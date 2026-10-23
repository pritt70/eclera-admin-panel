"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/helper";

interface DiscountViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discount: any;
  onEdit: () => void;
}

export function DiscountViewDialog({
  open,
  onOpenChange,
  discount,
  onEdit,
}: DiscountViewDialogProps) {
  const [currentDiscount, setCurrentDiscount] = useState<any>(discount);

  useEffect(() => {
    setCurrentDiscount(discount);
    if (discount?._id && open) {
      api("discount/view", { id: discount._id })
        .then((res) => {
          if (res && res.status && res.data) {
            setCurrentDiscount(res.data);
          }
        })
        .catch(() => {});
    }
  }, [discount, open]);

  if (!currentDiscount) return null;

  const isExpired = currentDiscount.endDate && new Date(currentDiscount.endDate) < new Date();

  const getStatusBadge = () => {
    if (isExpired) {
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold px-2 py-0.5">
          Expired
        </Badge>
      );
    }
    if (currentDiscount.status === "active") {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-2 py-0.5">
          Active
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs font-semibold px-2 py-0.5">
        Inactive
      </Badge>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "No Expiry";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const discountFormatted =
    currentDiscount.type === "percentage"
      ? `${currentDiscount.value}% Off`
      : `₹${Number(currentDiscount.value || 0).toLocaleString("en-IN")} Flat Off`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClose={() => onOpenChange(false)}
        className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden"
      >
        <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-white pr-14 text-left">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-slate-900">
              Coupon Details
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEdit();
              }}
              className="h-8 text-xs border-slate-300"
            >
              Edit Coupon
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Header Card with Coupon Code */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-lg font-bold text-[#B4395A] tracking-wider px-2.5 py-0.5 bg-rose-50 border border-rose-200 rounded">
                  {currentDiscount.code}
                </span>
                {getStatusBadge()}
                {currentDiscount.isSpecial ? (
                  <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-semibold px-2 py-0.5">
                    Special (Hidden from Website List)
                  </Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs font-semibold px-2 py-0.5">
                    Public
                  </Badge>
                )}
              </div>
              {currentDiscount.description && (
                <p className="text-xs text-slate-600 mt-2">
                  {currentDiscount.description}
                </p>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-medium uppercase block">
                DISCOUNT
              </span>
              <span className="text-lg font-bold text-slate-900">
                {discountFormatted}
              </span>
            </div>
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
                Discount Type
              </span>
              <p className="text-sm font-bold text-slate-900 capitalize">
                {currentDiscount.type === "percentage" ? "Percentage (% Off)" : "Fixed Amount (₹ Flat)"}
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
                Minimum Order
              </span>
              <p className="text-sm font-bold text-slate-900">
                {currentDiscount.minOrderValue > 0
                  ? `₹${Number(currentDiscount.minOrderValue).toLocaleString("en-IN")}`
                  : "No Minimum"}
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
                Max Discount Cap
              </span>
              <p className="text-sm font-bold text-slate-900">
                {currentDiscount.type === "percentage" && currentDiscount.maxDiscountAmount > 0
                  ? `₹${Number(currentDiscount.maxDiscountAmount).toLocaleString("en-IN")}`
                  : "No Cap"}
              </p>
            </div>
          </div>

          {/* Usage & Redemptions */}
          <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Usage & Validity
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase">Total Redemptions</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {currentDiscount.usedCount || 0}{" "}
                  {currentDiscount.usageLimit > 0
                    ? `/ ${currentDiscount.usageLimit} maximum`
                    : "(Unlimited)"}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase">Start Date</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {formatDate(currentDiscount.startDate)}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase">Expiry Date</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {formatDate(currentDiscount.endDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Scope Note */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Application Scope: </span>
            This coupon applies to the entire order subtotal during customer checkout when minimum order conditions are satisfied.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
