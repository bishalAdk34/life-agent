import { api } from "./client";
import type { Observation, ObservationKind } from "../types";

export const observationsApi = {
  list: (token: string, params?: { kind?: ObservationKind; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.kind) qs.set("kind", params.kind);
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.get<Observation[]>(`/observations${query ? `?${query}` : ""}`, token);
  },
  create: (
    token: string,
    payload: { kind: ObservationKind; text: string; source?: string; confidence?: number }
  ) => api.post<Observation>("/observations", payload, token),
  delete: (token: string, id: string) => api.del(`/observations/${id}`, token),
};
