import { api } from "./client";
import type { Interest } from "../types";

export const interestsApi = {
  list: (token: string) => api.get<Interest[]>("/interests", token),
  create: (token: string, label: string) =>
    api.post<Interest>("/interests", { label }, token),
  remove: (token: string, id: string) => api.del(`/interests/${id}`, token),
};
