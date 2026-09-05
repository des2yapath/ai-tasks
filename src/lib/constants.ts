export const APP_NAME = "Tasks";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export const FILE_LIMITS = {
  imageMaxBytes: 8 * 1024 * 1024,
  docMaxBytes: 256 * 1024,
  maxImages: 6,
  maxDocs: 4,
  maxTotalBytes: 20 * 1024 * 1024,
} as const;

export const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export const DOC_EXTENSIONS = [".md", ".txt"] as const;

export const STORAGE_KEYS = {
  providers: "ai.providers.v1",
  theme: "theme",
  offlineQueue: "offline.queue.v1",
} as const;
