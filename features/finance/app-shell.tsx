"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "next-themes";
import {
  ArrowDownUp,
  BarChart3,
  Languages,
  LayoutDashboard,
  Moon,
  Plus,
  Sun,
  Target,
  WalletCards,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinance } from "./finance-provider";
import { useLocale } from "./locale-provider";
import { TransactionForm } from "@/features/transactions/transaction-form";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { TransactionsView } from "@/features/transactions/transactions-view";
import { BudgetsView } from "@/features/budgets/budgets-view";
import { InsightsView } from "@/features/insights/insights-view";

export type AppView = "dashboard" | "transactions" | "budgets" | "insights";

const navigation = [
  { href: "/", key: "dashboard" as const, icon: LayoutDashboard },
  { href: "/transactions", key: "transactions" as const, icon: ArrowDownUp },
  { href: "/budgets", key: "budgets" as const, icon: Target },
  { href: "/insights", key: "insights" as const, icon: BarChart3 },
];

const pageCopyKeys: Record<AppView, { eyebrow: "dashboardEyebrow" | "transactionsEyebrow" | "budgetsEyebrow" | "insightsEyebrow"; title: "dashboardTitle" | "transactionsTitle" | "budgetsTitle" | "insightsTitle"; intro: "dashboardIntro" | "transactionsIntro" | "budgetsIntro" | "insightsIntro" }> = {
  dashboard: { eyebrow: "dashboardEyebrow", title: "dashboardTitle", intro: "dashboardIntro" },
  transactions: { eyebrow: "transactionsEyebrow", title: "transactionsTitle", intro: "transactionsIntro" },
  budgets: { eyebrow: "budgetsEyebrow", title: "budgetsTitle", intro: "budgetsIntro" },
  insights: { eyebrow: "insightsEyebrow", title: "insightsTitle", intro: "insightsIntro" },
};

function LoadingState({ label }: { label: string }) {
  return (
    <div className="app-frame" aria-busy="true" aria-label={label}>
      <aside className="sidebar-panel"><Skeleton className="h-10 w-32" /><Skeleton className="mt-12 h-56 w-full" /></aside>
      <main className="content-panel"><Skeleton className="h-8 w-48" /><Skeleton className="mt-8 h-28 w-full" /><div className="mt-6 grid gap-4 md:grid-cols-2"><Skeleton className="h-80" /><Skeleton className="h-80" /></div></main>
    </div>
  );
}

export function AppShell({ view }: { view: AppView }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLocale();
  const finance = useFinance();
  const [newOpen, setNewOpen] = useState(false);

  if (finance.isLoading) return <LoadingState label={t("loading")} />;

  const copy = pageCopyKeys[view];

  return (
    <div className="app-frame">
      <aside className="sidebar-panel">
        {/* Full-page navigation avoids a Vinext preview cache edge case. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="brand-lockup" aria-label={t("mizanHome")}>
          <span className="brand-mark"><WalletCards aria-hidden="true" /></span>
          <span><strong>Mizan</strong><small>{t("personalFinance")}</small></span>
        </a>
        <nav className="desktop-nav" aria-label={t("primaryNavigation")}>
          {navigation.map(({ href, key, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <a key={key} href={href} className={active ? "nav-link active" : "nav-link"} aria-current={active ? "page" : undefined}>
                <Icon aria-hidden="true" />
                <span>{t(key)}</span>
              </a>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <span className="signal-dot" aria-hidden="true" />
          <p><strong>{t("savedOnDevice")}</strong><span>{t("savedOnDeviceHint")}</span></p>
        </div>
        <div className="sidebar-actions">
          <Button variant="ghost" size="icon" onClick={() => setLanguage(language === "en" ? "ar" : "en")} aria-label={t("switchLanguage")}>
            <Languages />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={t("toggleTheme")}>
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
        </div>
      </aside>

      <main className="content-panel">
        {finance.storageError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>{t("savedUnavailable")}</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{finance.storageError}</span>
              <Button size="sm" variant="outline" onClick={finance.resetDemo}>{t("restore")}</Button>
            </AlertDescription>
          </Alert>
        )}
        <header className="page-header">
          <div>
            <p className="eyebrow">{t(copy.eyebrow)}</p>
            <h1>{t(copy.title)}</h1>
            <p>{t(copy.intro)}</p>
          </div>
          <Button size="lg" className="accent-button" onClick={() => setNewOpen(true)}><Plus />{t("addTransaction")}</Button>
        </header>

        {view === "dashboard" && <DashboardView onAdd={() => setNewOpen(true)} />}
        {view === "transactions" && <TransactionsView onAdd={() => setNewOpen(true)} />}
        {view === "budgets" && <BudgetsView />}
        {view === "insights" && <InsightsView />}

        <footer className="site-footer"><span>Mizan Finance</span><span>{t("footerText")}</span></footer>
      </main>

      <nav className="mobile-nav" aria-label={t("mobileNavigation")}>
        {navigation.map(({ href, key, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return <a key={key} href={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}><Icon /><span>{t(key)}</span></a>;
        })}
      </nav>

      <TransactionForm open={newOpen} onOpenChange={setNewOpen} onSubmit={finance.addTransaction} />
    </div>
  );
}
