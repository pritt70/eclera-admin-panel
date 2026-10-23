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
import { api } from "@/helper";
import toast from "@/lib/toast";
import { Plus, Trash2 } from "lucide-react";

export function SpecificationAddDialog({
  open,
  onOpenChange,
  onSuccess,
}: any) {
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [isVeriant, setIsVeriant] = useState(false);

  // Options state managed directly at creation time
  const [options, setOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  useEffect(() => {
    if (open) {
      setName("");
      setDisplayName("");
      setSlug("");
      setDescription("");
      setStatus("active");
      setIsVeriant(false);
      setOptions([]);
      setOptionInput("");
      setIsSlugManuallyEdited(false);
      setFormError(null);
    }
  }, [open]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManuallyEdited) {
      setSlug(slugify(val));
    }
  };

  // Add option to local list
  const handleAddOptionItem = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const trimmed = optionInput.trim();
    if (!trimmed) return;

    // Check duplicate (case-insensitive)
    const exists = options.some((opt) => opt.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      toast.error("Duplicate Option", `Option "${trimmed}" already added.`);
      return;
    }

    setOptions((prev) => [...prev, trimmed]);
    setOptionInput("");
  };

  // Update option name in local list
  const handleOptionNameChange = (index: number, newName: string) => {
    setOptions((prev) =>
      prev.map((opt, idx) => (idx === index ? newName : opt))
    );
  };

  // Remove option from local list
  const handleRemoveOptionItem = (indexToRemove: number) => {
    setOptions((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Specification name is required.");
      return;
    }

    // Validate options
    const cleanOptions: { name: string }[] = [];
    const seen = new Set<string>();
    for (const opt of options) {
      const trimmed = opt.trim();
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
      cleanOptions.push({ name: trimmed });
    }

    const confirmed = await toast.confirm({
      title: "Are you sure to save?",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        displayName: displayName.trim() || undefined,
        slug: slug.trim() ? slugify(slug) : undefined,
        description: description.trim(),
        status,
        is_veriant: isVeriant,
        is_variant: isVeriant,
        options: cleanOptions,
      };

      const res = await api("specification/create", payload, { method: "POST" });

      if (res && res.status) {
        toast.success("Specification Created", res.message || "Specification added successfully!");
        onOpenChange(false);
        onSuccess(res.data);
      } else {
        const errorMsg = res?.message || "Failed to create specification. Please check your inputs.";
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
            <DialogTitle>Add Specification</DialogTitle>
            <DialogDescription>
              Create a new specification and set its choices/options right now.
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
                <Label htmlFor="add-spec-name">
                  Specification Name <span className="text-[#B4395A]">*</span>
                </Label>
                <Input
                  id="add-spec-name"
                  placeholder="e.g. Skin Type"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Must be unique. Used in the admin panel.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-spec-display-name">Display Name</Label>
                <Input
                  id="add-spec-display-name"
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
              <Label htmlFor="add-spec-slug">
                Slug <span className="text-[#B4395A]">*</span>
              </Label>
              <Input
                id="add-spec-slug"
                placeholder="e.g. skin-type"
                value={slug}
                onChange={(e) => {
                  setIsSlugManuallyEdited(true);
                  setSlug(e.target.value);
                }}
                className="font-mono text-xs"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Auto-generated unique URL-friendly identifier.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="add-spec-desc">Description</Label>
              <Textarea
                id="add-spec-desc"
                placeholder="Brief description about this specification..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Options Management at Add time (Exact same numbered list style as Edit dialog) */}
            <div className="rounded-[4px] border p-3.5 space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold text-foreground">
                    Options / Choices ({options.length})
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Add choices like Oily, Dry, Sensitive. Specifications need at least 1 option to be selected in categories.
                  </p>
                </div>
              </div>

              {/* Add option input row */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add new choice (e.g. Combination, Sensitive)..."
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddOptionItem();
                    }
                  }}
                  className="text-xs h-8.5 bg-white dark:bg-slate-950"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddOptionItem}
                  disabled={!optionInput.trim()}
                  className="h-8.5 text-xs px-3 border-slate-300 dark:border-slate-700 shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-[#B4395A]" />
                  <span>Add</span>
                </Button>
              </div>

              {/* Options List: Numbered, with editable input and trash icon matching Edit dialog */}
              {options.length > 0 ? (
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                  {options.map((optName, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 pt-1.5 first:pt-0"
                    >
                      <span className="font-mono text-[11px] text-muted-foreground w-5 shrink-0">
                        {idx + 1}.
                      </span>

                      <Input
                        value={optName}
                        onChange={(e) => handleOptionNameChange(idx, e.target.value)}
                        placeholder="Option name"
                        className="text-xs h-8 flex-1 bg-white dark:bg-slate-950"
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOptionItem(idx)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 shrink-0"
                        title="Remove this option"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  No options added yet. You can add choices using the field above.
                </p>
              )}
            </div>

            {/* Status Switch */}
            <div className="flex items-center justify-between p-3 rounded-[3px] border bg-slate-50/50 dark:bg-slate-900/50">
              <div className="space-y-0.5">
                <Label htmlFor="add-spec-status" className="text-xs font-semibold cursor-pointer">
                  Active Status
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Active specifications with options can be assigned to categories.
                </p>
              </div>
              <Switch
                id="add-spec-status"
                checked={status === "active"}
                onCheckedChange={(checked) => setStatus(checked ? "active" : "inactive")}
              />
            </div>

            {/* Variant Switch */}
            <div className="flex items-center justify-between p-3 rounded-[3px] border bg-slate-50/50 dark:bg-slate-900/50">
              <div className="space-y-0.5">
                <Label htmlFor="add-spec-variant" className="text-xs font-semibold cursor-pointer">
                  Variant Specification
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Enable if this specification is used to generate product variants (e.g. Size, Shade, Volume).
                </p>
              </div>
              <Switch
                id="add-spec-variant"
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
              {submitting ? "Saving..." : "Save Specification"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
