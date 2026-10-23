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
import { CustomerAddDialog } from "@/app/customer/@components/add";
import { CustomerEditDialog } from "@/app/customer/@components/edit";
import { CustomerViewDialog } from "@/app/customer/@components/view";
import { api } from "@/helper";
import toast from "@/lib/toast";
import {
  Users,
  Eye,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";

export default function CustomersPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);

  // Filter & Pagination states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "blocked">("all");
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
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Fetch customers from API
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api("customer/list", {
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (res && res.status && res.data) {
        setCustomers(res.data.customers || []);
        setTotalCustomers(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setError(res?.message || "Failed to load customers");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while fetching customers");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Handle instant status switch toggle
  const handleToggleStatus = async (item: any) => {
    if (!item._id) return;
    const previousStatus = item.status;
    const nextStatus = previousStatus === "active" ? "inactive" : "active";

    // Optimistic UI update
    setCustomers((prev) =>
      prev.map((c) => (c._id === item._id ? { ...c, status: nextStatus } : c))
    );

    try {
      const res = await api("customer/change-status", {
        id: item._id,
        status: nextStatus,
      });

      if (res && res.status) {
        toast.success("Status Updated", `Customer is now ${nextStatus}`);
      } else {
        // Rollback
        setCustomers((prev) =>
          prev.map((c) => (c._id === item._id ? { ...c, status: previousStatus } : c))
        );
        toast.error("Status Update Failed", res?.message || "Could not toggle status.");
      }
    } catch (err: any) {
      // Rollback
      setCustomers((prev) =>
        prev.map((c) => (c._id === item._id ? { ...c, status: previousStatus } : c))
      );
      toast.error("Error", err?.message || "Failed to update customer status");
    }
  };

  // Handle Delete with confirm dialog
  const handleDelete = async (item: any) => {
    if (!item._id) return;

    const confirmed = await toast.confirm({
      title: "Delete Customer?",
      text: `Are you sure you want to delete ${item.firstName} ${item.lastName || ""}? This action cannot be undone.`,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    });

    if (!confirmed) return;

    try {
      const res = await api("customer/delete", { id: item._id });
      if (res && res.status) {
        toast.success("Deleted", res.message || "Customer was deleted successfully.");
        fetchCustomers();
      } else {
        toast.error("Delete Blocked", res?.message || "Cannot delete this customer.");
      }
    } catch (err: any) {
      toast.error("Delete Error", err?.message || "An unexpected error occurred.");
    }
  };

  const handleOpenAdd = () => {
    setAddDialogOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setSelectedCustomer(item);
    setEditDialogOpen(true);
  };

  const handleOpenView = (item: any) => {
    setSelectedCustomer(item);
    setViewDialogOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Sidebar */}
      <Sidebar
        currentPath="/customer"
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          title="Customers"
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        >
          <Button
            onClick={handleOpenAdd}
            className="h-8.5 px-3.5 text-xs font-semibold bg-[#B4395A] text-white hover:bg-[#9b2f4c] shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
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
                placeholder="Search customers by name, email, or phone..."
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-[3px] self-start sm:self-auto">
              {(["all", "active", "inactive", "blocked"] as const).map((tab) => (
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
                <p className="text-xs text-slate-500 font-medium">Loading customers...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center space-y-3">
                <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-[2px] max-w-md mx-auto border border-red-200">
                  {error}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCustomers}
                  className="h-8 text-xs border-slate-300"
                >
                  Retry Loading
                </Button>
              </div>
            ) : customers.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">No customers found</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {search || statusFilter !== "all"
                      ? "No records match your active search filters."
                      : "Start by adding your first registered customer."}
                  </p>
                </div>
                {!search && statusFilter === "all" && (
                  <Button
                    onClick={handleOpenAdd}
                    size="sm"
                    className="h-8 text-xs bg-[#B4395A] hover:bg-[#9b2f4c] text-white"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Customer
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
                        Customer
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Contact
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">
                        Orders
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">
                        Total Spent
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
                    {customers.map((item, idx) => {
                      const fullName = `${item.firstName || ""} ${item.lastName || ""}`.trim() || "Customer";
                      const initials = `${(item.firstName || "")[0] || ""}${(item.lastName || "")[0] || ""}`.toUpperCase() || "C";
                      const isBlocked = item.status === "blocked";

                      return (
                        <TableRow
                          key={item._id}
                          className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors"
                        >
                          <TableCell className="text-xs text-slate-400 font-medium text-center">
                            {(page - 1) * limit + idx + 1}
                          </TableCell>

                          {/* Customer Profile Column */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 text-[#B4395A] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs border border-rose-300/40">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenView(item)}
                                  className="text-xs font-semibold text-slate-900 hover:text-[#B4395A] text-left transition-colors truncate block"
                                >
                                  {fullName}
                                </button>
                                <div className="mt-0.5">
                                  <span className="text-[11px] text-slate-500 truncate">
                                    {item.email}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Contact */}
                          <TableCell>
                            <div className="text-xs text-slate-600">
                              {item.phone || <span className="text-slate-400 italic text-[11px]">No phone</span>}
                            </div>
                          </TableCell>

                          {/* Orders */}
                          <TableCell className="text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                              {item.ordersCount || 0}
                            </span>
                          </TableCell>

                          {/* Total Spent */}
                          <TableCell className="text-right text-xs font-semibold text-slate-800">
                            ₹{Number(item.totalSpent || 0).toLocaleString("en-IN")}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="text-center">
                            {isBlocked ? (
                              <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[11px] font-semibold">
                                Blocked
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
                                title="View Customer Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(item)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-[#B4395A] hover:bg-rose-50"
                                title="Edit Customer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                title="Delete Customer"
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
            {!loading && customers.length > 0 && (
              <DataTablePagination
                page={page}
                totalPages={totalPages}
                totalItems={totalCustomers}
                limit={limit}
                itemName="customers"
                onPageChange={setPage}
              />
            )}
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <CustomerAddDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchCustomers}
      />

      <CustomerEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        customer={selectedCustomer}
        onSuccess={fetchCustomers}
      />

      <CustomerViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        customer={selectedCustomer}
        onEdit={() => {
          setViewDialogOpen(false);
          setEditDialogOpen(true);
        }}
      />
    </div>
  );
}
