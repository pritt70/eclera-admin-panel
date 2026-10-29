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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/helper";
import toast from "@/lib/toast";
import { COUNTRIES, getStatesForCountry } from "@/lib/countries";

interface CustomerEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: any;
  onSuccess: () => void;
}

export function CustomerEditDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerEditDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "blocked">("active");
  const [notes, setNotes] = useState("");

  // Address fields
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("India");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (customer && open) {
      setFirstName(customer.firstName || "");
      setLastName(customer.lastName || "");
      setEmail(customer.email || "");
      setPhone(customer.phone || "");
      setStatus(customer.status || "active");
      setNotes(customer.notes || "");

      const primaryAddr = customer.addresses?.[0] || {};
      setStreet(primaryAddr.street || "");
      setCity(primaryAddr.city || "");
      setState(primaryAddr.state || "");
      setPostalCode(primaryAddr.postalCode || "");
      setCountry(primaryAddr.country || "India");

      setFormError(null);
    }
  }, [customer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer?._id) return;
    setFormError(null);

    if (!firstName.trim()) {
      setFormError("First name is required.");
      return;
    }
    if (!email.trim()) {
      setFormError("Email address is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }

    const confirmed = await toast.confirm({
      title: "Update Customer?",
      text: "Are you sure you want to save changes to this customer profile?",
      confirmButtonText: "Update Customer",
      cancelButtonText: "Cancel",
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const addresses = [];
      if (street.trim() || city.trim() || postalCode.trim()) {
        addresses.push({
          _id: customer.addresses?.[0]?._id,
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          phone: phone.trim(),
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          country: country.trim() || "India",
          isDefault: true,
        });
      }

      const payload = {
        id: customer._id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        status,
        notes: notes.trim(),
        addresses,
      };

      const res = await api("customer/update", payload);

      if (res && res.status) {
        toast.success("Success", res.message || "Customer updated successfully");
        onOpenChange(false);
        onSuccess();
      } else {
        setFormError(res?.message || "Failed to update customer");
        toast.error("Error", res?.message || "Failed to update customer");
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
            Edit Customer
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-0.5">
            Update personal info, contact details, status, or addresses for {customer?.firstName} {customer?.lastName}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                {formError}
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Personal Information
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Last Name
                  </Label>
                  <Input
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">
                    Phone Number
                  </Label>
                  <Input
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Status Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Account Status</Label>
              <Select
                value={status}
                onValueChange={(val: any) => {
                  if (val) setStatus(val);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="text-xs">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Active (Storefront login & checkout allowed)
                    </span>
                  </SelectItem>
                  <SelectItem value="inactive" className="text-xs">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      Inactive (Temporarily suspended)
                    </span>
                  </SelectItem>
                  <SelectItem value="blocked" className="text-xs">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Blocked (Fraudulent / Banned)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Internal Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Admin Internal Notes
              </Label>
              <Textarea
                placeholder="Notes about customer preferences, order issues, or history..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-xs resize-none"
              />
            </div>

            {/* Address */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Primary Address
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Street Address</Label>
                <Input
                  placeholder="Flat / Building, Street, Area"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Country</Label>
                  <select
                    value={country}
                    onChange={(e) => {
                      const newCountry = e.target.value;
                      setCountry(newCountry);
                      const states = getStatesForCountry(newCountry);
                      if (states.length > 0) {
                        setState(states[0]);
                      } else {
                        setState("");
                      }
                    }}
                    className="w-full h-9 px-2 text-xs border border-slate-300 rounded-[2px] bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#B4395A]"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">State / Province</Label>
                  {getStatesForCountry(country).length > 0 ? (
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full h-9 px-2 text-xs border border-slate-300 rounded-[2px] bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#B4395A]"
                    >
                      <option value="">Select State</option>
                      {getStatesForCountry(country).map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      placeholder="Gujarat"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="h-9 text-xs"
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">City</Label>
                  <Input
                    placeholder="Surat"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Postal Code</Label>
                  <Input
                    placeholder="395007"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
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
              {submitting ? "Updating..." : "Update Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
