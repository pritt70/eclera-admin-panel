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
import { ImageUploader } from "@/components/image-uploader";
import toast from "@/lib/toast";
import {
  CheckCircle2,
  XCircle,
  Package,
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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    setCurrentProduct(product);
    setActiveImageIndex(0);

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
  const primaryImage = images[activeImageIndex]?.url || images[0]?.url || "";
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

  // Handle image upload / remove directly from View modal
  const handleImagesChanged = async (newImages: any[]) => {
    try {
      const cleanImages = (newImages || [])
        .map((img: any) => ({
          url: img.url || "",
          key: img.key || "",
        }))
        .filter((img) => Boolean(img.url));

      const updateRes = await api(
        "product/update",
        {
          id: currentProduct._id,
          images: cleanImages,
        },
        { method: "POST" }
      );

      if (updateRes && updateRes.status) {
        setCurrentProduct((prev: any) => ({
          ...prev,
          images: cleanImages,
        }));
        if (onProductUpdated) onProductUpdated();
        toast.success("Success", "Product images updated successfully");
      } else {
        toast.error("Error", updateRes?.message || "Failed to update product images.");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "An unexpected error occurred.");
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
          {/* Section 1: Product Images (Upload, remove & manage directly) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Product Images
              </h4>
              <span className="text-[11px] text-slate-400">
                Add, remove, or change images. First image is the primary thumbnail.
              </span>
            </div>
            <ImageUploader
              single={false}
              value={images}
              onChange={handleImagesChanged}
              folder="products"
            />
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

          {/* Collections & URLs */}
          {(collections.length > 0 || currentProduct.shortDescription) && (
            <div className="space-y-3">
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

              {currentProduct.shortDescription && (
                <div className="p-2.5 rounded-[3px] bg-slate-50 border border-slate-200 text-slate-600 italic text-xs">
                  "{currentProduct.shortDescription}"
                </div>
              )}
            </div>
          )}



          {/* SECTION: Specifications */}
          {specifications.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Assigned Specifications
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {specifications.map((item: any, idx: number) => {
                  const spec = item.specification || {};
                  const options = Array.isArray(item.options) ? item.options : [];

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-[3px] border border-slate-200 bg-slate-50/70 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{spec.name}</span>
                        {spec.is_variant && (
                          <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 text-[9px] font-semibold rounded">
                            Variant
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {options.map((opt: any, oIdx: number) => (
                          <span
                            key={oIdx}
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded-[2px] text-[11px] text-slate-700"
                          >
                            {typeof opt === "object" ? opt.name : opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION: Related Products */}
          {relatedProducts.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Related Products ({relatedProducts.length})
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
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
