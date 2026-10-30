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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SearchInput } from "@/components/ui/search-input";
import { DataTablePagination } from "@/components/ui/pagination";
import { ShippingAddDialog } from "@/app/shipping/@components/add";
import { ShippingEditDialog } from "@/app/shipping/@components/edit";
import { ShippingViewDialog } from "@/app/shipping/@components/view";
import { api } from "@/helper";
import toast from "@/lib/toast";
import {
  Truck,
  Eye,
  Pencil,
  Trash2,
  Plus,
  MapPin,
} from "lucide-react";

type ShippingTab = "all" | "active" | "inactive" | "free" | "paid";

interface StatusCounts {
  all?: number;
  active?: number;
  inactive?: number;
  free?: number;
  paid?: number;
}

const STATUS_TABS: { key: ShippingTab; label: string; badgeColor: string }[] = [
  { key: "all", label: "All Rules", badgeColor: "bg-slate-100 text-slate-700" },
  { key: "active", label: "Active", badgeColor: "bg-emerald-100 text-emerald-800" },
  { key: "inactive", label: "Inactive", badgeColor: "bg-slate-200 text-slate-700" },
  { key: "free", label: "Free Shipping", badgeColor: "bg-emerald-100 text-emerald-800" },
  { key: "paid", label: "Paid Shipping", badgeColor: "bg-sky-100 text-sky-800" },
];

