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
import { HtmlEditor } from "@/components/ui/html-editor";
import { Switch } from "@/components/ui/switch";
import { ImageUploader, uploadPendingImages } from "@/components/image-uploader";
import { Select } from "@/components/select";
import { CategorySpecificationPicker } from "@/app/category/@components/specification-picker";
import { api } from "@/helper";
import toast from "@/lib/toast";
import { AlertCircle, Package } from "lucide-react";
import { getProductLookups } from "../@helper/lookups";

export function ProductAddDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  // Basic info
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  // Category
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [loadingLookups, setLoadingLookups] = useState(false);

  // Pricing & Inventory
  const [price, setPrice] = useState<string>("0");
  const [comparePrice, setComparePrice] = useState<string>("0");
  const [costPrice, setCostPrice] = useState<string>("0");
  const [stock, setStock] = useState<string>("0");
  const [trackStock, setTrackStock] = useState<boolean>(true);

  // Images
  const [images, setImages] = useState<any[]>([]);

  // Category Specifications
  const [availableSpecifications, setAvailableSpecifications] = useState<any[]>([]);
  const [assignedSpecifications, setAssignedSpecifications] = useState<any[]>([]);

  // Related Products (Category-wise)
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [selectedRelatedProductIds, setSelectedRelatedProductIds] = useState<string[]>([]);
  const [loadingRelatedProducts, setLoadingRelatedProducts] = useState(false);

  // SEO
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [flipkartUrl, setFlipkartUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-slug utility
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Reset form and fetch lookups when modal opens
  useEffect(() => {
    if (open) {
      setName("");
      setSlug("");
      setSku("");
      setBarcode("");
      setDescription("");
      setStatus("active");
      setIsSlugManuallyEdited(false);
      setSelectedCategoryId("");
      setPrice("0");
      setComparePrice("0");
      setCostPrice("0");
      setStock("0");
      setTrackStock(true);
      setImages([]);
      setAssignedSpecifications([]);
      setAvailableSpecifications([]);
      setSelectedRelatedProductIds([]);
      setCategoryProducts([]);
      setSeoTitle("");
      setSeoDescription("");
      setFlipkartUrl("");
      setFormError(null);

      getProductLookups()
        .then(({ categories: cats }) => {
          setCategories(cats || []);
        })
        .catch((e) => console.error("Failed to load lookups:", e));
    }
  }, [open]);

  // When selectedCategoryId changes:
  // 1. Fetch category specifications
  // 2. Fetch category-wise products for Related Products selector
  useEffect(() => {
    if (!selectedCategoryId) {
      setAvailableSpecifications([]);
      setAssignedSpecifications([]);
      setCategoryProducts([]);
      setSelectedRelatedProductIds([]);
      return;
    }

    // 1. Fetch category details to get its specifications
    api("category/view", { id: selectedCategoryId })
      .then((res) => {
        if (res && res.status && res.data) {
          const cat = res.data;
          const catSpecs = cat.specifications || [];
          const specsList: any[] = [];
          const initialAssigned: any[] = [];

          catSpecs.forEach((item: any) => {
            const specObj = item.specification || item;
            if (!specObj?._id) return;

            const opts = Array.isArray(item.options) && item.options.length > 0
              ? item.options
              : specObj.options || [];

            const specWithOpts = { ...specObj, options: opts };
            specsList.push(specWithOpts);

            initialAssigned.push({
              specificationId: specObj._id,
              specification: specWithOpts,
              selectedOptionIds: opts.map((o: any) => o._id || o.id || "").filter(Boolean),
            });
          });

          setAvailableSpecifications(specsList);
          setAssignedSpecifications(initialAssigned);
        }
      })
      .catch((err) => console.error("Failed to load category specifications:", err));

    // 2. Fetch products in this category for Related Products selector
    setLoadingRelatedProducts(true);
    api("product/list", { category: selectedCategoryId, limit: 100 })
      .then((res) => {
        if (res && res.status && res.data) {
          setCategoryProducts(res.data.products || []);
        }
      })
      .catch((err) => console.error("Failed to load category products:", err))
      .finally(() => setLoadingRelatedProducts(false));
  }, [selectedCategoryId]);

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
      setFormError("Product name is required.");
      return;
    }

    if (!selectedCategoryId) {
      setFormError("Category is required. Please select a category for this product.");
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setFormError("Valid product price is required.");
      return;
    }

    const confirmed = await toast.confirm({
      title: "Save New Product?",
      confirmButtonText: "Yes, Save",
      cancelButtonText: "Cancel",
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const uploadedImages = await uploadPendingImages(images, "products");

      const payload: any = {
        name: name.trim(),
        slug: slug.trim() ? slugify(slug) : undefined,
        sku: sku.trim() || undefined,
        barcode: barcode.trim() || undefined,
        category: selectedCategoryId,
        description: description.trim(),
        price: numPrice,
        comparePrice: parseFloat(comparePrice) || 0,
        costPrice: parseFloat(costPrice) || 0,
        stock: parseInt(stock, 10) || 0,
        trackStock,
        status,
        images: uploadedImages,
        specifications: assignedSpecifications.map((item) => ({
          specification: item.specificationId,
          options: item.selectedOptionIds,
        })),
        relatedProducts: selectedRelatedProductIds,
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
        flipkartUrl: flipkartUrl.trim(),
      };

      const res = await api("product/create", payload, { method: "POST" });

      if (res && res.status) {
        toast.success("Product Created", res.message || "Product added successfully!");
        onOpenChange(false);
        onSuccess();
      } else {
        const errorMsg = res?.message || "Failed to create product. Please check your inputs.";
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
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-white pr-14 text-left">
            <DialogTitle className="text-base font-bold text-slate-900">
              Add New Product
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Create a new cosmetics product with inventory, specifications, related items, and variant groups.
            </DialogDescription>
          </DialogHeader>

          {/* Form Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {formError && (
              <div className="rounded-[4px] border border-red-500/30 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Top: Product Gallery Images (Multi-image upload) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Product Images
                </Label>
                <span className="text-[11px] text-slate-400">
                  First image will be the primary catalog thumbnail
                </span>
              </div>
              <ImageUploader
                single={false}
                value={images}
                onChange={setImages}
                folder="products"
                disabled={submitting}
              />
            </div>

            {/* Product Status (Top: right below image upload) */}
            <div className="flex items-center justify-between p-3.5 rounded-[3px] border border-slate-200 bg-slate-50/70">
              <div className="space-y-0.5">
                <Label className="mb-0 text-xs font-bold text-slate-800">Product Status</Label>
                <p className="text-[11px] text-slate-500">
                  {status === "active" ? "Product is active and purchasable in store" : "Product is hidden from store"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${status === "active" ? "text-[#B4395A]" : "text-slate-400"}`}>
                  {status === "active" ? "Active" : "Inactive"}
                </span>
                <Switch
                  checked={status === "active"}
                  onCheckedChange={(checked) => setStatus(checked ? "active" : "inactive")}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* General Product Fields */}
            <div className="space-y-3.5 pt-3 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="add-prod-name">
                    Product Name <span className="text-[#B4395A]">*</span>
                  </Label>
                  <Input
                    id="add-prod-name"
                    placeholder="e.g. Velvet Matte Liquid Lipstick - Ruby Red"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="add-prod-slug">
                    URL Slug <span className="text-slate-400 font-normal">(Auto-generated)</span>
                  </Label>
                  <Input
                    id="add-prod-slug"
                    placeholder="e.g. velvet-matte-liquid-lipstick-ruby-red"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setIsSlugManuallyEdited(true);
                    }}
                    disabled={submitting}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="add-prod-category">
                    Category <span className="text-[#B4395A]">*</span>
                  </Label>
                  <Select
                    placeholder={loadingLookups ? "Loading categories..." : "Select product category..."}
                    options={categories.map((c) => ({
                      value: c._id || c.id,
                      label: c.name,
                      data: c,
                    }))}
                    value={
                      selectedCategoryId
                        ? {
                            value: selectedCategoryId,
                            label: categories.find((c) => (c._id || c.id) === selectedCategoryId)?.name || "Selected",
                          }
                        : null
                    }
                    isLoading={loadingLookups}
                    isSearchable={true}
                    isClearable={false}
                    onChange={(opt: any) => setSelectedCategoryId(opt?.value || "")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="add-prod-sku">SKU Code</Label>
                  <Input
                    id="add-prod-sku"
                    placeholder="e.g. ECL-LIP-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    disabled={submitting}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-prod-desc">Full Description</Label>
                <HtmlEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Detailed description, key ingredients, usage instructions in HTML or rich text..."
                  minHeight="200px"
                />
              </div>
            </div>

            {/* SECTION 2: Pricing & Inventory */}
            <div className="pt-3 border-t border-slate-200 space-y-3.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Pricing & Inventory
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="add-prod-price">
                    Selling Price (₹) <span className="text-[#B4395A]">*</span>
                  </Label>
                  <Input
                    id="add-prod-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    disabled={submitting}
                    className="font-mono text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="add-prod-compare-price">MRP / Compare (₹)</Label>
                  <Input
                    id="add-prod-compare-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    disabled={submitting}
                    className="font-mono text-sm text-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="add-prod-cost">Cost Price (₹)</Label>
                  <Input
                    id="add-prod-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    disabled={submitting}
                    className="font-mono text-sm text-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="add-prod-stock">Stock Quantity</Label>
                  <Input
                    id="add-prod-stock"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    disabled={submitting}
                    className="font-mono text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-[3px] border border-slate-200 bg-slate-50/70">
                <div className="space-y-0.5">
                  <Label className="mb-0 text-xs font-semibold">Track Inventory</Label>
                  <p className="text-[11px] text-slate-500">
                    Automatically decrement stock when orders are placed
                  </p>
                </div>
                <Switch
                  checked={trackStock}
                  onCheckedChange={setTrackStock}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* SECTION: Category Specifications */}
            {availableSpecifications.length > 0 && (
              <div className="space-y-2">
                <CategorySpecificationPicker
                  availableSpecifications={availableSpecifications}
                  assignedSpecifications={assignedSpecifications}
                  onChange={setAssignedSpecifications}
                />
              </div>
            )}

            {/* SECTION 5: Related Products (Category-wise conditional search select) */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    You Might Also Like
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Products recommended alongside this product in the catalog
                  </p>
                </div>
                {selectedRelatedProductIds.length > 0 && (
                  <span className="text-[11px] font-mono text-[#B4395A] font-semibold">
                    {selectedRelatedProductIds.length} related
                  </span>
                )}
              </div>

              {!selectedCategoryId ? (
                <div className="p-4 rounded-[4px] border border-dashed border-amber-200 bg-amber-50/50 flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800">
                    <strong>Category Required:</strong> Please select a Category above to search and select related products.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <Select
                    isMulti={true}
                    placeholder={
                      loadingRelatedProducts
                        ? "Loading category products..."
                        : "Search & select related products from this category..."
                    }
                    noOptionsMessage={() =>
                      loadingRelatedProducts
                        ? "Loading products..."
                        : categoryProducts.length === 0
                        ? "No other products in this category yet"
                        : "No matching products found"
                    }
                    options={categoryProducts.map((p) => ({
                      value: p._id,
                      label: `${p.name} (₹${p.price})`,
                      data: p,
                    }))}
                    value={categoryProducts
                      .filter((p) => selectedRelatedProductIds.includes(p._id))
                      .map((p) => ({
                        value: p._id,
                        label: `${p.name} (₹${p.price})`,
                        data: p,
                      }))}
                    isLoading={loadingRelatedProducts}
                    isSearchable={true}
                    isClearable={true}
                    isDisabled={submitting}
                    onChange={(selected: any) => {
                      const ids = Array.isArray(selected) ? selected.map((s) => s.value) : [];
                      setSelectedRelatedProductIds(ids);
                    }}
                  />

                  {/* Badges preview */}
                  {selectedRelatedProductIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedRelatedProductIds.map((relId) => {
                        const relProd = categoryProducts.find((p) => p._id === relId);
                        if (!relProd) return null;
                        const thumb = relProd.images?.[0]?.url;

                        return (
                          <div
                            key={relId}
                            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-[4px] border border-slate-200 bg-slate-50 text-xs shadow-2xs"
                          >
                            {thumb ? (
                              <img src={thumb} alt="" className="w-5 h-5 rounded object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-slate-400" />
                            )}
                            <span className="font-medium text-slate-800 max-w-[180px] truncate">
                              {relProd.name}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              ₹{relProd.price}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>



            {/* Search Engine Optimization (SEO) */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Search Engine Optimization (SEO)
              </h4>
              <div className="space-y-1.5">
                <Label htmlFor="add-prod-seo-title">SEO Title</Label>
                <Input
                  id="add-prod-seo-title"
                  placeholder="e.g. Velvet Matte Liquid Lipstick in Ruby Red | Eclera Cosmetics"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-prod-seo-desc">SEO Meta Description</Label>
                <Textarea
                  id="add-prod-seo-desc"
                  rows={2}
                  placeholder="Shop Eclera's iconic velvet matte liquid lipstick. Long lasting hydration, smudge-proof..."
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Marketplace Integration */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Marketplace Integration
                </h4>
                <span className="text-[11px] text-slate-400 font-normal">Optional</span>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-prod-flipkart-url">Flipkart Product URL</Label>
                <Input
                  id="add-prod-flipkart-url"
                  placeholder="e.g. https://www.flipkart.com/..."
                  value={flipkartUrl}
                  onChange={(e) => setFlipkartUrl(e.target.value)}
                  disabled={submitting}
                />
                <p className="text-[11px] text-slate-500">
                  When set, a &quot;Buy on Flipkart&quot; button will automatically appear for this product on the website.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="h-8 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="h-8 text-xs font-semibold bg-[#B4395A] hover:bg-[#962e49] text-white"
            >
              {submitting ? "Saving..." : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
