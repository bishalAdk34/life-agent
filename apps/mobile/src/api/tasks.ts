import { api } from "./client";
import type { Task } from "../types";

export const tasksApi = {
  list: (token: string, date?: string) =>
    api.get<Task[]>(`/tasks${date ? `?date=${date}` : ""}`, token),
  create: (
    token: string,
    payload: { title: string; description?: string; scheduled_for: string }
  ) => api.post<Task>("/tasks", payload, token),
  complete: (token: string, id: string) =>
    api.post<Task>(`/tasks/${id}/complete`, {}, token),
  reschedule: (token: string, id: string, scheduled_for: string) =>
    api.post<Task>(`/tasks/${id}/reschedule`, { scheduled_for }, token),
};
