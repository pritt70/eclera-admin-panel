"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/helper";
import toast from "@/lib/toast";
import { ImageUploader } from "@/components/image-uploader";

export function CategoryViewDialog({
  open,
  onOpenChange,
  category,
  onCategoryUpdated,
}: any) {
  const [currentCategory, setCurrentCategory] = useState<any>(category);

  useEffect(() => {
    setCurrentCategory(category);
    if (category?._id && open) {
      api("category/view", { id: category._id })
        .then((res) => {
          if (res && res.status && res.data) {
            setCurrentCategory(res.data);
          }
        })
        .catch(() => { });
    }
  }, [category, open]);

  if (!currentCategory) return null;

  const handleImageChanged = async (newImg: any) => {
    try {
      const updateRes = await api(
        "category/update",
        {
          id: currentCategory._id,
          image: newImg ? { url: newImg.url, key: newImg.key } : { url: "", key: "" },
        },
        { method: "POST" }
      );

      if (updateRes && updateRes.status) {
        setCurrentCategory((prev: any) => ({
          ...prev,
          image: newImg || { url: "", key: "" },
        }));
        if (onCategoryUpdated) onCategoryUpdated();
        toast.success("Success", newImg ? "Category image updated" : "Category image removed");
      } else {
        toast.error("Error", updateRes?.message || "Failed to update category image.");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "An unexpected error occurred.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-white pr-14 text-left">
          <DialogTitle className="text-base font-bold text-slate-900">
            Category
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Section 1: Category Image */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Category Image
            </h4>
            <ImageUploader
              single={true}
              singleValue={currentCategory.image}
              onSingleChange={handleImageChanged}
              folder="categories"
            />
          </div>

          {/* Section 2: General Category Details */}
          <div className="rounded-[4px] border border-slate-200/90 bg-white p-4 space-y-3.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Category Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-3 rounded-[3px] bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Category Name
                </span>
                <span className="font-semibold text-slate-900 text-sm">{currentCategory.name}</span>
              </div>

              <div className="p-3 rounded-[3px] bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Status
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-[2px] border ${currentCategory.status === "active"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${currentCategory.status === "active" ? "bg-emerald-600" : "bg-slate-400"
                      }`}
                  />
                  {currentCategory.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="p-3 rounded-[3px] bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  URL Slug
                </span>
                <span className="font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded-[2px] border border-slate-200 inline-block">
                  /{currentCategory.slug}
                </span>
              </div>

              <div className="p-3 rounded-[3px] bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Associated Products
                </span>
                <span className="font-bold text-slate-800">
                  {currentCategory.productsCount ?? 0} active products
                </span>
              </div>

              <div className="p-3 rounded-[3px] bg-slate-50 border border-slate-200/60 sm:col-span-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Creation Date
                </span>
                <span className="text-slate-600">
                  {currentCategory.createdAt
                    ? new Date(currentCategory.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                    : "Not specified"}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="p-3 rounded-[3px] bg-slate-50 border border-slate-200/60 text-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Description
              </span>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {currentCategory.description?.trim() || "No description provided for this category."}
              </p>
            </div>

            {/* SEO metadata */}
            {(currentCategory.seoTitle || currentCategory.seoDescription) && (
              <div className="p-3 rounded-[3px] bg-slate-50 border border-slate-200/60 text-xs space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  SEO Metadata
                </span>
                {currentCategory.seoTitle && (
                  <div>
                    <span className="font-semibold text-slate-600 text-[11px]">Title: </span>
                    <span className="text-slate-800">{currentCategory.seoTitle}</span>
                  </div>
                )}
                {currentCategory.seoDescription && (
                  <div>
                    <span className="font-semibold text-slate-600 text-[11px]">Meta Description: </span>
                    <span className="text-slate-700">{currentCategory.seoDescription}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Assigned Specifications & Options */}
          <div className="rounded-[4px] border border-slate-200/90 bg-white p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Assigned Specifications & Options ({Array.isArray(currentCategory.specifications) ? currentCategory.specifications.length : 0})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Attributes and options applicable to products in this category
                </p>
              </div>
            </div>

            {Array.isArray(currentCategory.specifications) && currentCategory.specifications.length > 0 ? (
              <div className="space-y-2.5">
                {currentCategory.specifications.map((item: any, idx: number) => {
                  const spec = item?.specification || item;
                  const specName = spec?.name || `Specification #${idx + 1}`;
                  const specSlug = spec?.slug || "";
                  const isVariant = Boolean(spec?.is_veriant || spec?.is_variant);
                  const optionsList: any[] = Array.isArray(item?.options)
                    ? item.options
                    : Array.isArray(spec?.options)
                      ? spec.options
                      : [];

                  return (
                    <div
                      key={spec?._id || idx}
                      className="p-3 rounded-[3px] bg-slate-50 border border-slate-200/60"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">{specName}</span>
                          {spec?.display_name && spec.display_name !== spec.name && (
                            <span className="text-[11px] text-slate-500 font-normal">
                              ({spec.display_name})
                            </span>
                          )}
                          {specSlug && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              /{specSlug}
                            </span>
                          )}
                          {isVariant && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-[2px] bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                              Variant
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#B4395A] font-semibold uppercase tracking-wider shrink-0">
                          Active on Category
                        </span>
                      </div>

                      {/* Options Badges */}
                      <div className="mt-2 pt-2 border-t border-slate-200/50">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Selected Options ({optionsList.length}):
                        </span>
                        {optionsList.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {optionsList.map((opt: any, oIdx: number) => (
                              <span
                                key={opt?._id || oIdx}
                                className="px-2 py-0.5 text-[11px] font-medium bg-white text-slate-700 rounded-[2px] border border-slate-200 shadow-2xs"
                              >
                                {typeof opt === "object" ? opt.name : opt}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            All options enabled
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-[3px] border border-slate-200/60">
                No specifications assigned to this category.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs font-semibold px-4"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
