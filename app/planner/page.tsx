import type { Metadata } from "next";
import { AppShell } from "@/features/finance/app-shell";
export const metadata: Metadata = { title: "Monthly Scenario Planner" };
export default function PlannerPage() { return <AppShell view="planner" />; }
