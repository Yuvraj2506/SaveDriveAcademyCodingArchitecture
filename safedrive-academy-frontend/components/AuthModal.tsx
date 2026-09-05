"use client";

import React, { useState } from "react";

export type AuthRole = "user" | "admin_staff" | "admin_owner";

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

  if (!isOpen) return null;

  const handleDemoFill = (type: "user_4w" | "user_2w" | "staff" | "owner") => {
    setErrorMessage(null);
    setIsFirstTimeSetup(false);
    if (type === "user_4w") {
      setMainTab("user");
      setIdentifier("+91 98765 43210");
      setPassword("demoStudent2026");
    } else if (type === "user_2w") {
      setMainTab("user");
      setIdentifier("+91 91234 56789");
      setPassword("demoStudent2026");
    } else if (type === "staff") {
      setMainTab("admin");
      setAdminSubRole("staff");
      setIdentifier("staff.rajesh@safedrive.io");
      setPassword("demoStaff2026");
    } else {
      setMainTab("admin");
      setAdminSubRole("owner");
      setIdentifier("owner.suresh@safedrive.io");
      setPassword("demoOwner2026");
    }
  };

  // 1. Regular Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          requestedRole: mainTab,
          adminSubRole: mainTab === "admin" ? adminSubRole : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Authentication failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      if (typeof window !== "undefined" && data.session?.token) {
        localStorage.setItem("safedrive_auth_token", data.session.token);
        localStorage.setItem("safedrive_user", JSON.stringify(data.user));
      }

      setSuccessMessage(data.message || "Authentication successful!");

      setTimeout(() => {
        setLoading(false);
        setSuccessMessage(null);
        onLoginSuccess(data.user.role, data.user.phone || identifier.trim(), data.user.name);
        onClose();
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect to authentication server";
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  // 2. First-Time Setup: Verify Phone
  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: setupPhone.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.message || "Mobile number not registered in approved students.");
        setLoading(false);
        return;
      }

      setVerifiedName(data.studentName || "Student");
      setSetupStep("set_password");
      setLoading(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  // 3. First-Time Setup: Set New Password
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: setupPhone.trim(), password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.message || "Failed to set password.");
        setLoading(false);
        return;
      }

      if (typeof window !== "undefined" && data.session?.token) {
        localStorage.setItem("safedrive_auth_token", data.session.token);
        localStorage.setItem("safedrive_user", JSON.stringify(data.user));
      }

      setSuccessMessage("Password set successfully! Logging in to your dashboard...");

      setTimeout(() => {
        setLoading(false);
        setSuccessMessage(null);
        onLoginSuccess("user", setupPhone.trim(), verifiedName || "Student");
        onClose();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to set password";
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-white border border-[#f0f0f0] rounded-[24px] p-6 sm:p-8 shadow-2xl"
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
              ? "Verify your registered +91 mobile number to create your password."
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

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-3.5 p-3 rounded-[16px] bg-red-50 border border-red-200 text-red-700 text-[12px] flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span>{errorMessage}</span>
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
          /* ═══════════════════════════════════════════════════════
              FIRST-TIME STUDENT PASSWORD SETUP FORM
              ═══════════════════════════════════════════════════════ */
          <div className="space-y-4">
            {setupStep === "verify" ? (
              <form onSubmit={handleVerifyPhone} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070] mb-1">
                    Enter Registered Mobile Number (+91) *
                  </label>
                  <input
                    type="text"
                    required
                    value={setupPhone}
                    onChange={(e) => setSetupPhone(e.target.value)}
                    placeholder="+91 98765 43210"
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
                  <span className="text-[#707070] block">📞 {setupPhone}</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070] mb-1">
                    Create New Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={4}
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
                    minLength={4}
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
          /* ═══════════════════════════════════════════════════════
              REGULAR SIGN IN FORM
              ═══════════════════════════════════════════════════════ */
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070] mb-1">
                {mainTab === "user"
                  ? "Registered Mobile Number (+91)"
                  : adminSubRole === "staff"
                  ? "Staff Email / Mobile Phone"
                  : "Owner Email Address"}
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  mainTab === "user"
                    ? "+91 98765 43210"
                    : adminSubRole === "staff"
                    ? "staff.rajesh@safedrive.io"
                    : "owner.suresh@safedrive.io"
                }
                className="w-full h-10 px-3.5 rounded-[16px] bg-[#f0f0f0] text-[14px] text-[#141414] focus-ring-mobbin outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070]">
                  Password
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
                Student (4-Wheeler)
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill("user_2w")}
                className="px-2.5 py-1 rounded-full bg-[#f3f3f3] hover:bg-[#e0e0e0] text-[11px] font-medium text-[#141414] cursor-pointer"
              >
                Student (2-Wheeler)
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
      </div>
    </div>
  );
}
