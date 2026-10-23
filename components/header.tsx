"use client";

import React from "react";

export function Header({
  title,
  subtitle,
  onOpenMobileMenu,
  children,
}: any) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 rounded-[2px] border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            aria-label="Open sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide">
            {title}
          </h1>
        </div>
      </div>

      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
}

export default Header;
