import type { Metadata } from "next";
import { AppShell } from "@/features/finance/app-shell";

export const metadata: Metadata = { title: "Transactions" };

export default function TransactionsPage() {
  return <AppShell view="transactions" />;
}
