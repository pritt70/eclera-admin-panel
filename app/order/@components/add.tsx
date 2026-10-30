"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/helper";
import toast from "@/lib/toast";
import { Plus, Trash2, Check, Tag, X } from "lucide-react";
import { Select } from "@/components/select";
import { COUNTRIES, getStatesForCountry } from "@/lib/countries";

interface OrderAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderAdded: () => void;
}

interface OrderItemState {
  productId: string;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
  image: string;
}

export function OrderAddDialog({
  open,
  onOpenChange,
  onOrderAdded,
}: OrderAddDialogProps) {
  const [loading, setLoading] = useState(false);

  // Products, coupons and customers available in the store
  const [products, setProducts] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [fetchingCatalog, setFetchingCatalog] = useState(false);

  // Customer state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Shipping state
  const [country, setCountry] = useState("India");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Gujarat");
  const [postalCode, setPostalCode] = useState("");

  // Items state
  const [items, setItems] = useState<OrderItemState[]>([
    {
      productId: "",
      productName: "",
      sku: "",
      price: 0,
      quantity: 1,
      subtotal: 0,
      image: "",
    },
  ]);

  // Coupon & Discount state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [couponModalOpen, setCouponModalOpen] = useState(false);

  // Payment method: "prepaid" | "advance"
  const [paymentMethod, setPaymentMethod] = useState<"prepaid" | "advance">("prepaid");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [orderStatus, setOrderStatus] = useState("pending");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [returnReason, setReturnReason] = useState("");

  // Fetch catalog products, active discounts and customers whenever modal opens
  const fetchCatalogData = useCallback(async () => {
    setFetchingCatalog(true);
    try {
      const [prodRes, discRes, custRes] = await Promise.all([
        api("product/list", { limit: 100 }),
        api("discount/list", { limit: 50, status: "active" }),
        api("customer/list", { limit: 100 }),
      ]);

      if (prodRes && prodRes.status && prodRes.data?.products) {
        setProducts(prodRes.data.products);
      }
      if (discRes && discRes.status && discRes.data?.discounts) {
        setCoupons(discRes.data.discounts);
      }
      if (custRes && custRes.status && custRes.data?.customers) {
        setCustomers(custRes.data.customers);
      }
    } catch (err) {
      console.error("Failed to load catalog data:", err);
    } finally {
      setFetchingCatalog(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchCatalogData();
    }
  }, [open, fetchCatalogData]);

  // Handle existing customer selection
  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (!customerId) return;

    const cust = customers.find((c) => c._id === customerId);
    if (cust) {
      const fullName = `${cust.firstName || ""} ${cust.lastName || ""}`.trim();
      setCustomerName(fullName);
      setCustomerEmail(cust.email || "");
      setCustomerPhone(cust.phone || "");

      if (cust.addresses && cust.addresses.length > 0) {
        const addr = cust.addresses.find((a: any) => a.isDefault) || cust.addresses[0];
        if (addr) {
          if (addr.street) setStreet(addr.street);
          if (addr.city) setCity(addr.city);
          if (addr.state) setState(addr.state);
          if (addr.postalCode) setPostalCode(addr.postalCode);
          if (addr.country) setCountry(addr.country);
        }
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedCustomerId("");
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCountry("India");
    setStreet("");
    setCity("");
    setState("Gujarat");
    setPostalCode("");
    setItems([
      {
        productId: "",
        productName: "",
        sku: "",
        price: 0,
        quantity: 1,
        subtotal: 0,
        image: "",
      },
    ]);
    setCouponCodeInput("");
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setShippingFee(0);
    setPaymentMethod("prepaid");
    setPaymentStatus("paid");
    setOrderStatus("pending");
    setReturnReason("");
    setCarrier("");
    setTrackingNumber("");
    setNotes("");
  };

  // Subtotal calculation
  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  }, [items]);

  // Memoized product options for search-select dropdown
  const productOptions = useMemo(() => {
    return products.map((p) => ({
      value: p._id,
      label: `${p.name} — ₹${p.price}${p.sku ? ` (SKU: ${p.sku})` : ""}`,
      product: p,
    }));
  }, [products]);

  // Recalculate discount whenever subtotal changes if a coupon is active
  useEffect(() => {
    if (!appliedCoupon) {
      setDiscountAmount(0);
      return;
    }

    // Check min order value
    if (appliedCoupon.minOrderValue && subtotal < appliedCoupon.minOrderValue) {
      // Order dropped below min order value
      setDiscountAmount(0);
      setAppliedCoupon(null);
      toast.warning(
        "Coupon Removed",
        `Subtotal ₹${subtotal} is below minimum requirement of ₹${appliedCoupon.minOrderValue} for coupon ${appliedCoupon.code}`
      );
      return;
    }

    let calculatedDiscount = 0;
    if (appliedCoupon.type === "percentage") {
      calculatedDiscount = (subtotal * Number(appliedCoupon.value)) / 100;
      if (appliedCoupon.maxDiscountAmount && Number(appliedCoupon.maxDiscountAmount) > 0) {
        calculatedDiscount = Math.min(calculatedDiscount, Number(appliedCoupon.maxDiscountAmount));
      }
    } else {
      calculatedDiscount = Math.min(Number(appliedCoupon.value), subtotal);
    }

    setDiscountAmount(Math.round(calculatedDiscount));
  }, [subtotal, appliedCoupon]);

  // Grand total
  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - (Number(discountAmount) || 0) + (Number(shippingFee) || 0));
  }, [subtotal, discountAmount, shippingFee]);

  // Product Selection handler
  const handleSelectProduct = (index: number, selectedProdId: string) => {
    const selected = products.find((p) => p._id === selectedProdId);
    if (!selected) {
      // Clear selection
      setItems((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          productId: "",
          productName: "",
          sku: "",
          price: 0,
          subtotal: 0,
          image: "",
        };
        return next;
      });
      return;
    }

    setItems((prev) => {
      const next = [...prev];
      const qty = next[index]?.quantity || 1;
      const unitPrice = Number(selected.price || 0);
      next[index] = {
        productId: selected._id,
        productName: selected.name,
        sku: selected.sku || "",
        price: unitPrice,
        quantity: qty,
        subtotal: unitPrice * qty,
        image: selected.thumbnail?.url || "",
      };
      return next;
    });
  };

  // Quantity Change handler (ONLY qty can be changed, rate is locked)
  const handleQtyChange = (index: number, newQty: number) => {
    const sanitizedQty = Math.max(1, Math.floor(newQty) || 1);
    setItems((prev) => {
      const next = [...prev];
      const item = next[index];
      const unitPrice = Number(item.price || 0);
      next[index] = {
        ...item,
        quantity: sanitizedQty,
        subtotal: unitPrice * sanitizedQty,
      };
      return next;
    });
  };

  // Add Item Row
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: "",
        productName: "",
        sku: "",
        price: 0,
        quantity: 1,
        subtotal: 0,
        image: "",
      },
    ]);
  };

  // Remove Item Row
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Coupon Application handler
  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code) {
      toast.warning("Enter Coupon Code", "Please enter a coupon code to apply.");
      return;
    }

    if (subtotal <= 0) {
      toast.warning("Empty Order", "Add products with price before applying a coupon.");
      return;
    }

    // Find coupon in fetched list or fetch from API
    const match = coupons.find((c) => c.code.toUpperCase() === code);
    if (!match) {
      toast.error("Invalid Coupon", `Coupon code "${code}" was not found or is expired.`);
      return;
    }

    if (match.status !== "active") {
      toast.error("Coupon Inactive", `Coupon "${code}" is currently not active.`);
      return;
    }

    if (match.endDate && new Date(match.endDate) < new Date()) {
      toast.error("Coupon Expired", `Coupon "${code}" has expired.`);
      return;
    }

    if (match.minOrderValue && subtotal < match.minOrderValue) {
      toast.warning(
        "Minimum Order Required",
        `Minimum order subtotal of ₹${match.minOrderValue} is required to use "${code}" (Current: ₹${subtotal})`
      );
      return;
    }

    // Calculate discount
    let calculatedDiscount = 0;
    if (match.type === "percentage") {
      calculatedDiscount = (subtotal * Number(match.value)) / 100;
      if (match.maxDiscountAmount && Number(match.maxDiscountAmount) > 0) {
        calculatedDiscount = Math.min(calculatedDiscount, Number(match.maxDiscountAmount));
      }
    } else {
      calculatedDiscount = Math.min(Number(match.value), subtotal);
    }

    calculatedDiscount = Math.round(calculatedDiscount);
    setAppliedCoupon(match);
    setDiscountAmount(calculatedDiscount);
    setCouponCodeInput(match.code);

    toast.success(
      "Coupon Applied!",
      `Coupon ${match.code} applied successfully! You saved ₹${calculatedDiscount}.`
    );
  };

  // Remove Applied Coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCodeInput("");
    toast.info("Coupon Removed");
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!customerEmail.trim()) {
      toast.error("Customer email is required");
      return;
    }

    // Validate that at least one product is selected
    const validItems = items.filter((it) => it.productName.trim() && it.price > 0);
    if (validItems.length === 0) {
      toast.error("Please select at least one product for the order.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer: {
          id: selectedCustomerId || undefined,
          name: customerName.trim(),
          email: customerEmail.trim().toLowerCase(),
          phone: customerPhone.trim(),
        },
        shippingAddress: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          country: country.trim() || "India",
        },
        items: validItems.map((it) => ({
          product: it.productId || undefined,
          productName: it.productName.trim(),
          sku: it.sku.trim(),
          price: Number(it.price),
          quantity: Number(it.quantity) || 1,
          subtotal: Number(it.subtotal),
          image: it.image || "",
        })),
        subtotal,
        discountAmount,
        couponCode: appliedCoupon ? appliedCoupon.code : "",
        shippingFee: Number(shippingFee) || 0,
        totalAmount,
        paymentMethod,
        paymentStatus,
        orderStatus,
        returnReason: orderStatus === "returned" ? returnReason.trim() : undefined,
        tracking: {
          carrier: carrier.trim(),
          trackingNumber: trackingNumber.trim(),
        },
        notes: notes.trim(),
      };

      const res = await api("order/create", payload);

      if (res && res.status) {
        toast.success("Order Created", res.message || "New order has been placed.");
        resetForm();
        onOpenChange(false);
        onOrderAdded();
      } else {
        toast.error("Creation Failed", res?.message || "Could not create order.");
      }
    } catch (err: any) {
      toast.error("Error", err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 border-slate-200 bg-white overflow-hidden shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh] overflow-hidden">
          {/* ================= STICKY HEADER ================= */}
          <div className="shrink-0 sticky top-0 z-20 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900 tracking-tight">
                Create New Order
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Add a store customer order with product selection, coupon discount, and payment.
              </p>
            </div>
          </div>

          {/* ================= SCROLLABLE BODY ================= */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Customer Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Customer Information
                </h4>
                {selectedCustomerId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId("");
                      setCustomerName("");
                      setCustomerEmail("");
                      setCustomerPhone("");
                    }}
                    className="text-[11px] text-[#B4395A] hover:underline cursor-pointer"
                  >
                    Clear selection (Switch to manual)
                  </button>
                )}
              </div>

              {/* Existing Customer Dropdown */}
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-[2px] border border-slate-200">
                <Label className="text-xs font-semibold text-slate-700">
                  Select Existing Customer (Auto-fills details & address)
                </Label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full h-9 bg-white border border-slate-300 rounded-[2px] px-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#B4395A] cursor-pointer"
                >
                  <option value="">+ New Customer (Manual Entry)</option>
                  {customers.map((c) => {
                    const fullName = `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Unnamed";
                    return (
                      <option key={c._id} value={c._id}>
                        {fullName} — {c.email || c.phone || "No contact"}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Customer Name *</Label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
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
                    placeholder="e.g. priya@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="h-9 text-xs rounded-[2px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Phone Number</Label>
                  <Input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="h-9 text-xs rounded-[2px]"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Shipping Address
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Country</Label>
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

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">State / Province</Label>
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
                      type="text"
                      placeholder="e.g. State"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="h-9 text-xs rounded-[2px]"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">City</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-9 text-xs rounded-[2px]"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Postal Code</Label>
                  <Input
                    type="text"
                    placeholder="e.g. 400053"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="h-9 text-xs rounded-[2px]"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-4 space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Street / House No.</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Flat 402, Royal Palms, Link Road"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="h-9 text-xs rounded-[2px]"
                  />
                </div>
              </div>
            </div>

            {/* ================= ORDER ITEMS (Product Selection & Locked Rate) ================= */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Order Items ({items.length})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Select product from catalog. Rate is fixed automatically; only quantity can be adjusted.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-7 text-xs border-slate-300 rounded-[2px] flex items-center gap-1 cursor-pointer hover:bg-slate-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Item
                </Button>
              </div>

              {/* Items List */}
              <div className="space-y-2.5 border border-slate-200 rounded-[2px] p-3.5 bg-slate-50/60">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white p-2.5 border border-slate-200 rounded-[2px] shadow-2xs"
                  >
                    {/* Product Search Selector */}
                    <div className="flex-1 min-w-[220px]">
                      <Label className="text-[10px] text-slate-500 font-medium block mb-1">
                        Select Product *
                      </Label>
                      <Select
                        options={productOptions}
                        value={productOptions.find((opt) => opt.value === item.productId) || null}
                        onChange={(selected: any) => {
                          handleSelectProduct(idx, selected?.value || "");
                        }}
                        placeholder="Search product by name or SKU..."
                        isSearchable={true}
                        isClearable={false}
                        menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                        menuPosition="fixed"
                        className="text-xs"
                      />
                    </div>

                    {/* Locked SKU */}
                    <div className="w-28">
                      <Label className="text-[10px] text-slate-500 font-medium block mb-1">
                        SKU
                      </Label>
                      <Input
                        type="text"
                        readOnly
                        disabled
                        value={item.sku || "—"}
                        placeholder="SKU"
                        className="h-8.5 text-xs rounded-[2px] bg-slate-100/80 text-slate-600 cursor-not-allowed font-mono"
                      />
                    </div>

                    {/* Locked Rate (Price cannot be changed) */}
                    <div className="w-28">
                      <Label className="text-[10px] text-slate-500 font-medium block mb-1">
                        Rate (Fixed)
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          readOnly
                          disabled
                          value={item.price > 0 ? `₹${item.price}` : "₹0"}
                          placeholder="₹0"
                          className="h-8.5 text-xs rounded-[2px] bg-slate-100/80 text-slate-700 font-semibold cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Quantity (ONLY quantity can be changed) */}
                    <div className="w-20">
                      <Label className="text-[10px] text-slate-500 font-medium block mb-1">
                        Qty *
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                        className="h-8.5 text-xs rounded-[2px] text-center font-bold text-slate-900 focus:ring-1 focus:ring-[#B4395A]"
                      />
                    </div>

                    {/* Line Subtotal */}
                    <div className="w-24 text-right pt-3 sm:pt-0">
                      <Label className="text-[10px] text-slate-500 font-medium block mb-1">
                        Subtotal
                      </Label>
                      <div className="text-xs font-bold text-slate-900 h-8.5 flex items-center justify-end pr-1">
                        ₹{(Number(item.price || 0) * (Number(item.quantity) || 1)).toLocaleString("en-IN")}
                      </div>
                    </div>

                    {/* Delete Item Button */}
                    {items.length > 1 && (
                      <div className="pt-3 sm:pt-4">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-[2px] hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ================= COUPON CODE & DISCOUNT SECTION ================= */}
            <div className="border border-slate-200 rounded-[2px] p-4 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#B4395A]" />
                    <span>Coupon Code & Discount</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Apply coupon code to fetch and calculate order discount automatically.
                  </p>
                </div>

                {appliedCoupon && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium rounded-[2px]">
                    <Check className="w-3 h-3" />
                    Coupon Applied
                  </span>
                )}
              </div>

              {/* Coupon Input & Apply Button */}
              <div className="flex items-center gap-2 max-w-md">
                <div className="flex-1">
                  <Input
                    type="text"
                    disabled={Boolean(appliedCoupon)}
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code (e.g. GLOW20)"
                    className="h-9 text-xs rounded-[2px] uppercase font-mono tracking-wider font-semibold disabled:bg-slate-100 disabled:text-slate-700"
                  />
                </div>

                {appliedCoupon ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveCoupon}
                    className="h-9 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 rounded-[2px] cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Remove</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    className="h-9 px-4 text-xs font-semibold bg-[#B4395A] hover:bg-[#9b2f4c] text-white rounded-[2px] cursor-pointer"
                  >
                    Apply Coupon
                  </Button>
                )}
              </div>

              {/* "You don't have any coupon? View All" link */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <span className="text-slate-600">
                  {appliedCoupon ? "Want to try another coupon?" : "You don't have any coupon?"}{" "}
                  <button
                    type="button"
                    onClick={() => setCouponModalOpen(true)}
                    className="text-[#B4395A] font-bold hover:underline cursor-pointer ml-1 inline-flex items-center gap-1"
                  >
                    <span>View All</span>
                    {coupons.length > 0 && (
                      <span className="text-[10px] bg-[#B4395A]/10 text-[#B4395A] px-1.5 py-0.2 rounded-full font-bold">
                        {coupons.length}
                      </span>
                    )}
                  </button>
                </span>
              </div>

              {/* Applied Discount Info Callout */}
              {appliedCoupon && (
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-[2px] flex items-center justify-between text-xs text-emerald-800">
                  <div>
                    <span className="font-bold font-mono mr-1.5">{appliedCoupon.code}</span>
                    <span>
                      ({appliedCoupon.type === "percentage" ? `${appliedCoupon.value}% discount` : `₹${appliedCoupon.value} fixed discount`}
                      {appliedCoupon.maxDiscountAmount ? `, capped at ₹${appliedCoupon.maxDiscountAmount}` : ""})
                    </span>
                  </div>
                  <div className="font-bold text-emerald-700">
                    -₹{discountAmount.toLocaleString("en-IN")}
                  </div>
                </div>
              )}
            </div>

            {/* Shipping Fee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Shipping / Delivery Fee (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={shippingFee || ""}
                  onChange={(e) => setShippingFee(Number(e.target.value))}
                  placeholder="0 (Enter 0 for FREE delivery)"
                  className="h-9 text-xs rounded-[2px]"
                />
              </div>

              {/* Order Fulfillment Status */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Order Fulfillment Status</Label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full h-9 bg-white border border-slate-300 rounded-[2px] px-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#B4395A] cursor-pointer"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
            </div>

            {orderStatus === "returned" && (
              <div className="space-y-1 p-3 bg-rose-50 border border-rose-200 rounded-[2px]">
                <Label className="text-xs font-semibold text-rose-800">
                  Return Approval Reason / Call Notes
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. Customer call verified return approval - defective item"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="h-9 text-xs bg-white rounded-[2px]"
                />
              </div>
            )}

            {/* ================= PAYMENT METHOD (Prepaid and Advance Payment) ================= */}
            <div className="space-y-2 border border-slate-200 rounded-[2px] p-4 bg-white">
              <Label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Payment Method *
              </Label>
              <p className="text-[11px] text-slate-500 mb-2">
                Choose customer payment term (Prepaid or Advance Payment).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Prepaid Option */}
                <label
                  onClick={() => {
                    setPaymentMethod("prepaid");
                    setPaymentStatus("paid");
                  }}
                  className={`p-3 rounded-[2px] border cursor-pointer transition-all flex items-start gap-2.5 ${
                    paymentMethod === "prepaid"
                      ? "border-[#B4395A] bg-[#B4395A]/5 ring-1 ring-[#B4395A]"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "prepaid"}
                    onChange={() => {
                      setPaymentMethod("prepaid");
                      setPaymentStatus("paid");
                    }}
                    className="mt-0.5 accent-[#B4395A]"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Prepaid</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Full payment received online / in advance before dispatch.
                    </div>
                  </div>
                </label>

                {/* Advance Payment Option */}
                <label
                  onClick={() => {
                    setPaymentMethod("advance");
                    setPaymentStatus("paid");
                  }}
                  className={`p-3 rounded-[2px] border cursor-pointer transition-all flex items-start gap-2.5 ${
                    paymentMethod === "advance"
                      ? "border-[#B4395A] bg-[#B4395A]/5 ring-1 ring-[#B4395A]"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "advance"}
                    onChange={() => {
                      setPaymentMethod("advance");
                      setPaymentStatus("paid");
                    }}
                    className="mt-0.5 accent-[#B4395A]"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Advance Payment</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Partial advance deposit collected; remaining due on or after delivery.
                    </div>
                  </div>
                </label>
              </div>

              {/* Payment Status Dropdown */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Payment Record Status:</span>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="h-8 bg-white border border-slate-300 rounded-[2px] px-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#B4395A] cursor-pointer"
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            {/* ================= DETAILED PRICE BREAKUP ================= */}
            <div className="border border-slate-200 rounded-[2px] bg-slate-50/70 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Price Breakup
                </h4>
              </div>
              <div className="p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({items.filter((i) => i.price > 0).length} item{items.filter((i) => i.price > 0).length !== 1 ? "s" : ""})</span>
                  <span className="font-medium text-slate-900">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span>Discount</span>
                      {appliedCoupon && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-[2px]">
                          {appliedCoupon.code}
                        </span>
                      )}
                    </span>
                    <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Shipping / Delivery</span>
                  <span className="font-medium text-slate-900">
                    {Number(shippingFee) === 0 ? "FREE" : `₹${shippingFee}`}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-900">Total Payable Amount</span>
                  <span className="text-base text-[#B4395A] font-bold">
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Internal Order Notes / Instructions</Label>
              <Textarea
                rows={2}
                placeholder="Optional delivery notes or customer remarks..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs rounded-[2px]"
              />
            </div>
          </div>

          {/* ================= STICKY FOOTER ================= */}
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
              disabled={loading}
              className="text-xs h-8.5 px-5 rounded-[2px] bg-[#B4395A] hover:bg-[#9b2f4c] text-white font-semibold shadow-xs cursor-pointer"
            >
              {loading ? "Creating Order..." : "Create Order"}
            </Button>
          </div>
        </form>

        {/* ================= ELIGIBLE COUPONS POPUP MODAL ================= */}
        {couponModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
            <div
              className="bg-white rounded-[4px] border border-slate-200 shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Sticky Header */}
              <div className="shrink-0 px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-[#B4395A]" />
                    <span>Eligible Store Coupons</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select an eligible coupon code to apply an instant discount.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCouponModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-[2px] hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Subtotal Banner */}
              <div className="shrink-0 px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600">Current Order Subtotal:</span>
                <span className="font-bold text-slate-900">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>

              {/* Scrollable Coupons List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
                {coupons.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No active coupons found in store.
                  </div>
                ) : (
                  coupons.map((c) => {
                    const minRequired = Number(c.minOrderValue || 0);
                    const isEligible = subtotal >= minRequired;
                    const diffNeeded = minRequired - subtotal;
                    const isCurrentlyApplied = appliedCoupon?.code === c.code;

                    return (
                      <div
                        key={c._id}
                        className={`p-3.5 border rounded-[3px] transition-all relative ${
                          isCurrentlyApplied
                            ? "border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500"
                            : isEligible
                            ? "border-slate-200 hover:border-slate-300 bg-white shadow-2xs"
                            : "border-slate-200 bg-slate-50/60 opacity-80"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Coupon details */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-block px-2.5 py-0.5 border border-dashed border-[#B4395A] bg-[#B4395A]/5 text-[#B4395A] font-mono font-bold text-xs rounded-[2px] tracking-wider uppercase">
                                {c.code}
                              </span>
                              {isCurrentlyApplied ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-[2px] flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" /> Applied
                                </span>
                              ) : isEligible ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-[2px]">
                                  Eligible
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-[2px]">
                                  Not Eligible
                                </span>
                              )}
                            </div>

                            <div className="text-xs font-semibold text-slate-900 pt-0.5">
                              {c.type === "percentage"
                                ? `${c.value}% OFF${c.maxDiscountAmount ? ` up to ₹${c.maxDiscountAmount}` : ""}`
                                : `Flat ₹${c.value} OFF`}
                            </div>

                            {c.description && (
                              <div className="text-[11px] text-slate-500">{c.description}</div>
                            )}

                            <div className="text-[11px] text-slate-500 pt-0.5">
                              {minRequired > 0 ? (
                                <span>Valid on orders of ₹{minRequired} and above.</span>
                              ) : (
                                <span>No minimum order required.</span>
                              )}
                            </div>

                            {!isEligible && diffNeeded > 0 && (
                              <div className="text-[11px] font-medium text-amber-600 pt-0.5">
                                Add ₹{diffNeeded.toLocaleString("en-IN")} more to unlock this coupon.
                              </div>
                            )}
                          </div>

                          {/* Action button */}
                          <div className="shrink-0 pt-0.5">
                            {isCurrentlyApplied ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  handleRemoveCoupon();
                                }}
                                className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 rounded-[2px] cursor-pointer"
                              >
                                Remove
                              </Button>
                            ) : isEligible ? (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  handleApplyCoupon(c.code);
                                  setCouponModalOpen(false);
                                }}
                                className="h-7 px-3 text-xs font-semibold bg-[#B4395A] hover:bg-[#9b2f4c] text-white rounded-[2px] cursor-pointer shadow-2xs"
                              >
                                Apply
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                disabled
                                variant="outline"
                                className="h-7 text-xs border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed rounded-[2px]"
                              >
                                Apply
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Sticky Footer */}
              <div className="shrink-0 px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCouponModalOpen(false)}
                  className="text-xs h-8 px-4 rounded-[2px] border-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
