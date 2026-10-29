"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/image-uploader";
import { api } from "@/helper";
import toast from "@/lib/toast";

export function CollectionViewDialog({
  open,
  onOpenChange,
  collection,
  onCollectionUpdated,
}: any) {
  const [currentCollection, setCurrentCollection] = useState<any>(collection);
  const [categoryDetailsMap, setCategoryDetailsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState<{ categoryId: string; specificationId: string } | null>(null);

  useEffect(() => {
    setCurrentCollection(collection);
    if (collection?._id && open) {
      setLoading(true);
      api("collection/view", { id: collection._id })
        .then(async (res) => {
          if (res && res.status && res.data) {
            const colData = res.data;
            setCurrentCollection(colData);

            // Collect all category IDs
            const catList: any[] = [];
            if (colData.category) catList.push(colData.category);
            if (Array.isArray(colData.categories)) {
              for (const c of colData.categories) {
                if (c && !catList.some((existing: any) => (existing._id || existing) === (c._id || c))) {
                  catList.push(c);
                }
              }
            }

            // Fetch detailed specifications for categories
            const detailsMap: Record<string, any> = {};
            await Promise.all(
              catList.map(async (c: any) => {
                const cId = c._id || c.id || c;
                if (!cId) return;
                try {
                  const catRes = await api("category/view", { id: cId });
                  if (catRes && catRes.status && catRes.data) {
                    detailsMap[cId] = catRes.data;
                  }
                } catch (err) {
                  console.error("Failed to load category view:", err);
                }
              })
            );
            setCategoryDetailsMap(detailsMap);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [collection, open]);

  if (!currentCollection) return null;

  // Extract all categories
  const categoriesList: any[] = [];
  if (currentCollection.category) {
    categoriesList.push(currentCollection.category);
  }
  if (Array.isArray(currentCollection.categories)) {
    for (const c of currentCollection.categories) {
      if (c) {
        const cId = c._id || c.id || c;
        if (!categoriesList.some((existing: any) => (existing._id || existing.id || existing) === cId)) {
          categoriesList.push(c);
        }
      }
    }
  }

  const allColSpecs: any[] = currentCollection.specifications || [];

  // Helper to find selected options for a given specification ID from the collection's saved data
  const getSelectedOptionsForSpec = (specId: string) => {
    const matched = allColSpecs.find((cs: any) => {
      const sId =
        cs.specification?._id ||
        cs.specification?.id ||
        cs.specification ||
        cs.specificationId;
      return sId?.toString() === specId?.toString();
    });
    if (!matched) return [];
    return Array.isArray(matched.options) ? matched.options : [];
  };

  // Auto-select first specification tab if none selected
  if (!activeViewTab && categoriesList.length > 0) {
    for (const cat of categoriesList) {
      const catId = cat._id || cat.id || cat;
      const detailedCat = categoryDetailsMap[catId] || cat;
      const catSpecs =
        Array.isArray(detailedCat.specifications) && detailedCat.specifications.length > 0
          ? detailedCat.specifications
          : allColSpecs;

      if (catSpecs.length > 0) {
        const firstSpec = catSpecs[0].specification || catSpecs[0];
        const specId = firstSpec._id || firstSpec.id || firstSpec;
        if (specId) {
          setActiveViewTab({ categoryId: catId, specificationId: specId });
          break;
        }
      }
    }
  }

  const collectionImgUrl =
    currentCollection.image?.url ||
    currentCollection.image?.publicUrl ||
    (typeof currentCollection.image === "string" ? currentCollection.image : "");

  const handleImageChanged = async (newImg: any) => {
    try {
      const imgPayload =
        newImg && (newImg.url || newImg.publicUrl)
          ? {
              url: newImg.url || newImg.publicUrl,
              publicUrl: newImg.url || newImg.publicUrl,
              key: newImg.key || "",
            }
          : { url: "", publicUrl: "", key: "" };

      const res = await api("collection/update", {
        id: currentCollection._id,
        image: imgPayload,
      });

      if (res && res.status) {
        setCurrentCollection((prev: any) => ({
          ...prev,
          image: imgPayload,
        }));
        toast.success("Success", imgPayload.url ? "Collection image updated successfully." : "Collection image removed.");
        if (onCollectionUpdated) onCollectionUpdated();
      }
    } catch (e: any) {
      toast.error("Error", e?.message || "Failed to update collection image");
    }
  };

  const handleDeleteImage = async () => {
    const confirmed = await toast.confirm({
      title: "Remove Collection Image?",
      text: "This image will be permanently removed from this collection.",
      confirmButtonText: "Remove",
    });
    if (!confirmed) return;

    if (currentCollection.image?.key) {
      api("uploads", { key: currentCollection.image.key, force: true }, { method: "DELETE" }).catch(() => {});
    }

    await handleImageChanged(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        {/* Header: ONLY Collections title */}
        <DialogHeader className="px-6 py-4 border-b border-slate-200 shrink-0">
          <DialogTitle className="text-base font-bold text-slate-900">
            Collection: {currentCollection.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* 1. Collection Image */}
          <div className="rounded-[4px] border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Collection Image
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Uploaded image for this collection showcase.
                </p>
              </div>
              {collectionImgUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteImage}
                  className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Remove Image
                </Button>
              ) : null}
            </div>

            <div className="pt-1">
              {collectionImgUrl ? (
                <div className="relative max-w-[280px] aspect-video rounded-[3px] border border-slate-200 bg-slate-100 overflow-hidden shadow-xs">
                  <img
                    src={collectionImgUrl}
                    alt={currentCollection.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-[3px] border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                  No image uploaded for this collection. Click Edit Collection to add an image.
                </div>
              )}
            </div>
          </div>

          {/* 2. Collection Information Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Collection Information
            </h4>
            <div className="rounded-[4px] border border-slate-200 bg-slate-50/70 p-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 font-medium block text-[11px]">Collection Name</span>
                  <span className="text-sm font-bold text-slate-900 block mt-0.5">
                    {currentCollection.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block text-[11px]">Slug</span>
                  <span className="text-xs font-mono text-slate-600 block mt-0.5">
                    /{currentCollection.slug}
                  </span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-medium text-[11px]">Status</span>
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-[2px] border ${
                    currentCollection.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      currentCollection.status === "active" ? "bg-emerald-600" : "bg-slate-400"
                    }`}
                  />
                  {currentCollection.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>

              {currentCollection.description && (
                <div className="pt-2.5 border-t border-slate-200">
                  <span className="text-slate-500 font-medium block text-[11px] mb-1">Description</span>
                  <p className="text-slate-700 bg-white p-2.5 rounded-[3px] border border-slate-200 text-xs">
                    {currentCollection.description}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                <div>
                  Created:{" "}
                  <span className="font-mono text-slate-700">
                    {currentCollection.createdAt
                      ? new Date(currentCollection.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </span>
                </div>
                <div className="text-right">
                  Updated:{" "}
                  <span className="font-mono text-slate-700">
                    {currentCollection.updatedAt
                      ? new Date(currentCollection.updatedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Category Wise Specifications & Options: Left Tabs, Right Options */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Category & Specifications
            </h4>

            {categoriesList.length === 0 ? (
              <div className="p-4 text-center rounded-[4px] border border-dashed border-slate-200 bg-slate-50/50">
                <p className="text-xs text-slate-400 italic">No categories assigned to this collection.</p>
              </div>
            ) : (
              <div className="rounded-[4px] border border-slate-200 bg-white overflow-hidden flex flex-col sm:flex-row shadow-2xs min-h-[240px]">
                {/* Left Side: Category & Specification Tabs */}
                <div className="w-full sm:w-60 md:w-64 border-b sm:border-b-0 sm:border-r border-slate-200 bg-slate-50/60 flex flex-col shrink-0 max-h-[320px] overflow-y-auto">
                  <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Categories & Specifications
                  </div>

                  <div className="divide-y divide-slate-200/80">
                    {categoriesList.map((cat: any) => {
                      const catId = cat._id || cat.id || cat;
                      const detailedCat = categoryDetailsMap[catId] || cat;
                      const catName = detailedCat.name || cat.name || "Category";

                      const catSpecs = Array.isArray(detailedCat.specifications) && detailedCat.specifications.length > 0
                        ? detailedCat.specifications
                        : allColSpecs;

                      return (
                        <div key={catId} className="flex flex-col">
                          {/* Category Header */}
                          <div className="px-3 py-1.5 bg-slate-100/70 text-[11px] font-bold text-slate-800 truncate" title={catName}>
                            Category: {catName}
                          </div>

                          {/* Specification Tabs */}
                          <div className="py-1">
                            {catSpecs.length === 0 ? (
                              <div className="px-3 py-1 text-[11px] text-slate-400 italic">
                                No specifications
                              </div>
                            ) : (
                              catSpecs.map((item: any, sIdx: number) => {
                                const spec = item.specification || item;
                                const specId = spec._id || spec.id || spec;
                                const isVariant = Boolean(spec.is_veriant ?? spec.is_variant);
                                const isSelected =
                                  activeViewTab?.categoryId === catId &&
                                  activeViewTab?.specificationId === specId;

                                const selectedOpts = getSelectedOptionsForSpec(specId);

                                return (
                                  <button
                                    key={specId || sIdx}
                                    type="button"
                                    onClick={() =>
                                      setActiveViewTab({
                                        categoryId: catId,
                                        specificationId: specId,
                                      })
                                    }
                                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors border-l-2 select-none ${
                                      isSelected
                                        ? "bg-[#B4395A]/10 border-[#B4395A] text-[#B4395A] font-semibold"
                                        : "border-transparent text-slate-600 hover:bg-slate-100/90 hover:text-slate-900"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="truncate">{spec.name}</span>
                                      {isVariant && (
                                        <span className="px-1 py-0.2 bg-purple-100 text-purple-700 text-[9px] font-semibold rounded shrink-0">
                                          Variant
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-1">
                                      {selectedOpts.length}
                                    </span>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Side: Active Specification Details & Options */}
                <div className="flex-1 p-4 max-h-[320px] overflow-y-auto bg-white flex flex-col">
                  {(() => {
                    if (!activeViewTab) {
                      return (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                          <p className="text-xs">Select a specification from the left to view options.</p>
                        </div>
                      );
                    }

                    const activeCat = categoriesList.find(
                      (c: any) => (c._id || c.id || c) === activeViewTab.categoryId
                    );
                    const detailedCat = activeCat
                      ? categoryDetailsMap[activeCat._id || activeCat.id || activeCat] || activeCat
                      : null;
                    const catName = detailedCat?.name || activeCat?.name || "Category";

                    const catSpecs =
                      Array.isArray(detailedCat?.specifications) && detailedCat.specifications.length > 0
                        ? detailedCat.specifications
                        : allColSpecs;

                    const activeItem = catSpecs.find((item: any) => {
                      const spec = item.specification || item;
                      const specId = spec._id || spec.id || spec;
                      return specId?.toString() === activeViewTab.specificationId?.toString();
                    });

                    const activeSpec = activeItem?.specification || activeItem || {};
                    const selectedOpts = getSelectedOptionsForSpec(activeViewTab.specificationId);

                    return (
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-slate-500 pb-2 border-b border-slate-100">
                          Options ({selectedOpts.length} selected)
                        </div>

                        {selectedOpts.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No options selected for this specification.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {selectedOpts.map((opt: any) => (
                              <span
                                key={opt._id || opt.id || opt}
                                className="px-3 py-1.5 rounded-[4px] bg-rose-50 border border-[#B4395A]/30 text-[#B4395A] text-xs font-semibold flex items-center gap-1.5"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#B4395A]" />
                                {opt.name || opt}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* 3.5. Assigned Products Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Assigned Products
              </h4>
              <span className="text-xs text-slate-500 font-medium">
                {Array.isArray(currentCollection.products) ? currentCollection.products.length : 0} products
              </span>
            </div>

            {Array.isArray(currentCollection.products) && currentCollection.products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {currentCollection.products.map((prod: any) => {
                  const pImg =
                    Array.isArray(prod.images) && prod.images.length > 0
                      ? prod.images[0]?.url || prod.images[0]?.publicUrl || prod.images[0]
                      : null;

                  return (
                    <div
                      key={prod._id || prod.id}
                      className="flex items-center gap-2.5 p-2 rounded-[4px] border border-slate-200 bg-slate-50/70"
                    >
                      <div className="w-8 h-8 rounded-[3px] border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                        {pImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={pImg}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400">IMG</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-xs">
                        <p className="font-semibold text-slate-900 truncate" title={prod.name}>
                          {prod.name}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          {prod.sku && <span className="font-mono">{prod.sku}</span>}
                          {prod.price !== undefined && (
                            <span className="font-medium text-slate-700">
                              ₹{Number(prod.price).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3.5 rounded-[4px] border border-slate-200 bg-slate-50/50 text-center text-xs text-slate-400">
                No products currently assigned to this collection.
              </div>
            )}
          </div>

          {/* 4. SEO Details */}
          {(currentCollection.seoTitle || currentCollection.seoDescription) && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Search Engine Optimization (SEO)
              </h4>
              <div className="rounded-[4px] border border-slate-200 bg-slate-50/60 p-3.5 space-y-2 text-xs">
                {currentCollection.seoTitle && (
                  <div>
                    <span className="text-slate-500 font-medium block text-[11px]">SEO Title</span>
                    <span className="font-semibold text-slate-900">{currentCollection.seoTitle}</span>
                  </div>
                )}
                {currentCollection.seoDescription && (
                  <div>
                    <span className="text-slate-500 font-medium block text-[11px]">SEO Description</span>
                    <p className="text-slate-700">{currentCollection.seoDescription}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}