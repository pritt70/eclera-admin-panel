"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { DataTablePagination } from "@/components/ui/pagination";
import { DiscountAddDialog } from "@/app/discount/@components/add";
import { DiscountEditDialog } from "@/app/discount/@components/edit";
import { DiscountViewDialog } from "@/app/discount/@components/view";
import { api } from "@/helper";
import toast from "@/lib/toast";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  Tag,
} from "lucide-react";

export default function DiscountsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [totalDiscounts, setTotalDiscounts] = useState<number>(0);

  // Filter & Pagination states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "special" | "expired">("all");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<any>(null);

  // Fetch discounts from API
  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api("discount/list", {
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (res && res.status && res.data) {
        setDiscounts(res.data.discounts || []);
        setTotalDiscounts(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setError(res?.message || "Failed to load discounts");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while fetching discounts");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  // Handle instant status switch toggle
  const handleToggleStatus = async (item: any) => {
    if (!item._id) return;
    const previousStatus = item.status;
    const nextStatus = previousStatus === "active" ? "inactive" : "active";

    // Optimistic UI update
    setDiscounts((prev) =>
      prev.map((d) => (d._id === item._id ? { ...d, status: nextStatus } : d))
    );

    try {
      const res = await api("discount/change-status", {
        id: item._id,
        status: nextStatus,
      });

      if (res && res.status) {
        toast.success("Status Updated", `Coupon is now ${nextStatus}`);
      } else {
        // Rollback
        setDiscounts((prev) =>
          prev.map((d) => (d._id === item._id ? { ...d, status: previousStatus } : d))
        );
        toast.error("Status Update Failed", res?.message || "Could not toggle status.");
      }
    } catch (err: any) {
      // Rollback
      setDiscounts((prev) =>
        prev.map((d) => (d._id === item._id ? { ...d, status: previousStatus } : d))
      );
      toast.error("Error", err?.message || "Failed to update discount status");
    }
  };

  // Handle Delete with confirm dialog
  const handleDelete = async (item: any) => {
    if (!item._id) return;

    const confirmed = await toast.confirm({
      title: "Delete Coupon?",
      text: `Are you sure you want to delete coupon "${item.code}"? This action cannot be undone.`,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    });

    if (!confirmed) return;

    try {
      const res = await api("discount/delete", { id: item._id });
      if (res && res.status) {
        toast.success("Deleted", res.message || "Coupon was deleted successfully.");
        fetchDiscounts();
      } else {
        toast.error("Delete Blocked", res?.message || "Cannot delete this coupon.");
      }
    } catch (err: any) {
      toast.error("Delete Error", err?.message || "An unexpected error occurred.");
    }
  };

  const handleOpenAdd = () => {
    setAddDialogOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setSelectedDiscount(item);
    setEditDialogOpen(true);
  };

  const handleOpenView = (item: any) => {
    setSelectedDiscount(item);
    setViewDialogOpen(true);
  };

  const formatValidity = (item: any) => {
    if (!item.endDate) return "No Expiry";
    const end = new Date(item.endDate);
    const isExpired = end < new Date();
    const dateStr = end.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    if (isExpired) {
      return (
        <span className="text-amber-600 font-medium text-[11px]">
          Expired ({dateStr})
        </span>
      );
    }
    return <span className="text-slate-600 text-[11px]">Until {dateStr}</span>;
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Sidebar */}
      <Sidebar
        currentPath="/discount"
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          title="Discounts"
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        >
          <Button
            onClick={handleOpenAdd}
            className="h-8.5 px-3.5 text-xs font-semibold bg-[#B4395A] text-white hover:bg-[#9b2f4c] shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Discount</span>
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
                placeholder="Search by coupon code or description..."
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-[3px] self-start sm:self-auto">
              {(["all", "active", "inactive", "special", "expired"] as const).map((tab) => (
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
                <div className="h-6 w-6 animate-spin border-2 border-slate-200 border-t-[#B4395A] rounded-full" />
                <p className="text-xs text-slate-500 font-medium">Loading discounts...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center space-y-3">
                <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-[2px] max-w-md mx-auto border border-red-200">
                  {error}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchDiscounts}
                  className="h-8 text-xs border-slate-300"
                >
                  Retry Loading
                </Button>
              </div>
            ) : discounts.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">No discounts found</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {search || statusFilter !== "all"
                      ? "No coupon records match your active search filters."
                      : "Create your first discount coupon code for your customers."}
                  </p>
                </div>
                {!search && statusFilter === "all" && (
                  <Button
                    onClick={handleOpenAdd}
                    size="sm"
                    className="h-8 text-xs bg-[#B4395A] hover:bg-[#9b2f4c] text-white"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Discount
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                      <TableHead className="w-12 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">
                        #
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Coupon Code
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Discount Value
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Min. Order
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Max. Price Cap
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">
                        Usage
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Validity
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right w-28">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discounts.map((item, idx) => {
                      const discountText =
                        item.type === "percentage"
                          ? `${item.value}% Off`
                          : `₹${Number(item.value || 0).toLocaleString("en-IN")} Flat Off`;

                      const isExpired = item.endDate && new Date(item.endDate) < new Date();

                      return (
                        <TableRow
                          key={item._id}
                          className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors"
                        >
                          <TableCell className="text-xs text-slate-400 font-medium text-center">
                            {(page - 1) * limit + idx + 1}
                          </TableCell>

                          {/* Coupon Code Column */}
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleOpenView(item)}
                                  className="font-mono text-xs font-bold text-[#B4395A] hover:underline px-2 py-0.5 bg-rose-50/70 border border-rose-200 rounded tracking-wider text-left inline-block"
                                >
                                  {item.code}
                                </button>
                                {item.isSpecial && (
                                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 rounded px-1.5 py-0.5">
                                    Special
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 max-w-[200px]">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          {/* Discount Value */}
                          <TableCell>
                            <span className="text-xs font-semibold text-slate-900">
                              {discountText}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Full Order
                            </span>
                          </TableCell>

                          {/* Min Order */}
                          <TableCell className="text-xs text-slate-700">
                            {item.minOrderValue > 0 ? (
                              `₹${Number(item.minOrderValue).toLocaleString("en-IN")}`
                            ) : (
                              <span className="text-slate-400">No Min</span>
                            )}
                          </TableCell>

                          {/* Max Discount Cap */}
                          <TableCell className="text-xs text-slate-700">
                            {item.type === "percentage" && item.maxDiscountAmount > 0 ? (
                              `₹${Number(item.maxDiscountAmount).toLocaleString("en-IN")}`
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>

                          {/* Usage */}
                          <TableCell className="text-center text-xs text-slate-700">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                              {item.usedCount || 0}
                              {item.usageLimit > 0 && ` / ${item.usageLimit}`}
                            </span>
                          </TableCell>

                          {/* Validity */}
                          <TableCell className="text-xs">
                            {formatValidity(item)}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="text-center">
                            {isExpired ? (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] font-semibold">
                                Expired
                              </Badge>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <Switch
                                  checked={item.status === "active"}
                                  onCheckedChange={() => handleToggleStatus(item)}
                                />
                                <span
                                  className={`text-[11px] font-medium ${
                                    item.status === "active"
                                      ? "text-emerald-600"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {item.status === "active" ? "Active" : "Inactive"}
                                </span>
                              </div>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenView(item)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                title="View Coupon Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(item)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-[#B4395A] hover:bg-rose-50"
                                title="Edit Coupon"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                title="Delete Coupon"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {!loading && discounts.length > 0 && (
              <DataTablePagination
                page={page}
                totalPages={totalPages}
                totalItems={totalDiscounts}
                limit={limit}
                itemName="discounts"
                onPageChange={setPage}
              />
            )}
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <DiscountAddDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchDiscounts}
      />

      <DiscountEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        discount={selectedDiscount}
        onSuccess={fetchDiscounts}
      />

      <DiscountViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        discount={selectedDiscount}
        onEdit={() => {
          setViewDialogOpen(false);
          setEditDialogOpen(true);
        }}
      />
    </div>
  );
}
