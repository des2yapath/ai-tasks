import { AIError } from "@/lib/ai/errors";

export type GenerateInput = {
  systemPrompt: string;
  userText: string;
  images: { mimeType: string; base64: string; name?: string }[];
  signal?: AbortSignal;
};

export type TestInput = {
  prompt: string;
  image?: { mimeType: string; base64: string };
};

export type GenerateResult = { rawText: string };

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  readonly type: "gemini" | "openai-compatible";
  readonly supportsVision: boolean;
  readonly supportsJson: boolean;
  generateTasks(input: GenerateInput): Promise<GenerateResult>;
  testConnection(input: TestInput): Promise<{ ok: boolean; message: string }>;
}

const TIMEOUT_MS = 60_000;

export async function fetchJson(
  url: string,
  init: RequestInit,
  providerName: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), TIMEOUT_MS);
  const onExternalAbort = () => timeout.abort();
  signal?.addEventListener("abort", onExternalAbort);

  try {
    const response = await fetch(url, { ...init, signal: timeout.signal });
    if (!response.ok) {
      let detail = "";
      try {
        const body = (await response.json()) as { error?: { message?: string } | string };
        const err = body?.error;
        detail = typeof err === "string" ? err : err?.message ?? "";
      } catch {
        /* non-JSON error body */
      }
      throw httpError(response.status, providerName, detail);
    }
    return await response.json();
  } catch (err) {
    if (err instanceof AIError) throw err;
    if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) {
      throw new AIError("timeout", "The request timed out after 60s. Try again, or use a faster model.");
    }
    if (err instanceof TypeError) {
      throw new AIError(
        "network",
        `Unable to contact ${providerName}. Possible causes: a network connection problem, the endpoint being down, or a browser extension or firewall blocking requests.`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onExternalAbort);
  }
}

function httpError(status: number, providerName: string, detail: string): AIError {
  if (status === 401 || status === 403) {
    return new AIError(
      "auth",
      `Invalid API key for ${providerName}. Check the key in Settings → AI Providers.`,
      status,
    );
  }
  if (status === 404) {
    return new AIError(
      "model_not_found",
      `The model or endpoint was not found at ${providerName}. Check the model name and base URL. ${detail}`.trim(),
      status,
    );
  }
  if (status === 429) {
    return new AIError(
      "rate_limit",
      `Rate limit reached at ${providerName}. Wait a moment and retry (free tiers have daily limits).`,
      status,
    );
  }
  if (status >= 500) {
    return new AIError("server", `${providerName} server error (${status}). Try again shortly.`, status);
  }
  return new AIError(
    "unknown",
    `${providerName} rejected the request (${status}). ${detail}`.trim(),
    status,
  );
}

export function visionRejection(providerName: string): AIError {
  return new AIError(
    "vision_rejected",
    `The request was rejected. If the model doesn't support images, remove image attachments or pick a vision-capable model (${providerName}).`,
  );
}
