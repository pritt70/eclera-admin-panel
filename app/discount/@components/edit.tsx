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

interface DiscountEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discount: any;
  onSuccess: () => void;
}

export function DiscountEditDialog({
  open,
  onOpenChange,
  discount,
  onSuccess,
}: DiscountEditDialogProps) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState<string>("");
  const [minOrderValue, setMinOrderValue] = useState<string>("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [usageLimit, setUsageLimit] = useState<string>("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [isSpecial, setIsSpecial] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (discount && open) {
      setCode(discount.code || "");
      setDescription(discount.description || "");
      setType(discount.type || "percentage");
      setValue(discount.value !== undefined ? String(discount.value) : "");
      setMinOrderValue(discount.minOrderValue ? String(discount.minOrderValue) : "");
      setMaxDiscountAmount(discount.maxDiscountAmount ? String(discount.maxDiscountAmount) : "");

      const sDate = discount.startDate ? new Date(discount.startDate).toISOString().split("T")[0] : "";
      const eDate = discount.endDate ? new Date(discount.endDate).toISOString().split("T")[0] : "";
      setStartDate(sDate);
      setEndDate(eDate);

      setUsageLimit(discount.usageLimit ? String(discount.usageLimit) : "");
      setStatus(discount.status || "active");
      setIsSpecial(Boolean(discount.isSpecial));
      setFormError(null);
    }
  }, [discount, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discount?._id) return;
    setFormError(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setFormError("Coupon code is required.");
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      setFormError("Please enter a valid positive discount value.");
      return;
    }

    if (type === "percentage" && numValue > 100) {
      setFormError("Percentage discount cannot exceed 100%.");
      return;
    }

    const confirmed = await toast.confirm({
      title: "Update Coupon?",
      text: `Are you sure you want to update coupon "${cleanCode}"?`,
      confirmButtonText: "Update Coupon",
      cancelButtonText: "Cancel",
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const payload = {
        id: discount._id,
        code: cleanCode,
        description: description.trim(),
        type,
        value: numValue,
        minOrderValue: minOrderValue ? Math.max(0, parseFloat(minOrderValue)) : 0,
        maxDiscountAmount:
          type === "percentage" && maxDiscountAmount
            ? Math.max(0, parseFloat(maxDiscountAmount))
            : 0,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        usageLimit: usageLimit ? Math.max(0, parseInt(usageLimit, 10)) : 0,
        status,
        isSpecial,
      };

      const res = await api("discount/update", payload);

      if (res && res.status) {
        toast.success("Success", res.message || "Coupon updated successfully");
        onOpenChange(false);
        onSuccess();
      } else {
        setFormError(res?.message || "Failed to update coupon");
        toast.error("Error", res?.message || "Failed to update coupon");
      }
    } catch (err: any) {
      setFormError(err?.message || "An unexpected error occurred.");
      toast.error("Error", err?.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClose={() => onOpenChange(false)}
        className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden"
      >
        <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-white pr-14 text-left">
          <DialogTitle className="text-lg font-bold text-slate-900">
            Edit Discount Coupon
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-0.5">
            Modify settings, discount amount, or order criteria for coupon code {discount?.code}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                {formError}
              </div>
            )}

            {/* Coupon Code & Description */}
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Coupon Information
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Coupon Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. WELCOME20"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                    className="h-9 text-xs font-mono uppercase tracking-wider font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Discount Type <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-md h-9 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setType("percentage")}
                      className={`h-full flex items-center justify-center text-xs font-semibold rounded transition-all cursor-pointer ${
                        type === "percentage"
                          ? "bg-white text-[#B4395A] shadow-xs border border-slate-200"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      % Percentage
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("fixed")}
                      className={`h-full flex items-center justify-center text-xs font-semibold rounded transition-all cursor-pointer ${
                        type === "fixed"
                          ? "bg-white text-[#B4395A] shadow-xs border border-slate-200"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      ₹ Fixed Amount
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {type === "percentage"
                      ? "Percentage off the total order subtotal."
                      : "Flat rupee discount off the order subtotal."}
                  </p>
                </div>
              </div>

              {/* Discount Value & Max Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Discount Value {type === "percentage" ? "(%)" : "(₹)"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      max={type === "percentage" ? 100 : undefined}
                      placeholder={type === "percentage" ? "e.g. 20" : "e.g. 200"}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      required
                      className="h-9 text-xs pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      {type === "percentage" ? "%" : "₹"}
                    </span>
                  </div>
                </div>

                {type === "percentage" ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Maximum Discount Price (₹)
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="e.g. 500 (0 for no cap)"
                        value={maxDiscountAmount}
                        onChange={(e) => setMaxDiscountAmount(e.target.value)}
                        className="h-9 text-xs pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                        ₹
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Caps maximum discount on high-value orders (0 = unlimited).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Discount Scope
                    </Label>
                    <div className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-md flex items-center text-xs text-slate-600 font-medium">
                      Flat discount applied across full order
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Deducted directly from the customer's total cart subtotal.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Coupon Description / Offer Note
                </Label>
                <Textarea
                  placeholder="e.g. Get 20% off on your entire skincare routine."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>
            </div>

            {/* Restrictions & Order Criteria */}
            <div className="border-t border-slate-200 pt-4 space-y-4">
              <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Order Criteria & Usage Limits
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Minimum Order Value (₹)
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 499 (0 for no minimum)"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <p className="text-[11px] text-slate-400">
                    Minimum order subtotal needed before coupon applies.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Total Usage Limit
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 100 (0 for unlimited)"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <p className="text-[11px] text-slate-400">
                    Current redemptions: {discount?.usedCount || 0}
                  </p>
                </div>
              </div>

              {/* Validity Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Start Date
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Expiry / End Date
                  </Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <p className="text-[11px] text-slate-400">
                    Leave blank for coupons that never expire.
                  </p>
                </div>
              </div>
            </div>

            {/* Special Coupon Setting */}
            <div className="p-3.5 bg-rose-50/40 border border-rose-200/60 rounded-lg flex items-center justify-between">
              <div className="pr-4">
                <Label className="text-xs font-semibold text-slate-800">
                  Special Coupon
                </Label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Do not show this coupon in the website's public "View All Coupons" list. Customers must manually enter the code at checkout.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs font-semibold ${
                    isSpecial ? "text-[#B4395A]" : "text-slate-500"
                  }`}
                >
                  {isSpecial ? "Special (Hidden)" : "Public"}
                </span>
                <Switch
                  checked={isSpecial}
                  onCheckedChange={(checked) => setIsSpecial(checked)}
                />
              </div>
            </div>

            {/* Status Switch */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold text-slate-800">
                  Coupon Status
                </Label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Active coupons can be applied by shoppers during storefront checkout.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs font-semibold ${
                    status === "active" ? "text-emerald-600" : "text-slate-500"
                  }`}
                >
                  {status === "active" ? "Active" : "Inactive"}
                </span>
                <Switch
                  checked={status === "active"}
                  onCheckedChange={(checked) =>
                    setStatus(checked ? "active" : "inactive")
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-[#B4395A] hover:bg-[#962e49] text-white text-xs h-9 px-5"
            >
              {submitting ? "Updating..." : "Update Coupon"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
