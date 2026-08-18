import { apiRequest, GATEWAY_API_BASE } from "./http";
import type {
  AiConversation,
  AiChatMessage,
  AiChatRequest,
  AiChatResponse,
} from "./types";

export function sendAiMessage(
  message: string,
  conversationId: number | null = null
) {
  const body: AiChatRequest = { conversationId, message };

  return apiRequest<AiChatResponse>(
    GATEWAY_API_BASE,
    "/ai-chat/me/messages",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    { auth: true }
  );
}

export function getConversationMessages(conversationId: number) {
  return apiRequest<AiChatMessage[]>(
    GATEWAY_API_BASE,
    `/ai-chat/me/conversations/${encodeURIComponent(conversationId)}/messages`,
    { method: "GET" },
    { auth: true }
  );
}

export function getConversations() {
  return apiRequest<AiConversation[]>(
    GATEWAY_API_BASE,
    "/ai-chat/me/conversations",
    { method: "GET" },
    { auth: true }
  );
}

export function deleteConversation(conversationId: number) {
  return apiRequest<null>(
    GATEWAY_API_BASE,
    `/ai-chat/me/conversations/${encodeURIComponent(conversationId)}`,
    { method: "DELETE" },
    { auth: true }
  );
}
