import { apiRequest, GATEWAY_API_BASE } from "./http";
import type {
  MakeupRecommendation,
  OutfitRecommendation,
  PageResponse,
  PersonalColorChatResponse,
  PersonalColorConversation,
  PersonalColorMessage,
} from "./types";

function pageQuery(page: number, size: number) {
  const query = new URLSearchParams({
    page: String(Math.max(0, Math.trunc(page))),
    size: String(Math.min(100, Math.max(1, Math.trunc(size)))),
  });
  return query.toString();
}

function recommendationBody(message: string) {
  const normalizedMessage = message.trim();
  if (!normalizedMessage) {
    throw new Error("추천에 반영할 내용을 입력해 주세요.");
  }
  if (normalizedMessage.length > 1000) {
    throw new Error("추천 요청은 1,000자 이하로 입력해 주세요.");
  }
  return JSON.stringify({ message: normalizedMessage });
}

export function startPersonalColorAnalysis() {
  return apiRequest<PersonalColorChatResponse>(
    GATEWAY_API_BASE,
    "/personal-colors/me/analysis/start",
    { method: "POST" },
    { auth: true }
  );
}

export function sendPersonalColorAnalysisMessage(
  conversationId: number,
  message: string
) {
  return apiRequest<PersonalColorChatResponse>(
    GATEWAY_API_BASE,
    "/personal-colors/me/analysis/messages",
    {
      method: "POST",
      body: JSON.stringify({ conversationId, message }),
    },
    { auth: true }
  );
}

export function getPersonalColorAnalysisConversations(page = 0, size = 20) {
  return apiRequest<PageResponse<PersonalColorConversation>>(
    GATEWAY_API_BASE,
    `/personal-colors/me/analysis/conversations?${pageQuery(page, size)}`,
    { method: "GET" },
    { auth: true }
  );
}

export function getPersonalColorAnalysisMessages(
  conversationId: number,
  page = 0,
  size = 50
) {
  return apiRequest<PageResponse<PersonalColorMessage>>(
    GATEWAY_API_BASE,
    `/personal-colors/me/analysis/conversations/${encodeURIComponent(conversationId)}/messages?${pageQuery(page, size)}`,
    { method: "GET" },
    { auth: true }
  );
}

export function createOutfitRecommendation(message: string) {
  return apiRequest<OutfitRecommendation>(
    GATEWAY_API_BASE,
    "/personal-colors/me/outfits/recommendations",
    {
      method: "POST",
      body: recommendationBody(message),
    },
    { auth: true }
  );
}

export function getTodayOutfitRecommendation() {
  return apiRequest<OutfitRecommendation>(
    GATEWAY_API_BASE,
    "/personal-colors/me/outfits/recommendations/today",
    { method: "GET" },
    { auth: true }
  );
}

export function getOutfitRecommendations(page = 0, size = 20) {
  return apiRequest<PageResponse<OutfitRecommendation>>(
    GATEWAY_API_BASE,
    `/personal-colors/me/outfits/recommendations?${pageQuery(page, size)}`,
    { method: "GET" },
    { auth: true }
  );
}

export function createMakeupRecommendation(message: string) {
  return apiRequest<MakeupRecommendation>(
    GATEWAY_API_BASE,
    "/personal-colors/me/makeup/recommendations",
    {
      method: "POST",
      body: recommendationBody(message),
    },
    { auth: true }
  );
}

export function getTodayMakeupRecommendation() {
  return apiRequest<MakeupRecommendation>(
    GATEWAY_API_BASE,
    "/personal-colors/me/makeup/recommendations/today",
    { method: "GET" },
    { auth: true }
  );
}

export function getMakeupRecommendations(page = 0, size = 20) {
  return apiRequest<PageResponse<MakeupRecommendation>>(
    GATEWAY_API_BASE,
    `/personal-colors/me/makeup/recommendations?${pageQuery(page, size)}`,
    { method: "GET" },
    { auth: true }
  );
}
