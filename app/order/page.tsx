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
  Archive,
  RotateCcw,
} from "lucide-react";

type OrderTab =
  | "all"
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "returned"
  | "archived";

interface StatusCounts {
  all?: number;
  pending?: number;
  confirmed?: number;
  shipped?: number;
  delivered?: number;
  returned?: number;
  archived?: number;
}

const STATUS_TABS: { key: OrderTab; label: string; badgeColor: string }[] = [
  { key: "all", label: "All Orders", badgeColor: "bg-slate-100 text-slate-700" },
  { key: "pending", label: "Pending", badgeColor: "bg-amber-100 text-amber-800" },
  { key: "confirmed", label: "Confirmed", badgeColor: "bg-sky-100 text-sky-800" },
  { key: "shipped", label: "Shipped", badgeColor: "bg-purple-100 text-purple-800" },
  { key: "delivered", label: "Delivered", badgeColor: "bg-emerald-100 text-emerald-800" },
  { key: "returned", label: "Returned", badgeColor: "bg-rose-100 text-rose-800" },
  { key: "archived", label: "Archived", badgeColor: "bg-slate-200 text-slate-700" },
];

export default function OrdersPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [orders, setOrders] = useState<any[]>([]);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({});

  // Filter & Pagination states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderTab>("all");
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
        setStatusCounts(res.data.statusCounts || {});
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

  // Archive order
  const handleArchive = async (item: any) => {
    const confirmed = await toast.confirm({
      title: "Archive Order?",
      text: `Move Order #${item.orderNumber} to archives? It can be restored or deleted from the Archived tab.`,
      confirmButtonText: "Yes, Archive",
      cancelButtonText: "Cancel",
    });

    if (!confirmed) return;

    try {
      const res = await api("order/archive", { id: item._id });
      if (res && res.status) {
        toast.success("Order Archived", res.message || "Order moved to archive.");
        fetchOrders();
      } else {
        toast.error("Archive Failed", res?.message || "Could not archive order.");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "An unexpected error occurred.");
    }
  };

  // Unarchive / Restore order
  const handleUnarchive = async (item: any) => {
    try {
      const res = await api("order/unarchive", { id: item._id });
      if (res && res.status) {
        toast.success("Order Restored", res.message || "Order restored to active orders.");
        fetchOrders();
      } else {
        toast.error("Restore Failed", res?.message || "Could not restore order.");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "An unexpected error occurred.");
    }
  };

  // Permanent Delete (STRICT: Allowed only for archived orders)
  const handleDelete = async (item: any) => {
    if (!item.isArchived) {
      toast.error(
        "Cannot Delete Active Order",
        "Orders must be moved to Archive first before they can be permanently deleted."
      );
      return;
    }

    const confirmed = await toast.confirm({
      title: "Permanently Delete Order?",
      text: `Are you sure you want to permanently delete order #${item.orderNumber}? This action cannot be undone.`,
      confirmButtonText: "Yes, Delete Permanently",
      cancelButtonText: "Cancel",
    });

    if (!confirmed) return;

    try {
      const res = await api("order/delete", { id: item._id });
      if (res && res.status) {
        toast.success("Order Deleted", res.message || "Order removed permanently.");
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
          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
            Delivered
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wide">
            Shipped
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wide">
            Confirmed
          </span>
        );
      case "returned":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wide">
            Returned
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">
            Pending
          </span>
        );
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const m = (method || "").toLowerCase();
    let label = "COD";
    if (m === "prepaid") label = "Prepaid";
    else if (m === "advance") label = "Advance";
    else if (m === "upi_qr") label = "UPI QR";
    else if (m === "upi") label = "UPI";
    else if (m === "card") label = "Card";
    else if (m) label = method.toUpperCase();

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
        {label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const st = (status || "pending").toLowerCase();
    switch (st) {
      case "paid":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
            Paid
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wide">
            Failed
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wide">
            Refunded
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">
            Pending
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
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
          <div className="rounded-[2px] border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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
                  <p className="text-sm font-semibold text-slate-800">
                    {statusFilter === "archived" ? "No archived orders" : "No orders found"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {search || statusFilter !== "all"
                      ? "No orders match your active filter."
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
                        Order # & Date
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Customer
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Items
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Total
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">
                        Coupon
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Payment Method
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">
                        Payment Status
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">
                        Order Status
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
                      const isArchived = Boolean(item.isArchived);

                      return (
                        <TableRow
                          key={item._id}
                          className="hover:bg-slate-50/80 transition-colors border-b border-slate-100"
                        >
                          {/* Row Number */}
                          <TableCell className="text-xs text-slate-400 font-mono text-center py-3">
                            {rowNumber}
                          </TableCell>

                          {/* Order Number & Created At Date/Time */}
                          <TableCell className="py-3">
                            <button
                              type="button"
                              onClick={() => handleOpenView(item)}
                              className="text-xs font-bold text-[#B4395A] hover:underline cursor-pointer font-mono block"
                            >
                              {item.orderNumber}
                            </button>
                            <div className="text-[11px] text-slate-500 whitespace-nowrap mt-0.5 font-medium">
                              {formatDate(item.createdAt)}
                            </div>
                            {isArchived && (
                              <span className="inline-block text-[9px] font-semibold bg-slate-100 text-slate-600 px-1 py-0.2 rounded-[2px] mt-0.5">
                                Archived
                              </span>
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

                          {/* Coupon */}
                          <TableCell className="py-3 text-center whitespace-nowrap">
                            {item.couponCode ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                                {item.couponCode}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </TableCell>

                          {/* Payment Method */}
                          <TableCell className="py-3 whitespace-nowrap">
                            {getPaymentMethodBadge(item.paymentMethod)}
                          </TableCell>

                          {/* Payment Status */}
                          <TableCell className="py-3 text-center whitespace-nowrap">
                            {getPaymentStatusBadge(item.paymentStatus)}
                          </TableCell>

                          {/* Order Status */}
                          <TableCell className="py-3 text-center whitespace-nowrap">
                            {getOrderStatusBadge(item.orderStatus)}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* View Order */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenView(item)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-[2px]"
                                title="View Order Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>

                              {/* Non-archived actions */}
                              {!isArchived ? (
                                <>
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
                                    onClick={() => handleArchive(item)}
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-[2px]"
                                    title="Archive Order (Required before delete)"
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  {/* Archived actions: Restore or Delete */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUnarchive(item)}
                                    className="h-7 w-7 p-0 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-[2px]"
                                    title="Restore Order"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(item)}
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-[2px]"
                                    title="Permanently Delete Order"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </>
                              )}
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
