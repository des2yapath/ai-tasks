export type ProviderType = "gemini" | "openai-compatible";

export interface ProviderHeader {
  key: string;
  value: string;
}

export interface StoredProvider {
  id: string;
  type: ProviderType;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  organization: string;
  extraHeaders: ProviderHeader[];
  supportsVision: boolean;
  supportsJson: boolean;
  isDefault: boolean;
  enabled: boolean;
}
