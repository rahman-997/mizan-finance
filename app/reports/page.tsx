import type { Metadata } from "next";
import { AppShell } from "@/features/finance/app-shell";

export const metadata: Metadata = { title: "Financial Reports" };
export default function ReportsPage() { return <AppShell view="reports" />; }
