import { clearAuthSession, getAuthSession } from "../utils/storage";

// 모든 프론트 요청은 Gateway 하나를 통해 전달합니다.
export const GATEWAY_API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function bearerAuthorization(token: string) {
  return /^Bearer\s+/i.test(token) ? token : `Bearer ${token}`;
}

function extractMessage(data: unknown, fallback: string) {
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    for (const key of ["message", "error", "detail"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return fallback;
}

function responseMessage(data: unknown) {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;
  return [record.message, record.error, record.detail]
    .find((value): value is string => typeof value === "string") ?? "";
}

function isInvalidAuthenticationResponse(status: number, data: unknown) {
  if (status === 401) return true;
  const message = responseMessage(data);
  return status === 400 && /인증\s*토큰.*(유효하지|누락)/.test(message);
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (response.status === 204) return null;
  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }
  const text = await response.text().catch(() => "");
  return text || null;
}

// 모든 API 호출이 공통으로 사용하는 fetch 래퍼입니다.
// JSON 요청에는 Content-Type을 자동 추가하고, FormData에는 브라우저가 boundary를 설정하도록 직접 넣지 않습니다.
export async function apiRequest<T>(
  base: string,
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean } = {}
): Promise<T> {
  const baseHeaders = new Headers(init.headers ?? {});
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;

  if (!isFormData && init.body && !baseHeaders.has("Content-Type")) {
    baseHeaders.set("Content-Type", "application/json");
  }

  if (options.auth) {
    const session = getAuthSession();
    const token = session?.accessToken ?? null;
    if (!token) throw new ApiError("로그인이 필요합니다.", 401, null);
    baseHeaders.set("Authorization", bearerAuthorization(token));
  }

  let response: Response | null = null;

  try {
    response = await fetch(`${base}${path}`, {
      ...init,
      headers: baseHeaders,
    });
  } catch (error) {
    // 네트워크 자체가 연결되지 않은 경우(ngrok 종료, DNS/인터넷 문제 등)
    // HTTP 상태 코드가 없기 때문에 status=0으로 구분합니다.
    console.error("[API 연결 실패]", {
      url: `${base}${path}`,
      error,
    });
    throw new ApiError(
      "백엔드 서버에 연결할 수 없습니다. ngrok 주소와 서버 실행 상태를 확인해 주세요.",
      0,
      error
    );
  }

  if (!response) throw new ApiError("서버 요청을 시작하지 못했습니다.", 0, null);

  const data = await parseResponse(response);

  if (!response.ok) {
    if (options.auth && isInvalidAuthenticationResponse(response.status, data)) {
      clearAuthSession();
      if (typeof window !== "undefined" && window.location.pathname !== "/email-login") {
        window.setTimeout(() => window.location.assign("/email-login"), 0);
      }
    }

    const fallbackMessage =
      response.status === 403 && path === "/auth/login"
        ? "아이디 또는 비밀번호가 올바르지 않습니다. 서버가 변경되었다면 새 서버에서 회원가입 후 로그인해 주세요."
        : `요청에 실패했습니다. (${response.status})`;

    throw new ApiError(
      extractMessage(data, fallbackMessage),
      response.status,
      data
    );
  }

  return data as T;
}
