"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import {
  DOC_EXTENSIONS,
  FILE_LIMITS,
  IMAGE_MIME_TYPES,
} from "@/lib/constants";

export interface CapturedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  kind: "image" | "doc";
  base64?: string;
  textContent?: string;
  previewUrl?: string;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

async function readAsBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function readAsText(file: File): Promise<string> {
  return await file.text();
}

export function validateFile(
  file: File,
  existing: CapturedFile[],
): { ok: true; file: File } | { ok: false; error: string } {
  const isImage = (IMAGE_MIME_TYPES as readonly string[]).includes(file.type);
  const isDoc =
    DOC_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext)) ||
    file.type.startsWith("text/");
  if (!isImage && !isDoc) {
    return { ok: false, error: `"${file.name}" is not a supported file type. Use PNG/JPG/WebP images or .md/.txt files.` };
  }
  const images = existing.filter((f) => f.kind === "image").length + (isImage ? 1 : 0);
  const docs = existing.filter((f) => f.kind === "doc").length + (isDoc ? 1 : 0);
  if (isImage && images > FILE_LIMITS.maxImages) {
    return { ok: false, error: `At most ${FILE_LIMITS.maxImages} images per generation.` };
  }
  if (isDoc && docs > FILE_LIMITS.maxDocs) {
    return { ok: false, error: `At most ${FILE_LIMITS.maxDocs} text files per generation.` };
  }
  const totalBytes =
    existing.reduce((sum, f) => sum + f.size, 0) + file.size;
  if (totalBytes > FILE_LIMITS.maxTotalBytes) {
    return { ok: false, error: "Total upload size is limited to 20 MB per generation." };
  }
  if (isImage && file.size > FILE_LIMITS.imageMaxBytes) {
    return { ok: false, error: `"${file.name}" exceeds the 8 MB image limit.` };
  }
  if (isDoc && file.size > FILE_LIMITS.docMaxBytes) {
    return { ok: false, error: `"${file.name}" exceeds the 256 KB text file limit.` };
  }
  return { ok: true, file };
}

export function CaptureFiles({
  files,
  onAdd,
  onRemove,
  onError,
}: {
  files: CapturedFile[];
  onAdd: (files: CapturedFile[]) => void;
  onRemove: (id: string) => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function ingest(fileList: FileList | File[]) {
    const next: CapturedFile[] = [];
    for (const file of Array.from(fileList)) {
      const check = validateFile(file, [...files, ...next]);
      if (!check.ok) {
        onError(check.error);
        continue;
      }
      const isImage = (IMAGE_MIME_TYPES as readonly string[]).includes(file.type);
      const captured: CapturedFile = {
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        type: file.type || (isImage ? "image/png" : "text/plain"),
        size: file.size,
        kind: isImage ? "image" : "doc",
      };
      try {
        if (isImage) {
          captured.base64 = await readAsBase64(file);
          captured.previewUrl = URL.createObjectURL(file);
        } else {
          captured.textContent = await readAsText(file);
        }
        next.push(captured);
      } catch {
        onError(`Could not read "${file.name}".`);
      }
    }
    if (next.length > 0) onAdd(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={[...IMAGE_MIME_TYPES, ...DOC_EXTENSIONS, "text/*"].join(",")}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void ingest(e.target.files);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void ingest(e.dataTransfer.files);
        }}
        className={cn(
          "flex min-h-20 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-4 text-center transition-colors",
          dragging ? "border-primary bg-accent/40" : "hover:bg-accent/30",
        )}
      >
        <Icon name="plus" className="size-5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Drop images or .md/.txt files, or click to browse — you can also paste screenshots with
          Ctrl+V
        </span>
      </button>
      {files.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="group relative flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs shadow-sm"
            >
              {file.kind === "image" && file.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- local object URL preview of a file the user just attached
                <img
                  src={file.previewUrl}
                  alt={file.name}
                  className="size-8 rounded object-cover"
                />
              ) : (
                <Icon name={file.kind === "image" ? "image" : "file"} className="size-4 text-muted-foreground" />
              )}
              <span className="flex flex-col">
                <span className="max-w-44 truncate font-medium">{file.name}</span>
                <span className="text-muted-foreground">{formatBytes(file.size)}</span>
              </span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => onRemove(file.id)}
                className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Icon name="x" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
