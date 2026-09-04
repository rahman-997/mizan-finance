"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { FinanceProvider } from "@/features/finance/finance-provider";
import { LocaleProvider } from "@/features/finance/locale-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <LocaleProvider>
        <FinanceProvider>{children}</FinanceProvider>
        <Toaster position="top-center" richColors />
      </LocaleProvider>
    </ThemeProvider>
  );
}
