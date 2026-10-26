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
import { ImageUploader } from "@/components/image-uploader";
import { Select } from "@/components/select";
import { CategorySpecificationPicker } from "@/app/category/@components/specification-picker";
import { api } from "@/helper";
import toast from "@/lib/toast";
import { AlertCircle, Package } from "lucide-react";
import { getProductLookups } from "../@helper/lookups";

export function ProductEditDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
  onSuccess: () => void;
}) {
  // Basic info
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  // Category & Collections
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
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

  // Slugify
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Pre-fill form when product is passed
  useEffect(() => {
    if (product && open) {
      setName(product.name || "");
      setSlug(product.slug || "");
      setSku(product.sku || "");
      setBarcode(product.barcode || "");
      setDescription(product.description || "");
      setStatus(product.status || "active");

      const catId = product.category?._id || product.category || "";
      setSelectedCategoryId(catId);

      const colIds = Array.isArray(product.collections)
        ? product.collections.map((c: any) => (typeof c === "object" ? c._id : c)).filter(Boolean)
        : [];
      setSelectedCollectionIds(colIds);

      setPrice(product.price !== undefined ? product.price.toString() : "0");
      setComparePrice(product.comparePrice !== undefined ? product.comparePrice.toString() : "0");
      setCostPrice(product.costPrice !== undefined ? product.costPrice.toString() : "0");
      setStock(product.stock !== undefined ? product.stock.toString() : "0");
      setTrackStock(product.trackStock !== undefined ? Boolean(product.trackStock) : true);

      setImages(Array.isArray(product.images) ? product.images : []);

      const relIds = Array.isArray(product.relatedProducts)
        ? product.relatedProducts.map((p: any) => (typeof p === "object" ? p._id : p)).filter(Boolean)
        : [];
      setSelectedRelatedProductIds(relIds);

      setSeoTitle(product.seoTitle || "");
      setSeoDescription(product.seoDescription || "");
      setFlipkartUrl(product.flipkartUrl || "");
      setFormError(null);

      // Fetch lookups (cached)
      getProductLookups()
        .then(({ categories: cats, collections: cols }) => {
          setCategories(cats || []);
          setCollections(cols || []);
        })
        .catch((e) => console.error("Failed to load lookups:", e));

      // Pre-fill specifications from product
      if (catId) {
        api("category/view", { id: catId })
          .then((res) => {
            if (res && res.status && res.data) {
              const catSpecs = res.data.specifications || [];
              const specsList: any[] = [];
              const assigned: any[] = [];

              catSpecs.forEach((item: any) => {
                const specObj = item.specification || item;
                if (!specObj?._id) return;

                const availableOpts = Array.isArray(item.options) && item.options.length > 0
                  ? item.options
                  : specObj.options || [];

                specsList.push({ ...specObj, options: availableOpts });

                // Check what this product currently has selected
                const prodSpec = (product.specifications || []).find(
                  (ps: any) => (ps.specification?._id || ps.specification) === specObj._id
                );

                let selectedOpts: string[] = [];
                if (prodSpec) {
                  selectedOpts = (prodSpec.options || []).map((o: any) =>
                    typeof o === "object" ? o._id : o
                  );
                } else {
                  selectedOpts = availableOpts.map((o: any) => o._id || o.id || "");
                }

                assigned.push({
                  specificationId: specObj._id,
                  specification: { ...specObj, options: availableOpts },
                  selectedOptionIds: selectedOpts.filter(Boolean),
                });
              });

              setAvailableSpecifications(specsList);
              setAssignedSpecifications(assigned);
            }
          })
          .catch((e) => console.error("Failed to load category specs:", e));
      }
    }
  }, [product, open]);

  // When selectedCategoryId changes, load category products for related products
  useEffect(() => {
    if (!selectedCategoryId) {
      setCategoryProducts([]);
      return;
    }

    setLoadingRelatedProducts(true);
    api("product/list", { category: selectedCategoryId, limit: 100, excludeId: product?._id })
      .then((res) => {
        if (res && res.status && res.data) {
          setCategoryProducts(res.data.products || []);
        }
      })
      .catch((err) => console.error("Failed to load category products:", err))
      .finally(() => setLoadingRelatedProducts(false));
  }, [selectedCategoryId, product?._id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product?._id) return;
    setFormError(null);

    if (!name.trim()) {
      setFormError("Product name is required.");
      return;
    }

    if (!selectedCategoryId) {
      setFormError("Category is required.");
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setFormError("Valid product price is required.");
      return;
    }

    const confirmed = await toast.confirm({
      title: "Update Product?",
      confirmButtonText: "Yes, Update",
      cancelButtonText: "Cancel",
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const payload: any = {
        id: product._id,
        name: name.trim(),
        slug: slug.trim() ? slugify(slug) : undefined,
        sku: sku.trim() || undefined,
        barcode: barcode.trim() || undefined,
        category: selectedCategoryId,
        collections: selectedCollectionIds,
        description: description.trim(),
        price: numPrice,
        comparePrice: parseFloat(comparePrice) || 0,
        costPrice: parseFloat(costPrice) || 0,
        stock: parseInt(stock, 10) || 0,
        trackStock,
        status,
        images: images.map((img: any) => {
          const u = img.url || img.publicUrl || (typeof img === "string" ? img : "");
          return {
            url: u,
            publicUrl: u,
            key: img.key || "",
          };
        }).filter((img) => Boolean(img.url)),
        specifications: assignedSpecifications.map((item) => ({
          specification: item.specificationId,
          options: item.selectedOptionIds,
        })),
        relatedProducts: selectedRelatedProductIds,
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
        flipkartUrl: flipkartUrl.trim(),
      };

      const res = await api("product/update", payload, { method: "POST" });

      if (res && res.status) {
        toast.success("Product Updated", res.message || "Product details updated successfully!");
        onOpenChange(false);
        onSuccess();
      } else {
        const errorMsg = res?.message || "Failed to update product.";
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
              Edit Product: {product?.name || "Product"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update pricing, inventory, category specifications, related items, and variant grouping.
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
                  <Label htmlFor="edit-prod-name">
                    Product Name <span className="text-[#B4395A]">*</span>
                  </Label>
                  <Input
                    id="edit-prod-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-prod-slug">URL Slug</Label>
                  <Input
                    id="edit-prod-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    disabled={submitting}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-prod-category">
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
                  <Label htmlFor="edit-prod-sku">SKU Code</Label>
                  <Input
                    id="edit-prod-sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    disabled={submitting}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-prod-collections">Collections (Optional)</Label>
                  <Select
                    isMulti={true}
                    placeholder={loadingLookups ? "Loading collections..." : "Assign to collections..."}
                    options={collections.map((col) => ({
                      value: col._id || col.id,
                      label: col.name,
                    }))}
                    value={collections
                      .filter((col) => selectedCollectionIds.includes(col._id || col.id))
                      .map((col) => ({ value: col._id || col.id, label: col.name }))}
                    isLoading={loadingLookups}
                    isSearchable={true}
                    isClearable={true}
                    onChange={(opts: any) => {
                      setSelectedCollectionIds(Array.isArray(opts) ? opts.map((o) => o.value) : []);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-prod-desc">Full Description</Label>
                <Textarea
                  id="edit-prod-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
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
                  <Label htmlFor="edit-prod-price">
                    Selling Price (₹) <span className="text-[#B4395A]">*</span>
                  </Label>
                  <Input
                    id="edit-prod-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    disabled={submitting}
                    className="font-mono text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-prod-compare-price">MRP / Compare (₹)</Label>
                  <Input
                    id="edit-prod-compare-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    disabled={submitting}
                    className="font-mono text-sm text-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-prod-cost">Cost Price (₹)</Label>
                  <Input
                    id="edit-prod-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    disabled={submitting}
                    className="font-mono text-sm text-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-prod-stock">Stock Quantity</Label>
                  <Input
                    id="edit-prod-stock"
                    type="number"
                    min="0"
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
                    Related Products
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
                <Label htmlFor="edit-prod-seo-title">SEO Title</Label>
                <Input
                  id="edit-prod-seo-title"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-prod-seo-desc">SEO Meta Description</Label>
                <Textarea
                  id="edit-prod-seo-desc"
                  rows={2}
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
                <Label htmlFor="edit-prod-flipkart-url">Flipkart Product URL</Label>
                <Input
                  id="edit-prod-flipkart-url"
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
              {submitting ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
