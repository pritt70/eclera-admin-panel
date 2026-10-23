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
import { OrderAddDialog } from "@/app/order/@components/add";
import { OrderEditDialog } from "@/app/order/@components/edit";
import { OrderViewDialog } from "@/app/order/@components/view";
import { api } from "@/helper";
import toast from "@/lib/toast";
import {
  ShoppingBag,
  Eye,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";

export default function OrdersPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [orders, setOrders] = useState<any[]>([]);
  const [totalOrders, setTotalOrders] = useState<number>(0);

  // Filter & Pagination states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  >("all");
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
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api("order/list", {
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (res && res.status && res.data) {
        setOrders(res.data.orders || []);
        setTotalOrders(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setError(res?.message || "Failed to load orders");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while fetching orders");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle Delete with SweetAlert2 confirmation
  const handleDelete = async (item: any) => {
    if (!item._id) return;

    const confirmed = await toast.confirm({
      title: "Delete Order?",
      text: `Are you sure you want to delete order "${item.orderNumber}"? This action cannot be undone.`,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    });

    if (!confirmed) return;

    try {
      const res = await api("order/delete", { id: item._id });
      if (res && res.status) {
        toast.success("Order Deleted", res.message || "Order removed successfully.");
        fetchOrders();
      } else {
        toast.error("Delete Failed", res?.message || "Could not delete order.");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "An unexpected error occurred.");
    }
  };

  const handleOpenAdd = () => {
    setAddDialogOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setSelectedOrder(item);
    setEditDialogOpen(true);
  };

  const handleOpenView = (item: any) => {
    setSelectedOrder(item);
    setViewDialogOpen(true);
  };

  const getOrderStatusBadge = (st: string) => {
    switch (st) {
      case "delivered":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
            Delivered
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
            Shipped
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wide">
            Processing
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wide">
            Confirmed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wide">
            Cancelled
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">
            Pending
          </span>
        );
    }
  };

  const getPaymentBadge = (method: string, status: string) => {
    const isPaid = status === "paid";
    const methodLabel =
      method === "prepaid"
        ? "Prepaid"
        : method === "advance"
        ? "Advance"
        : (method || "COD").toUpperCase();

    return (
      <div className="space-y-0.5">
        <span className="text-[11px] font-semibold text-slate-800 block">
          {methodLabel}
        </span>
        <span
          className={`inline-block text-[10px] font-medium px-1.5 py-0.2 rounded-[2px] border ${
            isPaid
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : status === "failed"
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          {status || "pending"}
        </span>
      </div>
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Sidebar */}
      <Sidebar
        currentPath="/order"
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          title="Orders"
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        >
          <Button
            onClick={handleOpenAdd}
            className="h-8.5 px-3.5 text-xs font-semibold bg-[#B4395A] text-white hover:bg-[#9b2f4c] shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Order</span>
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
                placeholder="Search by order #, customer, phone..."
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-[3px] self-start sm:self-auto overflow-x-auto max-w-full">
              {(
                [
                  "all",
                  "pending",
                  "confirmed",
                  "processing",
                  "shipped",
                  "delivered",
                  "cancelled",
                ] as const
              ).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-[2px] text-xs font-medium capitalize transition-colors cursor-pointer whitespace-nowrap ${
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
                <p className="text-xs text-slate-500 font-medium">Loading orders...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center space-y-3">
                <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-[2px] max-w-md mx-auto border border-red-200">
                  {error}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchOrders}
                  className="h-8 text-xs border-slate-300"
                >
                  Retry Loading
                </Button>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">No orders found</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {search || statusFilter !== "all"
                      ? "No orders match your active search filters."
                      : "Customer orders will appear here once placed on the storefront."}
                  </p>
                </div>
                {!search && statusFilter === "all" && (
                  <Button
                    onClick={handleOpenAdd}
                    size="sm"
                    className="h-8 text-xs bg-[#B4395A] hover:bg-[#9b2f4c] text-white"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Create Order
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
                        Order #
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Customer
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Date
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Items
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Total
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Payment
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
                    {orders.map((item, idx) => {
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

                          {/* Order Number */}
                          <TableCell className="py-3">
                            <button
                              type="button"
                              onClick={() => handleOpenView(item)}
                              className="text-xs font-bold text-[#B4395A] hover:underline cursor-pointer font-mono"
                            >
                              {item.orderNumber}
                            </button>
                            {item.couponCode && (
                              <div className="text-[10px] text-emerald-600 font-medium">
                                Coupon: {item.couponCode}
                              </div>
                            )}
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

                          {/* Date */}
                          <TableCell className="py-3 text-xs text-slate-600 whitespace-nowrap">
                            {formatDate(item.createdAt)}
                          </TableCell>

                          {/* Items Preview */}
                          <TableCell className="py-3">
                            <div className="text-xs font-medium text-slate-800 line-clamp-1 max-w-[180px]">
                              {firstItem?.productName || "No items"}
                            </div>
                            {itemCount > 1 && (
                              <div className="text-[10px] text-slate-400 font-medium">
                                + {itemCount - 1} more item{itemCount - 1 > 1 ? "s" : ""}
                              </div>
                            )}
                          </TableCell>

                          {/* Total */}
                          <TableCell className="py-3 whitespace-nowrap">
                            <div className="text-xs font-bold text-slate-900">
                              ₹{Number(item.totalAmount || 0).toLocaleString("en-IN")}
                            </div>
                            {Number(item.discountAmount || 0) > 0 && (
                              <div className="text-[10px] text-emerald-600">
                                -₹{item.discountAmount} off
                              </div>
                            )}
                          </TableCell>

                          {/* Payment */}
                          <TableCell className="py-3">
                            {getPaymentBadge(item.paymentMethod, item.paymentStatus)}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-3 text-center">
                            {getOrderStatusBadge(item.orderStatus)}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenView(item)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-[2px]"
                                title="View Order Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(item)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-[2px]"
                                title="Edit Order Status & Tracking"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-[2px]"
                                title="Delete Order"
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
            {!loading && !error && orders.length > 0 && (
              <div className="p-3 border-t border-slate-100 bg-white">
                <DataTablePagination
                  page={page}
                  limit={limit}
                  total={totalOrders}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <OrderAddDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onOrderAdded={fetchOrders}
      />

      <OrderEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        order={selectedOrder}
        onOrderUpdated={fetchOrders}
      />

      <OrderViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        order={selectedOrder}
        onOrderUpdated={fetchOrders}
      />
    </div>
  );
}
