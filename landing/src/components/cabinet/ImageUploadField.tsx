"use client";

import { useState, useRef, useId, type ChangeEvent, type DragEvent } from "react";
import { Camera, Image as ImageIcon, Link2, Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { imageSrc } from "@/lib/profile/links";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type UploadFieldProps = {
  kind: "avatar" | "banner";
  initialUrl?: string;
  name: string;
};

// Client-side visual image uploader for profile avatar and banner cover.
//
// Supports drag-and-drop, native file picking, instant local preview,
// server-side upload to /api/upload, and an expandable manual URL fallback.
export default function ImageUploadField({
  kind,
  initialUrl = "",
  name,
}: UploadFieldProps) {
  const t = useTranslations("cabinet.profile");
  const [value, setValue] = useState(initialUrl);
  const [preview, setPreview] = useState<string | null>(imageSrc(initialUrl));
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputId = useId();

  const isAvatar = kind === "avatar";

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Faqat rasm fayllari qabul qilinadi (JPG, PNG, WEBP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Rasm hajmi 10 MB dan oshmasligi kerak");
      return;
    }

    // Instant local preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", kind);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed with status " + res.status);
      }

      const data = (await res.json()) as { ok: boolean; url: string };
      if (data.url) {
        setValue(data.url);
        toast.success(isAvatar ? "Rasm yuklandi" : "Muqova yuklandi");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(t("uploadFailed"));
      // Revert preview on error if nothing saved
      if (!value) setPreview(null);
    } finally {
      setIsUploading(false);
    }
  }

  function onFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function handleRemove() {
    setValue("");
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Hidden inputs to carry values into standard FormData */}
      <input type="hidden" name={name} value={value} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onFileInputChange}
      />

      {isAvatar ? (
        /* Circular Avatar Uploader */
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl border border-border/80 bg-surface/50 backdrop-blur-xs">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex size-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 transition-all duration-200 ${
              isDragging
                ? "border-primary scale-105 ring-4 ring-primary/20"
                : "border-border hover:border-primary/80 hover:shadow-md"
            } bg-surface-2`}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Avatar"
                className="size-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-text-3 group-hover:text-primary transition-colors">
                <Camera className="size-8" />
              </div>
            )}

            {/* Hover overlay or upload spinner */}
            <div
              className={`absolute inset-0 flex items-center justify-center bg-black/40 text-white transition-opacity ${
                isUploading
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              }`}
            >
              {isUploading ? (
                <Loader2 className="size-6 animate-spin text-white" />
              ) : (
                <Camera className="size-6 text-white drop-shadow" />
              )}
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 text-xs font-semibold h-9 rounded-xl"
              >
                {isUploading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="size-3.5" />
                )}
                {preview ? t("changeAvatar") : t("uploadAvatar")}
              </Button>

              {preview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isUploading}
                  onClick={handleRemove}
                  className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-9 rounded-xl"
                >
                  <Trash2 className="size-3.5" />
                  {t("removeAvatar")}
                </Button>
              )}
            </div>

            <p className="text-[12px] text-text-3 leading-relaxed">
              {t("avatarHint")}
            </p>

            <button
              type="button"
              onClick={() => setShowUrlInput((s) => !s)}
              className="flex items-center gap-1 text-[11px] text-primary/80 hover:text-primary transition-colors pt-0.5"
            >
              <Link2 className="size-3" />
              <span>{t("orEnterUrl")}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Wide Banner Uploader */
        <div className="flex flex-col gap-3 p-4 rounded-2xl border border-border/80 bg-surface/50 backdrop-blur-xs">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200 ${
              isDragging
                ? "border-primary bg-primary/5 ring-4 ring-primary/20"
                : "border-border/80 hover:border-primary/80 hover:bg-surface-2/40"
            } bg-surface-2`}
          >
            {preview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Banner"
                  className="size-full object-cover transition-transform group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/90 drop-shadow-md">
                    {t("banner")}
                  </span>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md shadow-sm">
                      <Camera className="size-3" />
                      {t("changeBanner")}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 p-4 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-surface text-text-3 shadow-xs group-hover:text-primary group-hover:scale-110 transition-all">
                  <ImageIcon className="size-5" />
                </div>
                <span className="text-xs font-semibold text-text-1">
                  {t("uploadBanner")}
                </span>
                <span className="text-[11px] text-text-3 max-w-xs">
                  {t("bannerHint")}
                </span>
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white backdrop-blur-xs">
                <div className="flex items-center gap-2 rounded-xl bg-black/70 px-4 py-2 text-xs font-semibold shadow-xl">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span>{t("uploading")}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 text-xs font-semibold h-8 rounded-xl"
              >
                <UploadCloud className="size-3.5" />
                {preview ? t("changeBanner") : t("uploadBanner")}
              </Button>

              {preview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isUploading}
                  onClick={handleRemove}
                  className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-8 rounded-xl"
                >
                  <Trash2 className="size-3.5" />
                  {t("removeBanner")}
                </Button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowUrlInput((s) => !s)}
              className="flex items-center gap-1 text-[11px] text-primary/80 hover:text-primary transition-colors"
            >
              <Link2 className="size-3" />
              <span>{t("orEnterUrl")}</span>
            </button>
          </div>
        </div>
      )}

      {/* Manual URL Input dropdown fallback */}
      {showUrlInput && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs">
          <Link2 className="size-3.5 text-text-3 shrink-0" />
          <Input
            id={urlInputId}
            type="url"
            value={value}
            onChange={(e) => {
              const val = e.target.value;
              setValue(val);
              setPreview(imageSrc(val));
            }}
            placeholder="https://example.com/image.jpg"
            className="h-8 text-xs border-0 shadow-none focus-visible:ring-0 p-0"
          />
        </div>
      )}
    </div>
  );
}
