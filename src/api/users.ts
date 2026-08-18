import { apiRequest, GATEWAY_API_BASE } from "./http";
import type {
  DetailAnalysisResponse,
  OnboardingAnswerResponse,
  OnboardingQuestion,
  PhotoRetryResponse,
  RoutinePreferences,
  UserProfile,
} from "./types";

// 로그인 전에도 사용할 수 있는 기본 온보딩 질문 템플릿 조회
export async function getOnboardingTemplate() {
  return apiRequest<OnboardingQuestion[]>(
    GATEWAY_API_BASE,
    "/users/onboarding/template",
    { method: "GET" }
  );
}

// 7) 사용자가 입력할 수 있는 프로필 값과 온보딩 진행 상태만 부분 수정합니다.
// profileEmpty/profileCompleted/confidence 같은 서버 계산 필드는 요청에 포함하지 않습니다.
export type PatchProfileRequest = Partial<
  Omit<FullProfileRequest, "onboardingMode">
> & {
  onboardingStatus?: "INCOMPLETE" | "COMPLETE";
  onboardingMode?: "GUIDED" | "DIRECT";
  onboardingStep?: number;
};

export async function patchMyProfile(body: PatchProfileRequest) {
  return apiRequest<UserProfile>(
    GATEWAY_API_BASE,
    "/users/me",
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
    { auth: true }
  );
}

// 8/15/17/22) 진행 단계에 따라 현재 프로필을 다시 조회할 때 공통으로 사용
export async function getMyProfile() {
  return apiRequest<UserProfile>(
    GATEWAY_API_BASE,
    "/users/me",
    { method: "GET" },
    { auth: true }
  );
}

// 9/10) skinType 또는 personalColor가 "잘 모르겠어요"일 때 세부 질문을 요청
export async function submitOnboardingAnswer(field: string, value: string) {
  return apiRequest<OnboardingAnswerResponse>(
    GATEWAY_API_BASE,
    "/users/me/onboarding/answer",
    {
      method: "POST",
      body: JSON.stringify({ field, value }),
    },
    { auth: true }
  );
}

// 스킨타입/퍼스널컬러 세부 답변은 multipart/form-data로 전송합니다.
// detailAnswers는 JSON 문자열, photo는 사용자가 선택했을 때만 추가됩니다.
async function submitDetailFinal(
  path: string,
  detailAnswers: Record<string, string>,
  photo?: File | null
) {
  const form = new FormData();
  form.append("detailAnswers", JSON.stringify(detailAnswers));
  if (photo) form.append("photo", photo);

  return apiRequest<DetailAnalysisResponse>(
    GATEWAY_API_BASE,
    path,
    {
      method: "POST",
      body: form,
    },
    { auth: true }
  );
}

// 11/12) 스킨타입 세부 질문 최종 제출 (사진 없음/있음 공통)
export function submitSkinTypeDetailFinal(
  detailAnswers: Record<string, string>,
  photo?: File | null
) {
  return submitDetailFinal(
    "/users/me/onboarding/skin-type-detail/final",
    detailAnswers,
    photo
  );
}

// 13/14) 퍼스널컬러 세부 질문 최종 제출 (사진 없음/있음 공통)
export function submitPersonalColorDetailFinal(
  detailAnswers: Record<string, string>,
  photo?: File | null
) {
  return submitDetailFinal(
    "/users/me/onboarding/personal-color-detail/final",
    detailAnswers,
    photo
  );
}

// 16) 모든 온보딩 질문을 마친 뒤 한 번에 저장하는 프로필 BODY
export type FullProfileRequest = {
  nickname: string | null;
  gender: string | null;
  ageGroup: number | null;
  workDay: string | null;
  leaveTime: string | null;
  comeTime: string | null;
  workStyle: string | null;
  sleepHour: number | null;
  makeupFrequency: string | null;
  sunscreenFrequency: string | null;
  exerciseCount: number | null;
  sweatAmount: string | null;
  skinType: string | null;
  concerns: string | null;
  personalColor: string | null;
  onboardingMode: "DIRECT";
};

export async function saveFullProfile(body: FullProfileRequest) {
  return apiRequest<UserProfile>(
    GATEWAY_API_BASE,
    "/users/me/profile",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    { auth: true }
  );
}

// 18) 피드백 받고 싶은 루틴 저장
export async function saveRoutinePreferences(body: RoutinePreferences) {
  const { userId: _userId, ...payload } = body;
  return apiRequest<RoutinePreferences>(
    GATEWAY_API_BASE,
    "/users/me/routine-preferences",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    { auth: true }
  );
}

// 19) 저장한 루틴 선호도 다시 조회
export async function getRoutinePreferences() {
  return apiRequest<RoutinePreferences>(
    GATEWAY_API_BASE,
    "/users/me/routine-preferences",
    { method: "GET" },
    { auth: true }
  );
}

// 사진 재업로드 공통 함수: 기존 답변은 유지하고 photo만 multipart로 전송합니다.
async function reuploadPhoto(path: string, photo: File) {
  const form = new FormData();
  form.append("photo", photo);
  return apiRequest<PhotoRetryResponse>(
    GATEWAY_API_BASE,
    path,
    {
      method: "POST",
      body: form,
    },
    { auth: true }
  );
}

// 스킨타입 사진만 다시 업로드
export function reuploadSkinTypePhoto(photo: File) {
  return reuploadPhoto("/users/me/onboarding/skin-type-detail/photo", photo);
}

// 21) 퍼스널컬러 사진만 다시 업로드
export function reuploadPersonalColorPhoto(photo: File) {
  return reuploadPhoto("/users/me/onboarding/personal-color-detail/photo", photo);
}
