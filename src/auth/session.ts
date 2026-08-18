import { clearAuthSession, getAuthSession } from "../utils/storage";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const value = token.startsWith("Bearer ") ? token.slice(7) : token;
    const payload = value.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function hasValidAuthSession() {
  const session = getAuthSession();
  if (!session?.accessToken) return false;

  const payload = decodeJwtPayload(session.accessToken);
  if (!payload || typeof payload.exp !== "number") return true;

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp <= nowSeconds) {
    clearAuthSession();
    return false;
  }

  return true;
}
