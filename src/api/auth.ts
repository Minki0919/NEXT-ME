import { apiRequest, GATEWAY_API_BASE } from "./http";
import type { LoginResponse } from "./types";

// POST /auth/register 요청 BODY
export type RegisterRequest = {
  username: string;
  password: string;
  name: string;
  email: string;
};

// 1) 회원가입
export async function register(body: RegisterRequest) {
  return apiRequest<string>(
    GATEWAY_API_BASE,
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

// 2) 이메일 인증번호 전송
export async function sendEmailCode(email: string) {
  return apiRequest<string>(
    GATEWAY_API_BASE,
    "/auth/email/send",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    }
  );
}

// 3) 이메일 인증번호 검증
export async function verifyEmailCode(email: string, code: string) {
  return apiRequest<string>(
    GATEWAY_API_BASE,
    "/auth/email/verify",
    {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }
  );
}

// 4) 로그인 - 성공하면 userId/accessToken/사용자 기본 정보를 받습니다.
export async function login(username: string, password: string) {
  return apiRequest<LoginResponse>(GATEWAY_API_BASE, "/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}
