import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar, type PageId } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { AccountGrid } from "./components/dashboard/AccountGrid";
import { AccountList } from "./components/accounts/AccountList";
import { Settings } from "./components/settings/Settings";
import { useAccountStore } from "./stores/accountStore";
import { detectAntigravity } from "./services/tauri/platform";
import "./styles/globals.css";
import "./styles/animations.css";

/**
 * Root application component.
 *
 * Manages top-level routing between pages and provides the
 * overall app layout with sidebar navigation. Connects to the
 * Rust backend on mount to load initial data.
 */
function App() {
  const { t } = useTranslation();
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [antigravityInstalled, setAntigravityInstalled] = useState<boolean | null>(null);

  const { accounts, fetchAccounts } = useAccountStore();

  // Load initial data from the backend on mount
  useEffect(() => {
    fetchAccounts();

    detectAntigravity()
      .then((info) => setAntigravityInstalled(info.isInstalled))
      .catch(() => setAntigravityInstalled(false));
  }, [fetchAccounts]);

  const pageConfig: Record<PageId, { title: string; subtitle?: string }> = {
    dashboard: {
      title: t("dashboard.title"),
      subtitle: antigravityInstalled === false
        ? t("dashboard.antigravityNotDetected")
        : t("dashboard.subtitle"),
    },
    accounts: {
      title: t("accounts.title"),
      subtitle: `${t("accounts.subtitle")} (${accounts.length})`,
    },
    settings: {
      title: t("settings.title"),
      subtitle: t("settings.subtitle"),
    },
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <AccountGrid />;
      case "accounts":
        return <AccountList />;
      case "settings":
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[var(--bg-base)] dark">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          title={pageConfig[activePage].title}
          subtitle={pageConfig[activePage].subtitle}
        />

        <main className="flex-1 overflow-hidden">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
