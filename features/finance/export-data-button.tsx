"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFinance } from "./finance-provider";
import { useLocale } from "./locale-provider";

export function ExportDataButton() {
  const { transactions, budgets } = useFinance();
  const { language } = useLocale();

  const exportData = () => {
    const payload = {
      app: "Mizan Finance",
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
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={exportData}
      aria-label={language === "ar" ? "تصدير البيانات" : "Export data"}
      title={language === "ar" ? "تصدير البيانات" : "Export data"}
    >
      <Download aria-hidden="true" />
    </Button>
  );
}
