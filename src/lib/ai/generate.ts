import { AIError } from "@/lib/ai/errors";
import { parseGeneration, parseSingleTask } from "@/lib/ai/schemas";
import { regenerateOnePrompt, repairPrompt, systemPrompt } from "@/lib/ai/prompts";
import { toProvider } from "@/lib/ai/registry";
import type { GenerateInput } from "@/lib/ai/provider";
import type { GeneratedTask, ParsedGenerationResult } from "@/types/task";
import type { StoredProvider } from "@/types/provider";

export type UserMessage = {
  text: string;
  instructions: string;
};

export async function generateTasks(
  config: StoredProvider,
  message: UserMessage,
  images: GenerateInput["images"],
  signal?: AbortSignal,
): Promise<ParsedGenerationResult> {
  const provider = toProvider(config);
  const userText = assembleUserText(message);

  const input: GenerateInput = {
    systemPrompt: systemPrompt(),
    userText,
    images,
    signal,
  };

  let rawText: string;
  try {
    rawText = (await provider.generateTasks(input)).rawText;
  } catch (err) {
    throw err;
  }

  let parseFailure: AIError | null = null;
  try {
    return parseGeneration(rawText);
  } catch (err) {
    if (err instanceof AIError && err.kind === "invalid_json") {
      parseFailure = err;
    } else {
      throw err;
    }
  }

  const repairInput: GenerateInput = {
    systemPrompt: systemPrompt(),
    userText: `${userText}\n\n${repairPrompt(parseFailure?.message ?? "invalid JSON")}`,
    images,
    signal,
  };
  const repaired = await provider.generateTasks(repairInput);
  return parseGeneration(repaired.rawText);
}

export async function regenerateTask(
  config: StoredProvider,
  message: UserMessage,
  task: GeneratedTask,
  signal?: AbortSignal,
): Promise<GeneratedTask> {
  const provider = toProvider(config);
  const userText = `${assembleUserText(message)}\n\n${regenerateOnePrompt(JSON.stringify(task, null, 2))}`;
  const input: GenerateInput = {
    systemPrompt: systemPrompt(),
    userText,
    images: [],
    signal,
  };
  const result = await provider.generateTasks(input);
  return parseSingleTask(result.rawText);
}

function assembleUserText(message: UserMessage): string {
  const parts: string[] = [];
  if (message.text.trim()) parts.push(message.text.trim());
  if (message.instructions.trim()) {
    parts.push(`Extra instructions: ${message.instructions.trim()}`);
  }
  return parts.join("\n\n");
}
