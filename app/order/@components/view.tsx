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

interface OrderViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  onOrderUpdated?: () => void;
}

export function OrderViewDialog({
  open,
  onOpenChange,
  order,
  onOrderUpdated,
}: OrderViewDialogProps) {
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(order?.orderStatus || "pending");
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState<string>(order?.paymentStatus || "pending");

  React.useEffect(() => {
    if (order) {
      setCurrentStatus(order.orderStatus || "pending");
      setCurrentPaymentStatus(order.paymentStatus || "pending");
    }
  }, [order]);

  if (!order) return null;

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await api("order/change-status", {
        id: order._id,
        orderStatus: newStatus,
      });

      if (res && res.status) {
        toast.success("Order Updated", `Status changed to ${newStatus}`);
        setCurrentStatus(newStatus);
        if (onOrderUpdated) onOrderUpdated();
      } else {
        toast.error("Update Failed", res?.message || "Could not update status");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "An unexpected error occurred");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePaymentStatus = async (newPaymentStatus: string) => {
    setUpdating(true);
    try {
      const res = await api("order/change-status", {
        id: order._id,
        paymentStatus: newPaymentStatus,
      });

      if (res && res.status) {
        toast.success("Payment Updated", `Payment status is now ${newPaymentStatus}`);
        setCurrentPaymentStatus(newPaymentStatus);
        if (onOrderUpdated) onOrderUpdated();
      } else {
        toast.error("Update Failed", res?.message || "Could not update payment status");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "An unexpected error occurred");
    } finally {
      setUpdating(false);
    }
  };

  const getOrderStatusBadge = (st: string) => {
    switch (st) {
      case "delivered":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase text-[10px] tracking-wider">Delivered</Badge>;
      case "shipped":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 uppercase text-[10px] tracking-wider">Shipped</Badge>;
      case "processing":
        return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 uppercase text-[10px] tracking-wider">Processing</Badge>;
      case "confirmed":
        return <Badge className="bg-sky-50 text-sky-700 border-sky-200 uppercase text-[10px] tracking-wider">Confirmed</Badge>;
      case "cancelled":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 uppercase text-[10px] tracking-wider">Cancelled</Badge>;
      case "pending":
      default:
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 uppercase text-[10px] tracking-wider">Pending</Badge>;
    }
  };

  const getPaymentStatusBadge = (pst: string) => {
    switch (pst) {
      case "paid":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Paid</Badge>;
      case "refunded":
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">Refunded</Badge>;
      case "failed":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">Failed</Badge>;
      case "pending":
      default:
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Pending</Badge>;
    }
  };

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 border-slate-200 bg-white overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="shrink-0 sticky top-0 z-20 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base font-semibold text-slate-900">
                Order #{order.orderNumber}
              </DialogTitle>
              {getOrderStatusBadge(currentStatus)}
              {getPaymentStatusBadge(currentPaymentStatus)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Placed on {formattedDate}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Quick Bar */}
          <div className="p-3.5 bg-slate-50 rounded-[2px] border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Fulfillment Status:</span>
              <select
                value={currentStatus}
                disabled={updating}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-[2px] px-2.5 py-1 text-slate-800 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#B4395A]"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Payment Status:</span>
              <select
                value={currentPaymentStatus}
                disabled={updating}
                onChange={(e) => handleUpdatePaymentStatus(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-[2px] px-2.5 py-1 text-slate-800 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#B4395A]"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {/* Customer & Shipping Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Information */}
            <div className="border border-slate-200 rounded-[2px] p-4 bg-white">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                Customer Details
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-semibold text-slate-900">{order.customer?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-medium text-slate-700">{order.customer?.email || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-medium text-slate-700">{order.customer?.phone || "—"}</span>
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="border border-slate-200 rounded-[2px] p-4 bg-white">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                Shipping Address
              </h4>
              <div className="space-y-1 text-xs text-slate-700">
                <div className="font-semibold text-slate-900">
                  {order.shippingAddress?.name || order.customer?.name}
                </div>
                <div>{order.shippingAddress?.street || "—"}</div>
                <div>
                  {[
                    order.shippingAddress?.city,
                    order.shippingAddress?.state,
                    order.shippingAddress?.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </div>
                <div>{order.shippingAddress?.country || "India"}</div>
                {order.shippingAddress?.phone && (
                  <div className="text-slate-500 mt-1">Phone: {order.shippingAddress.phone}</div>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-[2px] overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Order Items ({order.items?.length || 0})
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
                {order.items?.map((item: any, idx: number) => (
                  <TableRow key={idx} className="border-b border-slate-100">
                    <TableCell className="text-xs py-3">
                      <div className="font-semibold text-slate-900">{item.productName}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.variantName ? `${item.variantName} • ` : ""}
                        SKU: {item.sku || "N/A"}
                      </div>
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

            {/* Financial Breakdown */}
            <div className="bg-slate-50/50 p-4 border-t border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{Number(order.subtotal || 0).toLocaleString("en-IN")}</span>
              </div>
              {Number(order.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>
                    Discount {order.couponCode && `(${order.couponCode})`}
                  </span>
                  <span>-₹{Number(order.discountAmount).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Shipping Fee</span>
                <span>
                  {Number(order.shippingFee || 0) === 0 ? "FREE" : `₹${order.shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="text-[#B4395A]">
                  ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Payment & Tracking Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-[2px] p-4 bg-white text-xs space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider">Payment Information</h4>
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span className="font-semibold uppercase text-slate-900">
                  {order.paymentMethod === "upi_qr" || order.paymentMethod === "qr"
                    ? "UPI QR Code"
                    : order.paymentMethod === "prepaid"
                    ? "Prepaid"
                    : order.paymentMethod === "advance"
                    ? "Advance Payment"
                    : order.paymentMethod || "COD"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span>{getPaymentStatusBadge(currentPaymentStatus)}</span>
              </div>
              {order.paymentScreenshot ? (
                <div className="pt-2.5 mt-2 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-semibold text-[11px] uppercase tracking-wide">
                      Payment Proof Screenshot:
                    </span>
                    <a
                      href={order.paymentScreenshot}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-semibold text-[#B4395A] hover:underline"
                    >
                      View Full Image ↗
                    </a>
                  </div>
                  {order.utrNumber && (
                    <div className="text-[11px] text-slate-700 bg-slate-50 p-1 rounded font-mono">
                      UTR / Txn ID: <strong>{order.utrNumber}</strong>
                    </div>
                  )}
                  <div className="relative border border-slate-200 rounded-[2px] bg-slate-50 overflow-hidden group">
                    <img
                      src={order.paymentScreenshot}
                      alt="Payment Proof Screenshot"
                      className="w-full max-h-56 object-contain cursor-pointer hover:opacity-95"
                      onClick={() => window.open(order.paymentScreenshot, "_blank")}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border border-slate-200 rounded-[2px] p-4 bg-white text-xs space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider">Shipping & Tracking</h4>
              <div className="flex justify-between">
                <span className="text-slate-500">Carrier:</span>
                <span className="font-medium text-slate-800">{order.tracking?.carrier || "Not assigned"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tracking #:</span>
                <span className="font-medium text-slate-800">{order.tracking?.trackingNumber || "—"}</span>
              </div>
              {order.notes && (
                <div className="pt-1 text-[11px] text-slate-500 italic">
                  Note: {order.notes}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
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
