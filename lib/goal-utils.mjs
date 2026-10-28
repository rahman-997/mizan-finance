// Manually tracked savings goals are plans, not bank account balances.
const invalid = () => { throw new Error("INVALID_GOAL"); };
function validateGoal(value) {
  if (!value || typeof value !== "object"
      || typeof value.id !== "string" || !value.id || value.id.length > 150
      || typeof value.title !== "string" || value.title.trim().length < 2 || value.title.trim().length > 60
      || !Number.isFinite(value.target) || value.target <= 0 || value.target > 1_000_000
      || !Number.isFinite(value.saved) || value.saved < 0 || value.saved > 1_000_000) invalid();
  return { id: value.id, title: value.title.trim(), target: value.target, saved: value.saved };
}

export function validateGoals(goals) {
  if (!Array.isArray(goals) || goals.length > 20) invalid();
  const parsed = goals.map(validateGoal);
  if (new Set(parsed.map((g) => g.id)).size !== parsed.length) invalid();
  return parsed;
}

export function appendGoal(data, goal) {
  const goals = data.goals || [];
  if (goals.length >= 20) throw new Error("GOAL_LIMIT");
  const next = validateGoal(goal);
  if (goals.some((g) => g.id === next.id)) throw new Error("GOAL_DUPLICATE");
  return { ...data, goals: [...goals, next] };
}
export function changeGoal(data, id, values) {
  const goals = data.goals || [];
  if (!goals.some((g) => g.id === id)) throw new Error("GOAL_NOT_FOUND");
  const next = validateGoal({ ...values, id });
  return { ...data, goals: goals.map((g) => g.id === id ? next : g) };
}
export function deleteGoal(data, id) {
  return { ...data, goals: (data.goals || []).filter((g) => g.id !== id) };
}
