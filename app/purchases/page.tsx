import type { Metadata } from "next";
import { AppShell } from "@/features/finance/app-shell";
export const metadata: Metadata = { title: "Planned Purchases" };
export default function PurchasesPage(){ return <AppShell view="purchases" />; }
