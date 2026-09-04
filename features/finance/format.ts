import type { Language } from "./locale-provider";

export const formatMoney = (value: number, language: Language) =>
  new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

export const formatDate = (value: string, language: Language) =>
  new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));

export const categoryLabels: Record<string, { en: string; ar: string }> = {
  Housing: { en: "Housing", ar: "السكن" },
  Food: { en: "Food", ar: "الطعام" },
  Transport: { en: "Transport", ar: "المواصلات" },
  Health: { en: "Health", ar: "الصحة" },
  Learning: { en: "Learning", ar: "التعلم" },
  Leisure: { en: "Leisure", ar: "الترفيه" },
  Salary: { en: "Salary", ar: "الراتب" },
  Freelance: { en: "Freelance", ar: "عمل حر" },
};
