"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Package,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Tag,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/helper";

interface CollectionProductSelectorProps {
  categories: any[];
  selectedCategoryIds: string[];
  selectedProducts: any[];
  onSelectedProductsChange: (products: any[]) => void;
  disabled?: boolean;
}

export function CollectionProductSelector({
  categories = [],
  selectedCategoryIds = [],
  selectedProducts = [],
  onSelectedProductsChange,
  disabled = false,
}: CollectionProductSelectorProps) {
  // Active category to search products from (defaults to the first selected category)
  const [activeCategoryId, setActiveCategoryId] = useState<string>("");

  // Search input and debounced search term
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Pagination states
  const [page, setPage] = useState<number>(1);
  const limit = 8;
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Results & Loading states
  const [productsList, setProductsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Keep track of active category ID based on selectedCategoryIds
  useEffect(() => {
    if (selectedCategoryIds.length > 0) {
      if (!selectedCategoryIds.includes(activeCategoryId)) {
        setActiveCategoryId(selectedCategoryIds[0]);
      }
    } else {
      setActiveCategoryId("");
      setProductsList([]);
      setTotalProducts(0);
      setTotalPages(1);
    }
  }, [selectedCategoryIds, activeCategoryId]);

  // Requirement 5: Debounced search with approximately 300 ms delay
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1); // Reset to page 1 on new search query
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Fetch products using GET products/select_product endpoint
  const fetchProducts = useCallback(async () => {
    if (!activeCategoryId) {
      setProductsList([]);
      setTotalProducts(0);
      setTotalPages(1);
      return;
    }

    setLoading(true);
    setFetchError(null);

    try {
      // Requirements:
      // - Endpoint: products/select_product (or /select_product)
      // - Query Parameters: categoryId, search, page, limit
      const endpoint = `products/select_product?categoryId=${encodeURIComponent(
        activeCategoryId
      )}&search=${encodeURIComponent(debouncedSearch)}&page=${page}&limit=${limit}`;

      const res = await api(endpoint, undefined, { method: "GET" });

      if (res && res.status && res.data) {
        setProductsList(res.data.products || []);
        const pagination = res.data.pagination || {};
        setTotalProducts(pagination.total ?? res.data.total ?? 0);
        setTotalPages(pagination.totalPages || 1);
      } else {
        setProductsList([]);
        setTotalProducts(0);
        setTotalPages(1);
        if (res?.message) {
          setFetchError(res.message);
        }
      }
    } catch (err: any) {
      console.error("Failed to load products for collection:", err);
      setFetchError(err?.message || "Failed to search products");
      setProductsList([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategoryId, debouncedSearch, page, limit]);

  // Trigger search when activeCategoryId, debouncedSearch, or page changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Selected product IDs set for fast O(1) membership check
  const selectedProductIds = React.useMemo(() => {
    return new Set(
      selectedProducts.map((p: any) =>
        typeof p === "object" && p !== null ? (p._id || p.id)?.toString() : p?.toString()
      )
    );
  }, [selectedProducts]);

  // Requirement 7 & 8: Toggle single product selection while keeping previous selections intact
  const handleToggleProduct = (product: any) => {
    if (disabled) return;
    const prodId = (product._id || product.id)?.toString();
    if (!prodId) return;

    if (selectedProductIds.has(prodId)) {
      // Remove product
      const updated = selectedProducts.filter(
        (p: any) => (p._id || p.id)?.toString() !== prodId
      );
      onSelectedProductsChange(updated);
    } else {
      // Add product (persist full product summary)
      onSelectedProductsChange([...selectedProducts, product]);
    }
  };

  // Select all products visible on the current page
  const handleSelectAllOnPage = () => {
    if (disabled || productsList.length === 0) return;

    const unselectedOnPage = productsList.filter(
      (p) => !selectedProductIds.has((p._id || p.id)?.toString())
    );

    if (unselectedOnPage.length > 0) {
      onSelectedProductsChange([...selectedProducts, ...unselectedOnPage]);
    } else {
      // If all on this page are already selected, deselect them
      const pageProductIds = new Set(productsList.map((p) => (p._id || p.id)?.toString()));
      const filtered = selectedProducts.filter(
        (p) => !pageProductIds.has((p._id || p.id)?.toString())
      );
      onSelectedProductsChange(filtered);
    }
  };

  // Remove a selected product by ID
  const handleRemoveSelected = (prodIdToRemove: string) => {
    if (disabled) return;
    const updated = selectedProducts.filter(
      (p: any) => (p._id || p.id)?.toString() !== prodIdToRemove
    );
    onSelectedProductsChange(updated);
  };

  // Clear all selected products
  const handleClearAllSelected = () => {
    if (disabled) return;
    onSelectedProductsChange([]);
  };

  // Helpers to get category name
  const getCategoryName = (catId: string) => {
    const match = categories.find((c: any) => (c._id || c.id) === catId);
    return match ? match.name : "Category";
  };

  const allOnPageSelected =
    productsList.length > 0 &&
    productsList.every((p) => selectedProductIds.has((p._id || p.id)?.toString()));

  return (
    <div className="space-y-3 pt-3 border-t border-slate-200">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-slate-900">
          Product <span className="text-[#B4395A]">*</span>
        </Label>

        {selectedProducts.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-pink-50/80 text-[#B4395A] border-pink-200 text-xs font-semibold px-2 py-0.5"
            >
              {selectedProducts.length} selected
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAllSelected}
              disabled={disabled}
              className="h-6 px-2 text-[11px] text-slate-500 hover:text-red-600 hover:bg-red-50"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* When no categories have been selected in the collection yet */}
      {selectedCategoryIds.length === 0 ? (
        <div className="p-4 rounded-[3px] border border-dashed border-slate-200 bg-slate-50/60 text-center space-y-1.5">
          <FolderOpen className="w-6 h-6 text-slate-400 mx-auto" />
          <p className="text-xs font-medium text-slate-700">No category selected</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Please select at least one category above. You can then search and assign products from that category.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Active Category Selector (when multiple categories exist) */}
          {selectedCategoryIds.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-medium text-slate-500 shrink-0">
                Search Category:
              </span>
              {selectedCategoryIds.map((cId) => {
                const isActive = activeCategoryId === cId;
                const catName = getCategoryName(cId);
                return (
                  <button
                    key={cId}
                    type="button"
                    onClick={() => {
                      setActiveCategoryId(cId);
                      setPage(1);
                    }}
                    disabled={disabled}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] text-xs font-medium transition-all ${
                      isActive
                        ? "bg-[#B4395A] text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {isActive && <Check className="w-3 h-3 text-white" />}
                    <span>{catName}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search Input Box */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="collection-product-search-input"
                type="text"
                placeholder={`Search products by name or SKU in ${getCategoryName(activeCategoryId)}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={disabled}
                className="pl-8 pr-8 h-9 text-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {productsList.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllOnPage}
                disabled={disabled || loading}
                className="h-9 px-3 text-xs shrink-0"
              >
                {allOnPageSelected ? "Deselect Page" : "Select Page"}
              </Button>
            )}
          </div>

          {/* Selected Products Shelf (Requirement 8: Keep previously selected products) */}
          {selectedProducts.length > 0 && (
            <div className="p-2.5 rounded-[3px] border border-pink-100 bg-pink-50/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#B4395A]" />
                  Attached Products ({selectedProducts.length}):
                </span>
                <span className="text-[10px] text-slate-500">
                  Preserved across all searches & categories
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {selectedProducts.map((p: any) => {
                  const pId = (p._id || p.id)?.toString();
                  const pImg =
                    Array.isArray(p.images) && p.images.length > 0
                      ? p.images[0]?.url || p.images[0]?.publicUrl || p.images[0]
                      : null;

                  return (
                    <div
                      key={pId}
                      className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-[3px] bg-white border border-pink-200/80 shadow-xs text-xs text-slate-800 group"
                    >
                      {pImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={pImg}
                          alt={p.name}
                          className="w-4 h-4 rounded-xs object-cover shrink-0"
                        />
                      ) : (
                        <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate max-w-[140px] font-medium" title={p.name}>
                        {p.name}
                      </span>
                      {p.sku && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({p.sku})
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveSelected(pId)}
                        disabled={disabled}
                        className="text-slate-400 hover:text-red-600 rounded-full p-0.5 hover:bg-red-50 transition-colors"
                        title="Remove product"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Results Display */}
          <div className="rounded-[3px] border border-slate-200 bg-white overflow-hidden">
            {/* Header info */}
            <div className="px-3 py-2 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium text-slate-800">
                {loading && <Loader2 className="w-3 h-3 animate-spin text-[#B4395A]" />}
                Product
              </span>

              {totalPages > 1 && (
                <span className="text-[11px] text-slate-400">
                  Page {page} of {totalPages}
                </span>
              )}
            </div>

            {/* Results Grid / List */}
            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#B4395A]" />
                <span className="text-xs">Fetching products from server...</span>
              </div>
            ) : fetchError ? (
              <div className="p-4 text-center text-xs text-red-600 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fetchError}</span>
              </div>
            ) : productsList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <Package className="w-6 h-6 mx-auto text-slate-300" />
                <p className="text-xs font-medium text-slate-600">No products found</p>
                <p className="text-[11px] text-slate-400">
                  {debouncedSearch
                    ? "Try adjusting your search terms or SKU"
                    : "There are no products in this category yet"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {productsList.map((product) => {
                  const pId = (product._id || product.id)?.toString();
                  const isChecked = selectedProductIds.has(pId);
                  const pImg =
                    Array.isArray(product.images) && product.images.length > 0
                      ? product.images[0]?.url || product.images[0]?.publicUrl || product.images[0]
                      : null;

                  return (
                    <div
                      key={pId}
                      onClick={() => handleToggleProduct(product)}
                      className={`flex items-center gap-3 px-3 py-2.5 text-xs cursor-pointer transition-colors select-none ${
                        isChecked
                          ? "bg-pink-50/40 hover:bg-pink-50/60"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* Checkbox */}
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => handleToggleProduct(product)}
                        onClick={(e) => e.stopPropagation()}
                        className="data-checked:bg-[#B4395A] data-checked:border-[#B4395A]"
                      />

                      {/* Thumbnail */}
                      <div className="w-9 h-9 rounded-[3px] border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
                        {pImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={pImg}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-4 h-4 text-slate-400" />
                        )}
                      </div>

                      {/* Product details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 truncate" title={product.name}>
                            {product.name}
                          </p>
                          {product.status && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-xs font-medium uppercase tracking-wider ${
                                product.status === "active"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {product.status}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                          {product.sku && (
                            <span className="flex items-center gap-1 font-mono">
                              <Tag className="w-3 h-3 text-slate-400" />
                              {product.sku}
                            </span>
                          )}
                          {product.price !== undefined && product.price !== null && (
                            <span className="font-medium text-slate-700">
                              ₹{Number(product.price).toLocaleString()}
                            </span>
                          )}
                          {product.stock !== undefined && (
                            <span className="text-slate-400">
                              Stock: {product.stock}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Selected Indicator */}
                      {isChecked && (
                        <div className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-[#B4395A]">
                          <Check className="w-3.5 h-3.5" />
                          <span>Added</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls Footer */}
            {totalPages > 1 && (
              <div className="px-3 py-2 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  Showing {(page - 1) * limit + 1}–
                  {Math.min(page * limit, totalProducts)} of {totalProducts}
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={disabled || page <= 1 || loading}
                    className="h-7 px-2 text-xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="sr-only">Previous</span>
                  </Button>

                  <span className="text-[11px] font-medium text-slate-600 px-1">
                    {page} / {totalPages}
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={disabled || page >= totalPages || loading}
                    className="h-7 px-2 text-xs"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="sr-only">Next</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
