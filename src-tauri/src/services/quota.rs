//! Antigravity Cloud Code quota service.
//!
//! Fetches real quota data from Google's Cloud Code API endpoints,
//! matching the same flow used by Antigravity IDE and cockpit-tools.

use crate::error::AppError;
use crate::models::quota::{CreditInfo, QuotaData};
use serde::{Deserialize, Serialize};
use serde_json::json;

// ── API Constants ──
const CLOUD_CODE_DAILY_BASE_URL: &str = "https://daily-cloudcode-pa.googleapis.com";
const LOAD_CODE_ASSIST_PATH: &str = "v1internal:loadCodeAssist";
const FETCH_AVAILABLE_MODELS_PATH: &str = "v1internal:fetchAvailableModels";
const DEFAULT_IDE_VERSION: &str = "1.20.5";

// ── API Response Types ──

#[derive(Debug, Deserialize)]
struct LoadProjectResponse {
    #[serde(rename = "cloudaicompanionProject")]
    project: Option<serde_json::Value>,
    #[serde(rename = "currentTier")]
    current_tier: Option<TierInfo>,
    #[serde(rename = "paidTier")]
    paid_tier: Option<TierInfo>,
}

#[derive(Debug, Deserialize)]
struct TierInfo {
    id: Option<String>,
    #[serde(rename = "availableCredits", default)]
    available_credits: Option<Vec<AvailableCreditRaw>>,
}

#[derive(Debug, Deserialize)]
struct AvailableCreditRaw {
    #[serde(rename = "creditType")]
    credit_type: Option<String>,
    #[serde(rename = "creditAmount")]
    credit_amount: Option<String>,
    #[serde(rename = "minimumCreditAmountForUsage")]
    minimum_credit_amount_for_usage: Option<String>,
}

#[derive(Debug, Deserialize)]
struct FetchModelsResponse {
    models: Option<std::collections::HashMap<String, ModelInfo>>,
}

#[derive(Debug, Deserialize)]
struct ModelInfo {
    #[serde(rename = "displayName")]
    display_name: Option<String>,
    #[serde(rename = "quotaInfo")]
    quota_info: Option<QuotaInfo>,
}

#[derive(Debug, Deserialize)]
struct QuotaInfo {
    #[serde(rename = "remainingFraction")]
    remaining_fraction: Option<f64>,
    #[serde(rename = "resetTime")]
    reset_time: Option<String>,
}

/// Result of the project ID + subscription fetch
#[derive(Debug)]
pub struct ProjectInfo {
    pub project_id: Option<String>,
    pub subscription_tier: Option<String>,
    pub credits: Vec<CreditInfo>,
}

fn user_agent() -> String {
    let os = match std::env::consts::OS {
        "macos" => "darwin",
        "windows" => "windows",
        "linux" => "linux",
        _ => "windows",
    };
    let arch = match std::env::consts::ARCH {
        "x86_64" => "amd64",
        "aarch64" => "arm64",
        _ => "amd64",
    };
    format!("antigravity/{} {}/{}", DEFAULT_IDE_VERSION, os, arch)
}

fn build_metadata() -> serde_json::Value {
    json!({
        "ideName": "antigravity",
        "ideType": "ANTIGRAVITY",
        "ideVersion": DEFAULT_IDE_VERSION,
        "pluginVersion": env!("CARGO_PKG_VERSION"),
        "platform": match (std::env::consts::OS, std::env::consts::ARCH) {
            ("macos", "x86_64") => "DARWIN_AMD64",
            ("macos", "aarch64") => "DARWIN_ARM64",
            ("linux", "x86_64") => "LINUX_AMD64",
            ("linux", "aarch64") => "LINUX_ARM64",
            ("windows", "x86_64") => "WINDOWS_AMD64",
            _ => "PLATFORM_UNSPECIFIED",
        },
        "updateChannel": "stable",
        "pluginType": "GEMINI"
    })
}

fn create_client() -> reqwest::Client {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .gzip(true)
        .build()
        .unwrap_or_default()
}

fn extract_project_id(value: &serde_json::Value) -> Option<String> {
    if let Some(text) = value.as_str() {
        if !text.is_empty() {
            return Some(text.to_string());
        }
    }
    if let Some(obj) = value.as_object() {
        if let Some(id_value) = obj.get("id") {
            if let Some(id) = id_value.as_str() {
                if !id.is_empty() {
                    return Some(id.to_string());
                }
            }
        }
    }
    None
}

