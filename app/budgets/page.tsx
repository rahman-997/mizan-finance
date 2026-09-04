import type { Metadata } from "next";
import { AppShell } from "@/features/finance/app-shell";

export const metadata: Metadata = { title: "Budgets" };

export default function BudgetsPage() {
  return <AppShell view="budgets" />;
}
