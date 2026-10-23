"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/helper";
import { AlertCircle, Lock } from "lucide-react";

export function SpecificationViewDialog({
  open,
  onOpenChange,
  specification,
}: any) {
  const [currentSpecification, setCurrentSpecification] = useState<any>(specification);
  const [loading, setLoading] = useState(false);

  const fetchFullDetail = async (id: string) => {
    setLoading(true);
    try {
      const res = await api("specification/view", { id });
      if (res && res.status && res.data) {
        setCurrentSpecification(res.data);
      }
    } catch (e) {
      console.error("Failed to load specification detail in view dialog:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (specification?._id && open) {
      setCurrentSpecification(specification);
      fetchFullDetail(specification._id);
    }
  }, [specification, open]);

  if (!currentSpecification) return null;

  const options: any[] = currentSpecification.options || [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header: Only Title "Specification" */}
        <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-white pr-14 text-left">
          <DialogTitle className="text-base font-bold text-slate-900">
            Specification
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-slate-50/30">
          {/* Section 1: Specification Details in Separated Clean Box Layout */}
          <div className="rounded-[4px] border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/80">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Specification Details
              </h3>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 1. Name */}
                <div className="p-3 rounded-[3px] bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Specification Name
                  </span>
                  <span className="font-semibold text-slate-900 text-sm">
                    {currentSpecification.name}
                  </span>
                </div>

                {/* 2. Display Name */}
                <div className="p-3 rounded-[3px] bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Display Name
                  </span>
                  <span className="font-semibold text-slate-900 text-sm">
                    {currentSpecification.displayName || currentSpecification.name}
                  </span>
                </div>

                {/* 3. URL Slug */}
                <div className="p-3 rounded-[3px] bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    URL Slug
                  </span>
                  <span className="font-mono text-xs text-slate-700 bg-white px-2 py-0.5 rounded-[2px] border border-slate-200 inline-block font-semibold">
                    /{currentSpecification.slug}
                  </span>
                </div>

                {/* 4. Status */}
                <div className="p-3 rounded-[3px] bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Status
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-[2px] border ${currentSpecification.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${currentSpecification.status === "active" ? "bg-emerald-600" : "bg-slate-400"
                        }`}
                    />
                    {currentSpecification.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* 5. Total Options */}
                <div className="p-3 rounded-[3px] bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Total Options
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {options.length} {options.length === 1 ? "option" : "options"}
                  </span>
                </div>

                {/* 6. Variant Specification */}
                <div className="p-3 rounded-[3px] bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Variant Specification
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-[2px] border ${currentSpecification.is_veriant || currentSpecification.is_variant
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${currentSpecification.is_veriant || currentSpecification.is_variant ? "bg-purple-600" : "bg-slate-400"
                        }`}
                    />
                    {currentSpecification.is_veriant || currentSpecification.is_variant ? "Yes (Variant Enabled)" : "No"}
                  </span>
                </div>

                {/* 7. Created Date */}
                <div className="p-3 rounded-[3px] bg-slate-50 border border-slate-200/60 sm:col-span-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Creation Date
                  </span>
                  <span className="text-slate-700 font-medium">
                    {formatDate(currentSpecification.createdAt)}
                  </span>
                </div>
              </div>

              {/* Description Box */}
              <div className="p-3 rounded-[3px] bg-slate-50 border border-slate-200/60 text-xs">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Description
                </span>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {currentSpecification.description?.trim() || "No description provided for this specification."}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Options Card (Read-Only List for View Purpose) */}
          <div className="rounded-[4px] border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Options Card ({options.length})
                </h3>
              </div>
            </div>

            <div className="p-4">
              {loading ? (
                <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin border-2 border-slate-300 border-t-[#B4395A] rounded-full" />
                  <span>Loading options...</span>
                </div>
              ) : options.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 rounded-[3px] border border-dashed border-slate-200 text-center bg-slate-50/50">
                  <AlertCircle className="w-7 h-7 text-amber-500/80 mb-2" />
                  <p className="text-xs font-semibold text-slate-800">No options configured</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm">
                    This specification currently has 0 options. You can add choices using the Edit dialog.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-[3px] divide-y divide-slate-100 overflow-hidden">
                  {options.map((opt, idx) => {
                    const is_used = Boolean(opt.is_used || opt.isUsed);

                    return (
                      <div
                        key={opt._id || idx}
                        className="flex items-center justify-between px-3.5 py-2.5 text-xs hover:bg-slate-50/80 transition-colors"
                      >
                        {/* Index & Option Name */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-3">
                          <span className="font-mono text-[11px] text-slate-400 w-5 shrink-0">
                            {idx + 1}.
                          </span>
                          <span className="font-medium text-slate-800 truncate">
                            {opt.name}
                          </span>
                        </div>

                        {/* In Use status indicator */}
                        {is_used && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-amber-50 text-amber-700 border-amber-300 flex items-center gap-1 font-medium py-0 shrink-0"
                          >
                            <Lock className="w-2.5 h-2.5" />
                            <span>In Use</span>
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-3 border-t border-slate-200 bg-white">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8 border-slate-300"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
