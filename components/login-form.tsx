"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setCookie } from "@/helper";

const DEFAULT_ADMIN_EMAIL = "eclera.cosmetics@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "Eclera2171";

export function LoginForm({ className = "" }: { className?: string }) {
  const router = useRouter();

  const [email, setEmail] = useState<string>(DEFAULT_ADMIN_EMAIL);
  const [password, setPassword] = useState<string>(DEFAULT_ADMIN_PASSWORD);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await api("auth/login", {
        email: email.trim(),
        password: password,
      });

      if (res && res.status) {
        setSuccessMessage("Login successful! Redirecting...");

        if (res.data?.token) {
          setCookie("admin_token", res.data.token, 7);
        }
        if (res.data?.admin) {
          const adminInfo = { ...res.data.admin, name: "Eclera" };
          setCookie("admin_user", JSON.stringify(adminInfo), 7);
          if (typeof window !== "undefined") {
            localStorage.setItem("admin_user", JSON.stringify(adminInfo));
            localStorage.setItem("admin_token", res.data.token || "");
          }
        }

        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 600);
      } else {
        setErrorMessage(res?.message || "Invalid email or password.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`admin-card p-6 w-full ${className}`}>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-800">Login</h1>
        <p className="text-xs text-slate-500 mt-1">
          Enter your email and password to login
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-[var(--admin-radius)] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 rounded-[var(--admin-radius)] border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="admin-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="admin-input"
          />
        </div>

        <div>
          <label htmlFor="password" className="admin-label">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="admin-input pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="admin-btn-primary w-full mt-2"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
