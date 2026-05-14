//! Quota-related Tauri commands.
//!
//! IPC handlers for fetching real quota data from
//! Antigravity's Cloud Code API.

use crate::error::AppError;
use crate::models::quota::{QuotaData, QuotaFetchResult};
use crate::services::{crypto, database::Database, oauth, quota};
use tauri::State;

/// Fetch quota for a single account by ID.
///
/// Refreshes the OAuth token, then calls the Cloud Code API
/// to get real-time model quota data.
#[tauri::command]
pub async fn fetch_account_quota(
    db: State<'_, Database>,
    account_id: String,
) -> Result<QuotaFetchResult, AppError> {
    // 1. Get account from DB
    let account = db.get_account(&account_id)?;
    let email = account.email.clone();

    // 2. Get encrypted token and decrypt it
    let encrypted_token = db.get_encrypted_token(&account_id)?;
    let refresh_token = crypto::decrypt(&encrypted_token)?;

    // 3. Refresh the access token
    let token_response = oauth::refresh_access_token(&refresh_token).await?;

    // 4. Fetch real quota
    match quota::fetch_full_quota(&token_response.access_token).await {
        Ok(quota_data) => Ok(QuotaFetchResult {
            account_id,
            email,
            quota: quota_data,
            success: true,
            error: None,
        }),
        Err(e) => Ok(QuotaFetchResult {
            account_id,
            email,
            quota: QuotaData::new(),
            success: false,
            error: Some(e.to_string()),
        }),
    }
}

/// Fetch quotas for ALL accounts.
///
/// Iterates all stored accounts, refreshes tokens, and
/// fetches quota data for each one sequentially.
#[tauri::command]
pub async fn fetch_all_quotas(
    db: State<'_, Database>,
) -> Result<Vec<QuotaFetchResult>, AppError> {
    let accounts = db.get_all_accounts()?;
    let mut results: Vec<QuotaFetchResult> = Vec::new();

    for account in &accounts {
        let email = account.email.clone();
        let account_id = account.id.clone();

        // Try to get and decrypt token
        let encrypted_token = match db.get_encrypted_token(&account_id) {
            Ok(t) => t,
            Err(e) => {
                results.push(QuotaFetchResult {
                    account_id,
                    email,
                    quota: QuotaData::new(),
                    success: false,
                    error: Some(format!("Token not found: {}", e)),
                });
                continue;
            }
        };

        let refresh_token = match crypto::decrypt(&encrypted_token) {
            Ok(t) => t,
            Err(e) => {
                results.push(QuotaFetchResult {
                    account_id,
                    email,
                    quota: QuotaData::new(),
                    success: false,
                    error: Some(format!("Token decryption failed: {}", e)),
                });
                continue;
            }
        };

        // Refresh access token
        let token_response = match oauth::refresh_access_token(&refresh_token).await {
            Ok(t) => t,
            Err(e) => {
                results.push(QuotaFetchResult {
                    account_id,
                    email,
                    quota: QuotaData::new(),
                    success: false,
                    error: Some(format!("Token refresh failed: {}", e)),
                });
                continue;
            }
        };

        // Fetch quota
        match quota::fetch_full_quota(&token_response.access_token).await {
            Ok(quota_data) => {
                results.push(QuotaFetchResult {
                    account_id,
                    email,
                    quota: quota_data,
                    success: true,
                    error: None,
                });
            }
            Err(e) => {
                results.push(QuotaFetchResult {
                    account_id,
                    email,
                    quota: QuotaData::new(),
                    success: false,
                    error: Some(e.to_string()),
                });
            }
        }
    }

    Ok(results)
}
