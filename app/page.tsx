"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCookie, api } from "@/helper";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MaintenanceDialog } from "@/components/maintenance-dialog";
import { Wrench, ShieldAlert, CheckCircle2, Settings } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryCount, setCategoryCount] = useState<number>(0);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [maintenanceConfig, setMaintenanceConfig] = useState<{
    isActive: boolean;
    title: string;
    description: string;
  }>({
    isActive: false,
    title: "",
    description: "",
  });

  useEffect(() => {
    const token = getCookie("admin_token") || (typeof window !== "undefined" && localStorage.getItem("admin_token"));

    // If not logged in, immediately redirect to login page
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    // Fetch live categories count and maintenance status from database
    async function fetchDashboardData() {
      try {
        const [catRes, maintRes] = await Promise.all([
          api("category/list", { limit: 1 }),
          api("maintenance"),
        ]);

        if (catRes && catRes.status && catRes.data?.pagination?.total !== undefined) {
          setCategoryCount(catRes.data.pagination.total);
        }

        if (maintRes && maintRes.status && maintRes.data) {
          setMaintenanceConfig({
            isActive: Boolean(maintRes.data.isActive),
            title: maintRes.data.title || "",
            description: maintRes.data.description || "",
          });
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin border-2 border-slate-300 border-t-[#B4395A]" />
          <p className="text-xs font-medium text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Reusable Sidebar with live category badge */}
      <Sidebar
        currentPath="/"
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
        categoryCount={categoryCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          title="Dashboard"
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Dashboard Body */}
        <main className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Welcome Banner */}
          <div className="rounded-[2px] border border-slate-200 bg-white p-4 shadow-xs border-l-4 border-l-[#B4395A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Welcome back, Eclera
              </h2>
              <p className="text-xs text-slate-500">
                Store catalog and management overview.
              </p>
            </div>
            <div className="text-[11px] text-slate-400 font-mono sm:text-right shrink-0">
              {currentDate}
            </div>
          </div>

          {/* Under Maintenance Website Control Card (Single Click Manage Dialog) */}
          <div
            className={`rounded-[2px] border p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
              maintenanceConfig.isActive
                ? "bg-amber-50/80 border-amber-300 border-l-4 border-l-amber-500"
                : "bg-white border-slate-200 border-l-4 border-l-emerald-500"
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  maintenanceConfig.isActive
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {maintenanceConfig.isActive ? (
                  <ShieldAlert className="w-5 h-5 text-amber-600 animate-pulse" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900 tracking-tight">
                    Website Status:
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-none ${
                      maintenanceConfig.isActive
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        maintenanceConfig.isActive ? "bg-amber-600 animate-ping" : "bg-emerald-600"
                      }`}
                    />
                    {maintenanceConfig.isActive ? "Under Maintenance (Active)" : "Live (Normal Operation)"}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {maintenanceConfig.isActive
                    ? maintenanceConfig.title
                      ? `Visitors see white maintenance screen: "${maintenanceConfig.title}"`
                      : "Website is currently in maintenance mode."
                    : "Website is fully visible and accepting customer orders normally."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMaintenanceModalOpen(true)}
              className={`shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-none cursor-pointer transition-colors shadow-xs ${
                maintenanceConfig.isActive
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-slate-900 hover:bg-[#B4395A] text-white"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configure Maintenance</span>
            </button>
          </div>

          {/* Module Cards Grid with live API Categories count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                title: "Orders",
                href: "/order",
                count: "0",
                desc: "Store orders & sales",
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                ),
              },
              {
                title: "Abandoned Cart",
                href: "/abandoned-cart",
                count: "0",
                desc: "Uncompleted checkout carts",
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
              },
              {
                title: "Products",
                href: "/product",
                count: "0",
                desc: "Catalog & inventory items",
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                ),
              },
              {
                title: "Categories",
                href: "/category",
                count: categoryCount.toString(),
                desc: "Product taxonomy & grouping",
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                ),
              },
              {
                title: "Collections",
                href: "/collections",
                count: "0",
                desc: "Featured & seasonal collections",
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                ),
              },
              {
                title: "Customers",
                href: "/customer",
                count: "0",
                desc: "Registered store accounts",
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ),
              },
              {
                title: "Discounts",
                href: "/discount",
                count: "0",
                desc: "Coupons & promotional offers",
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                ),
              },
              {
                title: "Specifications",
                href: "/specifications",
                count: "0",
                desc: "Custom product attributes",
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                ),
              },
            ].map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="rounded-[2px] border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-[#B4395A]/50 hover:bg-slate-50/50 block group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 group-hover:text-slate-800">
                    {card.title}
                  </span>
                  <span className="p-1 rounded-[2px] bg-[#B4395A]/10 text-[#B4395A] group-hover:bg-[#B4395A] group-hover:text-white transition-colors">
                    {card.icon}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
                    {card.count}
                  </span>
                  <span className="text-[11px] text-[#B4395A] font-semibold group-hover:translate-x-0.5 transition-transform">
                    View →
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  {card.desc}
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>

      {/* Single Unified Maintenance Modal Dialog for both Add and Edit */}
      <MaintenanceDialog
        open={maintenanceModalOpen}
        onOpenChange={setMaintenanceModalOpen}
        onUpdated={(updated) => setMaintenanceConfig(updated)}
      />
    </div>
  );
}
