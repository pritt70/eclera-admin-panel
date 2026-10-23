"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/helper";
import toast from "@/lib/toast";
import { Mail, CheckCircle2 } from "lucide-react";

interface CartViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: any;
  onCartUpdated?: () => void;
}

export function AbandonedCartViewDialog({
  open,
  onOpenChange,
  cart,
  onCartUpdated,
}: CartViewDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!cart) return null;

  const handleSendRecovery = async () => {
    setLoading(true);
    try {
      const res = await api("abandoned-cart/send-recovery", { id: cart._id });
      if (res && res.status) {
        toast.success("Email Sent", `Recovery reminder dispatched to ${cart.customer?.email}`);
        if (onCartUpdated) onCartUpdated();
      } else {
        toast.error("Failed to Send", res?.message || "Could not dispatch recovery reminder");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRecovered = async () => {
    setLoading(true);
    try {
      const res = await api("abandoned-cart/change-status", {
        id: cart._id,
        recoveryStatus: "recovered",
      });
      if (res && res.status) {
        toast.success("Status Updated", `Cart marked as recovered!`);
        if (onCartUpdated) onCartUpdated();
      } else {
        toast.error("Failed to Update", res?.message || "Could not update status");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getRecoveryBadge = (st: string) => {
    switch (st) {
      case "recovered":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] uppercase">Recovered</Badge>;
      case "email_sent":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] uppercase">Email Sent</Badge>;
      case "expired":
        return <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] uppercase">Expired</Badge>;
      case "abandoned":
      default:
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] uppercase">Abandoned</Badge>;
    }
  };

  const formattedDate = cart.lastActivityAt
    ? new Date(cart.lastActivityAt).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-slate-200 bg-white">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base font-semibold text-slate-900">
                Cart #{cart.cartNumber}
              </DialogTitle>
              {getRecoveryBadge(cart.recoveryStatus)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Last customer activity on {formattedDate}</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Action Banner */}
          {cart.recoveryStatus !== "recovered" && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-[2px] flex items-center justify-between gap-3">
              <div className="text-xs text-amber-900">
                <span className="font-semibold">Cart Abandoned at: </span>
                <span className="capitalize">{cart.checkoutStep?.replace("_", " ") || "Cart view"}</span>
                {cart.emailSentCount > 0 && (
                  <span className="text-amber-700 ml-1">
                    ({cart.emailSentCount} recovery email{cart.emailSentCount > 1 ? "s" : ""} sent)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={loading}
                  onClick={handleSendRecovery}
                  className="h-7 text-xs bg-[#B4395A] hover:bg-[#9b2f4c] text-white flex items-center gap-1 rounded-[2px]"
                >
                  <Mail className="w-3 h-3" />
                  <span>Send Recovery Email</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={handleMarkRecovered}
                  className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1 rounded-[2px]"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Mark Recovered</span>
                </Button>
              </div>
            </div>
          )}

          {/* Customer Details */}
          <div className="border border-slate-200 rounded-[2px] p-4 bg-white">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              Customer Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Customer Name:</span>
                <span className="font-semibold text-slate-900">{cart.customer?.name || "Anonymous"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Email Address:</span>
                <span className="font-medium text-slate-700">{cart.customer?.email || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Phone:</span>
                <span className="font-medium text-slate-700">{cart.customer?.phone || "—"}</span>
              </div>
            </div>
          </div>

          {/* Items in Cart */}
          <div className="border border-slate-200 rounded-[2px] overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Abandoned Items ({cart.items?.length || 0})
              </h4>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-white border-b border-slate-200">
                  <TableHead className="text-xs font-semibold text-slate-600">Product</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-right">Price</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-center">Qty</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.items?.map((item: any, idx: number) => (
                  <TableRow key={idx} className="border-b border-slate-100">
                    <TableCell className="text-xs py-3">
                      <div className="font-semibold text-slate-900">{item.productName}</div>
                      {item.variantName && (
                        <div className="text-[11px] text-slate-500">{item.variantName}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-right py-3 text-slate-700">
                      ₹{Number(item.price || 0).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-xs text-center py-3 font-semibold text-slate-800">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-xs text-right py-3 font-semibold text-slate-900">
                      ₹{Number(item.subtotal || item.price * item.quantity || 0).toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
              <span>Total Abandoned Value</span>
              <span className="text-[#B4395A]">
                ₹{Number(cart.cartTotal || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Recovery History */}
          <div className="border border-slate-200 rounded-[2px] p-4 bg-white text-xs space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider">Recovery Log</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-slate-500 block text-[11px]">Emails Dispatched:</span>
                <span className="font-semibold text-slate-900">{cart.emailSentCount || 0}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Last Reminder Sent:</span>
                <span className="font-medium text-slate-700">
                  {cart.lastEmailSentAt
                    ? new Date(cart.lastEmailSentAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Never"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Recovered At:</span>
                <span className="font-medium text-slate-700">
                  {cart.recoveredAt
                    ? new Date(cart.recoveredAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Not yet"}
                </span>
              </div>
            </div>
            {cart.notes && (
              <div className="pt-2 text-[11px] text-slate-500 italic border-t border-slate-100">
                Note: {cart.notes}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8.5 px-4 rounded-[2px] border-slate-300"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
