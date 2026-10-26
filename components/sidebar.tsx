"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteCookie, getCookie, setCookie, api } from "@/helper";

// Module-level cache to prevent duplicate /list calls on every navigation
let cachedSidebarCounts: { categories: number; specifications: number; collections: number; banners: number; customers: number; discounts: number; orders: number; abandonedCarts: number; policies: number } | null = null;
let isFetchingSidebarCounts = false;

export function Sidebar({
  currentPath = "/",
  mobileMenuOpen = false,
  onCloseMobileMenu = () => { },
  categoryCount: externalCategoryCount,
}: any) {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{ name?: string; email?: string } | null>(null);
  const [counts, setCounts] = useState<{ categories: number; specifications: number; collections: number; banners: number; customers: number; discounts: number; orders: number; abandonedCarts: number; policies: number }>({
    categories: externalCategoryCount ?? 0,
    specifications: 0,
    collections: 0,
    banners: 0,
    customers: 0,
    discounts: 0,
    orders: 0,
    abandonedCarts: 0,
    policies: 0,
  });

  useEffect(() => {
    // Read logged-in user
    const rawUser = getCookie("admin_user");
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        u.name = "Eclera";
        setAdminUser(u);
      } catch {
        setAdminUser({ name: "Eclera", email: "eclera.cosmetics@gmail.com" });
      }
    } else if (typeof window !== "undefined") {
      const stored = localStorage.getItem("admin_user");
      if (stored) {
        try {
          const u = JSON.parse(stored);
          u.name = "Eclera";
          setAdminUser(u);
        } catch {
          setAdminUser({ name: "Eclera", email: "eclera.cosmetics@gmail.com" });
        }
      }
    }

    // Fetch live categories, specifications, collections, banners, customers, discounts, orders and abandoned-carts count from API (once per session)
    if (!cachedSidebarCounts && !isFetchingSidebarCounts) {
      isFetchingSidebarCounts = true;
      (async () => {
        try {
          const [catRes, specRes, colRes, bannerRes, custRes, discountRes, orderRes, cartRes, policyRes] = await Promise.all([
            api("category/list", { limit: 1 }),
            api("specification/list", { limit: 1 }),
            api("collection/list", { limit: 1 }),
            api("banner/list", { limit: 1 }),
            api("customer/list", { limit: 1 }),
            api("discount/list", { limit: 1 }),
            api("order/list", { limit: 1 }),
            api("abandoned-cart/list", { limit: 1 }),
            api("policy/list", { limit: 1 }),
          ]);

          const newCounts: { categories: number; specifications: number; collections: number; banners: number; customers: number; discounts: number; orders: number; abandonedCarts: number; policies: number } = {
            categories: 0,
            specifications: 0,
            collections: 0,
            banners: 0,
            customers: 0,
            discounts: 0,
            orders: 0,
            abandonedCarts: 0,
            policies: 0,
          };
          if (catRes && catRes.status && catRes.data?.pagination?.total !== undefined) {
            newCounts.categories = catRes.data.pagination.total;
          }
          if (specRes && specRes.status && specRes.data?.pagination?.total !== undefined) {
            newCounts.specifications = specRes.data.pagination.total;
          }
          if (colRes && colRes.status) {
            newCounts.collections = colRes.data?.pagination?.total ?? colRes.data?.total ?? 0;
          }
          if (bannerRes && bannerRes.status && bannerRes.data?.pagination?.total !== undefined) {
            newCounts.banners = bannerRes.data.pagination.total;
          }
          if (custRes && custRes.status && custRes.data?.pagination?.total !== undefined) {
            newCounts.customers = custRes.data.pagination.total;
          }
          if (discountRes && discountRes.status && discountRes.data?.pagination?.total !== undefined) {
            newCounts.discounts = discountRes.data.pagination.total;
          }
          if (orderRes && orderRes.status && orderRes.data?.pagination?.total !== undefined) {
            newCounts.orders = orderRes.data.pagination.total;
          }
          if (cartRes && cartRes.status && cartRes.data?.pagination?.total !== undefined) {
            newCounts.abandonedCarts = cartRes.data.pagination.total;
          }
          if (policyRes && policyRes.status && policyRes.data?.pagination?.total !== undefined) {
            newCounts.policies = policyRes.data.pagination.total;
          }

          cachedSidebarCounts = newCounts;
          setCounts((prev) => ({ ...prev, ...newCounts }));
        } catch (err) {
          console.error("Failed to fetch sidebar counts:", err);
        } finally {
          isFetchingSidebarCounts = false;
        }
      })();
    } else if (cachedSidebarCounts) {
      setCounts((prev) => ({ ...prev, ...cachedSidebarCounts }));
    }
  }, []);

  useEffect(() => {
    if (externalCategoryCount !== undefined) {
      setCounts((prev) => ({ ...prev, categories: externalCategoryCount }));
    }
  }, [externalCategoryCount]);

  const handleLogout = () => {
    deleteCookie("admin_token");
    deleteCookie("admin_user");
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
    }
    router.replace("/auth/login");
  };

  const navLinks = [
    {
      label: "Dashboard",
      href: "/",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: "Orders",
      href: "/order",
      count: counts.orders.toString(),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      label: "Abandoned Cart",
      href: "/abandoned-cart",
      count: counts.abandonedCarts.toString(),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      label: "Products",
      href: "/product",
      count: "0",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      label: "Categories",
      href: "/category",
      count: counts.categories.toString(),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
    {
      label: "Collections",
      href: "/collections",
      count: counts.collections.toString(),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      label: "Specifications",
      href: "/specifications",
      count: counts.specifications.toString(),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      label: "Discounts",
      href: "/discount",
      count: counts.discounts.toString(),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
    },
    {
      label: "Customers",
      href: "/customer",
      count: counts.customers.toString(),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      label: "Banners",
      href: "/banner",
      count: counts.banners.toString(),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: "Announcements",
      href: "/announcement",
      count: (counts as any).announcements?.toString() || "3",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
    },
    {
      label: "Policies",
      href: "/policy",
      count: counts.policies.toString(),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: "Social Media",
      href: "/social",
      count: (counts as any).social?.toString() || "",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={onCloseMobileMenu}
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen z-50 w-60 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 transition-transform duration-200 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            {/* Brand Logo Header */}
            <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-center relative bg-white shrink-0">
              <Link href="/" className="flex items-center justify-center py-1">
                <img
                  src="/eclera-logo.svg"
                  alt="ECLERA - Easy skincare for everyday glow"
                  className="h-8 max-h-9 w-auto max-w-[170px] object-contain mx-auto"
                />
              </Link>
              <button
                onClick={onCloseMobileMenu}
                className="absolute right-3 top-1/2 -translate-y-1/2 lg:hidden p-1.5 text-slate-400 hover:text-slate-700"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Direct Navigation Links */}
            <div className="p-3">
              <nav className="space-y-1">
                {navLinks.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? currentPath === "/"
                      : currentPath.startsWith(item.href);

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={onCloseMobileMenu}
                      className={`flex items-center justify-between px-3 py-2 rounded-[2px] text-sm transition-colors ${isActive
                        ? "bg-[#B4395A] text-white font-medium"
                        : "text-slate-600 hover:text-[#B4395A] hover:bg-slate-50 font-normal"
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={isActive ? "text-white" : "text-slate-400"}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && (
                        <span
                          className={`text-xs px-1.5 py-0.2 rounded-[2px] font-mono ${isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-500"
                            }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* User Profile Card & Logout */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2">
            <div className="p-2 rounded-[2px] bg-white border border-slate-200/90 flex items-center gap-2">
              <div className="h-7 w-7 rounded-[2px] bg-[#B4395A] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                E
              </div>
              <div className="flex flex-col text-left leading-tight min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-800 truncate">
                  Eclera
                </span>
                <span className="text-[10px] text-slate-500 font-mono truncate">
                  {adminUser?.email || "eclera.cosmetics@gmail.com"}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full h-8 px-2.5 text-xs rounded-[2px] border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5 font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
