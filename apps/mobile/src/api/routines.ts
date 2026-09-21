import { api } from "./client";
import type { Routine } from "../types";

export const routinesApi = {
  list: (token: string) => api.get<Routine[]>("/routines", token),
  create: (
    token: string,
    payload: {
      title: string;
      description?: string;
      scheduled_time: string;
      days_of_week: number[];
      duration_minutes: number;
    }
  ) => api.post<Routine>("/routines", payload, token),
  update: (token: string, id: string, payload: Partial<Routine>) =>
    api.put<Routine>(`/routines/${id}`, payload, token),
};
