import { api } from "./client";
import type { Budget, BudgetPeriod } from "../types";

export const budgetsApi = {
  list: (token: string) => api.get<Budget[]>("/budgets", token),
  set: (
    token: string,
    payload: { category?: string; period: BudgetPeriod; amount_limit: number }
  ) => api.put<Budget>("/budgets", payload, token),
};
