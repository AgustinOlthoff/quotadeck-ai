//! Quota data models.
//!
//! Structures representing AI model quota information
//! fetched from Antigravity's Cloud Code API.

use serde::{Deserialize, Serialize};

/// Quota information for a single AI model.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelQuota {
    /// Model identifier (e.g., "gemini-2.5-pro")
    pub name: String,

    /// Human-readable model name
    #[serde(default)]
    pub display_name: Option<String>,

    /// Remaining percentage (0-100)
    pub percentage: i32,

    /// ISO 8601 timestamp when this quota resets
    pub reset_time: String,
}

/// AI credit information from loadCodeAssist paidTier.availableCredits
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreditInfo {
    pub credit_type: String,
    #[serde(default)]
    pub credit_amount: Option<String>,
    #[serde(default)]
    pub minimum_credit_amount_for_usage: Option<String>,
}

/// Complete quota data structure for an account.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuotaData {
    /// Individual model quotas
    pub models: Vec<ModelQuota>,

    /// Unix timestamp of last update
    pub last_updated: i64,

    /// Whether the account is forbidden (403)
    #[serde(default)]
    pub is_forbidden: bool,

    /// Subscription tier (FREE/PRO/ULTRA)
    #[serde(default)]
    pub subscription_tier: Option<String>,

    /// AI credit list (paid accounts only)
    #[serde(default)]
    pub credits: Vec<CreditInfo>,
}

impl QuotaData {
    pub fn new() -> Self {
        Self {
            models: Vec::new(),
            last_updated: chrono::Utc::now().timestamp(),
            is_forbidden: false,
            subscription_tier: None,
            credits: Vec::new(),
        }
    }

    pub fn add_model(
        &mut self,
        name: String,
        display_name: Option<String>,
        percentage: i32,
        reset_time: String,
    ) {
        self.models.push(ModelQuota {
            name,
            display_name,
            percentage,
            reset_time,
        });
    }
}

impl Default for QuotaData {
    fn default() -> Self {
        Self::new()
    }
}

/// Result of a quota fetch operation, sent to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuotaFetchResult {
    pub account_id: String,
    pub email: String,
    pub quota: QuotaData,
    pub success: bool,
    pub error: Option<String>,
}
