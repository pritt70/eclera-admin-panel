"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, DollarSign, Clock, FileText } from "lucide-react";

interface ShippingViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: any;
}

export function ShippingViewDialog({
  open,
  onOpenChange,
  rule,
}: ShippingViewDialogProps) {
  if (!rule) return null;

  const isFree = rule.type === "free" || Number(rule.rate || 0) === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 border-slate-200 bg-white overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="shrink-0 sticky top-0 z-20 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base font-semibold text-slate-900 tracking-tight">
                {rule.title}
              </DialogTitle>
              {isFree ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] uppercase font-semibold">
                  Free Shipping (₹0)
                </Badge>
              ) : (
                <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] uppercase font-semibold">
                  ₹{rule.rate} Delivery Charge
                </Badge>
              )}
              <Badge
                className={`text-[10px] uppercase font-semibold ${
                  rule.status === "active"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {rule.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Created on {new Date(rule.createdAt || Date.now()).toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Location Details Card */}
          <div className="border border-slate-200 rounded-[2px] p-4 bg-white space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-[#B4395A]" />
              <span>Target Region</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-[2px] border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase">Country</span>
                <span className="font-semibold text-slate-900">{rule.country || "India"}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-[2px] border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase">State</span>
                <span className="font-semibold text-slate-900">{rule.state || "All States"}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-[2px] border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase">City</span>
                <span className="font-semibold text-slate-900">{rule.city || "All Cities"}</span>
              </div>
            </div>
          </div>

          {/* Pricing & Thresholds Card */}
          <div className="border border-slate-200 rounded-[2px] p-4 bg-white space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Rate & Conditions</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-[2px] border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase">Delivery Charges</span>
                <span className="text-sm font-bold text-slate-900">
                  {isFree ? "Free (₹0)" : `₹${rule.rate}`}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-[2px] border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase">Free Shipping Threshold</span>
                <span className="font-semibold text-slate-900">
                  {rule.minOrderValue > 0 ? `Orders above ₹${rule.minOrderValue}` : "No threshold"}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Estimate */}
          <div className="border border-slate-200 rounded-[2px] p-4 bg-white space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Estimated Delivery Timeline</span>
            </div>
            <p className="text-xs text-slate-700 font-medium pt-1">
              {rule.estimatedDays || "3-5 Business Days"}
            </p>
          </div>

          {/* Notes */}
          {rule.notes && (
            <div className="border border-slate-200 rounded-[2px] p-4 bg-white space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Internal Notes</span>
              </div>
              <p className="text-xs text-slate-600 pt-1 whitespace-pre-wrap">{rule.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 sticky bottom-0 z-20 bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8.5 px-4 rounded-[2px] border-slate-300 hover:bg-slate-100 cursor-pointer"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
