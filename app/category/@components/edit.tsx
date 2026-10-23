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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { api } from "@/helper";
import toast from "@/lib/toast";
import { CategorySpecificationPicker } from "./specification-picker";

export function CategoryEditDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: any) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  // Specifications selection
  const [availableSpecifications, setAvailableSpecifications] = useState<any[]>([]);
  const [assignedSpecifications, setAssignedSpecifications] = useState<any[]>([]);
  const [loadingSpecs, setLoadingSpecs] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-slug utility helper
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Pre-fill form when category is selected and fetch active specifications
  useEffect(() => {
    if (category && open) {
      setName(category.name || "");
      setSlug(category.slug || "");
      setDescription(category.description || "");
      setStatus(category.status || "active");
      setSeoTitle(category.seoTitle || "");
      setSeoDescription(category.seoDescription || "");
      setFormError(null);
      setAssignedSpecifications([]);

      const fetchSpecsAndDetail = async () => {
        setLoadingSpecs(true);
        try {
          const [specsRes, catRes] = await Promise.all([
            api("specification/list", { status: "active", limit: 100 }),
            api("category/view", { id: category._id }),
          ]);

          const allAvailable: any[] =
            specsRes && specsRes.status && specsRes.data
              ? specsRes.data.specifications || []
              : [];
          setAvailableSpecifications(allAvailable);

          const catSpecs =
            catRes?.data?.specifications || category?.specifications || [];
          const assigned: any[] = [];

          if (Array.isArray(catSpecs)) {
            for (const rawItem of catSpecs) {
              if (!rawItem) continue;
              const specObj = rawItem.specification || rawItem;
              const specId =
                specObj?._id ||
                specObj?.id ||
                (typeof specObj === "string" ? specObj : null);
              if (!specId) continue;

              const fullSpec =
                allAvailable.find((s) => s._id === specId) ||
                (typeof specObj === "object"
                  ? specObj
                  : { _id: specId, name: "Specification", slug: "", options: [] });

              let selectedOpts: string[] = [];
              if (Array.isArray(rawItem.options) && rawItem.options.length > 0) {
                selectedOpts = rawItem.options
                  .map((o: any) => (typeof o === "string" ? o : o._id || o.id))
                  .filter(Boolean);
              } else if (Array.isArray(fullSpec.options)) {
                selectedOpts = fullSpec.options
                  .map((o: any) => o._id || o.id || "")
                  .filter(Boolean);
              }

              assigned.push({
                specificationId: specId,
                specification: fullSpec,
                selectedOptionIds: selectedOpts,
              });
            }
          }

          setAssignedSpecifications(assigned);
        } catch (e) {
          console.error("Failed to load specifications for category edit:", e);
        } finally {
          setLoadingSpecs(false);
        }
      };

      fetchSpecsAndDetail();
    }
  }, [category, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category?._id) return;
    setFormError(null);

    if (!name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    const confirmed = await toast.confirm({
      title: "Are you sure to save?",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const payload = {
        id: category._id,
        name: name.trim(),
        slug: slug.trim() ? slugify(slug) : undefined,
        description: description.trim(),
        status,
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
        specifications: assignedSpecifications.map((item) => ({
          specification: item.specificationId,
          options: item.selectedOptionIds,
        })),
      };

      const res = await api("category/update", payload, { method: "POST" });

      if (res && res.status) {
        toast.success("Category Updated", res.message || "Category details saved successfully!");
        onOpenChange(false);
        onSuccess();
      } else {
        const errorMsg = res?.message || "Failed to update category. Please check your inputs.";
        setFormError(errorMsg);
        toast.error("Update Failed", errorMsg);
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
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Header */}
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category details and SEO settings.
            </DialogDescription>
          </DialogHeader>

          {/* Form Fields */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {formError && (
              <div className="rounded-[3px] border border-red-500/30 bg-red-50 p-2.5 text-xs text-red-700">
                {formError}
              </div>
            )}

            {/* General Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="edit-cat-name">
                  Category Name <span className="text-[#B4395A]">*</span>
                </Label>
                <Input
                  id="edit-cat-name"
                  placeholder="e.g. Lip Care"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-cat-slug">
                  Slug <span className="text-slate-400 font-normal">(Auto-generated)</span>
                </Label>
                <Input
                  id="edit-cat-slug"
                  placeholder="e.g. lip-care"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={submitting}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-cat-desc">Description</Label>
              <Textarea
                id="edit-cat-desc"
                rows={2}
                placeholder="Brief description of products in this category..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Status Toggle Box */}
            <div className="flex items-center justify-between p-3.5 rounded-[3px] border border-slate-200 bg-slate-50/70">
              <div className="space-y-0.5">
                <Label className="mb-0">Status</Label>
                <p className="text-[11px] text-slate-500">
                  {status === "active"
                    ? "Category is active and visible in catalog"
                    : "Category is hidden from public catalog"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold ${status === "active" ? "text-[#B4395A]" : "text-slate-400"
                    }`}
                >
                  {status === "active" ? "Active" : "Inactive"}
                </span>
                <Switch
                  checked={status === "active"}
                  onCheckedChange={(checked) => setStatus(checked ? "active" : "inactive")}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Specifications & Options Selection Section */}
            <CategorySpecificationPicker
              availableSpecifications={availableSpecifications}
              assignedSpecifications={assignedSpecifications}
              onChange={setAssignedSpecifications}
              loading={loadingSpecs}
            />

            {/* SEO Metadata Section */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Search Engine Optimization (SEO)
              </h4>
              <div className="space-y-1.5">
                <Label htmlFor="edit-seo-title">SEO Title</Label>
                <Input
                  id="edit-seo-title"
                  placeholder="e.g. Natural Lip Balms & Tints | Eclera Cosmetics"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-seo-desc">SEO Description</Label>
                <Textarea
                  id="edit-seo-desc"
                  rows={2}
                  placeholder="Meta description for search engines and social shares..."
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#B4395A] hover:bg-[#9b2f4c] text-white"
            >
              {submitting ? "Updating..." : "Update Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
