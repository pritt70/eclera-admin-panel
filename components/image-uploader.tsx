"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, getCookie, BASE_API_URL } from "@/helper";
import toast from "@/lib/toast";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface ImageItem {
  id: string;
  url: string;
  previewUrl?: string;
  key?: string;
  fileName?: string;
  status: "pending" | "uploading" | "uploaded" | "error";
  progress?: number;
  localFile?: File;
  isPrimary?: boolean;
  error?: string;
}

export interface ImageUploaderProps {
  value?: any[];
  onChange?: (images: any[]) => void;
  singleValue?: any;
  onSingleChange?: (image: any) => void;
  removedKeys?: string[];
  onRemovedKeysChange?: (keys: string[]) => void;
  single?: boolean;
  folder?: string;
  maxFiles?: number;
  disabled?: boolean;
}

/**
 * Direct single file binary upload to Cloudflare R2 via backend streaming
 */
export async function directUploadFileToR2(
  file: File,
  folder: string = "products"
): Promise<{ key: string; publicUrl: string }> {
  const token =
    getCookie("admin_token") ||
    (typeof window !== "undefined" ? localStorage.getItem("admin_token") : null);

  const uploadEndpoint = `${BASE_API_URL}/uploads/direct?folder=${encodeURIComponent(
    folder
  )}&fileName=${encodeURIComponent(file.name)}`;

  const res = await fetch(uploadEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      ...(token ? { Authorization: `Bearer ${token}`, "x-admin-token": token } : {}),
    },
    body: file,
  });

  const data = await res.json();
  if (!res.ok || !data.status || !data.data) {
    throw new Error(data.message || `Upload failed with status ${res.status}`);
  }

  return {
    key: data.data.key,
    publicUrl: data.data.publicUrl,
  };
}

/**
 * Uploads all pending images in an array to Cloudflare R2 on save/confirm.
 * Leaves already uploaded images untouched.
 * Preserves order and primary flag.
 */
export async function uploadPendingImages(
  images: any[],
  folder: string = "products"
): Promise<Array<{ url: string; publicUrl: string; key: string; isPrimary?: boolean; fileName?: string }>> {
  if (!Array.isArray(images) || images.length === 0) return [];

  const results: Array<{ url: string; publicUrl: string; key: string; isPrimary?: boolean; fileName?: string }> = [];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const isPrimary = img.isPrimary !== undefined ? Boolean(img.isPrimary) : i === 0;

    if (img.localFile instanceof File) {
      // Pending local file to be uploaded to R2
      const uploaded = await directUploadFileToR2(img.localFile, folder);
      results.push({
        url: uploaded.publicUrl,
        publicUrl: uploaded.publicUrl,
        key: uploaded.key,
        isPrimary,
        fileName: img.fileName || img.localFile.name,
      });
    } else if (img.url || img.publicUrl) {
      // Existing already uploaded image
      const u = img.publicUrl || img.url;
      results.push({
        url: u,
        publicUrl: u,
        key: img.key || "",
        isPrimary,
        fileName: img.fileName,
      });
    }
  }

  // Ensure exactly one primary if images exist
  if (results.length > 0 && !results.some((r) => r.isPrimary)) {
    results[0].isPrimary = true;
  }

  return results;
}

/**
 * Uploads a single pending image to R2 on save/confirm if a local file was picked.
 * If already uploaded or empty, returns existing or null.
 */
export async function uploadSinglePendingImage(
  image: any,
  folder: string = "categories"
): Promise<{ url: string; publicUrl: string; key: string } | null> {
  if (!image) return null;

  if (image.localFile instanceof File) {
    const uploaded = await directUploadFileToR2(image.localFile, folder);
    return {
      url: uploaded.publicUrl,
      publicUrl: uploaded.publicUrl,
      key: uploaded.key,
    };
  }

  const u = image.publicUrl || image.url;
  if (u) {
    return {
      url: u,
      publicUrl: u,
      key: image.key || "",
    };
  }

  return null;
}

/**
 * Permanently deletes removed images from Cloudflare R2.
 * Triggered strictly when user confirms Save/Update.
 */
