"use client";

import React from "react";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: any) {
  return (
    <div className={`relative w-full ${className}`}>
      <svg
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        style={{ width: 14, height: 14 }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="admin-search-input"
      />
    </div>
  );
}