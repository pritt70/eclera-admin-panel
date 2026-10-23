"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/helper";
import toast from "@/lib/toast";

interface OrderEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  onOrderUpdated: () => void;
}

export function OrderEditDialog({
  open,
  onOpenChange,
  order,
  onOrderUpdated,
}: OrderEditDialogProps) {
  const [loading, setLoading] = useState(false);

  const [orderStatus, setOrderStatus] = useState("pending");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (order) {
      setOrderStatus(order.orderStatus || "pending");
      setPaymentStatus(order.paymentStatus || "pending");
      setPaymentMethod(order.paymentMethod || "cod");
      setCarrier(order.tracking?.carrier || "");
      setTrackingNumber(order.tracking?.trackingNumber || "");
      setTrackingUrl(order.tracking?.trackingUrl || "");
      setNotes(order.notes || "");
    }
  }, [order]);

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        id: order._id,
        orderStatus,
        paymentStatus,
        paymentMethod,
        tracking: {
          carrier: carrier.trim(),
          trackingNumber: trackingNumber.trim(),
          trackingUrl: trackingUrl.trim(),
        },
        notes: notes.trim(),
      };

      const res = await api("order/update", payload);

      if (res && res.status) {
        toast.success("Order Updated", `Order #${order.orderNumber} updated successfully.`);
        onOpenChange(false);
        onOrderUpdated();
      } else {
        toast.error("Update Failed", res?.message || "Failed to update order details.");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 border-slate-200 bg-white overflow-hidden shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="shrink-0 sticky top-0 z-20 bg-white p-6 border-b border-slate-100">
            <DialogTitle className="text-base font-semibold text-slate-900">
              Edit Order #{order.orderNumber}
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-1">
              Update fulfillment status, shipping tracking, and payment state.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Statuses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Fulfillment Status</Label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full h-9 bg-white border border-slate-300 rounded-[2px] px-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#B4395A]"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Payment Status</Label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full h-9 bg-white border border-slate-300 rounded-[2px] px-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#B4395A]"
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Payment Method</Label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-9 bg-white border border-slate-300 rounded-[2px] px-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#B4395A]"
              >
                <option value="prepaid">Prepaid</option>
                <option value="advance">Advance Payment</option>
                <option value="cod">Cash on Delivery (COD)</option>
                <option value="upi">UPI / Online</option>
                <option value="card">Card</option>
              </select>
            </div>

            {/* Tracking Information */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Shipping & Tracking Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Courier / Carrier</Label>
                  <Input
                    type="text"
                    placeholder="e.g. BlueDart, Delhivery"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="h-9 text-xs rounded-[2px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Tracking Number</Label>
                  <Input
                    type="text"
                    placeholder="e.g. BD987654321IN"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="h-9 text-xs rounded-[2px]"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Tracking URL</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  className="h-9 text-xs rounded-[2px]"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <Label className="text-xs font-semibold text-slate-700">Internal Order Notes</Label>
              <Textarea
                rows={3}
                placeholder="Notes for order fulfillment or customer special requests..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs rounded-[2px]"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 sticky bottom-0 z-20 bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8.5 px-4 rounded-[2px] border-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="text-xs h-8.5 px-4 rounded-[2px] bg-[#B4395A] hover:bg-[#9b2f4c] text-white font-semibold"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
