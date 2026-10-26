"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/helper";
import toast from "@/lib/toast";
import {
  Package,
  Trash2,
  ImageOff,
} from "lucide-react";

export function ProductViewDialog({
  open,
  onOpenChange,
  product,
  onProductUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
  onProductUpdated?: () => void;
}) {
  const [currentProduct, setCurrentProduct] = useState<any>(product);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deletingIdx, setDeletingIdx] = useState<number | null>(null);

  useEffect(() => {
    setCurrentProduct(product);

    if (product?._id && open) {
      setLoadingDetail(true);
      api("product/view", { id: product._id })
        .then((res) => {
          if (res && res.status && res.data) {
            setCurrentProduct(res.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingDetail(false));
    }
  }, [product, open]);

  if (!currentProduct) return null;

  const images = Array.isArray(currentProduct.images) ? currentProduct.images : [];
  const categoryName = currentProduct.category?.name || "Uncategorized";
  const collections = Array.isArray(currentProduct.collections) ? currentProduct.collections : [];
  const specifications = Array.isArray(currentProduct.specifications) ? currentProduct.specifications : [];
  const relatedProducts = Array.isArray(currentProduct.relatedProducts) ? currentProduct.relatedProducts : [];

  // Calculate discount percentage if comparePrice > price
  const discountPercent =
    currentProduct.comparePrice > currentProduct.price
      ? Math.round(
          ((currentProduct.comparePrice - currentProduct.price) / currentProduct.comparePrice) * 100
        )
      : 0;

  // Handle deleting a single image from view modal (no other image management actions)
  const handleDeleteImage = async (indexToDelete: number) => {
    const confirmed = await toast.confirm({
      title: "Delete Image?",
      text: "Are you sure you want to remove this photo from the product?",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    });

    if (!confirmed) return;

    try {
      setDeletingIdx(indexToDelete);

      const targetImg = images[indexToDelete];
      const updatedImages = images
        .filter((_: any, idx: number) => idx !== indexToDelete)
        .map((img: any) => {
          const u = img.url || img.publicUrl || (typeof img === "string" ? img : "");
          return {
            url: u,
            publicUrl: u,
            key: img.key || "",
          };
        })
        .filter((img: any) => Boolean(img.url));

      // If deleted image had a storage key in R2, delete storage object as well
      if (targetImg?.key) {
        api("uploads", { key: targetImg.key, force: true }, { method: "DELETE" }).catch(() => {});
      }

      const updateRes = await api(
        "product/update",
        {
          id: currentProduct._id,
          images: updatedImages,
        },
        { method: "POST" }
      );

      if (updateRes && updateRes.status) {
        setCurrentProduct((prev: any) => ({
          ...prev,
          images: updatedImages,
        }));
        if (onProductUpdated) onProductUpdated();
        toast.success("Success", "Photo removed successfully");
      } else {
        toast.error("Error", updateRes?.message || "Failed to remove image.");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "An unexpected error occurred.");
    } finally {
      setDeletingIdx(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-white pr-14 text-left">
          <DialogTitle className="text-base font-bold text-slate-900">
            {currentProduct.name}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[2px] bg-rose-50 text-[#B4395A] border border-rose-200">
              {categoryName}
            </span>
            {currentProduct.sku && (
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-[2px]">
                SKU: {currentProduct.sku}
              </span>
            )}
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-[2px] border ${
                currentProduct.status === "active"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              {currentProduct.status === "active" ? "Active" : "Inactive"}
            </span>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Section 1: Uploaded Product Images with Prominent Size and Delete Action Only */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Product Images ({images.length})
              </h4>
              {images.length > 0 && (
                <span className="text-[11px] text-slate-400">
                  First image is the primary catalog thumbnail. Click the trash icon to delete.
                </span>
              )}
            </div>

            {images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {images.map((img: any, idx: number) => {
                  const imgUrl = img?.url || img?.publicUrl || (typeof img === "string" ? img : "");
                  const isPrimary = idx === 0;
                  const isDeleting = deletingIdx === idx;

                  return (
                    <div
                      key={img?._id || img?.key || idx}
                      className={`group relative rounded-[4px] border bg-white shadow-xs overflow-hidden flex flex-col transition-all ${
                        isPrimary
                          ? "border-[#B4395A] ring-1 ring-[#B4395A]/30"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {/* Prominent Large Aspect-Square Image Box */}
                      <div className="relative aspect-square w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                        <img
                          src={imgUrl}
                          alt={`${currentProduct.name} preview ${idx + 1}`}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='1.5'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                          }}
                        />

                        {/* Primary Badge */}
                        {isPrimary && (
                          <div className="absolute top-2 left-2 z-10 pointer-events-none">
                            <span className="bg-[#B4395A] text-white text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold rounded-[2px] shadow-xs">
                              Primary
                            </span>
                          </div>
                        )}

                        {/* ONLY Delete Action Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(idx)}
                          disabled={isDeleting}
                          className="absolute top-2 right-2 z-10 p-1.5 rounded-[3px] bg-white/95 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200/80 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete image"
                        >
                          {isDeleting ? (
                            <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent animate-spin rounded-full" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 px-4 rounded-[4px] border border-dashed border-slate-200 bg-slate-50 text-center">
                <ImageOff className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No images uploaded for this product</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Edit this product to upload photos</p>
              </div>
            )}
          </div>

          {/* Pricing & Inventory Grid */}
          <div className="p-4 rounded-[4px] border border-slate-200 bg-slate-50/70 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pricing & Inventory
            </span>

            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-bold font-mono text-slate-900">
                ₹{currentProduct.price}
              </span>
              {currentProduct.comparePrice > currentProduct.price && (
                <>
                  <span className="text-sm font-mono text-slate-400 line-through">
                    ₹{currentProduct.comparePrice}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-[2px] bg-rose-100 text-[#B4395A] text-[10px] font-bold">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 block">Stock:</span>
                <span
                  className={`font-semibold font-mono text-xs ${
                    currentProduct.stock > 0 ? "text-emerald-700" : "text-rose-600 font-bold"
                  }`}
                >
                  {currentProduct.stock > 0 ? `${currentProduct.stock} in stock` : "Out of stock"}
                </span>
              </div>
              {currentProduct.costPrice > 0 && (
                <div>
                  <span className="text-[10px] text-slate-400 block">Cost Price:</span>
                  <span className="font-mono text-slate-700 text-xs">₹{currentProduct.costPrice}</span>
                </div>
              )}
              <div>
                <span className="text-[10px] text-slate-400 block">Catalog URL:</span>
                <span className="font-mono text-slate-700 text-[11px]">/product/{currentProduct.slug}</span>
              </div>
            </div>
          </div>

          {/* Collections */}
          {collections.length > 0 && (
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Assigned Collections
              </span>
              <div className="flex flex-wrap gap-1.5">
                {collections.map((col: any) => (
                  <span
                    key={col._id || col}
                    className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-[2px] border border-slate-200 text-[11px]"
                  >
                    {col.name || "Collection"}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Specifications */}
          {specifications.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Specifications
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {specifications.map((spec: any, sIdx: number) => {
                  const specName = spec.specification?.name || "Specification";
                  const opts = Array.isArray(spec.options)
                    ? spec.options.map((o: any) => (typeof o === "object" ? o.name || o.value : o)).join(", ")
                    : "";

                  return (
                    <div key={sIdx} className="p-2.5 rounded-[3px] border border-slate-200 bg-slate-50/50">
                      <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wide">
                        {specName}
                      </span>
                      <span className="text-slate-600 text-xs mt-0.5 block">{opts || "None"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Related Products ({relatedProducts.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {relatedProducts.map((rel: any) => {
                  const thumb = rel.images?.[0]?.url;

                  return (
                    <div
                      key={rel._id}
                      className="p-2.5 rounded-[4px] border border-slate-200 bg-white flex items-center gap-2.5 shadow-2xs"
                    >
                      <div className="w-10 h-10 rounded border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                        {thumb ? (
                          <img src={thumb} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 leading-tight text-xs">
                        <span className="font-semibold text-slate-900 truncate block">
                          {rel.name}
                        </span>
                        <span className="text-[11px] font-mono text-[#B4395A] font-medium">
                          ₹{rel.price}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION: Description */}
          {currentProduct.description && (
            <div className="space-y-1.5 pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Detailed Description
              </span>
              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed bg-slate-50/50 p-3 rounded-[3px] border border-slate-200">
                {currentProduct.description}
              </p>
            </div>
          )}

          {/* SECTION: SEO */}
          {(currentProduct.seoTitle || currentProduct.seoDescription) && (
            <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Search Engine Optimization
              </span>
              {currentProduct.seoTitle && (
                <p className="text-slate-800 font-medium">
                  <strong>Title:</strong> {currentProduct.seoTitle}
                </p>
              )}
              {currentProduct.seoDescription && (
                <p className="text-slate-500">
                  <strong>Meta:</strong> {currentProduct.seoDescription}
                </p>
              )}
            </div>
          )}

          {/* SECTION: Marketplace Integration */}
          {currentProduct.flipkartUrl && (
            <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Marketplace Integration
              </span>
              <p className="text-slate-800 font-medium flex items-center gap-1.5">
                <strong>Flipkart:</strong>
                <a
                  href={currentProduct.flipkartUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline truncate max-w-sm inline-block"
                >
                  {currentProduct.flipkartUrl}
                </a>
              </p>
            </div>
          )}
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
