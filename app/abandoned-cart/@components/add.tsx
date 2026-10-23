"use client";

import React, { useState } from "react";
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
import { Plus, Trash2 } from "lucide-react";

interface AbandonedCartAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCartAdded: () => void;
}

interface CartItemInput {
  productName: string;
  price: number;
  quantity: number;
}

export function AbandonedCartAddDialog({
  open,
  onOpenChange,
  onCartAdded,
}: AbandonedCartAddDialogProps) {
  const [loading, setLoading] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [checkoutStep, setCheckoutStep] = useState("shipping_address");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<CartItemInput[]>([
    { productName: "", price: 0, quantity: 1 },
  ]);

  const resetForm = () => {
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCheckoutStep("shipping_address");
    setNotes("");
    setItems([{ productName: "", price: 0, quantity: 1 }]);
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productName: "", price: 0, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof CartItemInput, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const cartTotal = items.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!customerEmail.trim()) {
      toast.error("Valid customer email is required");
      return;
    }

    const validItems = items.filter((it) => it.productName.trim() && it.price > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one item with product name and price");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer: {
          name: customerName.trim(),
          email: customerEmail.trim().toLowerCase(),
          phone: customerPhone.trim(),
        },
        items: validItems.map((it) => ({
          productName: it.productName.trim(),
          price: Number(it.price),
          quantity: Number(it.quantity) || 1,
          subtotal: Number(it.price) * (Number(it.quantity) || 1),
        })),
        cartTotal,
        checkoutStep,
        notes: notes.trim(),
      };

      const res = await api("abandoned-cart/create", payload);

      if (res && res.status) {
        toast.success("Abandoned Cart Logged", res.message || "Cart record created.");
        resetForm();
        onOpenChange(false);
        onCartAdded();
      } else {
        toast.error("Creation Failed", res?.message || "Could not log cart.");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-slate-200 bg-white">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-6 border-b border-slate-100">
            <DialogTitle className="text-base font-semibold text-slate-900">
              Log Abandoned Cart
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-1">
              Simulate or manually record an unfinished customer checkout session.
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Customer Information */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Customer Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Customer Name *</Label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Meera Nair"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-9 text-xs rounded-[2px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Email Address *</Label>
                  <Input
                    type="email"
                    required
                    placeholder="e.g. meera.nair@gmail.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="h-9 text-xs rounded-[2px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Phone Number</Label>
                  <Input
                    type="text"
                    placeholder="e.g. +91 9845012345"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="h-9 text-xs rounded-[2px]"
                  />
                </div>
              </div>
            </div>

            {/* Abandoned Step */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Checkout Step Abandoned</Label>
              <select
                value={checkoutStep}
                onChange={(e) => setCheckoutStep(e.target.value)}
                className="w-full h-9 bg-white border border-slate-300 rounded-[2px] px-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#B4395A]"
              >
                <option value="cart">Cart View</option>
                <option value="contact_info">Customer Contact Info Entry</option>
                <option value="shipping_address">Shipping Address Entry</option>
                <option value="payment_pending">Payment Selection / Pending</option>
              </select>
            </div>

            {/* Cart Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Cart Items ({items.length})
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-7 text-xs border-slate-300 rounded-[2px] flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-2 border border-slate-200 rounded-[2px] p-3 bg-slate-50/50">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white p-2 border border-slate-200 rounded-[2px]">
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder="Product Name *"
                        value={item.productName}
                        onChange={(e) => handleItemChange(idx, "productName", e.target.value)}
                        className="h-8 text-xs rounded-[2px]"
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Price (₹)"
                        value={item.price || ""}
                        onChange={(e) => handleItemChange(idx, "price", Number(e.target.value))}
                        className="h-8 text-xs rounded-[2px]"
                      />
                    </div>
                    <div className="w-16">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity || ""}
                        onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                        className="h-8 text-xs rounded-[2px] text-center"
                      />
                    </div>
                    <div className="w-24 text-right text-xs font-semibold text-slate-800 pr-2">
                      ₹{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString("en-IN")}
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Calculated Value */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-[2px] flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Total Cart Value:</span>
              <span className="text-base font-bold text-[#B4395A]">
                ₹{cartTotal.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Internal Notes</Label>
              <Textarea
                rows={2}
                placeholder="Optional notes or remarks regarding this abandoned checkout..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs rounded-[2px]"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
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
              {loading ? "Saving..." : "Log Cart"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
