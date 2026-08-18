import type {
  DetailAnalysisResponse,
  LoginResponse,
  OnboardingQuestion,
  PhotoRetryResponse,
  RoutinePreferences,
  UserProfile,
} from "../api/types";

export const STORAGE_KEYS = {
  signup: "nextme.signup",
  auth: "nextme.auth",
  profile: "nextme.profile",
  onboardingTemplate: "nextme.onboardingTemplate",
  skinQuestions: "nextme.skinQuestions",
  personalColorQuestions: "nextme.personalColorQuestions",
  skinAnalysis: "nextme.skinAnalysis",
  personalColorAnalysis: "nextme.personalColorAnalysis",
  analysisTarget: "nextme.analysisTarget",
  routinePreferences: "nextme.routinePreferences",
  survey: "nextme.survey",
  charts: "nextme.charts",
  chartData: "nextme.chartData",
} as const;

export type JsonObject = Record<string, unknown>;

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeStored(key: string) {
  localStorage.removeItem(key);
}

export function updateSurvey(patch: JsonObject) {
  const current = readJson<JsonObject>(STORAGE_KEYS.survey, {});
  writeJson(STORAGE_KEYS.survey, { ...current, ...patch });
}

export function readSurvey() {
  return readJson<JsonObject>(STORAGE_KEYS.survey, {});
}

export function saveAuthSession(session: LoginResponse) {
  writeJson(STORAGE_KEYS.auth, session);
}

export function getAuthSession() {
  return readJson<LoginResponse | null>(STORAGE_KEYS.auth, null);
}

export function clearAuthSession() {
  removeStored(STORAGE_KEYS.auth);
  removeStored(STORAGE_KEYS.profile);
}

export function saveProfile(profile: UserProfile) {
  writeJson(STORAGE_KEYS.profile, profile);
}

export function getStoredProfile() {
  return readJson<UserProfile | null>(STORAGE_KEYS.profile, null);
}

export function saveOnboardingTemplate(template: OnboardingQuestion[]) {
  writeJson(STORAGE_KEYS.onboardingTemplate, template);
}

export function saveSkinQuestions(questions: OnboardingQuestion[] | null) {
  writeJson(STORAGE_KEYS.skinQuestions, questions ?? []);
}

export function savePersonalColorQuestions(questions: OnboardingQuestion[] | null) {
  writeJson(STORAGE_KEYS.personalColorQuestions, questions ?? []);
}

export type AnalysisTarget = "skinType" | "personalColor";
export type StoredAnalysisResponse =
  | DetailAnalysisResponse
  | PhotoRetryResponse;

export function saveAnalysisTarget(target: AnalysisTarget) {
  writeJson(STORAGE_KEYS.analysisTarget, target);
}

export function getStoredAnalysisTarget() {
  return readJson<AnalysisTarget>(STORAGE_KEYS.analysisTarget, "personalColor");
}

export function saveSkinAnalysis(response: StoredAnalysisResponse) {
  writeJson(STORAGE_KEYS.skinAnalysis, response);
}

export function getStoredSkinAnalysis() {
  return readJson<StoredAnalysisResponse | null>(STORAGE_KEYS.skinAnalysis, null);
}

export function savePersonalColorAnalysis(response: StoredAnalysisResponse) {
  writeJson(STORAGE_KEYS.personalColorAnalysis, response);
}

export function getStoredPersonalColorAnalysis() {
  return readJson<StoredAnalysisResponse | null>(
    STORAGE_KEYS.personalColorAnalysis,
    null
  );
}

export function saveStoredRoutinePreferences(preferences: RoutinePreferences) {
  writeJson(STORAGE_KEYS.routinePreferences, preferences);
}

export function clearNextMeLocalData() {
  for (const key of Object.values(STORAGE_KEYS)) {
    localStorage.removeItem(key);
  }
}
