import type { Metadata } from "next";
import { AppShell } from "@/features/finance/app-shell";

export const metadata: Metadata = { title: "Savings Goals" };
export default function GoalsPage() { return <AppShell view="goals" />; }
