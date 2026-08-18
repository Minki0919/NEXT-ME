import type { FullProfileRequest } from "../api/users";
import type { UserProfile } from "../api/types";
import { getStoredProfile, readSurvey } from "./storage";

function asNullableString(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function asNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

// time 입력을 백엔드가 사용하는 HH:mm 형식으로 정규화합니다.
export function toTimeString(exactTime: unknown) {
  if (typeof exactTime !== "string") return null;
  const match = exactTime.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?$/);
  if (!match) return exactTime || null;
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? "00");
  if (
    !Number.isInteger(hour) ||
    hour < 0 ||
    hour > 23 ||
    !Number.isInteger(minute) ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// 여러 화면에 나뉘어 저장된 설문 값을 POST /users/me/profile BODY 하나로 합칩니다.
export function buildFullProfileRequest(
  overrides: Partial<UserProfile> = {}
): FullProfileRequest {
  const survey = readSurvey();
  const profile = { ...(getStoredProfile() ?? {}), ...overrides } as Partial<UserProfile>;
  const exerciseCount = asNullableNumber(
    survey.exerciseCount ?? profile.exerciseCount
  );
  const workDays = Array.isArray(survey.workDay)
    ? (survey.workDay as string[]).join(",")
    : asNullableString(survey.workDay ?? profile.workDay);
  const rawGender = asNullableString(survey.gender ?? profile.gender);
  const gender = rawGender === "여자" ? "여성" : rawGender === "남자" ? "남성" : rawGender;

  return {
    nickname: asNullableString(survey.nickname ?? profile.nickname),
    gender,
    ageGroup: asNullableNumber(survey.ageGroup ?? profile.ageGroup),
    workDay: workDays,
    leaveTime: toTimeString(
      survey.leaveTime ?? survey.endTime ?? profile.leaveTime
    ),
    comeTime: toTimeString(
      survey.comeTime ?? survey.startTime ?? profile.comeTime
    ),
    workStyle: asNullableString(survey.workStyle ?? profile.workStyle),
    sleepHour: asNullableNumber(survey.sleepHour ?? profile.sleepHour),
    makeupFrequency: asNullableString(
      survey.makeupFrequency ?? profile.makeupFrequency
    ),
    sunscreenFrequency: asNullableString(
      survey.sunscreenFrequency ?? profile.sunscreenFrequency
    ),
    exerciseCount,
    sweatAmount: asNullableString(survey.sweatAmount ?? profile.sweatAmount),
    skinType: asNullableString(survey.skinType ?? profile.skinType),
    concerns: asNullableString(survey.concerns ?? profile.concerns),
    personalColor: asNullableString(
      survey.personalColor ?? profile.personalColor
    ),
    onboardingMode: "DIRECT",
  };
}
