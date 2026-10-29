import type { Metadata } from "next";
import { AppShell } from "@/features/finance/app-shell";
export const metadata: Metadata = { title: "Privacy and Data" };
export default function DataCenterPage(){ return <AppShell view="dataCenter" />; }
