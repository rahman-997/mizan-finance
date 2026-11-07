import type { Metadata } from "next";
import { AppShell } from "@/features/finance/app-shell";

export const metadata: Metadata = { title: "Recurring Expenses" };
export default function RecurringPage() { return <AppShell view="recurring" />; }
