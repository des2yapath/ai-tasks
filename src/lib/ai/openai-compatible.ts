import { AIError } from "@/lib/ai/errors";
import { fetchJson, visionRejection, type AIProvider, type GenerateInput, type TestInput } from "@/lib/ai/provider";
import type { StoredProvider } from "@/types/provider";

interface ChatResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  if (base.endsWith(path)) return base;
  return `${base}${path}`;
}

function extractText(data: unknown): string {
  const res = data as ChatResponse;
  if (res.error?.message) {
    throw new AIError("unknown", `Provider error: ${res.error.message}`);
  }
  return res.choices?.[0]?.message?.content ?? "";
}

export function createOpenAICompatibleProvider(config: StoredProvider): AIProvider {
  const url = joinUrl(config.baseUrl, "/chat/completions");

  function headers(): Record<string, string> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    };
    if (config.organization) h["OpenAI-Organization"] = config.organization;
    for (const header of config.extraHeaders) {
      if (header.key) h[header.key] = header.value;
    }
    return h;
  }

  return {
    id: config.id,
    name: config.name,
    type: "openai-compatible",
    supportsVision: config.supportsVision,
    supportsJson: config.supportsJson,

    async generateTasks(input: GenerateInput) {
      if (input.images.length > 0 && !config.supportsVision) {
        throw visionRejection(config.name);
      }
      const userContent: unknown = config.supportsVision
        ? [
            { type: "text", text: input.userText },
            ...input.images.map((image) => ({
              type: "image_url",
              image_url: { url: `data:${image.mimeType};base64,${image.base64}` },
            })),
          ]
        : input.userText;

      const body: Record<string, unknown> = {
        model: config.model,
        temperature: 0.3,
        messages: [
          { role: "system", content: input.systemPrompt },
          { role: "user", content: userContent },
        ],
        ...(config.supportsJson ? { response_format: { type: "json_object" } } : {}),
      };

      const data = await fetchJson(
        url,
        { method: "POST", headers: headers(), body: JSON.stringify(body) },
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
      const body: Record<string, unknown> = {
        model: config.model,
        messages: [
          {
            role: "user",
            content: input.image
              ? [
                  { type: "text", text: input.prompt },
                  {
                    type: "image_url",
                    image_url: { url: `data:${input.image.mimeType};base64,${input.image.base64}` },
                  },
                ]
              : input.prompt,
          },
        ],
      };
      const data = await fetchJson(
        url,
        { method: "POST", headers: headers(), body: JSON.stringify(body) },
        config.name,
      );
      const rawText = extractText(data);
      return { ok: rawText.trim() !== "", message: rawText.trim().slice(0, 200) || "Empty response" };
    },
  };
}
