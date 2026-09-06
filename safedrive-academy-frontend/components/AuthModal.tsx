"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./ToastContext";
import { apiClient, setTokens, AUTH_KEYS } from "@/lib/apiClient";

export type AuthRole = "student" | "admin_staff" | "admin_owner" | "user";

interface AuthModalProps {
  isOpen: boolean;
  defaultRole?: "user" | "admin";
  onClose: () => void;
  onLoginSuccess: (role: AuthRole, studentPhone?: string, userName?: string) => void;
}

export default function AuthModal({
  isOpen,
  defaultRole = "user",
  onClose,
  onLoginSuccess,
}: AuthModalProps) {
  const { showToast } = useToast();
  const [mainTab, setMainTab] = useState<"user" | "admin">(defaultRole);
  const [adminSubRole, setAdminSubRole] = useState<"staff" | "owner">("staff");
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);

  // Login form state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // First time setup state
  const [setupStep, setSetupStep] = useState<"verify" | "set_password">("verify");
  const [setupPhone, setSetupPhone] = useState("");
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleDemoFill = (type: "user_4w" | "user_2w" | "staff" | "owner") => {
    setErrorMessage(null);
    setIsFirstTimeSetup(false);
    if (type === "user_4w") {
      setMainTab("user");
      setIdentifier("9876543212");
      setPassword("StudentPass@123");
    } else if (type === "user_2w") {
      setMainTab("user");
      setIdentifier("9876543213");
      setPassword("StudentPass@123");
    } else if (type === "staff") {
      setMainTab("admin");
      setAdminSubRole("staff");
      setIdentifier("9876543211");
      setPassword("StaffPass@123");
    } else {
      setMainTab("admin");
      setAdminSubRole("owner");
      setIdentifier("9876543210");
      setPassword("OwnerPass@123");
    }
  };

  // 1. Regular Login Submission via Express Backend
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      const msg = "Please enter your registered 10-digit mobile number.";
      setErrorMessage(msg);
      showToast(msg, "warning", "Input Required");
      return;
    }

    if (!password) {
      const msg = "Please enter your password.";
      setErrorMessage(msg);
      showToast(msg, "warning", "Input Required");
      return;
    }

    setLoading(true);

    const activeExpectedRole: "student" | "admin_staff" | "admin_owner" =
      mainTab === "user"
        ? "student"
        : adminSubRole === "staff"
        ? "admin_staff"
        : "admin_owner";

    try {
      const data = await apiClient.login(cleanIdentifier, password, activeExpectedRole);

      if (typeof window !== "undefined") {
        setTokens(data.Token, data.RefreshToken);
        localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(data.User));
      }

      setSuccessMessage(`Welcome back, ${data.User.FullName}!`);
      showToast(`Welcome back, ${data.User.FullName}!`, "success", "Signed In Successfully");

      setTimeout(() => {
        setLoading(false);
        setSuccessMessage(null);
        onLoginSuccess(data.User.Role as AuthRole, data.User.PhoneNumber, data.User.FullName);
        onClose();
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect to authentication server.";
      setErrorMessage(msg);
      showToast(msg, "error", "Sign In Failed");
      setLoading(false);
    }
  };

  // 2. First-Time Setup: Verify Phone
  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const data = await apiClient.verifyStudentPhone(setupPhone.trim());
      setVerifiedName(data.FullName || "Student");
      setSetupStep("set_password");
      showToast("Mobile number verified! Please create your password.", "info", "Phone Verified");
      setLoading(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setErrorMessage(msg);
      showToast(msg, "error", "Verification Failed");
      setLoading(false);
    }
  };

  // 3. First-Time Setup: Set New Password
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 8) {
      const msg = "Password must be at least 8 characters long.";
      setErrorMessage(msg);
      showToast(msg, "warning", "Validation Error");
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = "Passwords do not match. Please re-enter.";
      setErrorMessage(msg);
      showToast(msg, "warning", "Validation Error");
      return;
    }

    setLoading(true);

    try {
      const data = await apiClient.setStudentPassword(setupPhone.trim(), newPassword);

      if (typeof window !== "undefined" && data.Token) {
        setTokens(data.Token, data.RefreshToken);
        localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(data.User));
      }

      setSuccessMessage("Password set successfully! Logging in to your dashboard...");
      showToast("Account activated successfully!", "success", "Welcome");

      setTimeout(() => {
        setLoading(false);
        setSuccessMessage(null);
        onLoginSuccess("student", setupPhone.trim(), verifiedName || data.User?.FullName || "Student");
        onClose();
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to set password";
      setErrorMessage(msg);
      showToast(msg, "error", "Activation Failed");
      setLoading(false);
    }
  };

  const getSuggestedRoleSwitch = (msg: string | null) => {
    if (!msg) return null;
    const lower = msg.toLowerCase();
    if (lower.includes("admin portal (staff)") || lower.includes("registered as staff")) {
      return { tab: "admin" as const, subRole: "staff" as const, label: "Switch to Staff Portal" };
    }
    if (lower.includes("admin portal (owner)") || lower.includes("registered as academy owner")) {
      return { tab: "admin" as const, subRole: "owner" as const, label: "Switch to Owner Portal" };
    }
    if (lower.includes("student portal") || lower.includes("registered as a student")) {
      return { tab: "user" as const, subRole: null, label: "Switch to Student Portal" };
    }
    return null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="auth-modal-backdrop"
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        >
          <motion.div
            key="auth-modal-card"
            layout
            initial={{ y: "100vh" }}
            animate={{ y: 0 }}
            exit={{ y: "100vh" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-white border border-[#f0f0f0] rounded-[24px] p-6 sm:p-8 shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#f3f3f3] hover:bg-[#e0e0e0] text-[#141414] flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5 pb-4">
          <div className="w-9 h-9 squircle-icon bg-[#141414] text-white flex items-center justify-center mx-auto mb-2 text-sm font-bold">
            S
          </div>
          <h2 className="text-[20px] font-semibold text-[#141414] tracking-tight">
            {isFirstTimeSetup ? "Student Password Setup." : "Sign In to SafeDrive."}
          </h2>
          <p className="text-[13px] text-[#707070]">
            {isFirstTimeSetup
              ? "Verify your registered 10-digit mobile number to create your password."
              : "Access your driving training records and fees ledger."}
          </p>
        </div>

        {/* Mode Switcher */}
        {!isFirstTimeSetup && (
          <div className="grid grid-cols-2 p-1 rounded-full bg-[#f3f3f3] gap-1 mb-4">
            <button
              type="button"
              onClick={() => {
                setMainTab("user");
                setErrorMessage(null);
              }}
              className={`py-1.5 text-[13px] font-semibold rounded-full transition-all cursor-pointer ${
                mainTab === "user" ? "bg-[#ffffff] text-[#141414] shadow-sm" : "text-[#707070] hover:text-[#141414]"
              }`}
            >
              Student (User)
            </button>
            <button
              type="button"
              onClick={() => {
                setMainTab("admin");
                setErrorMessage(null);
              }}
              className={`py-1.5 text-[13px] font-semibold rounded-full transition-all cursor-pointer ${
                mainTab === "admin" ? "bg-[#ffffff] text-[#141414] shadow-sm" : "text-[#707070] hover:text-[#141414]"
              }`}
            >
              Admin Portal
            </button>
          </div>
        )}

        {/* Admin Sub-Role Selector */}
        {!isFirstTimeSetup && mainTab === "admin" && (
          <div className="flex items-center justify-between bg-[#f3f3f3]/80 p-1.5 rounded-full mb-4 px-3 text-[12px]">
            <span className="font-semibold text-[#707070]">Admin Role:</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setAdminSubRole("staff");
                  setErrorMessage(null);
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  adminSubRole === "staff" ? "bg-[#141414] text-white" : "text-[#707070] hover:text-[#141414]"
                }`}
              >
                Staff / Instructor
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdminSubRole("owner");
                  setErrorMessage(null);
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  adminSubRole === "owner" ? "bg-[#141414] text-white" : "text-[#707070] hover:text-[#141414]"
                }`}
              >
                Academy Owner
              </button>
            </div>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mb-3.5 p-3 rounded-[16px] bg-red-50 border border-red-200 text-red-700 text-[12px] space-y-2">
            <div className="flex items-start gap-2">
              <span className="font-bold shrink-0">!</span>
              <span className="flex-1">{errorMessage}</span>
            </div>
            {(() => {
              const suggested = getSuggestedRoleSwitch(errorMessage);
              if (!suggested) return null;
              return (
                <div className="pt-0.5 pl-4">
                  <button
                    type="button"
                    onClick={() => {
                      setMainTab(suggested.tab);
                      if (suggested.subRole) {
                        setAdminSubRole(suggested.subRole);
                      }
                      setErrorMessage(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded-full font-semibold text-[11px] transition-all cursor-pointer shadow-sm"
                  >
                    <span>{suggested.label}</span>
                    <span>→</span>
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* Success Alert */}
        {successMessage ? (
          <div className="py-6 text-center space-y-1.5 bg-[#f3f3f3] rounded-[16px] p-4 text-[#141414]">
            <div className="text-xl font-bold">✓</div>
            <div className="font-semibold text-[14px]">{successMessage}</div>
            <p className="text-[12px] text-[#707070]">Opening dashboard...</p>
          </div>
        ) : isFirstTimeSetup ? (
          /* FIRST-TIME STUDENT PASSWORD SETUP FORM */
          <div className="space-y-4">
            {setupStep === "verify" ? (
              <form onSubmit={handleVerifyPhone} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070] mb-1">
                    Enter Registered Mobile Number (10 Digits) *
                  </label>
                  <input
                    type="text"
                    required
                    value={setupPhone}
                    onChange={(e) => setSetupPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full h-10 px-3.5 rounded-[16px] bg-[#f0f0f0] text-[14px] text-[#141414] focus-ring-mobbin outline-none"
                  />
                  <span className="text-[11px] text-[#707070] mt-1 block">
                    Must be registered by Academy Staff & approved by Owner.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 rounded-full bg-[#141414] hover:bg-[#262626] disabled:bg-[#707070] text-white text-[13px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Verifying Mobile Number...</span>
                    </>
                  ) : (
                    <span>Verify Mobile Number →</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFirstTimeSetup(false);
                      setErrorMessage(null);
                    }}
                    className="text-[12px] font-semibold text-[#707070] hover:text-[#141414]"
                  >
                    ← Back to Regular Sign In
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSetPassword} className="space-y-3.5">
                <div className="p-3 bg-[#f3f3f3] rounded-[16px] text-[12px] space-y-0.5">
                  <span className="text-[#707070] block">Verified Student Record:</span>
                  <span className="font-semibold text-[#141414] text-[14px] block">{verifiedName}</span>
                  <span className="text-[#707070] block">Phone: {setupPhone}</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070] mb-1">
                    Create New Password (min 8 chars) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full h-10 px-3.5 rounded-[16px] bg-[#f0f0f0] text-[14px] text-[#141414] focus-ring-mobbin outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070] mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full h-10 px-3.5 rounded-[16px] bg-[#f0f0f0] text-[14px] text-[#141414] focus-ring-mobbin outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 rounded-full bg-[#141414] hover:bg-[#262626] disabled:bg-[#707070] text-white text-[13px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Activating Account...</span>
                    </>
                  ) : (
                    <span>Set Password & Login →</span>
                  )}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* REGULAR SIGN IN FORM (EXPRESS BACKEND AUTH) */
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070] mb-1">
                {mainTab === "user"
                  ? "Student Registered Mobile Number *"
                  : adminSubRole === "staff"
                  ? "Staff Registered Mobile Number *"
                  : "Owner Registered Mobile Number *"}
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  mainTab === "user"
                    ? "Enter 10-digit student mobile number"
                    : adminSubRole === "staff"
                    ? "Enter 10-digit staff mobile number"
                    : "Enter 10-digit owner mobile number"
                }
                className="w-full h-10 px-3.5 rounded-[16px] bg-[#f0f0f0] text-[14px] text-[#141414] focus-ring-mobbin outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070]">
                  Password (min 8 characters) *
                </label>
                <a href="#" className="text-[12px] text-[#707070] hover:text-[#141414]">
                  Forgot?
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-10 px-3.5 rounded-[16px] bg-[#f0f0f0] text-[14px] text-[#141414] focus-ring-mobbin outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-full bg-[#141414] hover:bg-[#262626] disabled:bg-[#707070] text-white text-[13px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>
                  Sign In as{" "}
                  {mainTab === "user"
                    ? "Student"
                    : adminSubRole === "staff"
                    ? "Staff"
                    : "Owner"}
                </span>
              )}
            </button>

            {mainTab === "user" && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFirstTimeSetup(true);
                    setSetupStep("verify");
                    setErrorMessage(null);
                  }}
                  className="text-[12px] font-semibold text-[#141414] hover:underline cursor-pointer"
                >
                  New student? Set up password & activate account →
                </button>
              </div>
            )}
          </form>
        )}

        {/* 1-Click Demo Fill */}
        {!isFirstTimeSetup && (
          <div className="mt-5 pt-3.5 border-t border-[#f0f0f0] text-center">
            <span className="text-[11px] font-semibold text-[#707070] block mb-2">
              1-Click Demo Credentials:
            </span>
            <div className="flex flex-wrap justify-center gap-1.5">
              <button
                type="button"
                onClick={() => handleDemoFill("user_4w")}
                className="px-2.5 py-1 rounded-full bg-[#f3f3f3] hover:bg-[#e0e0e0] text-[11px] font-medium text-[#141414] cursor-pointer"
              >
                Student (4W)
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill("user_2w")}
                className="px-2.5 py-1 rounded-full bg-[#f3f3f3] hover:bg-[#e0e0e0] text-[11px] font-medium text-[#141414] cursor-pointer"
              >
                Student (2W)
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill("staff")}
                className="px-2.5 py-1 rounded-full bg-[#f3f3f3] hover:bg-[#e0e0e0] text-[11px] font-medium text-[#141414] cursor-pointer"
              >
                Staff Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill("owner")}
                className="px-2.5 py-1 rounded-full bg-[#f3f3f3] hover:bg-[#e0e0e0] text-[11px] font-medium text-[#141414] cursor-pointer"
              >
                Academy Owner
              </button>
            </div>
          </div>
        )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}