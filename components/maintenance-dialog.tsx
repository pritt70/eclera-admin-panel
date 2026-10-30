"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/helper";
import { toast } from "@/lib/toast";
import { Wrench, Check, Eye } from "lucide-react";

interface MaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (config: { isActive: boolean; title: string; description: string }) => void;
}

export function MaintenanceDialog({
  open,
  onOpenChange,
  onUpdated,
}: MaintenanceDialogProps) {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Load current configuration directly from database when modal opens
  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    async function loadConfig() {
      setLoading(true);
      try {
        const res = await api("maintenance");
        if (isMounted && res && res.status && res.data) {
          setIsActive(Boolean(res.data.isActive));
          setTitle(res.data.title || "");
          setDescription(res.data.description || "");
        }
      } catch (err) {
        console.error("Failed to load maintenance settings from database:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadConfig();
    return () => {
      isMounted = false;
    };
  }, [open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isActive && !title.trim()) {
      toast.error("Validation Error", "Please enter a title before activating maintenance mode");
      return;
    }

    setSaving(true);
    try {
      const res = await api("maintenance/update", {
        isActive,
        title: title.trim(),
        description: description.trim(),
      });

      if (res && res.status && res.data) {
        const updated = res.data;
        setIsActive(Boolean(updated.isActive));
        setTitle(updated.title || "");
        setDescription(updated.description || "");

        toast.success(
          "Settings Saved to Database",
          updated.isActive
            ? "Maintenance Mode is now ACTIVE. Website will show your maintenance title & description."
            : "Maintenance Mode is now INACTIVE. Website is now LIVE."
        );

        if (onUpdated) {
          onUpdated({
            isActive: Boolean(updated.isActive),
            title: updated.title || "",
            description: updated.description || "",
          });
        }
        onOpenChange(false);
      } else {
        toast.error("Update Failed", res?.message || "Failed to update maintenance settings in database");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-none border border-slate-200 bg-white">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isActive
                  ? "bg-amber-100 text-amber-700 border border-amber-300"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
                Website Maintenance Mode
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Enable or disable website maintenance and save title and description in database.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <div className="w-6 h-6 border-2 border-[#B4395A] border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading database settings...</p>
            </div>
          ) : (
            <>
              {/* Status Switch Block */}
              <div
                className={`p-4 border transition-colors ${
                  isActive
                    ? "bg-amber-50/70 border-amber-300"
                    : "bg-emerald-50/50 border-emerald-200"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isActive ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                        }`}
                      />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        {isActive ? "Maintenance Mode: ACTIVE" : "Maintenance Mode: INACTIVE (LIVE)"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {isActive
                        ? "Website is currently under maintenance. Visitors will see the title & description."
                        : "Website is public and fully operational for all visitors."}
                    </p>
                  </div>

                  {/* Toggle button */}
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isActive ? "bg-amber-500" : "bg-slate-300"
                    }`}
                    role="switch"
                    aria-checked={isActive}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        isActive ? "translate-x-7" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Maintenance Title */}
              <div className="space-y-1.5">
                <Label htmlFor="m-title" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Maintenance Title {isActive && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="m-title"
                  type="text"
                  placeholder="Enter maintenance title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10 text-xs sm:text-sm rounded-none border-slate-300 focus:border-[#B4395A] focus:ring-[#B4395A]"
                />
              </div>

              {/* Maintenance Description */}
              <div className="space-y-1.5">
                <Label htmlFor="m-desc" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Maintenance Description
                </Label>
                <Textarea
                  id="m-desc"
                  rows={3}
                  placeholder="Enter maintenance description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs sm:text-sm rounded-none border-slate-300 focus:border-[#B4395A] focus:ring-[#B4395A]"
                />
              </div>

              {/* Live Preview Box */}
              {(title || description) && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Website Center View Preview</span>
                  </div>
                  <div className="p-6 bg-white border border-dashed border-slate-300 rounded-none text-center shadow-xs">
                    <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3 text-[#5B6240]">
                      <Wrench className="w-4 h-4" />
                    </div>
                    {title && (
                      <h4 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                        {title}
                      </h4>
                    )}
                    {description && (
                      <p className="text-xs text-stone-600 mt-2 max-w-sm mx-auto leading-relaxed">
                        {description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
              className="text-xs rounded-none border-slate-300"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={saving || loading}
              className={`text-xs font-semibold rounded-none px-6 transition-colors ${
                isActive
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-[#B4395A] hover:bg-[#972D49] text-white"
              }`}
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  <span>Save to Database</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
