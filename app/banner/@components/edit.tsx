"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/image-uploader";
import { api } from "@/helper";
import toast from "@/lib/toast";
import { AlertCircle } from "lucide-react";

export function BannerEditDialog({
  open,
  onOpenChange,
  banner,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: any;
  onSuccess: () => void;
}) {
  const [images, setImages] = useState<any[]>([]);
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (banner && open) {
      setLink(banner.link || "");
      const imgUrl = banner.image?.publicUrl || banner.image?.url;
      if (imgUrl) {
        setImages([{ ...banner.image, url: imgUrl, publicUrl: imgUrl }]);
      } else {
        setImages([]);
      }
      setFormError(null);
    }
  }, [banner, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const primaryImg = images[0];
    if (!primaryImg || !primaryImg.url) {
      setFormError("Banner image is required. Please upload an image.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        id: banner._id,
        link: link.trim(),
        image: {
          url: primaryImg.url,
          key: primaryImg.key || "",
        },
        mobileImage: {
          url: primaryImg.url,
          key: primaryImg.key || "",
        },
      };

      const res = await api(`banner/update/${banner._id}`, payload, { method: "POST" });

      if (res && res.status) {
        toast.success("Banner Updated", res.message || "Banner updated successfully!");
        onOpenChange(false);
        onSuccess();
      } else {
        const errorMsg = res?.message || "Failed to update banner.";
        setFormError(errorMsg);
        toast.error("Operation Failed", errorMsg);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setFormError(errorMsg);
      toast.error("Error", errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-white pr-14 text-left">
            <DialogTitle className="text-base font-bold text-slate-900">
              Edit Banner
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update banner image and redirection link.
            </DialogDescription>
          </DialogHeader>

          {/* Form Body - Exactly 2 fields */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {formError && (
              <div className="rounded-[4px] border border-red-500/30 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Field 1: Banner Image Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Upload Image <span className="text-[#B4395A]">*</span>
              </Label>
              <ImageUploader
                single={true}
                value={images}
                onChange={setImages}
                folder="banners"
                disabled={submitting}
              />
            </div>

            {/* Field 2: Redirection Link */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-banner-link" className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Redirection Link
              </Label>
              <Input
                id="edit-banner-link"
                placeholder="e.g. /category/lipsticks or https://..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                disabled={submitting}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="h-8 text-xs font-medium px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="h-8 text-xs font-semibold px-5 bg-[#B4395A] hover:bg-[#9f1239] text-white shadow-2xs"
            >
              {submitting ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
