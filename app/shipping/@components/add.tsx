"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { api } from "@/helper";
import toast from "@/lib/toast";
import { COUNTRIES, getStatesForCountry } from "@/lib/countries";

interface ShippingAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ShippingAddDialog({
  open,
  onOpenChange,
  onSuccess,
}: ShippingAddDialogProps) {
  const [title, setTitle] = useState("");
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("All States");
  const [city, setCity] = useState("All Cities");
  const [postalCodes, setPostalCodes] = useState("");
  const [rate, setRate] = useState<number>(0);
  const [minOrderValue, setMinOrderValue] = useState<number>(0);
  const [estimatedDays, setEstimatedDays] = useState("3-5 Business Days");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // States available for the selected country
  const availableStates = ["All States", ...getStatesForCountry(country)];

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTitle("");
      setCountry("India");
      setState("All States");
      setCity("All Cities");
      setPostalCodes("");
      setRate(0);
      setMinOrderValue(0);
      setEstimatedDays("3-5 Business Days");
      setStatus("active");
      setNotes("");
      setFormError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Shipping zone title is required");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const deliveryRate = Math.max(0, Number(rate) || 0);
      const parsedPostalCodes = postalCodes
        ? postalCodes.split(",").map((p) => p.trim()).filter(Boolean)
        : [];

      const payload = {
        title: title.trim(),
        country: country.trim() || "India",
        state: state.trim() || "All States",
        city: city.trim() || "All Cities",
        postalCodes: parsedPostalCodes,
        type: deliveryRate === 0 ? "free" : "paid",
        rate: deliveryRate,
        minOrderValue: Number(minOrderValue) || 0,
        estimatedDays: estimatedDays.trim() || "3-5 Business Days",
        status,
        notes: notes.trim(),
      };

      const res = await api("shipping/create", payload);

      if (res && res.status) {
        toast.success("Shipping Rule Created", `Shipping rule "${title}" added successfully.`);
        onOpenChange(false);
        onSuccess();
      } else {
        setFormError(res?.message || "Failed to create shipping rule");
      }
    } catch (err: any) {
      setFormError(err?.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const isFree = Number(rate || 0) === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 border-slate-200 bg-white overflow-hidden shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="shrink-0 sticky top-0 z-20 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900 tracking-tight">
                Add Shipping Zone & Rule
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure Country, State, and City wise Free or Paid delivery rates.
              </p>
            </div>
          </div>

          {/* Form Body - Balanced Grouping (col-12 & col-6 only) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-[2px] text-xs">
                {formError}
              </div>
            )}

            {/* Col 12: Zone Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800">
                Zone / Rule Title <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                required
                placeholder="e.g. Free Delivery - Gujarat or Standard India Shipping"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-xs rounded-[2px] border-slate-300 focus:border-[#B4395A]"
              />
              <p className="text-[11px] text-slate-400">
                A clear, descriptive title to identify this delivery zone rule.
              </p>
            </div>

            {/* Group 1: Geographic Region (2x2 Grid: all col-6) */}
            <div className="border border-slate-200 rounded-[2px] bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                <span className="w-1.5 h-3.5 bg-[#B4395A] rounded-full inline-block" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Geographic Region
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Col 6: Country */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Country <span className="text-red-500">*</span>
                  </Label>
                  <select
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      setState("All States");
                    }}
                    className="w-full h-9 bg-white border border-slate-300 rounded-[2px] px-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#B4395A] cursor-pointer"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Col 6: State */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">State / Province</Label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full h-9 bg-white border border-slate-300 rounded-[2px] px-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#B4395A] cursor-pointer"
                  >
                    {availableStates.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Col 6: City */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">City</Label>
                  <Input
                    type="text"
                    placeholder="All Cities (or e.g. Surat)"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-9 text-xs bg-white rounded-[2px] border-slate-300"
                  />
                  <p className="text-[10px] text-slate-400">Leave "All Cities" to apply to entire state.</p>
                </div>

                {/* Col 6: Postal Codes */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Postal / PIN Codes</Label>
                  <Input
                    type="text"
                    placeholder="e.g. 395001, 395002 (Optional)"
                    value={postalCodes}
                    onChange={(e) => setPostalCodes(e.target.value)}
                    className="h-9 text-xs bg-white rounded-[2px] border-slate-300 font-mono"
                  />
                  <p className="text-[10px] text-slate-400">Comma-separated PIN codes, or leave blank for all.</p>
                </div>
              </div>
            </div>

            {/* Group 2: Delivery Charges & Settings (2x2 Grid: all col-6) */}
            <div className="border border-slate-200 rounded-[2px] bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-3.5 bg-emerald-600 rounded-full inline-block" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Delivery Charges & Settings
                  </h4>
                </div>
                {isFree ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ✓ Free Shipping (₹0)
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-300">
                    Paid Shipping (₹{rate})
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Col 6: Delivery Charge Rate */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Delivery Charges (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={rate}
                    onChange={(e) => setRate(Math.max(0, Number(e.target.value) || 0))}
                    className="h-9 text-xs bg-white rounded-[2px] border-slate-300 font-semibold"
                  />
                  <p className="text-[10px] text-slate-500">
                    Enter 0 for Free Shipping, or enter standard rate (e.g. ₹50).
                  </p>
                </div>

                {/* Col 6: Free Shipping Threshold */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Free on Orders Above (₹)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={minOrderValue || ""}
                    onChange={(e) => setMinOrderValue(Number(e.target.value) || 0)}
                    className="h-9 text-xs bg-white rounded-[2px] border-slate-300"
                  />
                  <p className="text-[10px] text-slate-500">
                    Free delivery when order total is greater than or equal to this amount (0 = none).
                  </p>
                </div>

                {/* Col 6: Estimated Delivery Time */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">
                    Estimated Delivery Time
                  </Label>
                  <Input
                    type="text"
                    placeholder="e.g. 2-4 Business Days or Same Day"
                    value={estimatedDays}
                    onChange={(e) => setEstimatedDays(e.target.value)}
                    className="h-9 text-xs bg-white rounded-[2px] border-slate-300"
                  />
                  <p className="text-[10px] text-slate-400">Estimated delivery timeline displayed to customer.</p>
                </div>

                {/* Col 6: Status Toggle Card */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Rule Status</Label>
                  <div className="h-9 px-3 bg-white border border-slate-300 rounded-[2px] flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">
                      {status === "active" ? (
                        <span className="text-emerald-700 font-semibold">● Active on Checkout</span>
                      ) : (
                        <span className="text-slate-500">○ Inactive (Disabled)</span>
                      )}
                    </span>
                    <Switch
                      checked={status === "active"}
                      onCheckedChange={(checked: boolean) => setStatus(checked ? "active" : "inactive")}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Enable or disable this rule during customer checkout.</p>
                </div>
              </div>
            </div>

            {/* Col 12: Internal Notes */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Internal Notes (Optional)</Label>
              <Textarea
                rows={2}
                placeholder="Add internal notes or courier partner details (e.g. Shiprocket, BlueDart, Delhivery)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs rounded-[2px] bg-white border-slate-300 resize-none"
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 sticky bottom-0 z-20 bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8.5 px-4 rounded-[2px] border-slate-300 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="text-xs h-8.5 px-4 rounded-[2px] bg-[#B4395A] hover:bg-[#9b2f4c] text-white font-semibold cursor-pointer shadow-xs"
            >
              {submitting ? "Saving..." : "Create Shipping Rule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ShippingAddDialog;
