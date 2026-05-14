/**
 * Tauri IPC service for quota operations.
 *
 * Provides typed wrappers around Tauri invoke() calls
 * for fetching real quota data from the Rust backend.
 */

import { invoke } from "@tauri-apps/api/core";
import type { QuotaFetchResult } from "../../types/quota";

/**
 * Fetches quota data for a single account.
 *
 * @param accountId - The UUID of the account to fetch quota for
 * @returns QuotaFetchResult with real-time model quota data
 */
export async function fetchAccountQuota(accountId: string): Promise<QuotaFetchResult> {
  return invoke<QuotaFetchResult>("fetch_account_quota", { accountId });
}

/**
 * Fetches quota data for ALL accounts simultaneously.
 *
 * @returns Array of QuotaFetchResult, one per account
 */
export async function fetchAllQuotas(): Promise<QuotaFetchResult[]> {
  return invoke<QuotaFetchResult[]>("fetch_all_quotas");
}