fn extract_credits(tier: &TierInfo) -> Vec<CreditInfo> {
    tier.available_credits
        .as_ref()
        .map(|credits| {
            credits
                .iter()
                .filter_map(|raw| {
                    let credit_type = raw.credit_type.as_ref()?.clone();
                    if raw.credit_amount.is_none() {
                        return None;
                    }
                    Some(CreditInfo {
                        credit_type,
                        credit_amount: raw.credit_amount.clone(),
                        minimum_credit_amount_for_usage: raw
                            .minimum_credit_amount_for_usage
                            .clone(),
                    })
                })
                .collect()
        })
        .unwrap_or_default()
}

/// Step 1: Call loadCodeAssist to get projectId, subscription tier, and credits
pub async fn fetch_project_info(access_token: &str) -> Result<ProjectInfo, AppError> {
    let client = create_client();
    let ua = user_agent();

    let payload = json!({
        "metadata": build_metadata(),
        "mode": "FULL_ELIGIBILITY_CHECK"
    });

    let response = client
        .post(format!("{}/{}", CLOUD_CODE_DAILY_BASE_URL, LOAD_CODE_ASSIST_PATH))
        .bearer_auth(access_token)
        .header(reqwest::header::CONTENT_TYPE, "application/json")
        .header(reqwest::header::USER_AGENT, &ua)
        .header(reqwest::header::ACCEPT_ENCODING, "gzip")
        .json(&payload)
        .send()
        .await?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(AppError::HttpRequest(format!(
            "loadCodeAssist failed: {} - {}",
            status,
            &text[..text.len().min(200)]
        )));
    }

    let data: LoadProjectResponse = response.json().await?;

    let subscription_tier = data
        .paid_tier
        .as_ref()
        .and_then(|t| t.id.clone())
        .or_else(|| data.current_tier.as_ref().and_then(|t| t.id.clone()));

    let credits = data
        .paid_tier
        .as_ref()
        .map(extract_credits)
        .unwrap_or_default();

    let project_id = data.project.as_ref().and_then(extract_project_id);

    Ok(ProjectInfo {
        project_id,
        subscription_tier,
        credits,
    })
}

/// Step 2: Call fetchAvailableModels to get per-model quota data
pub async fn fetch_quota(
    access_token: &str,
    project_id: Option<&str>,
    subscription_tier: Option<String>,
    credits: Vec<CreditInfo>,
) -> Result<QuotaData, AppError> {
    let client = create_client();
    let ua = user_agent();

    let payload = project_id
        .filter(|id| !id.is_empty())
        .map(|id| json!({ "project": id }))
        .unwrap_or_else(|| json!({}));

    let response = client
        .post(format!(
            "{}/{}",
            CLOUD_CODE_DAILY_BASE_URL, FETCH_AVAILABLE_MODELS_PATH
        ))
        .bearer_auth(access_token)
        .header(reqwest::header::USER_AGENT, &ua)
        .header(reqwest::header::ACCEPT_ENCODING, "gzip")
        .json(&payload)
        .send()
        .await?;

    if response.status() == reqwest::StatusCode::FORBIDDEN {
        let mut q = QuotaData::new();
        q.is_forbidden = true;
        q.subscription_tier = subscription_tier;
        return Ok(q);
    }

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(AppError::HttpRequest(format!(
            "fetchAvailableModels failed: {} - {}",
            status,
            &text[..text.len().min(200)]
        )));
    }

    let data: FetchModelsResponse = response.json().await?;
    let mut quota_data = QuotaData::new();

    if let Some(models) = data.models {
        for (name, info) in models {
            if let Some(qi) = info.quota_info {
                // Only include gemini and claude models (like cockpit-tools)
                if name.contains("gemini") || name.contains("claude") || name.contains("gpt") {
                    let percentage = qi
                        .remaining_fraction
                        .map(|f| (f * 100.0) as i32)
                        .unwrap_or(0);
                    let reset_time = qi.reset_time.unwrap_or_default();
                    quota_data.add_model(name, info.display_name, percentage, reset_time);
                }
            }
        }
    }

    quota_data.subscription_tier = subscription_tier;
    quota_data.credits = credits;
    quota_data
        .models
        .sort_by(|a, b| a.name.cmp(&b.name));

    Ok(quota_data)
}

/// Full quota fetch flow: refresh token → loadCodeAssist → fetchAvailableModels
pub async fn fetch_full_quota(
    access_token: &str,
) -> Result<QuotaData, AppError> {
    // Step 1: Get project info
    let info = fetch_project_info(access_token).await?;

    // Step 2: Fetch model quotas
    let quota = fetch_quota(
        access_token,
        info.project_id.as_deref(),
        info.subscription_tier,
        info.credits,
    )
    .await?;

    Ok(quota)
}
