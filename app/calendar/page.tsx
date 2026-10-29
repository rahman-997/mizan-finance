import type { Metadata } from "next";
import { AppShell } from "@/features/finance/app-shell";

export const metadata: Metadata = { title: "Financial Calendar" };
export default function CalendarPage() { return <AppShell view="calendar" />; }
