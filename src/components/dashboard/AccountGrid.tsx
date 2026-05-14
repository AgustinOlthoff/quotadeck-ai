/**
 * AccountGrid — Main account dashboard grid.
 *
 * Displays all accounts as cards with real-time quota bars,
 * subscription tier badges, and reset countdown timers.
 * Inspired by cockpit-tools UI but with our own design language.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  RefreshCw, Zap, Clock, AlertTriangle, CheckCircle2,
  Crown, Shield, WifiOff, Loader2, ChevronDown,
  Play, Search
} from "lucide-react";
import { cn } from "../../utils/cn";
import { useAccountStore } from "../../stores/accountStore";
import { fetchAllQuotas } from "../../services/tauri/quota";
import type { Account } from "../../types/account";
import type { QuotaFetchResult, ModelQuota } from "../../types/quota";
import { getModelDisplayName, getQuotaColor, getTierColor, formatTierLabel } from "../../types/quota";
import { formatCountdown } from "../../utils/formatters";

// ── Animation Variants ──

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: "easeOut" as const } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

// ── Main Component ──

export function AccountGrid() {
  const { t } = useTranslation();
  const { accounts, fetchAccounts, switchAccount } = useAccountStore();
  const [quotas, setQuotas] = useState<Record<string, QuotaFetchResult>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusBanner, setStatusBanner] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const bannerTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showBanner = useCallback((type: "success" | "error" | "info", message: string) => {
    if (bannerTimeout.current) clearTimeout(bannerTimeout.current);
    setStatusBanner({ type, message });
    bannerTimeout.current = setTimeout(() => setStatusBanner(null), 4000);
  }, []);

  // ── Refresh Quota Data ──
  const refreshQuotas = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const results = await fetchAllQuotas();
      const map: Record<string, QuotaFetchResult> = {};
      let successCount = 0;
      let errorCount = 0;
      for (const r of results) {
        map[r.accountId] = r;
        if (r.success) successCount++;
        else errorCount++;
      }
      setQuotas(map);
      setLastRefresh(new Date());

      if (errorCount > 0 && successCount > 0) {
        showBanner("info", `${successCount} ${t("grid.accountsOk", "actualizadas")}, ${errorCount} con error`);
      } else if (errorCount > 0) {
        showBanner("error", t("grid.allFailed", "Error al obtener cuotas"));
      } else if (successCount > 0) {
        showBanner("success", t("grid.refreshed", "Cuotas actualizadas"));
      }
    } catch (err) {
      showBanner("error", String(err));
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, showBanner, t]);

  // ── Initial Load ──
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // ── Auto-refresh on mount if we have accounts ──
  useEffect(() => {
    if (accounts.length > 0 && Object.keys(quotas).length === 0 && !isRefreshing) {
      refreshQuotas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts.length]);

  // ── Handle Account Switch ──
  const handleSwitch = async (id: string) => {
    try {
      await switchAccount(id);
      showBanner("success", t("grid.switched", "Cuenta activada"));
    } catch (err) {
      showBanner("error", String(err));
    }
  };

  // ── Filter accounts ──
  const filteredAccounts = accounts.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.email.toLowerCase().includes(q) ||
      a.label.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Status Banner ── */}
      <AnimatePresence>
        {statusBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium",
                statusBanner.type === "success" && "bg-emerald-500/10 text-emerald-400 border-b border-emerald-500/20",
                statusBanner.type === "error" && "bg-red-500/10 text-red-400 border-b border-red-500/20",
                statusBanner.type === "info" && "bg-blue-500/10 text-blue-400 border-b border-blue-500/20"
              )}
            >
              {statusBanner.type === "success" && <CheckCircle2 size={16} />}
              {statusBanner.type === "error" && <AlertTriangle size={16} />}
              {statusBanner.type === "info" && <Zap size={16} />}
              <span>{statusBanner.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder={t("grid.search", "Buscar cuenta...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-8 pr-3 py-1.5 text-sm rounded-lg w-56",
                "bg-[var(--bg-elevated)] border border-[var(--border-subtle)]",
                "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                "focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]/30",
                "transition-colors"
              )}
            />
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            {filteredAccounts.length} {t("grid.of", "de")} {accounts.length} {t("grid.accounts", "cuentas")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-[var(--text-muted)]">
              {t("grid.lastUpdate", "Última:")} {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={refreshQuotas}
            disabled={isRefreshing}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg",
              "bg-[var(--accent-primary)] text-white",
              "hover:brightness-110 active:brightness-90",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
          >
            <RefreshCw size={13} className={cn(isRefreshing && "animate-spin")} />
            {isRefreshing ? t("grid.refreshing", "Actualizando...") : t("common.refresh", "Actualizar")}
          </button>
        </div>
      </div>

      {/* ── Grid Content ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {accounts.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            variants={gridVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                quotaResult={quotas[account.id]}
                isRefreshing={isRefreshing}
                onSwitch={() => handleSwitch(account.id)}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Account Card Component ──

interface AccountCardProps {
  account: Account;
  quotaResult?: QuotaFetchResult;
  isRefreshing: boolean;
  onSwitch: () => void;
}

function AccountCard({ account, quotaResult, isRefreshing, onSwitch }: AccountCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const quota = quotaResult?.quota;
  const hasError = quotaResult && !quotaResult.success;
  const hasForbidden = quota?.isForbidden;

  // Sort models: lower percentage first (more critical)
  const sortedModels = [...(quota?.models || [])].sort((a, b) => a.percentage - b.percentage);

  return (
    <motion.div
      variants={cardVariants}
      layout
      className={cn(
        "rounded-xl overflow-hidden",
        "bg-[var(--bg-surface)] border",
        account.isActive ? "border-[var(--accent-primary)]/50 shadow-lg shadow-[var(--accent-primary)]/5" : "border-[var(--border-subtle)]",
        "hover:border-[var(--accent-primary)]/30",
        "transition-all duration-300"
      )}
    >
      {/* ── Card Header ── */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Avatar */}
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
              account.isActive
                ? "bg-[var(--accent-primary)] text-white"
                : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
            )}
          >
            {account.email.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {account.label || account.email.split("@")[0]}
              </p>
              {account.isActive && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <Zap size={8} />
                  {t("accounts.active", "Activa")}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] truncate">{account.email}</p>
          </div>
        </div>

        {/* Tier Badge + Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {quota?.subscriptionTier && (
            <span className={cn(
              "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border",
              getTierColor(quota.subscriptionTier)
            )}>
              {quota.subscriptionTier.includes("PRO") ? <Crown size={9} className="inline mr-0.5 -mt-0.5" /> : null}
              {formatTierLabel(quota.subscriptionTier)}
            </span>
          )}

          {!account.isActive && (
            <button
              onClick={onSwitch}
              className={cn(
                "p-1.5 rounded-lg text-[var(--text-muted)]",
                "hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)]",
                "transition-colors"
              )}
              title={t("accounts.activate", "Activar")}
            >
              <Play size={14} />
            </button>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ChevronDown size={14} className={cn("transition-transform", expanded && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* ── Quota Bars ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-2.5">
              {/* Error state */}
              {hasError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/8 border border-red-500/15">
                  <WifiOff size={13} className="text-red-400 shrink-0" />
                  <span className="text-xs text-red-400 truncate">
                    {quotaResult?.error || "Fetch error"}
                  </span>
                </div>
              )}

              {/* Forbidden state */}
              {hasForbidden && !hasError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/8 border border-amber-500/15">
                  <Shield size={13} className="text-amber-400 shrink-0" />
                  <span className="text-xs text-amber-400">
                    {t("grid.forbidden", "Acceso denegado (403)")}
                  </span>
                </div>
              )}

              {/* Loading */}
              {isRefreshing && !quota && !hasError && (
                <div className="flex items-center justify-center py-4 gap-2 text-xs text-[var(--text-muted)]">
                  <Loader2 size={14} className="animate-spin" />
                  {t("common.loading", "Cargando...")}
                </div>
              )}

              {/* Model quota bars */}
              {sortedModels.map((model) => (
                <QuotaBar key={model.name} model={model} />
              ))}

              {/* No models but successful */}
              {quotaResult?.success && sortedModels.length === 0 && !hasForbidden && (
                <p className="text-xs text-[var(--text-muted)] text-center py-2">
                  {t("grid.noModels", "Sin datos de modelo")}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Quota Bar Component ──

function QuotaBar({ model }: { model: ModelQuota }) {
  const displayName = getModelDisplayName(model.name, model.displayName);
  const color = getQuotaColor(model.percentage);
  const isCritical = model.percentage <= 10;

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-[var(--text-secondary)] truncate max-w-[60%]">
          {displayName}
        </span>
        <div className="flex items-center gap-2">
          {model.resetTime && (
            <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
              <Clock size={9} />
              {formatCountdown(model.resetTime)}
            </span>
          )}
          <span
            className={cn(
              "text-xs font-bold tabular-nums",
              isCritical && "animate-pulse"
            )}
            style={{ color }}
          >
            {model.percentage}%
          </span>
        </div>
      </div>
      <div className="w-full h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${model.percentage}%` }}
          transition={{ duration: 0.7, ease: "easeOut" as const }}
        />
      </div>
    </div>
  );
}

// ── Empty State ──

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center mb-4">
        <Zap size={28} className="text-[var(--accent-primary)] opacity-60" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {t("accounts.noAccounts", "Sin cuentas")}
      </h3>
      <p className="text-sm text-[var(--text-muted)] max-w-sm">
        {t("accounts.noAccountsDesc", "Agregá tu primera cuenta para empezar.")}
      </p>
    </div>
  );
}
