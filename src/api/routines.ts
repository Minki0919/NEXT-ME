import { apiRequest, GATEWAY_API_BASE } from "./http";
import type {
  RoutineCompletionStats,
  RoutinePlan,
  RoutineProgress,
  RoutineSettings,
} from "./types";

export function generateTodayRoutine(additionalRequest?: string) {
  const normalizedRequest = additionalRequest?.trim();
  if (normalizedRequest && normalizedRequest.length > 1000) {
    throw new Error("루틴 추가 요청은 1,000자 이하로 입력해 주세요.");
  }

  return apiRequest<RoutinePlan>(
    GATEWAY_API_BASE,
    "/routines/me/today/generate",
    {
      method: "POST",
      body: JSON.stringify(
        normalizedRequest ? { additionalRequest: normalizedRequest } : {}
      ),
    },
    { auth: true }
  );
}

export function getTodayRoutine() {
  return apiRequest<RoutinePlan>(
    GATEWAY_API_BASE,
    "/routines/me/today",
    { method: "GET" },
    { auth: true }
  );
}

export function getTodayRoutineProgress() {
  return apiRequest<RoutineProgress>(
    GATEWAY_API_BASE,
    "/routines/me/today/progress",
    { method: "GET" },
    { auth: true }
  );
}

export function setRoutineItemCompleted(itemId: number, completed: boolean) {
  return apiRequest<RoutinePlan>(
    GATEWAY_API_BASE,
    `/routines/me/today/items/${encodeURIComponent(itemId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    },
    { auth: true }
  );
}

export function adjustTodayRoutine(message: string) {
  const normalizedMessage = message.trim();
  if (!normalizedMessage) {
    throw new Error("변경하고 싶은 내용을 입력해 주세요.");
  }
  if (normalizedMessage.length > 1000) {
    throw new Error("일일 루틴 변경 요청은 1,000자 이하로 입력해 주세요.");
  }

  return apiRequest<RoutinePlan>(
    GATEWAY_API_BASE,
    "/routines/me/today/adjust",
    {
      method: "POST",
      body: JSON.stringify({ message: normalizedMessage }),
    },
    { auth: true }
  );
}

export function getRoutineSettings() {
  return apiRequest<RoutineSettings>(
    GATEWAY_API_BASE,
    "/routines/me/settings",
    { method: "GET" },
    { auth: true }
  );
}

export function updateRoutineSettings(body: {
  resetTime: string;
  zoneId?: string;
}) {
  return apiRequest<RoutineSettings>(
    GATEWAY_API_BASE,
    "/routines/me/settings",
    {
      method: "PUT",
      body: JSON.stringify(body),
    },
    { auth: true }
  );
}

export function getRoutineCompletionStats() {
  return apiRequest<RoutineCompletionStats>(
    GATEWAY_API_BASE,
    "/routines/me/stats",
    { method: "GET" },
    { auth: true }
  );
}
