import type { Metadata } from "next";
import { AppShell } from "@/features/finance/app-shell";

export const metadata: Metadata = { title: "Insights" };

export default function InsightsPage() {
  return <AppShell view="insights" />;
}