export async function deleteRemovedR2Keys(keys: string[]): Promise<void> {
  if (!Array.isArray(keys) || keys.length === 0) return;
  const uniqueKeys = Array.from(new Set(keys.filter((k) => typeof k === "string" && k.trim().length > 0)));

  await Promise.allSettled(
    uniqueKeys.map((key) =>
      api("uploads", { key, force: true }, { method: "DELETE" }).catch((err) => {
        console.warn(`Failed to delete R2 object key: ${key}`, err);
      })
    )
  );
}

export function ImageUploader({
  value,
  onChange,
  singleValue,
  onSingleChange,
  removedKeys = [],
  onRemovedKeysChange,
  single = false,
  folder = "products",
  maxFiles = 10,
  disabled = false,
}: ImageUploaderProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef(images);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  // Synchronize internal state with props safely
  useEffect(() => {
    let rawItems: any[] = [];
    if (singleValue !== undefined && singleValue !== null) {
      if (typeof singleValue === "string" && singleValue.trim()) {
        rawItems = [{ url: singleValue, key: "" }];
      } else if (typeof singleValue === "object" && (singleValue.url || singleValue.publicUrl || singleValue.localFile)) {
        rawItems = [singleValue];
      }
    } else if (Array.isArray(value)) {
      rawItems = single ? value.slice(0, 1) : value;
    }

    const normalized: ImageItem[] = rawItems
      .map((img: any, idx: number) => {
        const url = typeof img === "string" ? img : img?.url || img?.publicUrl || "";
        const key = typeof img === "object" ? img?.key || "" : "";
        const localFile = typeof img === "object" ? img?.localFile : undefined;
        if (!url && !localFile) return null;

        const id =
          (typeof img === "object" ? img?.id || img?._id || img?.key : null) ||
          (localFile ? `local_${localFile.name}_${idx}` : `img_${idx}_${url}`);

        return {
          id,
          url,
          key,
          localFile,
          fileName:
            (typeof img === "object" ? img?.fileName : "") ||
            localFile?.name ||
            key?.split("/").pop() ||
            `image_${idx + 1}.webp`,
          status: localFile ? "pending" : (typeof img === "object" ? img?.status : null) || "uploaded",
          progress: localFile ? 0 : 100,
          isPrimary:
            typeof img === "object" && img?.isPrimary !== undefined
              ? Boolean(img.isPrimary)
              : idx === 0,
          previewUrl: (typeof img === "object" ? img?.previewUrl : null) || url,
        } as ImageItem;
      })
      .filter((item): item is ImageItem => item !== null);

    setImages((prev) => {
      if (
        prev.length === normalized.length &&
        prev.every(
          (img, idx) =>
            img.url === normalized[idx]?.url &&
            img.key === normalized[idx]?.key &&
            img.localFile === normalized[idx]?.localFile &&
            img.status === normalized[idx]?.status &&
            img.isPrimary === normalized[idx]?.isPrimary
        )
      ) {
        return prev;
      }
      return normalized;
    });
  }, [single, singleValue, value]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => {
        if (img.previewUrl && img.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
  }, []);

  const trackRemovedKey = useCallback(
    (key?: string) => {
      if (!key) return;
      if (onRemovedKeysChange) {
        const current = removedKeys || [];
        if (!current.includes(key)) {
          onRemovedKeysChange([...current, key]);
        }
      }
    },
    [onRemovedKeysChange, removedKeys]
  );

  const notifyChange = useCallback(
    (newImages: ImageItem[]) => {
      setImages(newImages);
      if (onChange) {
        onChange(newImages);
      }
      if (single && onSingleChange) {
        const primary = newImages[0];
        if (primary) {
          onSingleChange({
            url: primary.url,
            publicUrl: primary.url,
            key: primary.key || "",
            localFile: primary.localFile,
            fileName: primary.fileName,
            status: primary.status,
          });
        } else {
          onSingleChange(null);
        }
      }
    },
    [onChange, onSingleChange, single]
  );

  // Validate and stage files locally (Deferred Upload)
  const processFiles = useCallback(
    (files: FileList | File[]) => {
      if (disabled) return;
      const fileArray = Array.from(files);

      const effectiveMax = single ? 1 : maxFiles;
      const remainingSlots = single ? 1 : effectiveMax - images.length;

      if (remainingSlots <= 0 && !single) {
        toast.warning(
          "Limit Reached",
          `You can only upload a maximum of ${effectiveMax} image${effectiveMax > 1 ? "s" : ""}.`
        );
        return;
      }

      const filesToProcess = fileArray.slice(0, remainingSlots);

      const stagedImages: ImageItem[] = [];

      filesToProcess.forEach((file) => {
        // Validate MIME type
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          toast.error(
            "Unsupported Format",
            `"${file.name}" is not supported. Please upload JPEG, PNG, or WebP images.`
          );
          return;
        }

        // Validate File size
        if (file.size > MAX_FILE_SIZE) {
          toast.error(
            "File Too Large",
            `"${file.name}" exceeds the 10MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`
          );
          return;
        }

        // Create local preview object URL (NO R2 UPLOAD YET)
        const previewUrl = URL.createObjectURL(file);
        const newImage: ImageItem = {
          id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          url: previewUrl,
          previewUrl,
          fileName: file.name,
          status: "pending", // Pending upload until save button is pressed
          progress: 0,
          localFile: file,
          key: "",
          isPrimary: single ? true : images.length === 0,
        };

        stagedImages.push(newImage);
      });

      if (stagedImages.length === 0) return;

      if (single) {
        // In single mode, if an existing saved image is being replaced, track its key for deletion on save
        const existing = images[0];
        if (existing?.key) {
          trackRemovedKey(existing.key);
        }
        if (existing?.previewUrl && existing.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(existing.previewUrl);
        }

        const next = [stagedImages[0]];
        notifyChange(next);
        toast.info("Image selected", "Image preview ready. It will upload when you click Save.");
      } else {
        const next = [...images, ...stagedImages];
        next.forEach((img, i) => {
          img.isPrimary = i === 0;
        });
        notifyChange(next);
        toast.info(
          `${stagedImages.length} image(s) selected`,
          "Images staged. They will be uploaded when you click Save."
        );
      }
    },
    [disabled, images, maxFiles, notifyChange, single, trackRemovedKey]
  );

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!disabled && e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Reorder controls
  const moveImage = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const updated = [...images];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    // Update primary flag (first is primary)
    updated.forEach((img, idx) => {
      img.isPrimary = idx === 0;
    });

    notifyChange(updated);
  };

  // Set as primary action
  const setPrimary = (index: number) => {
    if (index === 0) return;
    const updated = [...images];
    const [selected] = updated.splice(index, 1);
    updated.unshift(selected);

    updated.forEach((img, idx) => {
      img.isPrimary = idx === 0;
    });

    notifyChange(updated);
    toast.info("Primary Image Updated", `"${selected.fileName || "Image"}" set as primary.`);
  };

  // Remove image from UI selection (queues R2 key for deletion on Save, NO immediate R2 deletion)
  const handleDelete = (index: number) => {
    const target = images[index];
    if (!target) return;

    // Revoke local object URL if present
    if (target.previewUrl && target.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(target.previewUrl);
    }

    // If image had a storage key in R2, track it so it will be deleted from R2 when Save is clicked
    if (target.key) {
      trackRemovedKey(target.key);
    }

    const updated = images.filter((_, idx) => idx !== index);
    updated.forEach((img, idx) => {
      img.isPrimary = idx === 0;
    });

    notifyChange(updated);
    toast.info("Image removed", "Removed from selection. Changes will apply on Save.");
  };

  // Manual external URL
  const handleManualUrlApply = () => {
    const trimmed = manualUrl.trim();
    if (!trimmed) return;

    if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith("/")) {
      toast.error("Invalid URL", "Image URL must start with http:// or https://");
      return;
    }

    if (single && images[0]?.key) {
      trackRemovedKey(images[0].key);
    }

    const newImage: ImageItem = {
      id: `url_${Date.now()}`,
      url: trimmed,
      fileName: trimmed.split("/").pop() || "external-image.webp",
      status: "uploaded",
      progress: 100,
      isPrimary: single ? true : images.length === 0,
    };

    const next = single ? [newImage] : [...images, newImage];
    notifyChange(next);
    setManualUrl("");
    toast.success("Image URL added");
  };

  return (
    <div className="space-y-3">
      {/* Drag & Drop Upload Zone */}
      {(!single || images.length === 0) && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-[4px] p-6 text-center cursor-pointer transition-all ${
            isDragOver
              ? "border-[#B4395A] bg-[#B4395A]/5 scale-[0.99]"
              : "border-slate-300 hover:border-[#B4395A] bg-slate-50/50 hover:bg-slate-50"
          } ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={!single}
            accept={ALLOWED_MIME_TYPES.join(",")}
            onChange={(e) => e.target.files && processFiles(e.target.files)}
            className="sr-only"
            disabled={disabled}
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-500 shadow-xs">
              <svg className="w-5 h-5 text-[#B4395A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                <span className="text-[#B4395A] underline underline-offset-2">Click to choose image</span> or drag and drop
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PNG, JPG, WebP up to 10MB • Uploads to storage when you click Save / Confirm
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual URL Input */}
      {(!single || images.length === 0) && (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="url"
            placeholder="Or enter direct image URL (https://...)"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            disabled={disabled}
            className="flex-1 h-8 px-3 rounded-[3px] border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#B4395A]"
          />
          <Button
            type="button"
            onClick={handleManualUrlApply}
            disabled={disabled || !manualUrl.trim()}
            variant="outline"
            className="h-8 px-3 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Add URL
          </Button>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {images.length} {images.length === 1 ? "image" : "images"} selected
            </span>
            {!single && images.length > 1 && (
              <span className="text-[11px] text-slate-400">
                First image is Primary thumbnail. Use arrows to reorder.
              </span>
            )}
          </div>

          <div
            className={`grid gap-3 ${
              single
                ? folder === "banners"
                  ? "grid-cols-1 w-full max-w-full"
                  : "grid-cols-1 max-w-[280px]"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            }`}
          >
            {images.map((img, index) => (
              <div
                key={img.id}
                className={`relative group rounded-[3px] border bg-white shadow-xs overflow-hidden transition-all flex flex-col ${
                  img.isPrimary
                    ? "border-[#B4395A] ring-1 ring-[#B4395A]/30"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Thumbnail Display */}
                <div
                  className={`relative w-full bg-slate-100 overflow-hidden flex items-center justify-center ${
                    folder === "banners" && single
                      ? "aspect-[16/7] sm:aspect-[16/6] max-h-[220px]"
                      : "aspect-square"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.fileName || "Image Preview"}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='1.5'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                    }}
                  />

                  {/* Primary Badge */}
                  {img.isPrimary && !single && (
                    <div className="absolute top-1.5 left-1.5 z-10">
                      <Badge className="bg-[#B4395A] text-white text-[10px] px-1.5 py-0.5 uppercase tracking-wider font-bold shadow-xs">
                        Primary
                      </Badge>
                    </div>
                  )}

                  {/* Pending Save Badge */}
                  {img.status === "pending" && (
                    <div className="absolute bottom-1.5 left-1.5 z-10">
                      <span className="bg-amber-600/95 text-white text-[9px] px-1.5 py-0.5 rounded-[2px] font-semibold uppercase tracking-wider shadow-xs backdrop-blur-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Pending Save
                      </span>
                    </div>
                  )}

                  {/* Remove Button on Top-Right */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(index);
                    }}
                    disabled={disabled}
                    className="absolute top-1.5 right-1.5 z-10 p-1.5 bg-red-600/90 hover:bg-red-700 text-white rounded-full shadow-sm opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-50"
                    title="Remove image"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Footer Controls */}
                <div className="p-2 bg-white border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                  {single ? (
                    <div className="flex items-center justify-between gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled}
                        className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[3px] font-medium transition-colors cursor-pointer text-xs"
                      >
                        Change Image
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(index)}
                        disabled={disabled}
                        className="py-1 px-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-[3px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 text-xs ml-auto"
                        title="Remove image"
                      >
                        <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Reorder Left/Right */}
                      {images.length > 1 && (
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveImage(index, "left")}
                            disabled={index === 0 || disabled}
                            className="p-1 rounded-[2px] text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title="Move Left"
                          >
                            ◀
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(index, "right")}
                            disabled={index === images.length - 1 || disabled}
                            className="p-1 rounded-[2px] text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title="Move Right"
                          >
                            ▶
                          </button>
                        </div>
                      )}

                      {/* Set as Primary toggle */}
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => setPrimary(index)}
                          disabled={disabled}
                          className="text-[10px] text-[#B4395A] hover:underline font-semibold cursor-pointer"
                        >
                          Make Primary
                        </button>
                      )}

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(index)}
                        disabled={disabled}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-[2px] transition-colors ml-auto cursor-pointer"
                        title="Remove image"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
