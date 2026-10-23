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

interface CustomerViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: any;
  onEdit: () => void;
}

export function CustomerViewDialog({
  open,
  onOpenChange,
  customer,
  onEdit,
}: CustomerViewDialogProps) {
  const [currentCustomer, setCurrentCustomer] = useState<any>(customer);

  useEffect(() => {
    setCurrentCustomer(customer);
    if (customer?._id && open) {
      api("customer/view", { id: customer._id })
        .then((res) => {
          if (res && res.status && res.data) {
            setCurrentCustomer(res.data);
          }
        })
        .catch(() => {});
    }
  }, [customer, open]);

  if (!currentCustomer) return null;

  const initials = `${(currentCustomer.firstName || "")[0] || ""}${(currentCustomer.lastName || "")[0] || ""}`.toUpperCase() || "C";
  const fullName = `${currentCustomer.firstName || ""} ${currentCustomer.lastName || ""}`.trim() || "Customer";
  const ordersCount = currentCustomer.ordersCount || 0;
  const totalSpent = currentCustomer.totalSpent || 0;
  const avgOrderValue = ordersCount > 0 ? Math.round(totalSpent / ordersCount) : 0;
  const addresses = Array.isArray(currentCustomer.addresses) ? currentCustomer.addresses : [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-2 py-0.5">
            Active
          </Badge>
        );
      case "blocked":
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-semibold px-2 py-0.5">
            Blocked
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs font-semibold px-2 py-0.5">
            Inactive
          </Badge>
        );
    }
  };

  const formattedDate = currentCustomer.createdAt
    ? new Date(currentCustomer.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClose={() => onOpenChange(false)}
        className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden"
      >
        <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-white pr-14 text-left">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-slate-900">
              Customer Profile
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
              Edit Customer
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Profile Overview Header Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#B4395A] text-white flex items-center justify-center font-bold text-base shadow-xs">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{fullName}</h3>
                  {getStatusBadge(currentCustomer.status)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>Customer ID: #{String(currentCustomer._id).slice(-6)}</span>
                  <span>•</span>
                  <span>Joined {formattedDate}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
                Total Orders
              </span>
              <p className="text-xl font-bold text-slate-900">{ordersCount}</p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
                Total Spent
              </span>
              <p className="text-xl font-bold text-slate-900">
                ₹{Number(totalSpent).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
                Avg Order Value
              </span>
              <p className="text-xl font-bold text-slate-900">
                ₹{avgOrderValue.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase">Email</p>
                <a
                  href={`mailto:${currentCustomer.email}`}
                  className="font-medium text-[#B4395A] hover:underline"
                >
                  {currentCustomer.email || "—"}
                </a>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase">Phone</p>
                <a
                  href={`tel:${currentCustomer.phone}`}
                  className="font-medium text-slate-800 hover:underline"
                >
                  {currentCustomer.phone || "Not provided"}
                </a>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          {currentCustomer.notes && (
            <div className="space-y-1.5 p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-lg">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Admin Notes
              </h4>
              <p className="text-xs text-amber-900/90 whitespace-pre-wrap leading-relaxed">
                {currentCustomer.notes}
              </p>
            </div>
          )}

          {/* Addresses Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Shipping Addresses ({addresses.length})
            </h4>

            {addresses.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                No saved address records for this customer yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr: any, index: number) => (
                  <div
                    key={addr._id || index}
                    className="p-3.5 bg-white border border-slate-200 rounded-lg text-xs space-y-1 relative"
                  >
                    {addr.isDefault && (
                      <span className="absolute top-2.5 right-2.5 text-[10px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.5 rounded border border-slate-200">
                        Default
                      </span>
                    )}
                    {addr.name && <p className="font-semibold text-slate-900">{addr.name}</p>}
                    {addr.street && <p className="text-slate-600">{addr.street}</p>}
                    <p className="text-slate-600">
                      {[addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ")}
                    </p>
                    {addr.country && <p className="text-slate-500 font-medium">{addr.country}</p>}
                    {addr.phone && (
                      <p className="text-slate-500 pt-1 text-[11px]">Phone: {addr.phone}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
