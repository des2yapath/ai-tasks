export type AIErrorKind =
  | "network"
  | "auth"
  | "model_not_found"
  | "rate_limit"
  | "vision_rejected"
  | "server"
  | "timeout"
  | "invalid_json"
  | "empty"
  | "unknown";

export class AIError extends Error {
  readonly kind: AIErrorKind;
  readonly status?: number;

  constructor(kind: AIErrorKind, message: string, status?: number) {
    super(message);
    this.name = "AIError";
    this.kind = kind;
    this.status = status;
  }
}

export function describeError(err: unknown): string {
  if (err instanceof AIError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong while contacting the AI provider.";
}
