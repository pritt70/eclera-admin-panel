"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { api } from "@/helper";
import toast from "@/lib/toast";
import { Plus, Trash2, Lock } from "lucide-react";

export function SpecificationEditDialog({
  open,
  onOpenChange,
  specification,
  onSuccess,
}: any) {
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [isVeriant, setIsVeriant] = useState(false);

  // Options state with is_used tracking
  const [options, setOptions] = useState<any[]>([]);
  const [newOptionInput, setNewOptionInput] = useState("");
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Fetch full details and usage via View API in useEffect
  useEffect(() => {
    if (specification?._id && open) {
      setName(specification.name || "");
      setDisplayName(specification.displayName || "");
      setSlug(specification.slug || "");
      setDescription(specification.description || "");
      setStatus(specification.status || "active");
      setIsVeriant(Boolean(specification.is_veriant ?? specification.is_variant ?? false));
      setOptions([]);
      setNewOptionInput("");
      setFormError(null);

      const fetchDetail = async () => {
        setLoadingDetails(true);
        try {
          const res = await api("specification/view", { id: specification._id });
          if (res && res.status && res.data) {
            const data = res.data;
            setName(data.name || "");
            setDisplayName(data.displayName || "");
            setSlug(data.slug || "");
            setDescription(data.description || "");
            setStatus(data.status || "active");
            setIsVeriant(Boolean(data.is_veriant ?? data.is_variant ?? false));

            const fetchedOptions = (data.options || []).map((opt: any) => ({
              _id: opt._id,
              name: opt.name,
              is_used: Boolean(opt.is_used ?? opt.isUsed),
            }));
            setOptions(fetchedOptions);
          }
        } catch (err) {
          console.error("Failed to fetch specification detail:", err);
        } finally {
          setLoadingDetails(false);
        }
      };

      fetchDetail();
    }
  }, [specification, open]);

  // Add new option to list
  const handleAddOption = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const trimmed = newOptionInput.trim();
    if (!trimmed) return;

    // Check duplicate (case-insensitive)
    const exists = options.some((opt) => opt.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      toast.error("Duplicate Option", `Option "${trimmed}" already exists.`);
      return;
    }

    setOptions((prev) => [...prev, { name: trimmed, is_used: false }]);
    setNewOptionInput("");
  };

  // Update option name (Allowed even if in use)
  const handleOptionNameChange = (index: number, newName: string) => {
    setOptions((prev) =>
      prev.map((opt, idx) => (idx === index ? { ...opt, name: newName } : opt))
    );
  };

  // Remove option from list (Blocked if in use)
  const handleRemoveOption = (indexToRemove: number) => {
    const target = options[indexToRemove];
    if (target.is_used) {
      toast.error(
        "Cannot Remove Option",
        `"${target.name}" is currently in use across categories, collections, or products.`
      );
      return;
    }

    setOptions((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!specification?._id) return;

    if (!name.trim()) {
      setFormError("Specification name is required.");
      return;
    }

    // Validate options
    const cleanOptions = [];
    const seen = new Set<string>();
    for (const opt of options) {
      const trimmed = opt.name.trim();
      if (!trimmed) {
        setFormError("Option names cannot be blank.");
        return;
      }
      const lower = trimmed.toLowerCase();
      if (seen.has(lower)) {
        setFormError(`Duplicate option "${trimmed}" detected.`);
        return;
      }
      seen.add(lower);
      cleanOptions.push({
        _id: opt._id,
        name: trimmed,
      });
    }

    const confirmed = await toast.confirm({
      title: "Are you sure to save changes?",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const payload = {
        id: specification._id,
        name: name.trim(),
        displayName: displayName.trim() || undefined,
        slug: slug.trim() ? slugify(slug) : undefined,
        description: description.trim(),
        status,
        is_veriant: isVeriant,
        is_variant: isVeriant,
        options: cleanOptions,
      };

      const res = await api("specification/update", payload, { method: "POST" });

      if (res && res.status) {
        toast.success("Specification Updated", res.message || "Specification details saved successfully!");
        onOpenChange(false);
        onSuccess();
      } else {
        const errorMsg = res?.message || "Failed to update specification. Please check your inputs.";
        setFormError(errorMsg);
        toast.error("Operation Failed", errorMsg);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setFormError(errorMsg);
      toast.error("Error", errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-xl max-h-[90vh] flex flex-col p-0">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>Edit Specification</DialogTitle>
            <DialogDescription>
              Update specification name, display name, slug, status, and manage options.
            </DialogDescription>
          </DialogHeader>

          {/* Form Fields */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {formError && (
              <div className="rounded-[3px] border border-red-500/30 bg-red-50 p-2.5 text-xs text-red-700">
                {formError}
              </div>
            )}

            {/* Name & Display Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="edit-spec-name">
                  Specification Name <span className="text-[#B4395A]">*</span>
                </Label>
                <Input
                  id="edit-spec-name"
                  placeholder="e.g. Skin Type"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Must be unique. Used in the admin panel.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-spec-display-name">Display Name</Label>
                <Input
                  id="edit-spec-display-name"
                  placeholder="Defaults to name if left empty"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  The name shown to customers on the website.
                </p>
              </div>
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-spec-slug">
                Slug <span className="text-[#B4395A]">*</span>
              </Label>
              <Input
                id="edit-spec-slug"
                placeholder="e.g. skin-type"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="font-mono text-xs"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                URL identifier for this specification.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-spec-desc">Description</Label>
              <Textarea
                id="edit-spec-desc"
                placeholder="Brief description about this specification..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Options Management Section in Edit Dialog */}
            <div className="rounded-[4px] border p-3.5 space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold text-foreground">
                    Options / Choices ({options.length})
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Names can be edited anytime. Options currently in use cannot be removed.
                  </p>
                </div>
              </div>

              {/* Add option input row */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add new choice (e.g. Combination, Sensitive)..."
                  value={newOptionInput}
                  onChange={(e) => setNewOptionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                  className="text-xs h-8.5 bg-white dark:bg-slate-950"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddOption}
                  disabled={!newOptionInput.trim()}
                  className="h-8.5 text-xs px-3 border-slate-300 dark:border-slate-700 shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-[#B4395A]" />
                  <span>Add</span>
                </Button>
              </div>

              {/* Options List */}
              {loadingDetails ? (
                <div className="py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin border-2 border-slate-300 border-t-[#B4395A] rounded-full" />
                  <span>Loading options and checking usage...</span>
                </div>
              ) : options.length > 0 ? (
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                  {options.map((opt, idx) => (
                    <div
                      key={opt._id || `new-${idx}`}
                      className="flex items-center gap-2 pt-1.5 first:pt-0"
                    >
                      <span className="font-mono text-[11px] text-muted-foreground w-5 shrink-0">
                        {idx + 1}.
                      </span>

                      {/* Option Name Input (Renameable at all times) */}
                      <Input
                        value={opt.name}
                        onChange={(e) => handleOptionNameChange(idx, e.target.value)}
                        placeholder="Option name"
                        className="text-xs h-8 flex-1 bg-white dark:bg-slate-950"
                      />

                      {/* Usage Status / Remove Action */}
                      {opt.is_used ? (
                        <div className="flex items-center gap-1 shrink-0" title="In use: This option is selected in categories, collections, or products and cannot be deleted.">
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-amber-50 text-amber-700 border-amber-300 flex items-center gap-1 font-medium py-0.5"
                          >
                            <Lock className="w-2.5 h-2.5" />
                            <span>In Use</span>
                          </Badge>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOption(idx)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 shrink-0"
                          title="Remove this option"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  No options yet. Add choices using the field above.
                </p>
              )}
            </div>

            {/* Status Switch */}
            <div className="flex items-center justify-between p-3 rounded-[3px] border bg-slate-50/50 dark:bg-slate-900/50">
              <div className="space-y-0.5">
                <Label htmlFor="edit-spec-status" className="text-xs font-semibold cursor-pointer">
                  Active Status
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Active specifications with options can be assigned to categories.
                </p>
              </div>
              <Switch
                id="edit-spec-status"
                checked={status === "active"}
                onCheckedChange={(checked) => setStatus(checked ? "active" : "inactive")}
              />
            </div>

            {/* Variant Switch */}
            <div className="flex items-center justify-between p-3 rounded-[3px] border bg-slate-50/50 dark:bg-slate-900/50">
              <div className="space-y-0.5">
                <Label htmlFor="edit-spec-variant" className="text-xs font-semibold cursor-pointer">
                  Variant Specification
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Enable if this specification is used to generate product variants (e.g. Size, Shade, Volume).
                </p>
              </div>
              <Switch
                id="edit-spec-variant"
                checked={isVeriant}
                onCheckedChange={setIsVeriant}
              />
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-3 border-t bg-slate-50/50 dark:bg-slate-900/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="text-xs h-8.5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#B4395A] hover:bg-[#9b2f4c] text-white text-xs h-8.5"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
