"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFinance } from "./finance-provider";
import { useLocale } from "./locale-provider";

export function ExportDataButton({showLabel=false}: {showLabel?:boolean}) {
  const { transactions, budgets, recurring, goals, holdings, plans } = useFinance();
  const { language } = useLocale();

  const exportData = () => {
    const payload = {
      app: "Mizan Finance",
      version: 5,
      goals: goals || [],
      holdings: holdings || [],
      plans: plans || [],
      recurring: recurring || [],
      exportedBy: "Abdulrahman Hajar",
      exportedAt: new Date().toISOString(),
      transactions,
      budgets,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mizan-finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
    // Chromium may cancel an offline blob download if its detached anchor's URL
    // is revoked immediately. Attach it for the click and release it later.
    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 5_000);
    }
  };

  return (
    <Button
      variant="ghost"
      size={showLabel?"default":"icon"}
      onClick={exportData}
      aria-label={language === "ar" ? "تصدير البيانات" : "Export data"}
      title={language === "ar" ? "تصدير البيانات" : "Export data"}
    >
      <Download aria-hidden="true" />{showLabel && (language === "ar" ? "تصدير نسخة احتياطية" : "Download JSON backup")}
    </Button>
  );
}
