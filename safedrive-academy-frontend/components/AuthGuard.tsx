"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAccessToken, AUTH_KEYS } from "@/lib/apiClient";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    // 1. Root page is always public
    if (pathname === "/") {
      setIsAuthorized(true);
      return;
    }

    // 2. Validate token existence in localStorage
    const token = getAccessToken();
    if (!token) {
      // Missing token: Restrict access and bounce back to homepage with login triggered
      router.replace("/?login=true");
      return;
    }

    // 3. Verify user and role permissions if specified
    const storedUserStr = typeof window !== "undefined" ? localStorage.getItem(AUTH_KEYS.USER) : null;
    let role: string = "student";

    if (storedUserStr) {
      try {
        const parsed = JSON.parse(storedUserStr);
        role = parsed.Role || parsed.role || "student";
      } catch {
        // Fallback
      }
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const hasPermission = allowedRoles.includes(role);
      if (!hasPermission) {
        if (role === "admin_staff" || role === "admin_owner") {
          router.replace("/admin");
        } else {
          router.replace("/dashboard");
        }
        return;
      }
    }

    setIsAuthorized(true);
  }, [pathname, allowedRoles, router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-400 animate-pulse tracking-wide">
          Verifying security authorization...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
