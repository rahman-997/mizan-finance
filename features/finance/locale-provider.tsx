"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "ar";

const messages = {
  en: {
    dashboard: "Overview", transactions: "Transactions", budgets: "Budgets", insights: "Insights",
    addTransaction: "Add transaction", totalBalance: "Total balance", income: "Income", expenses: "Expenses",
    savingsRate: "Savings rate", thisMonth: "This month", recentActivity: "Recent activity",
    recentActivityHint: "Your latest money movements", monthlyFlow: "Monthly cash flow",
    monthlyFlowHint: "Income and expenses over six months", budgetPulse: "Budget pulse",
    budgetPulseHint: "How this month compares with your plan", viewAll: "View all", search: "Search transactions",
    allTypes: "All types", allCategories: "All categories", newest: "Newest first", oldest: "Oldest first",
    amountHigh: "Highest amount", amountLow: "Lowest amount", showing: "Showing", results: "results",
    noResults: "No transactions match these filters.", clearFilters: "Clear filters", monthlyBudgets: "Monthly budgets",
    budgetIntro: "Give every category a realistic spending limit.", editBudget: "Edit budget", spent: "spent",
    remaining: "remaining", overBudget: "over budget", categoryBreakdown: "Spending by category",
    categoryBreakdownHint: "Where your money went this month", trend: "Six-month trend",
    trendHint: "Compare the pace of income and spending", healthy: "Healthy margin",
    healthyText: "Your income is ahead of expenses. Keep directing the difference toward your priorities.",
    attention: "Needs attention", attentionText: "Expenses are running ahead of income. Review the largest category first.",
    restore: "Restore demo data", loading: "Loading your money plan",
    dashboardEyebrow: "SEPTEMBER PLAN", dashboardTitle: "Money, made clear.",
    dashboardIntro: "A calm view of what came in, what went out, and what needs your attention.",
    transactionsEyebrow: "ACTIVITY", transactionsTitle: "Every money movement",
    transactionsIntro: "Find, review, and manage your complete transaction history.",
    budgetsEyebrow: "MONTHLY PLAN", budgetsTitle: "Spend with intention",
    budgetsIntro: "Set practical limits and see where you stand before the month ends.",
    insightsEyebrow: "PATTERNS", insightsTitle: "Learn from your numbers",
    insightsIntro: "Use simple trends to make your next financial decision with confidence.",
    personalFinance: "Personal finance", savedOnDevice: "Saved on this device",
    savedOnDeviceHint: "Your data stays available between visits.", switchLanguage: "Switch language",
    toggleTheme: "Toggle color theme", savedUnavailable: "Saved data is unavailable",
    footerText: "Private by design · Built for everyday clarity", acrossAllActivity: "Across all activity",
    financialSummary: "Financial summary", cashFlowEyebrow: "CASH FLOW", limitsEyebrow: "LIMITS",
    ledgerEyebrow: "LEDGER", keepPlanCurrent: "Keep your plan current",
    strongBuffer: "You are building a strong buffer.", adjustmentHint: "A small adjustment can protect your month.",
    keptIncomePrefix: "You kept", keptIncomeSuffix: "% of this month’s income so far.",
    reviewTopCategory: "Review your top spending category and set one practical limit.",
    clearSearch: "Clear search", filterByType: "Filter by type", filterByCategory: "Filter by category",
    sortTransactions: "Sort transactions", incomeType: "Income", expenseType: "Expense",
    emptyHint: "Try a broader search or start with a new transaction.", transactionColumn: "Transaction",
    categoryColumn: "Category", dateColumn: "Date", amountColumn: "Amount", noNote: "No note added",
    typeLabel: "Type", noteLabel: "Note", editTransaction: "Edit transaction", deleteAction: "Delete",
    monthlyBudgetSummary: "Monthly budget summary", used: "used", yourLimit: "YOUR LIMIT",
    availableRestMonth: "available for the rest of the month.", abovePlan: "above your plan.",
    categoryPlans: "CATEGORY PLANS", monthlyLimit: "monthly limit",
    updateMonthlyLimit: "Update the monthly limit for", thisCategory: "this category",
    monthlyLimitUsd: "Monthly limit (USD)", cancel: "Cancel", saveBudget: "Save budget",
    budgetPositive: "Enter a budget greater than zero.", budgetTooLarge: "Keep the budget below 1,000,000.",
    monthlyRead: "MONTHLY READ", keyInsights: "Key insights", topSpendingCategory: "Top spending category",
    noSpendingYet: "No spending yet", expenseChange: "Expense change", comparedLastMonth: "Compared with last month",
    netThisMonth: "Net this month", incomeMinusExpenses: "Income minus expenses", mix: "MIX",
    totalSpent: "Total spent", addExpenseHint: "Add an expense to see your category mix.", momentum: "MOMENTUM",
    pieChartAria: "Pie chart of spending categories", barChartAria: "Bar chart comparing six months of income and expenses",
    transactionDialogDescription: "Record a money movement. Required fields are marked with an asterisk.",
    titleLabel: "Title", amountUsd: "Amount (USD)", categoryLabel: "Category", dateLabel: "Date",
    optionalContext: "Optional context", saving: "Saving...", saveChanges: "Save changes",
    transactionTypeAria: "Transaction type", categoryAria: "Category", exampleTitle: "e.g. Weekly groceries", mizanHome: "Mizan home", primaryNavigation: "Primary navigation", mobileNavigation: "Mobile navigation",
  },
  ar: {
    dashboard: "نظرة عامة", transactions: "المعاملات", budgets: "الميزانيات", insights: "التحليلات",
    addTransaction: "إضافة معاملة", totalBalance: "الرصيد الكلي", income: "الدخل", expenses: "المصروفات",
    savingsRate: "معدل الادخار", thisMonth: "هذا الشهر", recentActivity: "آخر النشاطات",
    recentActivityHint: "أحدث حركاتك المالية", monthlyFlow: "التدفق النقدي الشهري",
    monthlyFlowHint: "الدخل والمصروفات خلال ستة أشهر", budgetPulse: "حالة الميزانية",
    budgetPulseHint: "مقارنة إنفاق هذا الشهر مع خطتك", viewAll: "عرض الكل", search: "ابحث في المعاملات",
    allTypes: "كل الأنواع", allCategories: "كل الفئات", newest: "الأحدث أولاً", oldest: "الأقدم أولاً",
    amountHigh: "المبلغ الأعلى", amountLow: "المبلغ الأقل", showing: "عرض", results: "نتائج",
    noResults: "لا توجد معاملات مطابقة لهذه الفلاتر.", clearFilters: "مسح الفلاتر", monthlyBudgets: "الميزانيات الشهرية",
    budgetIntro: "ضع حد إنفاق واقعي لكل فئة.", editBudget: "تعديل الميزانية", spent: "مُنفق",
    remaining: "متبقٍ", overBudget: "فوق الميزانية", categoryBreakdown: "المصروفات حسب الفئة",
    categoryBreakdownHint: "أين صُرفت أموالك هذا الشهر", trend: "اتجاه ستة أشهر",
    trendHint: "قارن وتيرة الدخل والمصروفات", healthy: "هامش صحي",
    healthyText: "دخلك أعلى من مصروفاتك. وجّه الفرق نحو أولوياتك.", attention: "يحتاج انتباه",
    attentionText: "المصروفات أعلى من الدخل. ابدأ بمراجعة أكبر فئة.", restore: "استعادة البيانات التجريبية",
    loading: "جاري تحميل خطتك المالية",
    dashboardEyebrow: "خطة سبتمبر", dashboardTitle: "أموالك بصورة أوضح",
    dashboardIntro: "نظرة هادئة على ما دخل وما خرج وما يحتاج إلى انتباهك.",
    transactionsEyebrow: "النشاط", transactionsTitle: "كل حركة مالية",
    transactionsIntro: "ابحث وراجع وأدر سجل معاملاتك بالكامل.", budgetsEyebrow: "الخطة الشهرية",
    budgetsTitle: "أنفق بوعي", budgetsIntro: "ضع حدودًا عملية واعرف وضعك قبل نهاية الشهر.",
    insightsEyebrow: "الأنماط", insightsTitle: "تعلّم من أرقامك",
    insightsIntro: "استخدم اتجاهات بسيطة لاتخاذ قرارك المالي التالي بثقة.", personalFinance: "المالية الشخصية",
    savedOnDevice: "محفوظ على هذا الجهاز", savedOnDeviceHint: "تبقى بياناتك متاحة بين الزيارات.",
    switchLanguage: "تبديل اللغة", toggleTheme: "تبديل المظهر", savedUnavailable: "البيانات المحفوظة غير متاحة",
    footerText: "خصوصية من الأساس · وضوح للحياة اليومية", acrossAllActivity: "عبر جميع الحركات",
    financialSummary: "الملخص المالي", cashFlowEyebrow: "التدفق النقدي", limitsEyebrow: "الحدود",
    ledgerEyebrow: "السجل", keepPlanCurrent: "حافظ على خطتك محدثة",
    strongBuffer: "أنت تبني هامشًا ماليًا قويًا.", adjustmentHint: "تعديل صغير قد يحمي ميزانية شهرك.",
    keptIncomePrefix: "احتفظت بـ", keptIncomeSuffix: "% من دخل هذا الشهر حتى الآن.",
    reviewTopCategory: "راجع أعلى فئة إنفاق وحدد لها حدًا عمليًا.", clearSearch: "مسح البحث",
    filterByType: "تصفية حسب النوع", filterByCategory: "تصفية حسب الفئة", sortTransactions: "ترتيب المعاملات",
    incomeType: "دخل", expenseType: "مصروف", emptyHint: "جرّب بحثًا أوسع أو أضف معاملة جديدة.",
    transactionColumn: "المعاملة", categoryColumn: "الفئة", dateColumn: "التاريخ", amountColumn: "المبلغ",
    noNote: "لا توجد ملاحظة", typeLabel: "النوع", noteLabel: "الملاحظة", editTransaction: "تعديل المعاملة",
    deleteAction: "حذف", monthlyBudgetSummary: "ملخص الميزانية الشهرية", used: "مستخدم", yourLimit: "حدك الشهري",
    availableRestMonth: "متاح لبقية الشهر.", abovePlan: "فوق خطتك.", categoryPlans: "خطط الفئات",
    monthlyLimit: "حد شهري", updateMonthlyLimit: "حدّث الحد الشهري لفئة", thisCategory: "هذه الفئة",
    monthlyLimitUsd: "الحد الشهري (دولار)", cancel: "إلغاء", saveBudget: "حفظ الميزانية",
    budgetPositive: "أدخل ميزانية أكبر من صفر.", budgetTooLarge: "اجعل الميزانية أقل من 1,000,000.",
    monthlyRead: "قراءة الشهر", keyInsights: "أهم المؤشرات", topSpendingCategory: "أعلى فئة إنفاق",
    noSpendingYet: "لا يوجد إنفاق بعد", expenseChange: "تغير المصروفات", comparedLastMonth: "مقارنة بالشهر الماضي",
    netThisMonth: "صافي هذا الشهر", incomeMinusExpenses: "الدخل ناقص المصروفات", mix: "التوزيع",
    totalSpent: "إجمالي المصروف", addExpenseHint: "أضف مصروفًا لرؤية توزيع الإنفاق حسب الفئة.", momentum: "الاتجاه",
    pieChartAria: "مخطط دائري لفئات الإنفاق", barChartAria: "مخطط يقارن الدخل والمصروفات خلال ستة أشهر",
    transactionDialogDescription: "سجّل حركة مالية. الحقول المطلوبة مميزة بنجمة.", titleLabel: "العنوان",
    amountUsd: "المبلغ (دولار)", categoryLabel: "الفئة", dateLabel: "التاريخ", optionalContext: "ملاحظة اختيارية",
    saving: "جارٍ الحفظ...", saveChanges: "حفظ التعديلات", transactionTypeAria: "نوع المعاملة", categoryAria: "الفئة", exampleTitle: "مثال: مشتريات الأسبوع", mizanHome: "الصفحة الرئيسية لميزان", primaryNavigation: "التنقل الرئيسي", mobileNavigation: "تنقل الهاتف",
  },
} as const;

type MessageKey = keyof typeof messages.en;
type LocaleContextValue = { language: Language; setLanguage: (language: Language) => void; t: (key: MessageKey) => string };

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("mizan-language");
      if (saved === "ar" || saved === "en") queueMicrotask(() => setLanguageState(saved));
    } catch {
      // Language persistence is optional; keep the default language if storage is unavailable.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    try {
      window.localStorage.setItem("mizan-language", language);
    } catch {
      // The UI should remain usable even when browser storage is blocked.
    }
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage: setLanguageState,
    t: (key: MessageKey) => messages[language][key],
  }), [language]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}
