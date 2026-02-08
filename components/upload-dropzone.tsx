"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CloudUpload, Film, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface UploadResult {
  uploadId: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface UploadDropzoneProps {
  disabled?: boolean;
  demoUrl?: string | null;
  maxMb?: number;
  onUploaded: (result: UploadResult) => void;
  onCleared?: () => void;
}

const DEFAULT_MAX_MB = 50;

export function UploadDropzone({ disabled, demoUrl, maxMb = DEFAULT_MAX_MB, onUploaded, onCleared }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(demoUrl || null);
  const [filename, setFilename] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "uploaded" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (demoUrl) {
      setPreview(demoUrl);
      setFilename("demo.mp4");
      setStatus("idle");
      setProgress(0);
      setError(null);
    } else if (disabled) {
      setPreview(null);
      setFilename(null);
    }
  }, [demoUrl, disabled]);

  const validateFile = (file: File) => {
    if (file.type !== "video/mp4") {
      return "Only MP4 files are supported.";
    }
    if (file.size > maxMb * 1024 * 1024) {
      return `File exceeds ${maxMb}MB limit.`;
    }
    return null;
  };

  const reset = () => {
    setStatus("idle");
    setProgress(0);
    setError(null);
    setFilename(null);
    if (!demoUrl) {
      setPreview(null);
    }
    onCleared?.();
  };

  const uploadFile = useCallback((file: File) => {
    const validation = validateFile(file);
    if (validation) {
      setError(validation);
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setError(null);
    setFilename(file.name);
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onerror = () => {
      setStatus("error");
      setError("Upload failed. Please try again.");
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText) as UploadResult;
        setStatus("uploaded");
        setProgress(100);
        onUploaded(response);
      } else {
        setStatus("error");
        setError("Upload failed. Please try again.");
      }
    };
    xhr.send(formData);
  }, [onUploaded, maxMb]);

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const onSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative flex min-h-[210px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[28px] border-2 border-dashed border-ink/20 bg-white/90 p-6 text-center shadow-sticker transition",
          dragging && "border-primary bg-hero-cyan bg-cover",
          disabled && "cursor-not-allowed opacity-60"
        )}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !disabled) inputRef.current?.click();
        }}
        aria-disabled={disabled}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4"
          className="hidden"
          onChange={onSelect}
          disabled={disabled}
        />
        {preview ? (
          <div className="w-full">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>{filename || "Demo clip"}</span>
              {status === "uploaded" && !demoUrl ? <span className="text-success">Uploaded</span> : null}
            </div>
            <video className="mt-3 h-40 w-full rounded-2xl object-cover" src={preview} controls />
          </div>
        ) : (
          <>
            <div className="rounded-full bg-hero-pink p-4 shadow-pop">
              {disabled ? <Film className="h-6 w-6 text-ink" /> : <CloudUpload className="h-6 w-6 text-ink" />}
            </div>
            <div>
              <p className="text-sm text-ink font-semibold">Drag & drop an MP4 bug video</p>
              <p className="text-xs text-muted">Max size {maxMb}MB. No login required.</p>
            </div>
          </>
        )}
      </div>

      {status === "uploading" ? <Progress value={progress} /> : null}

      {error ? <p className="text-xs text-danger">{error}</p> : null}

      {preview && !disabled && !demoUrl ? (
        <Button variant="ghost" size="sm" onClick={reset} className="inline-flex items-center gap-2">
          <X className="h-4 w-4" />
          Clear upload
        </Button>
      ) : null}
    </div>
  );
}
