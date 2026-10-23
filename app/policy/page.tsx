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
import { SearchInput } from "@/components/ui/search-input";
import { DataTablePagination } from "@/components/ui/pagination";
import { PolicyAddDialog } from "@/app/policy/@components/add";
import { PolicyEditDialog } from "@/app/policy/@components/edit";
import { PolicyViewDialog } from "@/app/policy/@components/view";
import { api } from "@/helper";
import toast from "@/lib/toast";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  FileText,
} from "lucide-react";

export default function PoliciesPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [policies, setPolicies] = useState<any[]>([]);
  const [totalPolicies, setTotalPolicies] = useState<number>(0);

  // Filter & Pagination states
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
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
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);

  // Fetch policies from API
  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api("policy/list", {
        page,
        limit,
        search: search.trim() || undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (res && res.status && res.data) {
        setPolicies(res.data.policies || []);
        setTotalPolicies(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setError(res?.message || "Failed to load policies");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while fetching policies");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, typeFilter, statusFilter]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Handle instant status switch toggle
  const handleToggleStatus = async (item: any) => {
    if (!item._id) return;
    const previousStatus = item.status;
    const nextStatus = previousStatus === "active" ? "inactive" : "active";

    // Optimistic UI update
    setPolicies((prev) =>
      prev.map((p) => (p._id === item._id ? { ...p, status: nextStatus } : p))
    );

    try {
      const res = await api("policy/change-status", {
        id: item._id,
        status: nextStatus,
      });

      if (res && res.status) {
        toast.success("Status Updated", `Policy is now ${nextStatus}`);
      } else {
        // Rollback
        setPolicies((prev) =>
          prev.map((p) => (p._id === item._id ? { ...p, status: previousStatus } : p))
        );
        toast.error("Status Update Failed", res?.message || "Could not toggle status.");
      }
    } catch (err: any) {
      // Rollback
      setPolicies((prev) =>
        prev.map((p) => (p._id === item._id ? { ...p, status: previousStatus } : p))
      );
      toast.error("Error", err?.message || "Failed to update policy status");
    }
  };

  // Handle Delete with confirm dialog
  const handleDelete = async (item: any) => {
    if (!item._id) return;

    const confirmed = await toast.confirm({
      title: "Delete Policy?",
      text: `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    });

    if (!confirmed) return;

    try {
      const res = await api("policy/delete", { id: item._id });
      if (res && res.status) {
        toast.success("Deleted", res.message || "Policy was deleted successfully.");
        fetchPolicies();
      } else {
        toast.error("Delete Blocked", res?.message || "Cannot delete this policy.");
      }
    } catch (err: any) {
      toast.error("Delete Error", err?.message || "An unexpected error occurred.");
    }
  };


  const getTypeLabel = (type: string) => {
    switch (type) {
      case "shipping":
        return "Shipping Policy";
      case "return":
        return "Return & Refund";
      case "terms":
        return "Terms & Conditions";
      case "privacy":
        return "Privacy Policy";
      default:
        return "Custom Policy";
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Sidebar */}
      <Sidebar
        currentPath="/policy"
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          title="Store Policies"
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        >
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="h-8.5 px-3.5 text-xs font-semibold bg-[#B4395A] text-white hover:bg-[#9b2f4c] shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Policy</span>
          </Button>
        </Header>

        <main className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Filter Bar matching other modules */}
          <div className="rounded-[2px] border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex-1 max-w-sm">
              <SearchInput
                value={search}
                onChange={(val: any) => {
                  const text = typeof val === "string" ? val : val?.target?.value ?? "";
                  setSearch(text);
                  setPage(1);
                }}
                placeholder="Search policies by title or slug..."
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
              {/* Type Category Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-[3px]">
                {[
                  { key: "all", label: "All" },
                  { key: "shipping", label: "Shipping" },
                  { key: "return", label: "Return & Refund" },
                  { key: "terms", label: "Terms & Conditions" },
                  { key: "privacy", label: "Privacy" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setTypeFilter(tab.key);
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-[2px] text-xs font-medium transition-colors cursor-pointer ${
                      typeFilter === tab.key
                        ? "bg-white text-slate-900 shadow-xs font-semibold"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-[3px]">
                {(["all", "active", "inactive"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setStatusFilter(tab);
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-[2px] text-xs font-medium capitalize transition-colors cursor-pointer ${
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
          </div>

          {/* Table Container */}
          <div className="rounded-[2px] border border-slate-200 bg-white shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-2.5">
                <div className="h-6 w-6 animate-spin border-2 border-slate-200 border-t-[#B4395A] rounded-full" />
                <p className="text-xs text-slate-500 font-medium">Loading store policies...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center space-y-3">
                <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-[2px] max-w-md mx-auto border border-red-200">
                  {error}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPolicies}
                  className="h-8 text-xs border-slate-300"
                >
                  Retry Loading
                </Button>
              </div>
            ) : policies.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">No policies found</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {search || typeFilter !== "all" || statusFilter !== "all"
                      ? "Try adjusting your search query or filter selection."
                      : "Get started by adding store policies."}
                  </p>
                </div>
                {!search && typeFilter === "all" && statusFilter === "all" && (
                  <Button
                    onClick={() => setAddDialogOpen(true)}
                    className="h-8.5 px-4 text-xs font-semibold bg-[#B4395A] text-white hover:bg-[#9b2f4c]"
                  >
                    + Add Your First Policy
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14 text-center">#</TableHead>
                    <TableHead>Policy Title</TableHead>
                    <TableHead className="w-64">Policy Type</TableHead>
                    <TableHead className="w-36 text-center">Status</TableHead>
                    <TableHead className="w-28 text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {policies.map((item, idx) => (
                    <TableRow key={item._id || idx} className="hover:bg-slate-50/70 transition-colors">
                      {/* Index */}
                      <TableCell className="text-center font-mono text-xs text-slate-400">
                        {(page - 1) * limit + idx + 1}
                      </TableCell>

                      {/* Policy Title */}
                      <TableCell>
                        <div
                          onClick={() => {
                            setSelectedPolicy(item);
                            setViewDialogOpen(true);
                          }}
                          className="cursor-pointer group"
                        >
                          <span className="text-xs font-semibold text-slate-900 group-hover:text-[#B4395A] transition block">
                            {item.title}
                          </span>
                        </div>
                      </TableCell>

                      {/* Policy Type */}
                      <TableCell>
                        <span className="inline-block px-2.5 py-1 rounded-[2px] bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                          {getTypeLabel(item.type)}
                        </span>
                      </TableCell>

                      {/* Status Switch */}
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <Switch
                            checked={item.status === "active"}
                            onCheckedChange={() => handleToggleStatus(item)}
                            aria-label={`Toggle status for ${item.title}`}
                          />
                          <span
                            className={`text-[11px] font-medium ${
                              item.status === "active" ? "text-emerald-700 font-semibold" : "text-slate-400"
                            }`}
                          >
                            {item.status === "active" ? "Live" : "Draft"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-4">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedPolicy(item);
                              setViewDialogOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-[#B4395A] hover:bg-slate-100 rounded-[2px] transition-colors cursor-pointer"
                            title="View Policy"
                            aria-label="View Policy"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedPolicy(item);
                              setEditDialogOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-[#B4395A] hover:bg-slate-100 rounded-[2px] transition-colors cursor-pointer"
                            title="Edit Policy"
                            aria-label="Edit Policy"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-[2px] transition-colors cursor-pointer"
                            title="Delete Policy"
                            aria-label="Delete Policy"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination Controls */}
            {policies.length > 0 && (
              <div className="p-3 border-t border-slate-200">
                <DataTablePagination
                  page={page}
                  totalPages={totalPages}
                  totalItems={totalPolicies}
                  limit={limit}
                  onPageChange={(p: number) => setPage(p)}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Policy Dialog */}
      <PolicyAddDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchPolicies}
      />

      {/* Edit Policy Dialog */}
      <PolicyEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        policy={selectedPolicy}
        onSuccess={fetchPolicies}
      />

      {/* View / Preview Policy Dialog */}
      <PolicyViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        policy={selectedPolicy}
        onEdit={() => setEditDialogOpen(true)}
      />
    </div>
  );
}
