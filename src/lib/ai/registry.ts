import { createGeminiProvider } from "@/lib/ai/gemini";
import { createOpenAICompatibleProvider } from "@/lib/ai/openai-compatible";
import type { AIProvider } from "@/lib/ai/provider";
import type { StoredProvider } from "@/types/provider";

export function toProvider(config: StoredProvider): AIProvider {
  if (config.type === "gemini") return createGeminiProvider(config);
  return createOpenAICompatibleProvider(config);
}
