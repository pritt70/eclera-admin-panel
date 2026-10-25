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
import { SearchInput } from "@/components/ui/search-input";
import { api } from "@/helper";
import toast from "@/lib/toast";

export default function AnnouncementManagementPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search state
  const [search, setSearch] = useState("");

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form states - Message and Redirection Link
  const [formText, setFormText] = useState("");
  const [formLink, setFormLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isFetchingRef = useRef(false);

  // Fetch announcements from API
  const fetchAnnouncements = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await api("announcement/list", {
        search: search.trim() || undefined,
      });

      if (res && res.status && res.data) {
        setAnnouncements(res.data.announcements || []);
      } else {
        setError(res?.message || "Failed to load announcements");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while fetching announcements");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [search]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Open Add Dialog
  const handleOpenAdd = () => {
    setFormText("");
    setFormLink("");
    setAddModalOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (item: any) => {
    setSelectedItem(item);
    setFormText(item.text || "");
    setFormLink(item.link || "");
    setEditModalOpen(true);
  };

  // Submit Add
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) {
      toast.error("Validation Error", "Announcement message is required.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api("announcement/add", {
        text: formText.trim(),
        link: formLink.trim(),
      });

      if (res && res.status) {
        toast.success("Success", "Announcement added successfully.");
        setAddModalOpen(false);
        fetchAnnouncements();
      } else {
        toast.error("Failed", res?.message || "Failed to add announcement.");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "Failed to add announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem?._id) return;
    if (!formText.trim()) {
      toast.error("Validation Error", "Announcement message is required.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api("announcement/update", {
        id: selectedItem._id,
        text: formText.trim(),
        link: formLink.trim(),
      });

      if (res && res.status) {
        toast.success("Updated", "Announcement updated successfully.");
        setEditModalOpen(false);
        fetchAnnouncements();
      } else {
        toast.error("Update Failed", res?.message || "Failed to update announcement.");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "Failed to update announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Announcement using SweetAlert2 confirm dialog
  const handleDelete = async (item: any) => {
    if (!item._id) return;

    const confirmed = await toast.confirm({
      title: "Are you sure to delete?",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    });

    if (!confirmed) return;

    try {
      const res = await api("announcement/delete", { id: item._id });
      if (res && res.status) {
        toast.success("Deleted", "Announcement was deleted successfully.");
        fetchAnnouncements();
      } else {
        toast.error("Delete Failed", res?.message || "Cannot delete announcement.");
      }
    } catch (err: any) {
      toast.error("Delete Error", err?.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Sidebar */}
      <Sidebar
        currentPath="/announcement"
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area matching other modules */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          title="Announcements"
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        >
          <Button
            onClick={handleOpenAdd}
            className="h-8.5 px-3.5 text-xs font-semibold bg-[#B4395A] text-white hover:bg-[#9b2f4c] shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Announcement</span>
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
                }}
                placeholder="Search announcement message..."
              />
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Total Announcements: <span className="font-bold text-slate-800">{announcements.length}</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-[2px] border border-slate-200 bg-white shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-2.5">
                <div className="h-6 w-6 animate-spin border-2 border-slate-200 border-t-[#B4395A]" />
                <p className="text-xs text-slate-500 font-medium">Loading announcements...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center space-y-3">
                <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-[2px] max-w-md mx-auto border border-red-200">
                  {error}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAnnouncements}
                  className="h-8 text-xs border-slate-300"
                >
                  Retry Loading
                </Button>
              </div>
            ) : announcements.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                    />
                  </svg>
                </div>
                <div className="text-sm font-bold text-slate-800">No announcements found</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {search
                    ? "Try adjusting your search query."
                    : "Get started by adding top bar announcements for your store."}
                </p>
                {!search && (
                  <Button
                    onClick={handleOpenAdd}
                    className="h-8.5 px-4 text-xs font-semibold bg-[#B4395A] text-white hover:bg-[#9b2f4c]"
                  >
                    + Add Announcement
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">#</TableHead>
                    <TableHead>Announcement Message</TableHead>
                    <TableHead className="w-56">Redirection Link</TableHead>
                    <TableHead className="text-right w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((item, idx) => (
                    <TableRow key={item._id || idx}>
                      <TableCell className="text-center font-mono text-xs text-slate-500">
                        #{idx + 1}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs sm:text-sm font-medium text-slate-900 block leading-relaxed">
                          {item.text}
                        </span>
                      </TableCell>
                      <TableCell>
                        {item.link ? (
                          <span className="text-xs text-[#B4395A] font-mono hover:underline">
                            {item.link}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-[#B4395A] hover:bg-slate-100 rounded-[2px] transition-colors cursor-pointer"
                            title="Edit Announcement"
                            aria-label="Edit Announcement"
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
                            title="Delete Announcement"
                            aria-label="Delete Announcement"
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
          </div>
        </main>
      </div>

      {/* Add Announcement Dialog */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[3px] border border-slate-200 max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Add Announcement
              </h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Announcement Message *
                </label>
                <textarea
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="e.g. Free shipping on all prepaid orders above ₹499"
                  rows={3}
                  required
                  autoFocus
                  className="w-full text-xs sm:text-sm p-3 border border-slate-200 rounded-[2px] focus:outline-none focus:border-[#B4395A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Redirection Link (Optional)
                </label>
                <input
                  type="text"
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  placeholder="e.g. /shop or /categories"
                  className="w-full text-xs sm:text-sm p-2.5 border border-slate-200 rounded-[2px] focus:outline-none focus:border-[#B4395A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddModalOpen(false)}
                  disabled={submitting}
                  className="h-8.5 px-4 text-xs rounded-[2px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-8.5 px-4 text-xs font-semibold bg-[#B4395A] hover:bg-[#9B2E4C] text-white rounded-[2px]"
                >
                  {submitting ? "Saving..." : "Add Announcement"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Announcement Dialog */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[3px] border border-slate-200 max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Edit Announcement
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Announcement Message *
                </label>
                <textarea
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  rows={3}
                  required
                  autoFocus
                  className="w-full text-xs sm:text-sm p-3 border border-slate-200 rounded-[2px] focus:outline-none focus:border-[#B4395A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Redirection Link (Optional)
                </label>
                <input
                  type="text"
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  placeholder="e.g. /shop or /categories"
                  className="w-full text-xs sm:text-sm p-2.5 border border-slate-200 rounded-[2px] focus:outline-none focus:border-[#B4395A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                  disabled={submitting}
                  className="h-8.5 px-4 text-xs rounded-[2px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-8.5 px-4 text-xs font-semibold bg-[#B4395A] hover:bg-[#9B2E4C] text-white rounded-[2px]"
                >
                  {submitting ? "Updating..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
