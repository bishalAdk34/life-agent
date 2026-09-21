import { api } from "./client";
import type { Expense } from "../types";

export const expensesApi = {
  list: (token: string, range?: "daily" | "weekly" | "monthly") =>
    api.get<Expense[]>(`/expenses${range ? `?range=${range}` : ""}`, token),
  create: (
    token: string,
    payload: {
      amount: number;
      currency?: string;
      category: string;
      description?: string;
      occurred_at: string;
    }
  ) => api.post<Expense>("/expenses", payload, token),
};
