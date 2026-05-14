import { motion } from "framer-motion";
import { Activity, Users, Clock, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils/cn";
import { getModelDisplayName, getQuotaColor } from "../../types/quota";
import { formatCountdown } from "../../utils/formatters";
import type { ModelQuota } from "../../types/quota";
import type { Account } from "../../types/account";

/** Animation variants for staggered card entrance */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

interface DashboardProps {
  /** Currently active account (or null if none) */
  activeAccount: Account | null;
  /** Quota data for the active account */
  quotas: ModelQuota[];
  /** Total number of accounts */
  totalAccounts: number;
  /** Whether quota data is being refreshed */
  isLoading: boolean;
}

/**
 * Main dashboard page showing quota overview and active account status.
 *
 * This is the first screen users see when launching QuotaDeck AI.
 * It provides a quick overview of the current account's quota usage.
 */
export function Dashboard({ activeAccount, quotas, totalAccounts, isLoading }: DashboardProps) {
  const { t } = useTranslation();

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* ── Stats Overview ── */}
      <motion.div
        className="grid grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <StatCard
          icon={<Zap size={18} />}
          label={t("dashboard.activeAccount", "Active Account")}
          value={activeAccount?.label || activeAccount?.email || t("common.none", "None")}
          accent="primary"
        />
        <StatCard
          icon={<Users size={18} />}
          label={t("dashboard.totalAccounts", "Total Accounts")}
          value={String(totalAccounts)}
          accent="success"
        />
        <StatCard
          icon={<Activity size={18} />}
          label={t("dashboard.modelsTracked", "Models Tracked")}
          value={String(quotas.length)}
          accent="warning"
        />
      </motion.div>

      {/* ── Quota Cards ── */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
          {t("dashboard.quotaUsage", "Quota Usage")}
        </h2>

        {!activeAccount ? (
          <EmptyState />
        ) : isLoading ? (
          <LoadingSkeleton />
        ) : quotas.length === 0 ? (
          <NoQuotaData />
        ) : (
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {quotas.map((quota) => (
              <QuotaCard key={quota.name} quota={quota} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "primary" | "success" | "warning";
}

function StatCard({ icon, label, value, accent }: StatCardProps) {
  const accentColors = {
    primary: "text-[var(--accent-primary)] bg-[var(--accent-primary)]/10",
    success: "text-[var(--accent-success)] bg-[var(--accent-success-soft)]",
    warning: "text-[var(--accent-warning)] bg-[var(--accent-warning-soft)]",
  };

  return (
    <motion.div
      variants={cardVariants}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl",
        "bg-[var(--bg-surface)] border border-[var(--border-subtle)]",
        "shadow-[var(--shadow-sm)]"
      )}
    >
      <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg", accentColors[accent])}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-[140px]">{value}</p>
      </div>
    </motion.div>
  );
}

function QuotaCard({ quota }: { quota: ModelQuota }) {
  const displayName = getModelDisplayName(quota.name, quota.displayName);
  const color = getQuotaColor(quota.percentage);
  const countdown = formatCountdown(quota.resetTime);

  return (
    <motion.div
      variants={cardVariants}
      className={cn(
        "p-5 rounded-xl",
        "bg-[var(--bg-surface)] border border-[var(--border-subtle)]",
        "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
        "transition-shadow duration-200"
      )}
    >
      {/* Card header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {displayName}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{quota.name}</p>
        </div>
        <span
          className={cn(
            "text-2xl font-bold",
            quota.percentage <= 10 && "animate-pulse-glow"
          )}
          style={{ color }}
        >
          {quota.percentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden mb-3">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${quota.percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" as const }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>{quota.percentage}% remaining</span>
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>Resets {countdown}</span>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center mb-4">
        <Users size={28} className="text-[var(--text-muted)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {t("dashboard.noAccountSelected", "No account selected")}
      </h3>
      <p className="text-sm text-[var(--text-muted)] max-w-sm">
        {t("dashboard.noAccountDescription", "Add an Antigravity account to start monitoring your quota usage.")}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-32 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] animate-shimmer"
        />
      ))}
    </div>
  );
}

function NoQuotaData() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Activity size={28} className="text-[var(--text-muted)] mb-3" />
      <p className="text-sm text-[var(--text-muted)]">
        {t("dashboard.noQuotaData", "No quota data available yet.")}
      </p>
    </div>
  );
}
