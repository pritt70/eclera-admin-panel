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
import { CollectionAddDialog } from "@/app/collections/@components/add";
import { CollectionEditDialog } from "@/app/collections/@components/edit";
import { CollectionViewDialog } from "@/app/collections/@components/view";
import { api } from "@/helper";
import toast from "@/lib/toast";

export default function CollectionsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [collections, setCollections] = useState<any[]>([]);
  const [totalCollections, setTotalCollections] = useState<number>(0);

  // Filter & Pagination states
  const [search, setSearch] = useState("");
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
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [viewingCollection, setViewingCollection] = useState<any>(null);

  // Fetch collections from API
  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api("collection/list", {
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (res && res.status && res.data) {
        setCollections(res.data.collections || []);
        setTotalCollections(res.data.pagination?.total ?? res.data.total ?? 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setError(res?.message || "Failed to load collections");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while fetching collections");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Handle instant status switch toggle
  const handleToggleStatus = async (item: any) => {
    if (!item._id) return;
    const previousStatus = item.status;
    const nextStatus = previousStatus === "active" ? "inactive" : "active";

    // Optimistic UI update
    setCollections((prev) =>
      prev.map((c) => (c._id === item._id ? { ...c, status: nextStatus } : c))
    );

    try {
      const res = await api("collection/change-status", {
        id: item._id,
        status: nextStatus,
      });

      if (res && res.status) {
        toast.success(`Status updated`, `Collection is now ${nextStatus}`);
      } else {
        // Rollback
        setCollections((prev) =>
          prev.map((c) => (c._id === item._id ? { ...c, status: previousStatus } : c))
        );
        toast.error("Status Update Failed", res?.message || "Could not toggle status.");
      }
    } catch (err: any) {
      // Rollback
      setCollections((prev) =>
        prev.map((c) => (c._id === item._id ? { ...c, status: previousStatus } : c))
      );
      toast.error("Error", err?.message || "Failed to update collection status");
    }
  };

  // Handle Delete with SweetAlert2 confirm dialog
  const handleDelete = async (item: any) => {
    if (!item._id) return;

    const confirmed = await toast.confirm({
      title: "Are you sure to delete?",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    });

    if (!confirmed) return;

    try {
      const res = await api("collection/delete", { id: item._id });
      if (res && res.status) {
        toast.success("Deleted", res.message || "Collection was deleted successfully.");
        fetchCollections();
      } else {
        toast.error("Delete Blocked", res?.message || "Cannot delete this collection.");
      }
    } catch (err: any) {
      toast.error("Delete Error", err?.message || "An unexpected error occurred.");
    }
  };

  const handleOpenAdd = () => {
    setAddDialogOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setSelectedCollection(item);
    setEditDialogOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Sidebar with collection navigation */}
      <Sidebar
        currentPath="/collections"
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Collections"
          subtitle="Manage product collections and their assigned categories and specifications"
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        >
          <Button
            id="btn-add-collection"
            onClick={handleOpenAdd}
            className="h-9 px-4 text-xs font-semibold bg-[#B4395A] hover:bg-[#9b2f4c] text-white rounded-[2px] transition-colors shadow-2xs cursor-pointer"
          >
            + Add Collection
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
                placeholder="Search collections by name or slug..."
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
                  className={`px-3 py-1 text-xs capitalize rounded-[2px] transition-all cursor-pointer ${
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
                <p className="text-xs text-slate-500 font-medium">Loading collections...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center space-y-3">
                <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-[2px] max-w-md mx-auto border border-red-200">
                  {error}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCollections}
                  className="h-8 text-xs border-slate-300"
                >
                  Retry Loading
                </Button>
              </div>
            ) : collections.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <div className="text-sm font-bold text-slate-800">No collections found</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {search || statusFilter !== "all"
                    ? "Try adjusting your search query or status filter."
                    : "Get started by adding your first product collection."}
                </p>
                {!search && statusFilter === "all" && (
                  <Button
                    id="btn-add-first-collection"
                    onClick={handleOpenAdd}
                    className="h-8.5 px-4 text-xs font-semibold bg-[#B4395A] text-white hover:bg-[#9b2f4c]"
                  >
                    + Add Your First Collection
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Collection Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections.map((item) => {
                    const categoryName = item.category?.name || item.categories?.[0]?.name || "—";

                    return (
                      <TableRow key={item._id}>
                        {/* Image Thumbnail */}
                        <TableCell>
                          <div
                            onClick={() => setViewingCollection(item)}
                            className="h-9 w-9 rounded-[2px] border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:border-[#B4395A] transition"
                            title="Click to view details"
                          >
                            {item.image?.url ? (
                              <img
                                src={item.image.url}
                                alt={item.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='1.5'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                                }}
                              />
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {item.name?.charAt(0) || "C"}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Name and Slug */}
                        <TableCell>
                          <div
                            onClick={() => setViewingCollection(item)}
                            className="space-y-0.5 cursor-pointer group"
                            title="Click to view details"
                          >
                            <span className="text-xs font-semibold text-slate-900 group-hover:text-[#B4395A] transition block">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              /{item.slug}
                            </span>
                          </div>
                        </TableCell>

                        {/* Category Badge */}
                        <TableCell>
                          <span className="inline-flex items-center text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-[3px]">
                            {categoryName}
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

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => setViewingCollection(item)}
                              className="p-1.5 text-slate-500 hover:text-[#B4395A] hover:bg-slate-100 rounded-[2px] transition-colors cursor-pointer"
                              title="View Collection"
                              aria-label="View Collection"
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
                              title="Edit Collection"
                              aria-label="Edit Collection"
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
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-[2px] transition-colors cursor-pointer"
                              title="Delete Collection"
                              aria-label="Delete Collection"
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
            {!loading && collections.length > 0 && (
              <DataTablePagination
                page={page}
                totalPages={totalPages}
                totalItems={totalCollections}
                limit={limit}
                itemName="collections"
                onPageChange={(newPage: number) => setPage(newPage)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Add Collection Dialog */}
      <CollectionAddDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchCollections}
      />

      {/* Edit Collection Dialog */}
      <CollectionEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        collection={selectedCollection}
        onSuccess={fetchCollections}
      />

      {/* View Collection Dialog */}
      <CollectionViewDialog
        open={Boolean(viewingCollection)}
        onOpenChange={(open: boolean) => !open && setViewingCollection(null)}
        collection={viewingCollection}
        onCollectionUpdated={fetchCollections}
      />
    </div>
  );
}
