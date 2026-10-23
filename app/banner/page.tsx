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
import { Switch } from "@/components/ui/switch";
import { SearchInput } from "@/components/ui/search-input";
import { BannerAddDialog } from "@/app/banner/@components/add";
import { BannerEditDialog } from "@/app/banner/@components/edit";
import { BannerViewDialog } from "@/app/banner/@components/view";
import { api } from "@/helper";
import toast from "@/lib/toast";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  FolderTree,
  Layers,
  LayoutGrid,
  Maximize2,
} from "lucide-react";

interface BannerSectionConfig {
  key: string;
  title: string;
  icon: any;
  description: string;
}

const SECTIONS: BannerSectionConfig[] = [
  {
    key: "home_hero",
    title: "Hero Section Banners",
    icon: Sparkles,
    description: "Main homepage hero slider banners.",
  },
  {
    key: "category_top",
    title: "Category Page Banners",
    icon: FolderTree,
    description: "Top header banners on category catalog pages.",
  },
  {
    key: "home_middle",
    title: "Home Middle Banners",
    icon: Layers,
    description: "Mid-page promotional showcase banners.",
  },
  {
    key: "home_bottom",
    title: "Home Bottom Showcase Banners",
    icon: LayoutGrid,
    description: "Pre-footer visual banners on homepage.",
  },
  {
    key: "promo_popup",
    title: "Promotional Pop-ups",
    icon: Maximize2,
    description: "Special offer pop-up banners.",
  },
];

