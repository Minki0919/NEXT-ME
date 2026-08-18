import { login } from "../api/auth";
import { getMyProfile, getOnboardingTemplate } from "../api/users";
import type { UserProfile } from "../api/types";
import {
  saveAuthSession,
  saveOnboardingTemplate,
  saveProfile,
  updateSurvey,
} from "../utils/storage";

/**
 * 백엔드 권장 순서에 맞춰 로그인 세션과 최초 화면에 필요한 데이터를 준비합니다.
 * POST /auth/login -> 토큰 저장 -> GET /users/me -> 온보딩 템플릿 준비
 */
export async function loginAndPrepareUser(username: string, password: string) {
  const session = await login(username, password);
  saveAuthSession(session);

  const profile = await getMyProfile();
  saveProfile(profile);
  hydrateSurveyFromProfile(profile);

  // 템플릿 조회 실패가 로그인 자체를 막지는 않게 합니다.
  // 각 프로필 화면에서도 다시 조회하며 서버 실패 시 기본 질문을 사용합니다.
  try {
    const template = await getOnboardingTemplate();
    saveOnboardingTemplate(template);
  } catch (error) {
    console.warn("[온보딩 템플릿 준비 실패] 프로필 화면에서 다시 시도합니다.", error);
  }

  return { session, profile };
}

/** 서버 프로필 상태를 기준으로 로그인 직후 화면을 결정합니다. */
export function getPostLoginPath(profile: UserProfile) {
  if (profile.profileCompleted) return "/home";
  return "/profile/basic";
}

function hydrateSurveyFromProfile(profile: UserProfile) {
  const entries: Array<[string, unknown]> = [
    ["nickname", profile.nickname],
    ["gender", profile.gender],
    ["ageGroup", profile.ageGroup],
    ["workDay", profile.workDay?.split(",").map((day) => day.trim()).filter(Boolean)],
    ["leaveTime", profile.leaveTime],
    ["comeTime", profile.comeTime],
    ["workStyle", profile.workStyle],
    ["sleepHour", profile.sleepHour],
    ["makeupFrequency", profile.makeupFrequency],
    ["sunscreenFrequency", profile.sunscreenFrequency],
    ["exerciseCount", profile.exerciseCount],
    ["sweatAmount", profile.sweatAmount],
    ["skinType", profile.skinType],
    ["concerns", profile.concerns],
    ["personalColor", profile.personalColor],
  ];

  updateSurvey(Object.fromEntries(entries.filter(([, value]) => value !== null && value !== undefined)));
}
