// Historical, transaction-derived monthly totals. No forecasting or banking data.
export function reportMonths(transactions, count = 6, today = new Date().toISOString().slice(0, 10)) {
  if (!Number.isInteger(count) || count < 1 || count > 12 || !/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    throw new Error("INVALID_REPORT_RANGE");
  }
  const [year, month] = today.split("-").map(Number);
  if (month < 1 || month > 12) throw new Error("INVALID_REPORT_RANGE");
  const grouped = new Map();
  for (const item of transactions) {
    const key = typeof item.date === "string" ? item.date.slice(0, 7) : "";
    if (!/^\d{4}-\d{2}$/.test(key) || !["income", "expense"].includes(item.type)) continue;
    const totals = grouped.get(key) || { income: 0, expenses: 0 };
    if (item.type === "income") totals.income += Number(item.amount);
    else totals.expenses += Number(item.amount);
    grouped.set(key, totals);
  }
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - count + index, 1));
    const key = date.toISOString().slice(0, 7);
    const { income, expenses } = grouped.get(key) || { income: 0, expenses: 0 };
    return { key, income, expenses, net: income - expenses };
  });
}
export function reportCsv(months) {
  // Numeric monthly aggregates only: no user-provided content / formula injection.
  return "\uFEFFMonth,Income,Expenses,Net\r\n"
    + months.map((x) => [x.key, x.income, x.expenses, x.net].join(",")).join("\r\n") + "\r\n";
}
