import { DEFAULT_GEMINI_MODEL, STORAGE_KEYS } from "@/lib/constants";
import { newId } from "@/lib/utils/id";
import type { StoredProvider } from "@/types/provider";

export const BUILTIN_GEMINI_ID = "gemini-builtin";

function builtinGemini(): StoredProvider {
  return {
    id: BUILTIN_GEMINI_ID,
    type: "gemini",
    name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com",
    apiKey: "",
    model: DEFAULT_GEMINI_MODEL,
    organization: "",
    extraHeaders: [],
    supportsVision: true,
    supportsJson: true,
    isDefault: true,
    enabled: true,
  };
}

function normalize(list: StoredProvider[]): StoredProvider[] {
  const valid = list.filter(
    (p) => p && typeof p.id === "string" && typeof p.apiKey === "string" && typeof p.model === "string",
  );
  if (!valid.some((p) => p.id === BUILTIN_GEMINI_ID)) {
    valid.unshift(builtinGemini());
  }
  if (!valid.some((p) => p.isDefault && p.enabled)) {
    const first = valid.find((p) => p.enabled);
    if (first) first.isDefault = true;
  }
  const defaults = valid.filter((p) => p.isDefault);
  if (defaults.length > 1) {
    for (const p of defaults.slice(1)) p.isDefault = false;
  }
  return valid;
}

export function loadProviders(): StoredProvider[] {
  if (typeof window === "undefined") return [builtinGemini()];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.providers);
    if (!raw) return [builtinGemini()];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [builtinGemini()];
    return normalize(parsed as StoredProvider[]);
  } catch {
    return [builtinGemini()];
  }
}

export function saveProviders(list: StoredProvider[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.providers, JSON.stringify(list));
    window.dispatchEvent(new Event("providers-change"));
  } catch {
    /* storage unavailable */
  }
}

export function getDefaultProvider(list: StoredProvider[]): StoredProvider | null {
  return list.find((p) => p.isDefault && p.enabled) ?? list.find((p) => p.enabled) ?? null;
}

export function newProviderDraft(): StoredProvider {
  return {
    id: newId(),
    type: "openai-compatible",
    name: "",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey: "",
    model: "",
    organization: "",
    extraHeaders: [],
    supportsVision: false,
    supportsJson: true,
    isDefault: false,
    enabled: true,
  };
}
