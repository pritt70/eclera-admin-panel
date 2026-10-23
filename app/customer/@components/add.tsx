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

interface CustomerAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CustomerAddDialog({
  open,
  onOpenChange,
  onSuccess,
}: CustomerAddDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [notes, setNotes] = useState("");

  // Address fields
  const [showAddress, setShowAddress] = useState(false);
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("India");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setStatus("active");
      setNotes("");
      setShowAddress(false);
      setStreet("");
      setCity("");
      setState("");
      setPostalCode("");
      setCountry("India");
      setFormError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      title: "Are you sure to save?",
      text: "This customer will be added to your store database.",
      confirmButtonText: "Save Customer",
      cancelButtonText: "Cancel",
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const addresses = [];
      if (street.trim() || city.trim() || postalCode.trim()) {
        addresses.push({
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
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        status,
        notes: notes.trim(),
        addresses,
      };

      const res = await api("customer/create", payload);

      if (res && res.status) {
        toast.success("Success", res.message || "Customer created successfully");
        onOpenChange(false);
        onSuccess();
      } else {
        setFormError(res?.message || "Failed to create customer");
        toast.error("Error", res?.message || "Failed to create customer");
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
            Add New Customer
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-0.5">
            Create a customer profile to track orders, addresses, and engagement.
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
                    placeholder="e.g. Rahul"
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
                    placeholder="e.g. Sharma"
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
                    placeholder="rahul.sharma@example.com"
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

            {/* Account Status */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold text-slate-800">
                  Account Status
                </Label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Active customers can log in and place orders on the storefront.
                </p>
              </div>
              <div className="flex items-center gap-2">
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

            {/* Internal Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Admin Internal Notes
              </Label>
              <Textarea
                placeholder="Add private staff notes regarding this customer..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-xs resize-none"
              />
            </div>

            {/* Address Toggle */}
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  Default Shipping Address
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddress(!showAddress)}
                  className="h-7 text-xs border-slate-300"
                >
                  {showAddress ? "Remove Address" : "+ Add Address"}
                </Button>
              </div>

              {showAddress && (
                <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in-50 duration-200">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">
                      Street Address
                    </Label>
                    <Input
                      placeholder="Flat / Building, Street, Area"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700">City</Label>
                      <Input
                        placeholder="Surat"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-9 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700">State</Label>
                      <Input
                        placeholder="Gujarat"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="h-9 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700">Postal Code</Label>
                      <Input
                        placeholder="395007"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="h-9 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-slate-700">Country</Label>
                      <Input
                        placeholder="India"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="h-9 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
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
              {submitting ? "Saving..." : "Save Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