export default function ShippingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [rules, setRules] = useState<any[]>([]);
  const [totalRules, setTotalRules] = useState<number>(0);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({});

  // Filter & Pagination states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShippingTab>("all");
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
  const [selectedRule, setSelectedRule] = useState<any>(null);

  // Fetch shipping rules from API
  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryPayload: any = {
        page,
        limit,
        search: search.trim() || undefined,
      };

      if (statusFilter === "active" || statusFilter === "inactive") {
        queryPayload.status = statusFilter;
      } else if (statusFilter === "free" || statusFilter === "paid") {
        queryPayload.type = statusFilter;
      }

      const res = await api("shipping/list", queryPayload);

      if (res && res.status && res.data) {
        setRules(res.data.rules || []);
        setStatusCounts(res.data.statusCounts || {});
        setTotalRules(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setError(res?.message || "Failed to load shipping rules");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while fetching shipping rules");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // Handle instant status toggle
  const handleToggleStatus = async (item: any) => {
    if (!item._id) return;
    const previousStatus = item.status;
    const nextStatus = previousStatus === "active" ? "inactive" : "active";

    // Optimistic UI update
    setRules((prev) =>
      prev.map((r) => (r._id === item._id ? { ...r, status: nextStatus } : r))
    );

    try {
      const res = await api("shipping/change-status", {
        id: item._id,
        status: nextStatus,
      });

      if (res && res.status) {
        toast.success("Status Updated", `Shipping rule marked as ${nextStatus}`);
        fetchRules();
      } else {
        // Rollback
        setRules((prev) =>
          prev.map((r) => (r._id === item._id ? { ...r, status: previousStatus } : r))
        );
        toast.error("Status Update Failed", res?.message || "Could not toggle status.");
      }
    } catch (err: any) {
      // Rollback
      setRules((prev) =>
        prev.map((r) => (r._id === item._id ? { ...r, status: previousStatus } : r))
      );
      toast.error("Error", err?.message || "Failed to update status");
    }
  };

  // Handle Delete with SweetAlert2 confirmation
  const handleDelete = async (item: any) => {
    if (!item._id) return;

    const confirmed = await toast.confirm({
      title: "Delete Shipping Rule?",
      text: `Are you sure you want to delete "${item.title}"?`,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    });

    if (!confirmed) return;

    try {
      const res = await api("shipping/delete", { id: item._id });
      if (res && res.status) {
        toast.success("Rule Deleted", res.message || "Shipping rule removed successfully.");
        fetchRules();
      } else {
        toast.error("Delete Failed", res?.message || "Could not delete shipping rule.");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "An unexpected error occurred.");
    }
  };

  const handleOpenAdd = () => {
    setAddDialogOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setSelectedRule(item);
    setEditDialogOpen(true);
  };

  const handleOpenView = (item: any) => {
    setSelectedRule(item);
    setViewDialogOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Sidebar */}
      <Sidebar
        currentPath="/shipping"
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          title="Shipping Zones"
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        >
          <Button
            onClick={handleOpenAdd}
            className="h-8.5 px-3.5 text-xs font-semibold bg-[#B4395A] text-white hover:bg-[#9b2f4c] shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Shipping Zone</span>
          </Button>
        </Header>

        <main className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Filter Bar */}
          <div className="rounded-[2px] border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex-1 max-w-sm">
              <SearchInput
                value={search}
                onChange={(val: string) => {
                  setSearch(val);
                  setPage(1);
                }}
                placeholder="Search by zone title, country, state, city..."
              />
            </div>

            {/* Status Tabs with Live Count Badges */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-[3px] self-start lg:self-auto overflow-x-auto max-w-full">
              {STATUS_TABS.map((tab) => {
                const count = statusCounts[tab.key] ?? 0;
                const isActive = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setStatusFilter(tab.key);
                      setPage(1);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-white text-slate-900 shadow-xs font-semibold"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? "bg-slate-900 text-white"
                          : tab.badgeColor
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-[2px] border border-slate-200 bg-white shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-2.5">
                <div className="h-6 w-6 animate-spin border-2 border-slate-200 border-t-[#B4395A] rounded-full" />
                <p className="text-xs text-slate-500 font-medium">Loading shipping zones...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center space-y-3">
                <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-[2px] max-w-md mx-auto border border-red-200">
                  {error}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchRules}
                  className="h-8 text-xs border-slate-300"
                >
                  Retry Loading
                </Button>
              </div>
            ) : rules.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">No shipping zones found</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {search || statusFilter !== "all"
                      ? "No shipping zones match your active filters."
                      : "Create your first shipping rule to automate country, state, and city delivery rates."}
                  </p>
                </div>
                {!search && statusFilter === "all" && (
                  <Button
                    onClick={handleOpenAdd}
                    size="sm"
                    className="h-8 text-xs bg-[#B4395A] hover:bg-[#9b2f4c] text-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Shipping Zone
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
                        Zone Title
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Geographic Region
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Delivery Charges
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Estimated Delivery
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
                    {rules.map((item, idx) => {
                      const rowNumber = (page - 1) * limit + idx + 1;
                      const isFree = Number(item.rate || 0) === 0;

                      return (
                        <TableRow
                          key={item._id}
                          className="hover:bg-slate-50/80 transition-colors border-b border-slate-100"
                        >
                          {/* Row Number */}
                          <TableCell className="text-xs text-slate-400 font-mono text-center py-3">
                            {rowNumber}
                          </TableCell>

                          {/* Zone Title */}
                          <TableCell className="py-3">
                            <button
                              type="button"
                              onClick={() => handleOpenView(item)}
                              className="text-xs font-bold text-[#B4395A] hover:underline cursor-pointer block text-left"
                            >
                              {item.title}
                            </button>
                            {item.notes && (
                              <div className="text-[11px] text-slate-500 line-clamp-1 max-w-[220px]">
                                {item.notes}
                              </div>
                            )}
                          </TableCell>

                          {/* Geographic Region */}
                          <TableCell className="py-3">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{item.country || "India"}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 ml-5">
                              {item.state || "All States"}
                              {item.city && item.city !== "All Cities" ? ` • ${item.city}` : ""}
                            </div>
                          </TableCell>

                          {/* Delivery Charges */}
                          <TableCell className="py-3 whitespace-nowrap">
                            {isFree ? (
                              <div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Free Delivery (₹0)
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                  ₹{item.rate} Delivery Charge
                                </span>
                              </div>
                            )}
                            {item.minOrderValue > 0 && (
                              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                                Free on orders ≥ ₹{item.minOrderValue}
                              </div>
                            )}
                          </TableCell>

                          {/* Estimated Delivery */}
                          <TableCell className="py-3 text-xs text-slate-600 whitespace-nowrap">
                            {item.estimatedDays || "3-5 Business Days"}
                          </TableCell>

                          {/* Status Switch Toggle */}
                          <TableCell className="py-3 text-center">
                            <Switch
                              checked={item.status === "active"}
                              onCheckedChange={() => handleToggleStatus(item)}
                            />
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenView(item)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-[2px]"
                                title="View Zone Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(item)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-[2px]"
                                title="Edit Shipping Rule"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-[2px]"
                                title="Delete Shipping Rule"
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
            {!loading && !error && rules.length > 0 && (
              <div className="p-3 border-t border-slate-100 bg-white">
                <DataTablePagination
                  page={page}
                  limit={limit}
                  total={totalRules}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <ShippingAddDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchRules}
      />

      <ShippingEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        rule={selectedRule}
        onSuccess={fetchRules}
      />

      <ShippingViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        rule={selectedRule}
      />
    </div>
  );
}
