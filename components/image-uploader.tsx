"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, getCookie, BASE_API_URL } from "@/helper";
import toast from "@/lib/toast";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ImageUploader({
  value,
  onChange,
  singleValue,
  onSingleChange,
  single = false,
  folder = "products",
  maxFiles = 10,
  disabled = false,
}: any) {
  const [images, setImages] = useState<any[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeXhrs = useRef<Map<string, XMLHttpRequest>>(new Map());
  const imagesRef = useRef(images);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  const singleUrl = singleValue?.url;
  const singleKey = singleValue?.key;

  // Synchronize internal state with props safely without infinite re-render loops
  useEffect(() => {
    if (single) {
      if (singleUrl) {
        setImages((prev) => {
          if (
            prev.length === 1 &&
            prev[0].url === singleUrl &&
            prev[0].key === (singleKey || "")
          ) {
            return prev;
          }
          return [
            {
              id: singleKey || "single_img_1",
              key: singleKey || "",
              url: singleUrl,
              fileName: singleKey?.split("/").pop() || "image.webp",
              status: "uploaded",
              progress: 100,
              isPrimary: true,
            },
          ];
        });
      } else {
        setImages((prev) => (prev.length === 0 ? prev : []));
      }
    } else if (Array.isArray(value)) {
      setImages((prev) => {
        if (
          prev.length === value.length &&
          prev.every(
            (img, idx) =>
              img.id === value[idx]?.id &&
              img.url === value[idx]?.url &&
              img.status === value[idx]?.status &&
              img.progress === value[idx]?.progress &&
              img.isPrimary === value[idx]?.isPrimary
          )
        ) {
          return prev;
        }
        return value;
      });
    }
  }, [single, singleUrl, singleKey, value]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => {
        if (img.previewUrl && img.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
      // Abort any ongoing XHR uploads
      activeXhrs.current.forEach((xhr) => xhr.abort());
    };
  }, []);

  const notifyChange = useCallback(
    (newImages: any[]) => {
      setImages(newImages);
      if (onChange) {
        onChange(newImages);
      }
      if (single && onSingleChange) {
        const primary = newImages[0];
        if (primary && primary.status === "uploaded") {
          onSingleChange({ url: primary.url, key: primary.key || "" });
        } else {
          onSingleChange({ url: "", key: "" });
        }
      }
    },
    [onChange, onSingleChange, single]
  );

  // Upload to Cloudflare R2 via backend direct streaming endpoint (bypasses browser CORS restrictions)
  const uploadFileToR2 = useCallback(
    async (imgId: string, file: File) => {
      try {
        const token =
          getCookie("admin_token") ||
          (typeof window !== "undefined" ? localStorage.getItem("admin_token") : null);

        const uploadEndpoint = `${BASE_API_URL}/uploads/direct?folder=${encodeURIComponent(
          folder
        )}&fileName=${encodeURIComponent(file.name)}`;

        const xhr = new XMLHttpRequest();
        activeXhrs.current.set(imgId, xhr);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setImages((prev) =>
              prev.map((img) =>
                img.id === imgId ? { ...img, progress } : img
              )
            );
          }
        };

        xhr.onload = () => {
          activeXhrs.current.delete(imgId);
          try {
            const res = JSON.parse(xhr.responseText || "{}");
            if (xhr.status >= 200 && xhr.status < 300 && res.status && res.data) {
              const { key, publicUrl } = res.data;
              setImages((prev) => {
                const updated = prev.map((img) =>
                  img.id === imgId
                    ? {
                      ...img,
                      status: "uploaded" as const,
                      progress: 100,
                      key,
                      url: publicUrl,
                    }
                    : img
                );
                notifyChange(updated);
                return updated;
              });
              toast.success("Uploaded", `${file.name} uploaded successfully.`);
            } else {
              const errMsg = res.message || `Upload failed with status ${xhr.status}.`;
              setImages((prev) =>
                prev.map((img) =>
                  img.id === imgId ? { ...img, status: "error", error: errMsg } : img
                )
              );
              toast.error("Storage Error", errMsg);
            }
          } catch {
            const errMsg = `Upload failed with status ${xhr.status}`;
            setImages((prev) =>
              prev.map((img) =>
                img.id === imgId ? { ...img, status: "error", error: errMsg } : img
              )
            );
            toast.error("Storage Error", errMsg);
          }
        };

        xhr.onerror = () => {
          activeXhrs.current.delete(imgId);
          const errMsg = "Network error connecting to API server";
          setImages((prev) =>
            prev.map((img) =>
              img.id === imgId ? { ...img, status: "error", error: errMsg } : img
            )
          );
          toast.error("Network Error", errMsg);
        };

        xhr.open("POST", uploadEndpoint, true);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.setRequestHeader("x-admin-token", token);
        }
        xhr.send(file);
      } catch (err: any) {
        setImages((prev) =>
          prev.map((img) =>
            img.id === imgId
              ? { ...img, status: "error", error: err?.message || "Upload exception" }
              : img
          )
        );
        toast.error("Upload Failed", err?.message || "Could not upload file.");
      }
    },
    [folder, notifyChange]
  );

  // Validate and enqueue files
  const processFiles = useCallback(
    (files: FileList | File[]) => {
      if (disabled) return;
      const fileArray = Array.from(files);

      const effectiveMax = single ? 1 : maxFiles;
      const remainingSlots = effectiveMax - images.length;

      if (remainingSlots <= 0) {
        toast.warning(
          "Limit Reached",
          `You can only upload a maximum of ${effectiveMax} image${effectiveMax > 1 ? "s" : ""}.`
        );
        return;
      }

      const filesToProcess = fileArray.slice(0, remainingSlots);

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

        const previewUrl = URL.createObjectURL(file);
        const newImage: any = {
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          url: previewUrl,
          previewUrl,
          fileName: file.name,
          status: "uploading",
          progress: 0,
          localFile: file,
          isPrimary: images.length === 0,
        };

        setImages((prev) => {
          const next = single ? [newImage] : [...prev, newImage];
          // Ensure first image is marked primary
          if (next.length > 0) {
            next.forEach((img, i) => {
              img.isPrimary = i === 0;
            });
          }
          return next;
        });

        // Start upload
        uploadFileToR2(newImage.id, file);
      });
    },
    [disabled, images.length, maxFiles, single, uploadFileToR2]
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

  // Delete image (with backend R2 deletion if key exists)
  const handleDelete = async (index: number) => {
    const target = images[index];
    if (!target) return;

    const confirmed = await toast.confirm({
      title: "Remove Image?",
      text: "This image will be removed from your catalog.",
      confirmButtonText: "Remove",
    });

    if (!confirmed) return;

    // Abort if currently uploading
    const activeXhr = activeXhrs.current.get(target.id);
    if (activeXhr) {
      activeXhr.abort();
      activeXhrs.current.delete(target.id);
    }

    // Revoke object URL
    if (target.previewUrl && target.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(target.previewUrl);
    }

    // Call backend delete if object key is present
    if (target.key) {
      try {
        const delRes = await api("uploads", { key: target.key, force: true }, { method: "DELETE" });
        if (!delRes || !delRes.status) {
          toast.error("Failed to Remove", delRes?.message || "Could not delete image from storage.");
          return;
        }
      } catch (err: any) {
        toast.error("Error", err?.message || "Could not remove image.");
        return;
      }
    }

    const updated = images.filter((_, idx) => idx !== index);
    updated.forEach((img, idx) => {
      img.isPrimary = idx === 0;
    });

    notifyChange(updated);
    toast.success("Image removed");
  };

  // Retry failed upload
  const handleRetry = (target: any) => {
    if (!target.localFile) {
      toast.error("Retry Error", "Source file no longer in memory. Please select it again.");
      return;
    }

    setImages((prev) =>
      prev.map((img) =>
        img.id === target.id ? { ...img, status: "uploading", progress: 0, error: undefined } : img
      )
    );

    uploadFileToR2(target.id, target.localFile);
  };

  // Manual URL apply (for fallback/external URLs)
  const handleManualUrlApply = () => {
    const trimmed = manualUrl.trim();
    if (!trimmed) return;

    if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith("/")) {
      toast.error("Invalid URL", "Image URL must start with http:// or https://");
      return;
    }

    const newImage: any = {
      id: `url_${Date.now()}`,
      url: trimmed,
      fileName: trimmed.split("/").pop() || "external-image.webp",
      status: "uploaded",
      progress: 100,
      isPrimary: images.length === 0,
    };

    const next = single ? [newImage] : [...images, newImage];
    notifyChange(next);
    setManualUrl("");
    toast.success("Image added via URL");
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
          className={`relative border-2 border-dashed rounded-[4px] p-6 text-center cursor-pointer transition-all ${isDragOver
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
                <span className="text-[#B4395A] underline underline-offset-2">Click to upload</span> or drag and drop images
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PNG, JPG, WebP up to 10MB per file (original resolution preserved)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual URL Input Accordion/Bar */}
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
                Use arrows to reorder. The first image is the Primary.
              </span>
            )}
          </div>

          <div
            className={`grid gap-3 ${single
              ? "grid-cols-1"
              : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              }`}
          >
            {images.map((img, index) => (
              <div
                key={img.id}
                className={`relative group rounded-[3px] border bg-white shadow-xs overflow-hidden transition-all flex flex-col ${img.isPrimary
                  ? "border-[#B4395A] ring-1 ring-[#B4395A]/30"
                  : "border-slate-200 hover:border-slate-300"
                  }`}
              >
                {/* Thumbnail Display at original full aspect ratio */}
                <div className="relative aspect-square w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                  <img
                    src={img.url}
                    alt={img.fileName || "Uploaded Image"}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='1.5'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                    }}
                  />

                  {/* Primary Badge */}
                  {img.isPrimary && (
                    <div className="absolute top-1.5 left-1.5 z-10">
                      <Badge className="bg-[#B4395A] text-white text-[10px] px-1.5 py-0.5 uppercase tracking-wider font-bold shadow-xs">
                        Primary
                      </Badge>
                    </div>
                  )}

                  {/* Upload Progress Overlay */}
                  {img.status === "uploading" && (
                    <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center p-3 text-white">
                      <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mb-1.5">
                        <div
                          className="bg-[#B4395A] h-full transition-all duration-150"
                          style={{ width: `${img.progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-semibold">
                        {img.progress}%
                      </span>
                      <span className="text-[9px] text-slate-300 mt-0.5">Uploading to R2...</span>
                    </div>
                  )}

                  {/* Error State Overlay */}
                  {img.status === "error" && (
                    <div className="absolute inset-0 bg-red-950/80 p-2 text-white flex flex-col items-center justify-center text-center">
                      <svg className="w-5 h-5 text-red-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-[10px] text-red-200 line-clamp-2 leading-tight mb-2">
                        {img.error || "Upload failed"}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleRetry(img)}
                        className="px-2 py-0.5 bg-white text-slate-900 text-[10px] font-bold rounded-[2px] hover:bg-slate-100 cursor-pointer"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="p-1.5 bg-white border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                  {/* Reorder Left/Right */}
                  {!single && images.length > 1 && (
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
                  {!single && !img.isPrimary && img.status === "uploaded" && (
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
                    title="Delete image"
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
