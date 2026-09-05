"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CourseCards from "@/components/CourseCards";
import AuthModal, { AuthRole } from "@/components/AuthModal";
import Footer from "@/components/Footer";

export default function HomePage() {
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"user" | "admin">("user");

  const handleOpenAuth = (defaultTab: "user" | "admin" = "user") => {
    setAuthDefaultTab(defaultTab);
    setAuthModalOpen(true);
  };

  const handleLoginSuccess = (role: AuthRole) => {
    if (role === "user") {
      router.push("/dashboard");
    } else {
      router.push("/admin");
    }
  };

  const handleExploreCourses = () => {
    const el = document.getElementById("courses");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#ffffff] text-[#141414]">
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
