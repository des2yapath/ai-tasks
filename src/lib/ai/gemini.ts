import { AIError } from "@/lib/ai/errors";
import { fetchJson, visionRejection, type AIProvider, type GenerateInput, type TestInput } from "@/lib/ai/provider";
import type { StoredProvider } from "@/types/provider";

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
  }[];
  error?: { message?: string };
}

function endpoint(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
}

function buildBody(input: GenerateInput): Record<string, unknown> {
  const parts: Record<string, unknown>[] = [{ text: input.userText }];
  for (const image of input.images) {
    parts.push({ inlineData: { mimeType: image.mimeType, data: image.base64 } });
  }
  return {
    systemInstruction: { parts: [{ text: input.systemPrompt }] },
    contents: [{ role: "user", parts }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
  };
}

function extractText(data: unknown): string {
  const res = data as GeminiResponse;
  if (res.error?.message) {
    throw new AIError("unknown", `Gemini error: ${res.error.message}`);
  }
  const parts = res.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? "").join("");
  return text;
}

export function createGeminiProvider(config: StoredProvider): AIProvider {
  return {
    id: config.id,
    name: config.name,
    type: "gemini",
    supportsVision: config.supportsVision,
    supportsJson: config.supportsJson,

    async generateTasks(input: GenerateInput) {
      if (input.images.length > 0 && !config.supportsVision) {
        throw visionRejection(config.name);
      }
      const data = await fetchJson(
        endpoint(config.model),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": config.apiKey,
          },
          body: JSON.stringify(buildBody(input)),
        },
        config.name,
        input.signal,
      );
      const rawText = extractText(data);
      if (rawText.trim() === "") {
        throw new AIError("empty", "The model returned an empty response.");
      }
      return { rawText };
    },

    async testConnection(input: TestInput) {
      const testBody = {
        contents: [
          {
            role: "user",
            parts: input.image
              ? [
                  { text: input.prompt },
                  { inlineData: { mimeType: input.image.mimeType, data: input.image.base64 } },
                ]
              : [{ text: input.prompt }],
          },
        ],
      };
      const data = await fetchJson(
        endpoint(config.model),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": config.apiKey,
          },
          body: JSON.stringify(testBody),
        },
        config.name,
      );
      const rawText = extractText(data);
      return { ok: rawText.trim() !== "", message: rawText.trim().slice(0, 200) || "Empty response" };
    },
  };
}
