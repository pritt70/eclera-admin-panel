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
import { ImageUploader, uploadSinglePendingImage } from "@/components/image-uploader";
import { CollectionCategorySpecSelector } from "./collection-spec-selector";
import { CollectionProductSelector } from "./collection-product-selector";
import { api } from "@/helper";
import toast from "@/lib/toast";

export function CollectionAddDialog({
  open,
  onOpenChange,
  onSuccess,
}: any) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [image, setImage] = useState<any>({ url: "", key: "" });
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  // Category, specifications, and products
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [assignedSpecifications, setAssignedSpecifications] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  // Auto-slug utility helper
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Reset form and fetch active categories when dialog opens
  useEffect(() => {
    if (open) {
      setName("");
      setSlug("");
      setDescription("");
      setStatus("active");
      setImage({ url: "", key: "" });
      setSeoTitle("");
      setSeoDescription("");
      setSelectedCategoryIds([]);
      setAssignedSpecifications([]);
      setSelectedProducts([]);
      setIsSlugManuallyEdited(false);
      setFormError(null);

      const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
          const res = await api("category/list", { status: "active", limit: 200 });
          if (res && res.status && res.data) {
            setCategories(res.data.categories || []);
          }
        } catch (e) {
          console.error("Failed to load categories for collection dialog:", e);
        } finally {
          setLoadingCategories(false);
        }
      };

      fetchCategories();
    }
  }, [open]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManuallyEdited) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Collection name is required.");
      return;
    }

    if (!selectedCategoryIds || selectedCategoryIds.length === 0) {
      setFormError("Please select at least one category for this collection.");
      return;
    }

    if (!selectedProducts || selectedProducts.length === 0) {
      setFormError("Please select at least one product for this collection.");
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
      const uploadedImg = await uploadSinglePendingImage(image, "categories");

      const payload = {
        name: name.trim(),
        slug: slug.trim() ? slugify(slug) : undefined,
        description: description.trim(),
        image:
          uploadedImg && (uploadedImg.url || uploadedImg.publicUrl)
            ? {
                url: uploadedImg.url || uploadedImg.publicUrl,
                publicUrl: uploadedImg.url || uploadedImg.publicUrl,
                key: uploadedImg.key || "",
              }
            : undefined,
        category: selectedCategoryIds[0] || null,
        categories: selectedCategoryIds,
        status,
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
        specifications: assignedSpecifications.map((item: any) => ({
          specification: item.specificationId || item.specification?._id,
          options: item.selectedOptionIds || [],
        })),
        products: selectedProducts.map((p: any) => p._id || p.id).filter(Boolean),
      };

      const res = await api("collection/create", payload, { method: "POST" });

      if (res && res.status) {
        toast.success("Collection Created", res.message || "Collection added successfully!");
        onOpenChange(false);
        onSuccess();
      } else {
        const errorMsg = res?.message || "Failed to create collection. Please check your inputs.";
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
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-3xl">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Header */}
          <DialogHeader>
            <DialogTitle>Add New Collection</DialogTitle>
            <DialogDescription>
              Create a curated group of products, such as Best Sellers or New Arrivals.
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
                <Label htmlFor="add-col-name">
                  Collection Name <span className="text-[#B4395A]">*</span>
                </Label>
                <Input
                  id="add-col-name"
                  placeholder="e.g. Summer Glow 2026"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-col-slug">
                  Slug <span className="text-slate-400 font-normal">(Auto-generated)</span>
                </Label>
                <Input
                  id="add-col-slug"
                  placeholder="e.g. summer-glow-2026"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setIsSlugManuallyEdited(true);
                  }}
                  disabled={submitting}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="add-col-desc">Description</Label>
              <Textarea
                id="add-col-desc"
                rows={2}
                placeholder="Brief description of this collection..."
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
                    ? "Collection is active and visible in catalog"
                    : "Collection is hidden from public catalog"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-semibold ${
                    status === "active" ? "text-[#B4395A]" : "text-slate-400"
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

            {/* Collection Image */}
            <div className="space-y-1.5">
              <Label>Collection Image</Label>
              <ImageUploader
                single={true}
                singleValue={image}
                onSingleChange={(img: any) => setImage(img || { url: "", key: "" })}
                folder="categories"
                disabled={submitting}
              />
            </div>

            {/* Category & Specifications Selection Section */}
            <CollectionCategorySpecSelector
              categories={categories}
              selectedCategoryIds={selectedCategoryIds}
              onCategoryIdsChange={setSelectedCategoryIds}
              assignedSpecifications={assignedSpecifications}
              onSpecificationsChange={setAssignedSpecifications}
              loadingCategories={loadingCategories}
            />

            {/* Product Search & Selection Section */}
            <CollectionProductSelector
              categories={categories}
              selectedCategoryIds={selectedCategoryIds}
              selectedProducts={selectedProducts}
              onSelectedProductsChange={setSelectedProducts}
              disabled={submitting}
            />

            {/* SEO Metadata Section */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Search Engine Optimization (SEO)
              </h4>
              <div className="space-y-1.5">
                <Label htmlFor="add-seo-title">SEO Title</Label>
                <Input
                  id="add-seo-title"
                  placeholder="e.g. Summer Glow 2026 Collection | Eclera Cosmetics"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-seo-desc">SEO Description</Label>
                <Textarea
                  id="add-seo-desc"
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
              id="btn-create-collection"
              type="submit"
              disabled={submitting}
              className="bg-[#B4395A] hover:bg-[#9b2f4c] text-white"
            >
              {submitting ? "Creating..." : "Create Collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
