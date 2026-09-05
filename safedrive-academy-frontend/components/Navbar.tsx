"use client";

import React from "react";
import { AuthRole } from "./AuthModal";

interface NavbarProps {
  currentRole: AuthRole | null;
  onOpenAuth: (defaultTab?: "user" | "admin") => void;
  onSignOut: () => void;
}

export default function Navbar({
  currentRole,
  onOpenAuth,
  onSignOut,
}: NavbarProps) {
  return (
    <div className="sticky top-4 z-40 w-full px-4 sm:px-6 lg:px-8 flex justify-center">
      <header className="w-full max-w-3xl bg-[#f3f3f3]/95 backdrop-blur-md rounded-full px-5 py-2.5 flex items-center justify-between border border-[#e0e0e0]">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 squircle-icon bg-[#141414] flex items-center justify-center text-white text-[14px] font-bold transition-transform group-hover:scale-105">
            S
          </div>
          <span className="text-[17px] font-bold text-[#141414] tracking-tight">
            SafeDrive Academy.
          </span>
        </a>

        {/* Single Action Button (Sign In / Sign Out) */}
        <div>
          {currentRole ? (
            <button
              onClick={onSignOut}
              className="px-5 h-9 text-[13px] font-semibold text-[#141414] hover:bg-[#e0e0e0] bg-white border border-[#e0e0e0] rounded-full transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => onOpenAuth("user")}
              className="px-5 h-9 text-[13px] font-semibold text-white bg-[#141414] hover:bg-[#262626] rounded-full transition-colors cursor-pointer shadow-none"
            >
              Sign In
            </button>
          )}
        </div>
      </header>
    </div>
  );
}
