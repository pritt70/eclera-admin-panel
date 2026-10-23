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
import { SearchInput } from "@/components/ui/search-input";
import { DataTablePagination } from "@/components/ui/pagination";
import { AbandonedCartViewDialog } from "@/app/abandoned-cart/@components/view";
import { api } from "@/helper";
import toast from "@/lib/toast";
import {
  ShoppingCart,
  Eye,
  Mail,
  Trash2,
} from "lucide-react";

export default function AbandonedCartPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [carts, setCarts] = useState<any[]>([]);
  const [totalCarts, setTotalCarts] = useState<number>(0);

  // Filter & Pagination states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "abandoned" | "email_sent" | "recovered" | "expired"
  >("all");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCart, setSelectedCart] = useState<any>(null);

  // Fetch abandoned carts from API
  const fetchCarts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api("abandoned-cart/list", {
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (res && res.status && res.data) {
        setCarts(res.data.carts || []);
        setTotalCarts(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setError(res?.message || "Failed to load abandoned carts");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while fetching carts");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    fetchCarts();
  }, [fetchCarts]);

  // Handle Send Recovery Email with confirm dialog
  const handleSendRecovery = async (item: any) => {
    if (!item._id) return;

    const confirmed = await toast.confirm({
      title: "Send Recovery Email?",
      text: `Dispatch cart reminder email to customer "${item.customer?.email}"?`,
      confirmButtonText: "Yes, Send",
      cancelButtonText: "Cancel",
    });

    if (!confirmed) return;

    try {
      const res = await api("abandoned-cart/send-recovery", { id: item._id });
      if (res && res.status) {
        toast.success("Recovery Email Sent", `Reminder dispatched to ${item.customer?.email}`);
        fetchCarts();
      } else {
        toast.error("Send Failed", res?.message || "Failed to send email.");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "An unexpected error occurred.");
    }
  };

  // Handle Delete with SweetAlert2 confirmation
  const handleDelete = async (item: any) => {
    if (!item._id) return;

    const confirmed = await toast.confirm({
      title: "Delete Abandoned Cart?",
      text: `Are you sure you want to delete cart record "${item.cartNumber}"?`,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    });

    if (!confirmed) return;

    try {
      const res = await api("abandoned-cart/delete", { id: item._id });
      if (res && res.status) {
        toast.success("Cart Deleted", res.message || "Abandoned cart removed.");
        fetchCarts();
      } else {
        toast.error("Delete Failed", res?.message || "Could not delete cart record.");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "An unexpected error occurred.");
    }
  };

  const handleOpenView = (item: any) => {
    setSelectedCart(item);
    setViewDialogOpen(true);
  };

  const getRecoveryBadge = (st: string) => {
    switch (st) {
      case "recovered":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
            Recovered
          </span>
        );
      case "email_sent":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
            Email Sent
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
            Expired
          </span>
        );
      case "abandoned":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">
            Abandoned
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Sidebar */}
      <Sidebar
        currentPath="/abandoned-cart"
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          title="Abandoned Carts"
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

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
                placeholder="Search by cart #, customer, email..."
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-[3px] self-start sm:self-auto">
              {(
                [
                  "all",
                  "abandoned",
                  "email_sent",
                  "recovered",
                  "expired",
                ] as const
              ).map((tab) => (
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
                  {tab.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-[2px] border border-slate-200 bg-white shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-2.5">
                <div className="h-6 w-6 animate-spin border-2 border-slate-200 border-t-[#B4395A] rounded-full" />
                <p className="text-xs text-slate-500 font-medium">Loading abandoned carts...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center space-y-3">
                <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-[2px] max-w-md mx-auto border border-red-200">
                  {error}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCarts}
                  className="h-8 text-xs border-slate-300"
                >
                  Retry Loading
                </Button>
              </div>
            ) : carts.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">No abandoned carts</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {search || statusFilter !== "all"
                      ? "No abandoned carts match your search criteria."
                      : "Unfinished customer checkout sessions will be tracked and recovered here."}
                  </p>
                </div>
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
                        Cart ID
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Customer
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Items
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Cart Value
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Last Active
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">
                        Recovery Status
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right w-28">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {carts.map((item, idx) => {
                      const rowNumber = (page - 1) * limit + idx + 1;
                      const itemCount = item.items?.length || 0;
                      const firstItem = item.items?.[0];

                      return (
                        <TableRow
                          key={item._id}
                          className="hover:bg-slate-50/80 transition-colors border-b border-slate-100"
                        >
                          {/* Row Number */}
                          <TableCell className="text-xs text-slate-400 font-mono text-center py-3">
                            {rowNumber}
                          </TableCell>

                          {/* Cart ID */}
                          <TableCell className="py-3">
                            <button
                              type="button"
                              onClick={() => handleOpenView(item)}
                              className="text-xs font-bold text-[#B4395A] hover:underline cursor-pointer font-mono"
                            >
                              {item.cartNumber}
                            </button>
                            <div className="text-[10px] text-slate-400 capitalize">
                              At {item.checkoutStep?.replace("_", " ") || "cart"}
                            </div>
                          </TableCell>

                          {/* Customer */}
                          <TableCell className="py-3">
                            <div className="text-xs font-semibold text-slate-900">
                              {item.customer?.name || "Anonymous"}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {item.customer?.email}
                            </div>
                            {item.customer?.phone && (
                              <div className="text-[10px] text-slate-400">
                                {item.customer?.phone}
                              </div>
                            )}
                          </TableCell>

                          {/* Items Preview */}
                          <TableCell className="py-3">
                            <div className="text-xs font-medium text-slate-800 line-clamp-1 max-w-[200px]">
                              {firstItem?.productName || "Empty Cart"}
                            </div>
                            {itemCount > 1 && (
                              <div className="text-[10px] text-slate-400 font-medium">
                                + {itemCount - 1} other item{itemCount - 1 > 1 ? "s" : ""}
                              </div>
                            )}
                          </TableCell>

                          {/* Cart Total */}
                          <TableCell className="py-3 whitespace-nowrap">
                            <div className="text-xs font-bold text-slate-900">
                              ₹{Number(item.cartTotal || 0).toLocaleString("en-IN")}
                            </div>
                          </TableCell>

                          {/* Last Active */}
                          <TableCell className="py-3 text-xs text-slate-600 whitespace-nowrap">
                            {formatDate(item.lastActivityAt || item.createdAt)}
                          </TableCell>

                          {/* Recovery Status */}
                          <TableCell className="py-3 text-center">
                            {getRecoveryBadge(item.recoveryStatus)}
                            {item.emailSentCount > 0 && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {item.emailSentCount} email{item.emailSentCount > 1 ? "s" : ""} sent
                              </div>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {item.recoveryStatus !== "recovered" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSendRecovery(item)}
                                  className="h-7 w-7 p-0 text-slate-500 hover:text-[#B4395A] hover:bg-rose-50 rounded-[2px]"
                                  title="Send Recovery Email"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenView(item)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-[2px]"
                                title="View Cart Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-[2px]"
                                title="Delete Cart Record"
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
            {!loading && !error && carts.length > 0 && (
              <div className="p-3 border-t border-slate-100 bg-white">
                <DataTablePagination
                  page={page}
                  limit={limit}
                  total={totalCarts}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* View Dialog */}
      <AbandonedCartViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        cart={selectedCart}
        onCartUpdated={fetchCarts}
      />
    </div>
  );
}
