import { api } from "./client";
import type { ChatResponse } from "../types";

export const chatApi = {
  sendMessage: (token: string, message: string, conversationId?: string | null) =>
    api.post<ChatResponse>(
      "/chat/message",
      { message, conversation_id: conversationId ?? null },
      token
    ),
};
