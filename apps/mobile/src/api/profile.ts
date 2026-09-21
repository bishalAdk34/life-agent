import { api } from "./client";
import type { Profile } from "../types";

export const profileApi = {
  get: (token: string) => api.get<Profile>("/profile", token),
  update: (token: string, payload: { display_name?: string; timezone?: string }) =>
    api.put<Profile>("/profile", payload, token),
};
