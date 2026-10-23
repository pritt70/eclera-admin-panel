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
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/select";
import { HtmlEditor } from "@/components/ui/html-editor";
import { api } from "@/helper";
import toast from "@/lib/toast";

interface PolicyEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: any;
  onSuccess: () => void;
}

export function PolicyEditDialog({
  open,
  onOpenChange,
  policy,
  onSuccess,
}: PolicyEditDialogProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("custom");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (policy && open) {
      setTitle(policy.title || "");
      setType(policy.type || "custom");
      setContent(policy.content || "");
      setStatus(policy.status || "active");
      setFormError(null);
    }
  }, [policy, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policy?._id) return;

    setFormError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setFormError("Policy title is required.");
      return;
    }

    if (!content.trim()) {
      setFormError("Policy content is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api("policy/update", {
        id: policy._id,
        title: cleanTitle,
        type,
        content: content.trim(),
        status,
      });

      if (res && res.status) {
        toast.success("Policy updated successfully!");
        onOpenChange(false);
        onSuccess();
      } else {
        setFormError(res?.message || "Failed to update policy. Please try again.");
      }
    } catch (err: any) {
      setFormError(err?.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClose={() => onOpenChange(false)}
        className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden"
      >
        {/* Header - No icons */}
        <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-white pr-14 text-left">
          <DialogTitle className="text-base font-bold text-slate-900">
            Edit Policy
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Update policy title, type, HTML content, or publishing status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-[2px] text-xs font-medium text-red-700">
                {formError}
              </div>
            )}

            {/* Policy Title & Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-policy-title" className="text-xs font-semibold text-slate-700">
                  Policy Title <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="edit-policy-title"
                  placeholder="e.g. Shipping Policy, Return & Refund Policy"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-policy-type" className="text-xs font-semibold text-slate-700">
                  Policy Type <span className="text-rose-500">*</span>
                </Label>
                <Select
                  placeholder="Select policy type..."
                  options={[
                    { value: "shipping", label: "Shipping Policy" },
                    { value: "return", label: "Return & Refund Policy" },
                    { value: "terms", label: "Terms & Conditions" },
                    { value: "privacy", label: "Privacy Policy" },
                    { value: "custom", label: "Custom Policy" },
                  ]}
                  value={{
                    value: type,
                    label:
                      type === "shipping"
                        ? "Shipping Policy"
                        : type === "return"
                        ? "Return & Refund Policy"
                        : type === "terms"
                        ? "Terms & Conditions"
                        : type === "privacy"
                        ? "Privacy Policy"
                        : "Custom Policy",
                  }}
                  onChange={(opt: any) => setType(opt?.value || "custom")}
                  showSearchIcon={false}
                  isSearchable={false}
                  isClearable={false}
                />
              </div>
            </div>

            {/* HTML Editor */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                HTML Content <span className="text-rose-500">*</span>
              </Label>
              <HtmlEditor
                value={content}
                onChange={setContent}
                placeholder="Write policy content or HTML tags (H2, H3, paragraphs, bullet lists, links)..."
                minHeight="260px"
              />
            </div>

            {/* Status Switch */}
            <div className="flex items-center justify-between p-3 border border-slate-200 rounded-[2px] bg-white">
              <div>
                <p className="text-xs font-semibold text-slate-800">Policy Status</p>
                <p className="text-[11px] text-slate-500">
                  Active policies are visible to customers on the website and checkout page.
                </p>
              </div>
              <Switch
                checked={status === "active"}
                onCheckedChange={(checked) => setStatus(checked ? "active" : "inactive")}
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-3 border-t border-slate-200 bg-slate-50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-[#B4395A] hover:bg-[#9b2f4c] text-white text-xs gap-1.5"
            >
              {submitting ? "Saving..." : "Update Policy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
