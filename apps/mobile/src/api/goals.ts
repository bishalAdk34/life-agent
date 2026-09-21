import { api } from "./client";
import type { Goal, GoalStatus } from "../types";

export const goalsApi = {
  list: (token: string) => api.get<Goal[]>("/goals", token),
  create: (token: string, payload: { title: string; description?: string }) =>
    api.post<Goal>("/goals", payload, token),
  update: (
    token: string,
    id: string,
    payload: { title?: string; description?: string; status?: GoalStatus }
  ) => api.put<Goal>(`/goals/${id}`, payload, token),
};
