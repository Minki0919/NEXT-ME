import { apiRequest, GATEWAY_API_BASE } from "./http";
import type { UserCareRecommendation } from "./types";

/** 현재 서버 프로필로 새 피부 관리 성분 추천을 생성하고 저장합니다. */
export function generateMyUserCareRecommendation() {
  return apiRequest<UserCareRecommendation>(
    GATEWAY_API_BASE,
    "/user-care/me/recommendations",
    { method: "POST" },
    { auth: true }
  );
}

/** 가장 최근에 저장된 피부 관리 성분 추천을 조회합니다. */
export function getLatestMyUserCareRecommendation() {
  return apiRequest<UserCareRecommendation>(
    GATEWAY_API_BASE,
    "/user-care/me/recommendations/latest",
    { method: "GET" },
    { auth: true }
  );
}
