export function calculateSummary(transactions) {
  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return {
    income,
    expenses,
    balance: income - expenses,
    savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
  };
}

export function filterTransactions(transactions, filters = {}) {
  const query = String(filters.query || "").trim().toLowerCase();
  const type = filters.type || "all";
  const category = filters.category || "all";
  const sort = filters.sort || "newest";

  return transactions
    .filter((item) => {
      const matchesQuery = !query || `${item.title} ${item.category} ${item.note || ""}`.toLowerCase().includes(query);
      const matchesType = type === "all" || item.type === type;
      const matchesCategory = category === "all" || item.category === category;
      return matchesQuery && matchesType && matchesCategory;
    })
    .sort((a, b) => {
      if (sort === "amount-high") return b.amount - a.amount;
      if (sort === "amount-low") return a.amount - b.amount;
      if (sort === "oldest") return new Date(a.date).getTime() - new Date(b.date).getTime();
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
}

export function spendingByCategory(transactions) {
  const grouped = transactions
    .filter((item) => item.type === "expense")
    .reduce((result, item) => {
      result[item.category] = (result[item.category] || 0) + Number(item.amount);
      return result;
    }, {});

  return Object.entries(grouped)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function monthlySeries(transactions, count = 6) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const items = transactions.filter((item) => {
      const itemDate = new Date(`${item.date}T00:00:00`);
      return itemDate.getFullYear() === year && itemDate.getMonth() === monthIndex;
    });
    const summary = calculateSummary(items);
    return { month, income: summary.income, expenses: summary.expenses };
  });
}

export function currentMonthTransactions(transactions, reference = new Date()) {
  return transactions.filter((item) => {
    const itemDate = new Date(`${item.date}T00:00:00`);
    return itemDate.getMonth() === reference.getMonth() && itemDate.getFullYear() === reference.getFullYear();
  });
}
