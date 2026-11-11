import type { FinanceData, SavingsGoal } from "../features/finance/types";
export function validateGoals(goals: unknown): SavingsGoal[];
export function appendGoal(data: FinanceData, goal: SavingsGoal): FinanceData;
export function changeGoal(data: FinanceData, id: string, values: Omit<SavingsGoal, "id">): FinanceData;
export function deleteGoal(data: FinanceData, id: string): FinanceData;
