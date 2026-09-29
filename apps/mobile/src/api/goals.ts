import { api } from "./client";
import type { Goal, GoalStatus } from "../types";

export const goalsApi = {
  list: (token: string, params?: { category?: string; quarter?: string }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.quarter) qs.set("quarter", params.quarter);
    const query = qs.toString();
    return api.get<Goal[]>(`/goals${query ? `?${query}` : ""}`, token);
  },
  create: (
    token: string,
    payload: { title: string; description?: string; category?: string; quarter?: string }
  ) => api.post<Goal>("/goals", payload, token),
  update: (
    token: string,
    id: string,
    payload: { title?: string; description?: string; category?: string; quarter?: string; status?: GoalStatus }
  ) => api.put<Goal>(`/goals/${id}`, payload, token),
  delete: (token: string, id: string) => api.del(`/goals/${id}`, token),
};