export default function BannerManagementPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search state
  const [search, setSearch] = useState("");

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addSection, setAddSection] = useState("home_hero");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<any>(null);
  const [viewingBanner, setViewingBanner] = useState<any>(null);

  const isFetchingRef = useRef(false);

  // Fetch all banners
  const fetchBanners = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await api("banner/list", {
        limit: 100,
        search: search.trim() || undefined,
      });

      if (res && res.status && res.data) {
        setBanners(res.data.banners || []);
      } else {
        setError(res?.message || "Failed to load banners");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while fetching banners");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [search]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Handle instant status switch toggle
  const handleToggleStatus = async (item: any) => {
    if (!item._id) return;
    const previousStatus = item.status;
    const nextStatus = previousStatus === "active" ? "inactive" : "active";

    // Optimistic UI update
    setBanners((prev) =>
      prev.map((b) => (b._id === item._id ? { ...b, status: nextStatus } : b))
    );

    try {
      const res = await api("banner/change-status", {
        id: item._id,
        status: nextStatus,
      });

      if (res && res.status) {
        toast.success("Status Updated", `Banner is now ${nextStatus}`);
      } else {
        // Rollback
        setBanners((prev) =>
          prev.map((b) => (b._id === item._id ? { ...b, status: previousStatus } : b))
        );
        toast.error("Status Update Failed", res?.message || "Could not toggle status.");
      }
    } catch (err: any) {
      setBanners((prev) =>
        prev.map((b) => (b._id === item._id ? { ...b, status: previousStatus } : b))
      );
      toast.error("Error", err?.message || "Failed to update banner status");
    }
  };

  // Handle Delete with confirmation
  const handleDelete = async (item: any) => {
    if (!item._id) return;

    const confirmed = await toast.confirm({
      title: "Delete Banner?",
      text: `Are you sure you want to delete banner "${item.title}"?`,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    });

    if (!confirmed) return;

    try {
      const res = await api("banner/delete", { id: item._id });
      if (res && res.status) {
        toast.success("Deleted", res.message || "Banner deleted successfully.");
        fetchBanners();
      } else {
        toast.error("Delete Failed", res?.message || "Cannot delete banner.");
      }
    } catch (err: any) {
      toast.error("Delete Error", err?.message || "An unexpected error occurred.");
    }
  };

  const handleOpenAdd = (sectionKey = "home_hero") => {
    setAddSection(sectionKey);
    setAddDialogOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Sidebar */}
      <Sidebar
        currentPath="/banner"
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <Header
          title="Banners"
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Single Search Bar */}
          <div className="rounded-[4px] border border-slate-200 bg-white p-3 shadow-2xs">
            <SearchInput
              value={search}
              onChange={(val: any) => {
                const text = typeof val === "string" ? val : val?.target?.value ?? "";
                setSearch(text);
              }}
              placeholder="Search banners by title or link..."
              className="h-8.5 text-xs max-w-md w-full"
            />
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-[4px] text-xs text-red-700 flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchBanners} className="h-7 text-xs">
                Retry
              </Button>
            </div>
          )}

          {/* Direct Listing in Line in Set Boxes */}
          <div className="space-y-6">
            {SECTIONS.map((section) => {
              const sectionBanners = banners.filter((b) => b.position === section.key);
              const isCategorySection = section.key === "category_top";

              return (
                <div
                  key={section.key}
                  className="rounded-[4px] border border-slate-200 bg-white shadow-2xs overflow-hidden"
                >
                  {/* Box Header: Title on Left, Add Banner Button on Right */}
                  <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                          {section.title}
                        </h2>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                          {sectionBanners.length}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 hidden sm:block">
                        {section.description}
                      </p>
                    </div>

                    {/* Right-Side Add Banner Button */}
                    <Button
                      onClick={() => handleOpenAdd(section.key)}
                      className="h-8 px-3 text-xs font-semibold bg-[#B4395A] hover:bg-[#9b2f4c] text-white shadow-2xs cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Banner</span>
                    </Button>
                  </div>

                  {/* Box Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/40 border-b border-slate-200">
                          <TableHead className="w-12 text-center text-xs font-bold text-slate-700">#</TableHead>
                          <TableHead className="w-40 text-xs font-bold text-slate-700">Banner Image</TableHead>
                          <TableHead className="text-xs font-bold text-slate-700">Redirection Link</TableHead>
                          <TableHead className="w-24 text-center text-xs font-bold text-slate-700">Status</TableHead>
                          <TableHead className="w-24 text-right text-xs font-bold text-slate-700 pr-5">Actions</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {loading ? (
                          <TableRow className="animate-pulse">
                            <TableCell
                              colSpan={5}
                              className="py-6 text-center text-xs text-slate-400"
                            >
                              Loading banners...
                            </TableCell>
                          </TableRow>
                        ) : sectionBanners.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="py-8 text-center"
                            >
                              <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                                <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                                <p className="text-xs">No banners added in this section yet</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenAdd(section.key)}
                                  className="h-7 text-xs gap-1 cursor-pointer mt-1"
                                >
                                  <Plus className="w-3 h-3" /> Add Banner
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          sectionBanners.map((item, idx) => {
                            const bannerImg = item.image?.publicUrl || item.image?.url || (typeof item.image === "string" ? item.image : "");

                            return (
                              <TableRow
                                key={item._id}
                                className="hover:bg-slate-50/70 transition-colors"
                              >
                                <TableCell className="text-center font-mono text-xs text-slate-400">
                                  {idx + 1}
                                </TableCell>

                                {/* Banner Thumbnail */}
                                <TableCell>
                                  <div
                                    onClick={() => {
                                      setSelectedBanner(item);
                                      setEditDialogOpen(true);
                                    }}
                                    className="w-32 h-16 rounded border border-slate-200 bg-slate-100 overflow-hidden relative shadow-2xs group flex items-center justify-center cursor-pointer"
                                  >
                                    {bannerImg ? (
                                      <img
                                        src={bannerImg}
                                        alt=""
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      />
                                    ) : (
                                      <ImageIcon className="w-4 h-4 text-slate-400" />
                                    )}
                                  </div>
                                </TableCell>

                                {/* Redirection Link */}
                                <TableCell>
                                  {item.link ? (
                                    <span
                                      className="font-mono text-xs text-slate-700 max-w-lg truncate block"
                                      title={item.link}
                                    >
                                      {item.link}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic text-xs">
                                      No redirection link set
                                    </span>
                                  )}
                                </TableCell>

                                {/* Status Switch */}
                                <TableCell className="text-center">
                                  <Switch
                                    checked={item.status === "active"}
                                    onCheckedChange={() => handleToggleStatus(item)}
                                    aria-label="Toggle banner status"
                                  />
                                </TableCell>

                                {/* Actions */}
                                <TableCell className="text-right pr-5">
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedBanner(item);
                                        setEditDialogOpen(true);
                                      }}
                                      className="p-1.5 rounded-[3px] text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                                      title="Edit banner"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(item)}
                                      className="p-1.5 rounded-[3px] text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Delete banner"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Add Dialog */}
      <BannerAddDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        initialPosition={addSection}
        onSuccess={fetchBanners}
      />

      {/* Edit Dialog */}
      <BannerEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        banner={selectedBanner}
        onSuccess={fetchBanners}
      />

      {/* View Dialog */}
      <BannerViewDialog
        open={Boolean(viewingBanner)}
        onOpenChange={(open) => {
          if (!open) setViewingBanner(null);
        }}
        banner={viewingBanner}
      />
    </div>
  );
}
