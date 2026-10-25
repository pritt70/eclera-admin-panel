"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SearchInput } from "@/components/ui/search-input";
import { DataTablePagination } from "@/components/ui/pagination";
import { ProductAddDialog } from "@/app/product/@components/add";
import { ProductEditDialog } from "@/app/product/@components/edit";
import { ProductViewDialog } from "@/app/product/@components/view";
import { api } from "@/helper";
import toast from "@/lib/toast";

export default function ProductsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [products, setProducts] = useState<any[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);

  // Filter & Pagination states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [viewingProduct, setViewingProduct] = useState<any>(null);

  const isFetchingRef = useRef(false);

  // Fetch products (deduplicated to only execute 1 call)
  const fetchProducts = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await api("product/list", {
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (res && res.status && res.data) {
        setProducts(res.data.products || []);
        setTotalProducts(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setError(res?.message || "Failed to load products");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while fetching products");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle instant status switch toggle
  const handleToggleStatus = async (item: any) => {
    if (!item._id) return;
    const previousStatus = item.status;
    const nextStatus = previousStatus === "active" ? "inactive" : "active";

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p._id === item._id ? { ...p, status: nextStatus } : p))
    );

    try {
      const res = await api("product/change-status", {
        id: item._id,
        status: nextStatus,
      });

      if (res && res.status) {
        toast.success("Status Updated", `Product is now ${nextStatus}`);
      } else {
        // Rollback
        setProducts((prev) =>
          prev.map((p) => (p._id === item._id ? { ...p, status: previousStatus } : p))
        );
        toast.error("Status Update Failed", res?.message || "Could not toggle status.");
      }
    } catch (err: any) {
      // Rollback
      setProducts((prev) =>
        prev.map((p) => (p._id === item._id ? { ...p, status: previousStatus } : p))
      );
      toast.error("Error", err?.message || "Failed to update product status");
    }
  };

  // Handle Delete with SweetAlert2 confirmation
  const handleDelete = async (item: any) => {
    if (!item._id) return;

    const confirmed = await toast.confirm({
      title: "Are you sure to delete?",
      text: `Do you want to delete "${item.name}"?`,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    });

    if (!confirmed) return;

    try {
      const res = await api("product/delete", { id: item._id });
      if (res && res.status) {
        toast.success("Deleted", res.message || "Product was deleted successfully.");
        fetchProducts();
      } else {
        toast.error("Delete Blocked", res?.message || "Cannot delete this product.");
      }
    } catch (err: any) {
      toast.error("Delete Error", err?.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Sidebar with product navigation */}
      <Sidebar
        currentPath="/product"
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          title="Products"
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        >
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="h-8.5 px-3.5 text-xs font-semibold bg-[#B4395A] text-white hover:bg-[#9b2f4c] shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Product</span>
          </Button>
        </Header>

        <main className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Filter Bar */}
          <div className="rounded-[2px] border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-sm">
              <SearchInput
                value={search}
                onChange={(val: string) => {
                  setSearch(val);
                  setPage(1);
                }}
                placeholder="Search products by name or slug..."
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-[3px] self-start sm:self-auto">
              {(["all", "active", "inactive"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-[2px] text-xs font-medium capitalize transition-colors cursor-pointer ${
                    statusFilter === tab
                      ? "bg-white text-slate-900 shadow-xs font-semibold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-[2px] border border-slate-200 bg-white shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-2.5">
                <div className="h-6 w-6 animate-spin border-2 border-slate-200 border-t-[#B4395A]" />
                <p className="text-xs text-slate-500 font-medium">Loading products...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center space-y-3">
                <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-[2px] max-w-md mx-auto border border-red-200">
                  {error}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchProducts}
                  className="h-8 text-xs border-slate-300"
                >
                  Retry Loading
                </Button>
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <div className="text-sm font-bold text-slate-800">No products found</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {search || statusFilter !== "all"
                    ? "Try adjusting your search query or status filter."
                    : "Get started by adding your first product."}
                </p>
                {!search && statusFilter === "all" && (
                  <Button
                    onClick={() => setAddDialogOpen(true)}
                    className="h-8.5 px-4 text-xs font-semibold bg-[#B4395A] text-white hover:bg-[#9b2f4c]"
                  >
                    + Add Your First Product
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Image</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-center">Group</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {products.map((item) => {
                    const primaryThumb = item.images?.[0]?.url || item.images?.[0]?.publicUrl || (typeof item.images?.[0] === "string" ? item.images?.[0] : "");
                    const catName = item.category?.name || "Uncategorized";
                    const isGrouped = Boolean(item.group?.enabled);
                    const swatchColor = item.group?.swatchColor;

                    return (
                      <TableRow key={item._id}>
                        {/* Image Thumbnail */}
                        <TableCell>
                          <div
                            onClick={() => setViewingProduct(item)}
                            className="h-14 w-14 rounded-[4px] border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:border-[#B4395A] hover:shadow-xs transition"
                            title="Click to view product"
                          >
                            {primaryThumb ? (
                              <img
                                src={primaryThumb}
                                alt={item.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='1.5'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                                }}
                              />
                            ) : (
                              <span className="text-xs font-bold text-slate-400 uppercase">
                                {item.name.charAt(0)}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Name and Slug */}
                        <TableCell>
                          <div
                            onClick={() => setViewingProduct(item)}
                            className="space-y-0.5 cursor-pointer group"
                            title="Click to view details"
                          >
                            <span className="text-xs font-semibold text-slate-900 group-hover:text-[#B4395A] transition block">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-mono block">
                                /{item.slug}
                              </span>
                              {item.sku && (
                                <span className="font-mono text-[9px] text-slate-500 bg-slate-100 px-1 rounded-[2px]">
                                  {item.sku}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell>
                          <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-[2px] bg-rose-50 text-[#B4395A] border border-rose-200/70">
                            {catName}
                          </span>
                        </TableCell>

                        {/* Price */}
                        <TableCell>
                          <div className="flex flex-col font-mono text-xs">
                            <span className="font-bold text-slate-900">₹{item.price}</span>
                            {item.comparePrice > item.price && (
                              <span className="text-[10px] text-slate-400 line-through">
                                ₹{item.comparePrice}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Inventory */}
                        <TableCell className="text-center font-mono text-xs">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded-[2px] font-medium text-[11px] ${
                              (item.stock || 0) > 0
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {item.stock || 0}
                          </span>
                        </TableCell>

                        {/* Variant Group */}
                        <TableCell className="text-center">
                          {isGrouped ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border border-purple-200 bg-purple-50 text-purple-700 text-[10px] font-semibold">
                              {swatchColor && (
                                <span
                                  className="w-2 h-2 rounded-full border border-black/10 shrink-0"
                                  style={{ backgroundColor: swatchColor }}
                                />
                              )}
                              <span>{item.group?.attributeValue || "Grouped"}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-300">—</span>
                          )}
                        </TableCell>

                        {/* Status Switch */}
                        <TableCell className="text-center">
                          <Switch
                            checked={item.status === "active"}
                            onCheckedChange={() => handleToggleStatus(item)}
                            aria-label={`Toggle status for ${item.name}`}
                          />
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => setViewingProduct(item)}
                              className="p-1.5 text-slate-500 hover:text-[#B4395A] hover:bg-slate-100 rounded-[2px] transition-colors cursor-pointer"
                              title="View Product"
                              aria-label="View Product"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedProduct(item);
                                setEditDialogOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-[#B4395A] hover:bg-slate-100 rounded-[2px] transition-colors cursor-pointer"
                              title="Edit Product Details"
                              aria-label="Edit Product"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>

                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-[2px] transition-colors cursor-pointer"
                              title="Delete Product"
                              aria-label="Delete Product"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                <DataTablePagination
                  page={page}
                  totalPages={totalPages}
                  total={totalProducts}
                  limit={limit}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Dialog */}
      <ProductAddDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => {
          fetchProducts();
          setPage(1);
        }}
      />

      {/* Edit Dialog */}
      <ProductEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        product={selectedProduct}
        onSuccess={() => {
          fetchProducts();
        }}
      />

      {/* View Dialog */}
      <ProductViewDialog
        open={Boolean(viewingProduct)}
        onOpenChange={(open) => !open && setViewingProduct(null)}
        product={viewingProduct}
        onProductUpdated={fetchProducts}
      />
    </div>
  );
}
