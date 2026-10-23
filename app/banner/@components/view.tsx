"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Image as ImageIcon, FolderTree } from "lucide-react";
import { SECTION_OPTIONS } from "./add";

export function BannerViewDialog({
  open,
  onOpenChange,
  banner,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: any;
}) {
  if (!banner) return null;

  const sectionMeta =
    SECTION_OPTIONS.find((s) => s.value === banner.position) || SECTION_OPTIONS[0];
  const desktopImg = banner.image?.publicUrl || banner.image?.url || (typeof banner.image === "string" ? banner.image : "");
  const categoryName = banner.category?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-white pr-14 text-left">
          <DialogTitle className="text-base font-bold text-slate-900">
            {banner.title || sectionMeta.label}
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[2px] border bg-slate-100 text-slate-700 border-slate-200">
              {sectionMeta.shortLabel}
            </span>

            {banner.position === "category_top" && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[2px] bg-slate-100 text-slate-700 border border-slate-200">
                <FolderTree className="w-3 h-3 text-indigo-600" />
                Category: {categoryName || "All Categories"}
              </span>
            )}

            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-[2px] border ${
                banner.status === "active"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              {banner.status === "active" ? "Active" : "Inactive"}
            </span>

            {banner.sortOrder !== undefined && (
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-[2px]">
                Order: #{banner.sortOrder}
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Banner Image Preview */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Banner Preview
            </span>
            <div className="relative rounded-[6px] overflow-hidden border border-slate-200 bg-slate-900 min-h-[200px] flex items-center justify-center shadow-md">
              {desktopImg ? (
                <img
                  src={desktopImg}
                  alt={banner.title}
                  className="w-full h-full object-cover max-h-72"
                />
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                  <span className="text-xs">No image</span>
                </div>
              )}
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="p-4 rounded-[4px] border border-slate-200 bg-white grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Section
              </span>
              <span className="font-semibold text-slate-800 block mt-0.5">
                {sectionMeta.label}
              </span>
            </div>

            {banner.position === "category_top" && (
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Category
                </span>
                <span className="font-semibold text-indigo-700 block mt-0.5">
                  {categoryName || "All Categories"}
                </span>
              </div>
            )}

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Destination URL
              </span>
              <span className="font-mono text-slate-800 truncate block mt-0.5" title={banner.link}>
                {banner.link || "None"}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Button Text (CTA)
              </span>
              <span className="font-semibold text-[#B4395A] block mt-0.5">
                {banner.buttonText || "Shop Now"}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Sort Order
              </span>
              <span className="font-mono text-slate-800 block mt-0.5">
                #{banner.sortOrder || 0}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Status
              </span>
              <span className="font-semibold text-slate-800 block mt-0.5 capitalize">
                {banner.status}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs font-semibold px-4"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
