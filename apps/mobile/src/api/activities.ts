import { api } from "./client";
import type { Activity } from "../types";

export const activitiesApi = {
  recent: (token: string) => api.get<Activity[]>("/activities/recent", token),
  create: (
    token: string,
    payload: {
      title: string;
      category: string;
      duration_minutes?: number;
      occurred_at: string;
    }
  ) => api.post<Activity>("/activities", payload, token),
};
