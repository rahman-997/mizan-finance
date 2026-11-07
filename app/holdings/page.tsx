import type { Metadata } from "next";
import { AppShell } from "@/features/finance/app-shell";
export const metadata: Metadata = { title: "Assets and Liabilities" };
export default function HoldingsPage() { return <AppShell view="holdings" />; }
