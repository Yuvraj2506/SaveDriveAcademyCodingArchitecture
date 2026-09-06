"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CourseCards from "@/components/CourseCards";
import AuthModal, { AuthRole } from "@/components/AuthModal";
import Footer from "@/components/Footer";
import { getAccessToken, AUTH_KEYS } from "@/lib/apiClient";

function AutoLoginTrigger({ onTrigger }: { onTrigger: () => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("login") === "true") {
      onTrigger();
    }
  }, [searchParams, onTrigger]);

  return null;
}

export default function HomePage() {
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"user" | "admin">("user");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = getAccessToken();
    if (token) {
      const storedUserStr =
        typeof window !== "undefined"
          ? localStorage.getItem(AUTH_KEYS.USER) || localStorage.getItem("safedrive_user")
          : null;

      let role = "student";
      if (storedUserStr) {
        try {
          const parsed = JSON.parse(storedUserStr);
          role = parsed.Role || parsed.role || "student";
        } catch {
          // fallback
        }
      }

      if (role === "admin_staff" || role === "admin_owner") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
      return;
    }

    setIsCheckingAuth(false);
  }, [router]);

  const handleOpenAuth = (defaultTab: "user" | "admin" = "user") => {
    setAuthDefaultTab(defaultTab);
    setAuthModalOpen(true);
  };

  const handleLoginSuccess = (role: AuthRole) => {
    if (role === "student" || role === "user") {
      router.push("/dashboard");
    } else {
      router.push("/admin");
    }
  };

  const handleExploreCourses = () => {
    const el = document.getElementById("courses");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-400 animate-pulse tracking-wide">
          Loading SafeDrive Academy...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#ffffff] text-[#141414]">
      {/* Auto-open login modal when redirected from restricted route */}
      <Suspense fallback={null}>
        <AutoLoginTrigger onTrigger={() => setAuthModalOpen(true)} />
      </Suspense>

      {/* Floating Stadium Navigation Bar */}
      <Navbar
        currentRole={null}
        onOpenAuth={handleOpenAuth}
        onSignOut={() => {}}
      />

      <main className="flex-1 w-full flex flex-col">
        {/* Minimal Hero Section */}
        <Hero
          onOpenAuth={handleOpenAuth}
          onExploreCourses={handleExploreCourses}
        />

        {/* Exactly 2 Minimal Training Course Cards */}
        <div id="courses">
          <CourseCards />
        </div>
      </main>

      {/* Mobbin Signature Ink Black Footer */}
      <Footer />

      {/* Authentication Modal with Direct Route Navigation */}
      <AuthModal
        isOpen={authModalOpen}
        defaultRole={authDefaultTab}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}