import { api } from "./client";
import type { Task, TaskPriority } from "../types";

export const tasksApi = {
  list: (token: string, params?: { date?: string; priority?: TaskPriority }) => {
    const qs = new URLSearchParams();
    if (params?.date) qs.set("date", params.date);
    if (params?.priority) qs.set("priority", params.priority);
    const query = qs.toString();
    return api.get<Task[]>(`/tasks${query ? `?${query}` : ""}`, token);
  },
  create: (
    token: string,
    payload: { title: string; description?: string; scheduled_for: string; priority?: TaskPriority }
  ) => api.post<Task>("/tasks", payload, token),
  complete: (token: string, id: string) =>
    api.post<Task>(`/tasks/${id}/complete`, {}, token),
  reschedule: (token: string, id: string, scheduled_for: string) =>
    api.post<Task>(`/tasks/${id}/reschedule`, { scheduled_for }, token),
  delete: (token: string, id: string) =>
    api.del(`/tasks/${id}`, token),
};
