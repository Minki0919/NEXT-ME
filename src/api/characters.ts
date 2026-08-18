import { apiRequest, GATEWAY_API_BASE } from "./http";
import type { CharacterCatalog, CharacterCollection } from "./types";

export function getMyCharacterCollection() {
  return apiRequest<CharacterCollection>(
    GATEWAY_API_BASE,
    "/characters/me/collection",
    { method: "GET" },
    { auth: true }
  );
}

export function getMyCharacterCatalog() {
  return apiRequest<CharacterCatalog>(
    GATEWAY_API_BASE,
    "/characters/me/catalog",
    { method: "GET" },
    { auth: true }
  );
}
