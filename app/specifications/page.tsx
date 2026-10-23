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
import { SpecificationAddDialog } from "@/app/specifications/@components/add";
import { SpecificationEditDialog } from "@/app/specifications/@components/edit";
import { SpecificationViewDialog } from "@/app/specifications/@components/view";
import { api } from "@/helper";
import toast from "@/lib/toast";

export default function SpecificationsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [specifications, setSpecifications] = useState<any[]>([]);
  const [totalSpecifications, setTotalSpecifications] = useState<number>(0);

  // Filter & Pagination states
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
  const [selectedSpecification, setSelectedSpecification] = useState<any>(null);
  const [viewingSpecification, setViewingSpecification] = useState<any>(null);

  // Debounce search like categories
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch specifications from API
  const fetchSpecifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api("specification/list", {
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (res && res.status && res.data) {
        setSpecifications(res.data.specifications || []);
        setTotalSpecifications(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setError(res?.message || "Failed to load specifications");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while fetching specifications");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchSpecifications();
  }, [fetchSpecifications]);

  // Handle instant status switch toggle
  const handleToggleStatus = async (item: any) => {
    if (!item._id) return;
    const previousStatus = item.status;
    const nextStatus = previousStatus === "active" ? "inactive" : "active";

    // Optimistic UI update
    setSpecifications((prev) =>
      prev.map((s) => (s._id === item._id ? { ...s, status: nextStatus } : s))
    );

    try {
      const res = await api("specification/change-status", {
        id: item._id,
        status: nextStatus,
      });

      if (res && res.status) {
        toast.success(`Status updated`, `Specification is now ${nextStatus}`);
      } else {
        // Rollback
        setSpecifications((prev) =>
          prev.map((s) => (s._id === item._id ? { ...s, status: previousStatus } : s))
        );
        toast.error("Status Update Failed", res?.message || "Could not update status.");
      }
    } catch (err: any) {
      // Rollback
      setSpecifications((prev) =>
        prev.map((s) => (s._id === item._id ? { ...s, status: previousStatus } : s))
      );
      toast.error("Error", err?.message || "Failed to update specification status");
    }
  };

  // Handle Delete with SweetAlert2 confirm dialog
  const handleDelete = async (item: any) => {
    if (!item._id) return;

    const confirmed = await toast.confirm({
      title: `Delete "${item.name}"?`,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!confirmed) return;

    try {
      const res = await api("specification/delete", { id: item._id });
      if (res && res.status) {
        toast.success("Deleted", res.message || "Specification was deleted successfully.");
        fetchSpecifications();
      } else {
        toast.error("Delete Blocked", res?.message || "Cannot delete this specification.");
      }
    } catch (err: any) {
      toast.error("Delete Error", err?.message || "An unexpected error occurred.");
    }
  };

  const handleOpenAdd = () => {
    setAddDialogOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setSelectedSpecification(item);
    setEditDialogOpen(true);
  };

  const handleOpenView = (item: any) => {
    setViewingSpecification(item);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Sidebar with live specification count badge */}
      <Sidebar
        currentPath="/specifications"
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          title="Specifications"
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        >
          <Button
            onClick={handleOpenAdd}
            className="h-8.5 px-3.5 text-xs font-semibold bg-[#B4395A] text-white hover:bg-[#9b2f4c] shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Specification</span>
          </Button>
        </Header>

        <main className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Toolbar card: search input and segmented tabs */}
          <div className="rounded-[2px] border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-sm">
              <SearchInput
                value={search}
                onChange={(val: string) => {
                  setSearch(val);
                  setPage(1);
                }}
                placeholder="Search specifications by name or slug…"
              />
            </div>

            {/* Segmented Status Tabs All / Active / Inactive on the right */}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Specification Name</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead className="text-center">Categories</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="space-y-1.5 py-1">
                          <div className="h-3.5 w-32 bg-slate-100 rounded-[2px] animate-pulse" />
                          <div className="h-2.5 w-20 bg-slate-100 rounded-[2px] animate-pulse" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 py-1">
                          <div className="h-5 w-14 bg-slate-100 rounded-[2px] animate-pulse" />
                          <div className="h-5 w-12 bg-slate-100 rounded-[2px] animate-pulse" />
                          <div className="h-5 w-16 bg-slate-100 rounded-[2px] animate-pulse" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-5 w-7 mx-auto bg-slate-100 rounded-[2px] animate-pulse" />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-5 w-9 mx-auto bg-slate-100 rounded-[2px] animate-pulse" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="h-7 w-20 ml-auto bg-slate-100 rounded-[2px] animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : error ? (
              <div className="p-12 text-center space-y-3">
                <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-[2px] max-w-md mx-auto border border-red-200">
                  {error}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchSpecifications}
                  className="h-8 text-xs border-slate-300"
                >
                  Retry Loading
                </Button>
              </div>
            ) : specifications.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <div className="text-sm font-bold text-slate-800">No specifications found</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {search || statusFilter !== "all"
                    ? "Try adjusting your search query or status filter."
                    : "Get started by adding attributes like Skin Type, Finish, Concern, etc."}
                </p>
                {!search && statusFilter === "all" && (
                  <Button
                    onClick={handleOpenAdd}
                    className="h-8.5 px-4 text-xs font-semibold bg-[#B4395A] text-white hover:bg-[#9b2f4c]"
                  >
                    + Add Your First Specification
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Specification Name</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead className="text-center">Categories</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specifications.map((item) => (
                    <TableRow key={item._id}>
                      {/* Name in medium weight and the slug below as /slug in small mono */}
                      <TableCell>
                        <div
                          onClick={() => handleOpenView(item)}
                          className="space-y-0.5 cursor-pointer group"
                          title="Click to view details"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-900 group-hover:text-[#B4395A] transition">
                              {item.name}
                            </span>
                            {(item.is_veriant || item.is_variant) && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-[2px] bg-purple-50 text-purple-700 border border-purple-200 font-medium tracking-wide">
                                Variant
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            /{item.slug}
                          </span>
                        </div>
                      </TableCell>

                      {/* Options: first 3 badges, +N badge, or "No options" */}
                      <TableCell>
                        {Array.isArray(item.options) && item.options.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.options.slice(0, 3).map((opt: any, idx: number) => (
                              <span
                                key={opt._id || opt.id || idx}
                                className="inline-flex items-center px-2 py-0.5 rounded-[2px] bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium"
                              >
                                {opt.name}
                              </span>
                            ))}
                            {item.options.length > 3 && (
                              <span
                                onClick={() => handleOpenView(item)}
                                className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] bg-slate-100 text-slate-600 font-mono text-[11px] font-semibold cursor-pointer hover:bg-slate-200 transition-colors"
                                title={`+${item.options.length - 3} more options`}
                              >
                                +{item.options.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] bg-slate-50 border border-slate-200 text-slate-400 text-[11px] italic">
                            No options
                          </span>
                        )}
                      </TableCell>

                      {/* Categories count in small mono badge */}
                      <TableCell className="text-center font-mono text-xs">
                        <span className="px-1.5 py-0.5 rounded-[2px] bg-slate-100 text-slate-700 font-semibold">
                          {item.categoriesCount ?? 0}
                        </span>
                      </TableCell>

                      {/* Status Switch */}
                      <TableCell className="text-center">
                        <Switch
                          checked={item.status === "active"}
                          onCheckedChange={() => handleToggleStatus(item)}
                          aria-label={`Toggle status for ${item.name}`}
                        />
                      </TableCell>

                      {/* Actions: View, Edit, Delete */}
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenView(item)}
                            className="p-1.5 text-slate-500 hover:text-[#B4395A] hover:bg-slate-100 rounded-[2px] transition-colors cursor-pointer"
                            title="View Specification"
                            aria-label="View Specification"
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
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-[#B4395A] hover:bg-slate-100 rounded-[2px] transition-colors cursor-pointer"
                            title="Edit Specification Details"
                            aria-label="Edit Specification"
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
                            title="Delete Specification"
                            aria-label="Delete Specification"
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
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination Controls */}
            {!loading && specifications.length > 0 && (
              <DataTablePagination
                page={page}
                totalPages={totalPages}
                totalItems={totalSpecifications}
                limit={limit}
                itemName="specifications"
                onPageChange={(newPage: number) => setPage(newPage)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Dedicated Add Specification Dialog */}
      <SpecificationAddDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={(createdSpec: any) => {
          fetchSpecifications();
          if (createdSpec) {
            setViewingSpecification(createdSpec);
          }
        }}
      />

      {/* Dedicated Edit Specification Dialog */}
      <SpecificationEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        specification={selectedSpecification}
        onSuccess={fetchSpecifications}
      />

      {/* View Specification & Options Management Dialog */}
      <SpecificationViewDialog
        open={Boolean(viewingSpecification)}
        onOpenChange={(open: boolean) => !open && setViewingSpecification(null)}
        specification={viewingSpecification}
        onSpecificationUpdated={() => {
          fetchSpecifications();
        }}
      />
    </div>
  );
}
