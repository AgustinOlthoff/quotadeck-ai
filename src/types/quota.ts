/**
 * Type definitions for quota monitoring data.
 * Matches the Rust backend models (QuotaData, QuotaFetchResult).
 */

/** Quota information for a single AI model */
export interface ModelQuota {
  /** Model identifier (e.g., "gemini-2.5-pro") */
  name: string;

  /** Human-readable model name */
  displayName: string | null;

  /** Remaining percentage (0-100) */
  percentage: number;

  /** ISO 8601 timestamp when this quota resets */
  resetTime: string;
}

/** AI credit info (for paid accounts) */
export interface CreditInfo {
  creditType: string;
  creditAmount: string | null;
  minimumCreditAmountForUsage: string | null;
}

/** Complete quota data for an account */
export interface QuotaData {
  /** Per-model quotas */
  models: ModelQuota[];

  /** Unix timestamp of last update */
  lastUpdated: number;

  /** Whether the account is forbidden (403) */
  isForbidden: boolean;

  /** Subscription tier (FREE/PRO/ULTRA) */
  subscriptionTier: string | null;

  /** AI credits list */
  credits: CreditInfo[];
}

/** Result of a quota fetch operation from the backend */
export interface QuotaFetchResult {
  accountId: string;
  email: string;
  quota: QuotaData;
  success: boolean;
  error: string | null;
}

/**
 * Canonical model display names.
 * Maps API model identifiers to human-friendly names.
 */
export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  "gemini-3.1-pro-high": "Gemini 3.1 Pro (High)",
  "gemini-3.1-pro-low": "Gemini 3.1 Pro (Low)",
  "gemini-3-flash": "Gemini 3 Flash",
  "claude-sonnet-4-6": "Claude Sonnet 4.6",
  "claude-opus-4-6-thinking": "Claude Opus 4.6",
  "gpt-oss-120b-medium": "GPT-OSS 120B",
};

/**
 * Returns a clean display name for a model.
 */
export function getModelDisplayName(name: string, displayName?: string | null): string {
  if (displayName) return displayName;
  return MODEL_DISPLAY_NAMES[name] || name;
}

/**
 * Returns a CSS color based on remaining percentage.
 */
export function getQuotaColor(percentage: number): string {
  if (percentage <= 10) return "var(--accent-danger)";
  if (percentage <= 30) return "var(--accent-warning)";
  return "var(--accent-success)";
}

/**
 * Returns a tier badge color class.
 */
export function getTierColor(tier: string | null): string {
  switch (tier?.toUpperCase()) {
    case "G1-PRO-TIER":
    case "PRO":
      return "text-violet-400 bg-violet-400/15 border-violet-400/30";
    case "ULTRA":
      return "text-amber-400 bg-amber-400/15 border-amber-400/30";
    default:
      return "text-slate-400 bg-slate-400/15 border-slate-400/30";
  }
}

/**
 * Formats a tier ID to a display label.
 */
export function formatTierLabel(tier: string | null): string {
  if (!tier) return "Free";
  const t = tier.toUpperCase();
  if (t.includes("PRO")) return "Pro";
  if (t.includes("ULTRA")) return "Ultra";
  if (t.includes("FREE") || t.includes("LEGACY")) return "Free";
  return tier;
}
