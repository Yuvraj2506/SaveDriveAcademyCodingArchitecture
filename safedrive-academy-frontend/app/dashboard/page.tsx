"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CleanStudentData, CleanPaymentRecord } from "@/types";
import ReceiptModal from "@/components/ReceiptModal";
import Footer from "@/components/Footer";

import { apiClient, AUTH_KEYS } from "@/lib/apiClient";
import AuthGuard from "@/components/AuthGuard";

function StudentDashboardContent() {
  const router = useRouter();
  const [student, setStudent] = useState<CleanStudentData | null>(null);
  const [currentKm, setCurrentKm] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [receiptModalData, setReceiptModalData] = useState<{
    student: CleanStudentData;
    payment: CleanPaymentRecord;
  } | null>(null);

  useEffect(() => {
    async function loadStudentData() {
      let userPhone = "";
      let userName = "Student";
      let userRole = "student";

      if (typeof window !== "undefined") {
        const storedUserStr = localStorage.getItem(AUTH_KEYS.USER) || localStorage.getItem("safedrive_user");
        if (storedUserStr) {
          try {
            const storedUser = JSON.parse(storedUserStr);
            userRole = storedUser.Role || storedUser.role || "student";
            if (userRole === "admin_staff" || userRole === "admin_owner") {
              router.push("/admin");
              return;
            }
            userPhone = storedUser.PhoneNumber || storedUser.phone || "";
            userName = storedUser.FullName || storedUser.name || "Student";
          } catch {
            // fallback
          }
        }
      }

      // Default fallback student data matching user session
      const fallbackStudent: CleanStudentData = {
        name: userName,
        phone: userPhone || "9876543212",
        vehicleType: "4-Wheeler",
        coursePackage: "4-Wheeler Personal (120 km Target)",
        trainingType: "4w_personal",
        targetKm: 120,
        completedKm: 42,
        totalDays: 15,
        completedDays: 7,
        totalCourseFee: 8500,
        totalPaid: 5000,
        remainingDue: 3500,
        assignedInstructor: "Vikram Singh (Senior Trainer)",
        status: "active",
        registrationDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        dueDateNote: "Next installment of ₹3,500 due before final road test.",
        payments: [
          {
            receiptNumber: "REC-2026-089",
            date: "01 Sep 2026",
            method: "UPI",
            amount: 5000,
            recordedBy: "Ramesh Kumar (Staff)"
          }
        ]
      };

      try {
        const students = await apiClient.getStudents();
        if (students && students.length > 0) {
          const matched =
            students.find(
              (s: CleanStudentData) =>
                userPhone && s.phone.replace(/\D/g, "").includes(userPhone.replace(/\D/g, ""))
            ) || students[0];
          setStudent(matched);
          setCurrentKm(matched.completedKm || 0);
        } else {
          setStudent(fallbackStudent);
          setCurrentKm(fallbackStudent.completedKm);
        }
      } catch (err) {
        console.warn("Using local student profile:", err);
        setStudent(fallbackStudent);
        setCurrentKm(fallbackStudent.completedKm);
      } finally {
        setLoading(false);
      }
    }

    loadStudentData();
  }, [router]);

  const handleSignOut = async () => {
    await apiClient.logout();
    router.push("/");
  };

  if (loading || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ffffff] text-[#141414]">
        <div className="flex items-center gap-2 text-[14px] text-[#707070]">
          <span className="w-4 h-4 border-2 border-[#141414] border-t-transparent rounded-full animate-spin"></span>
          <span>Loading student dashboard...</span>
        </div>
      </div>
    );
  }

  const is4W = student.vehicleType === "4-Wheeler";
  const is2W = student.vehicleType === "2-Wheeler";
  const isLicenseOnly = student.vehicleType === "License-Only";

  const percentage = student.targetKm > 0 ? Math.min(100, Math.round((currentKm / student.targetKm) * 100)) : 0;
  const remainingKm = Math.max(0, student.targetKm - currentKm);
  const completedDays = student.completedDays || 0;
  const daysPercentage = Math.min(100, Math.round((completedDays / 15) * 100));

  return (
    <div className="min-h-screen flex flex-col bg-[#ffffff] text-[#141414]">
      {/* Top Floating Dashboard Navbar */}
      <div className="sticky top-4 z-40 w-full px-4 sm:px-6 lg:px-8 flex justify-center">
        <header className="w-full max-w-4xl bg-[#f3f3f3]/95 backdrop-blur-md rounded-full px-5 py-2.5 flex items-center justify-between border border-[#e0e0e0]">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 squircle-icon bg-[#141414] flex items-center justify-center text-white text-[14px] font-bold transition-transform group-hover:scale-105">
                S
              </div>
              <span className="text-[17px] font-bold text-[#141414] tracking-tight">
                SafeDrive Academy.
              </span>
            </a>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white text-[#141414] border border-[#e0e0e0]">
              Student Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-[#707070] block font-medium">Logged in as</span>
              <span className="text-[13px] font-semibold text-[#141414]">{student.name}</span>
            </div>

            <button
              onClick={handleSignOut}
              className="px-4 h-8 text-[12px] font-semibold text-[#141414] hover:bg-[#e0e0e0] bg-white border border-[#e0e0e0] rounded-full transition-colors cursor-pointer"
            >
              Sign Out →
            </button>
          </div>
        </header>
      </div>

      {/* Main Student Dashboard Content */}
      <main className="flex-1 w-full bg-[#f3f3f3] py-8 lg:py-12 mt-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Welcome Banner */}
          <div className="bg-[#ffffff] border border-[#f0f0f0] rounded-[24px] p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f3f3f3] text-[#141414]">
                  {isLicenseOnly ? "📋 Direct RTO License" : `${student.vehicleType} Training`}
                </span>
                <span className="text-[12px] text-[#707070]">📞 {student.phone}</span>
              </div>
              <h1 className="text-[26px] sm:text-[30px] font-semibold text-[#141414] tracking-tight mt-1">
                Welcome back, {student.name}.
              </h1>
              <p className="text-[13px] text-[#707070] mt-0.5">
                {student.coursePackage} · {isLicenseOnly ? "RTO Documentation Desk" : `Instructor: ${student.assignedInstructor}`}
              </p>
            </div>

            <div className="bg-[#f3f3f3] rounded-full px-5 py-2.5 text-left sm:text-center self-start sm:self-center">
              {is4W ? (
                <>
                  <div className="text-[22px] font-semibold text-[#141414] leading-none">
                    {currentKm} <span className="text-[13px] text-[#707070] font-normal">/ {student.targetKm} km</span>
                  </div>
                  <div className="text-[11px] text-[#707070] font-medium mt-1">
                    {percentage}% Completed
                  </div>
                </>
              ) : is2W ? (
                <>
                  <div className="text-[22px] font-semibold text-[#141414] leading-none">
                    {completedDays} <span className="text-[13px] text-[#707070] font-normal">/ 15 Days</span>
                  </div>
                  <div className="text-[11px] text-[#707070] font-medium mt-1">
                    {daysPercentage}% Completed
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[18px] font-semibold text-[#141414] leading-none">
                    Direct RTO
                  </div>
                  <div className="text-[11px] text-[#707070] font-medium mt-1">
                    License Application
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              CARD 1: ADAPTIVE PROGRESS (4W Km vs 2W 15 Days vs License-Only)
              ═══════════════════════════════════════════════════════ */}
          {is4W ? (
            /* 4-Wheeler Progress */
            <div className="bg-[#ffffff] border border-[#f0f0f0] rounded-[24px] p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#f0f0f0]">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f3f3f3] text-[#141414]">
                    Practical Driving Milestones
                  </span>
                  <h2 className="text-[20px] font-semibold text-[#141414] tracking-tight mt-1">
                    Kilometers Completed.
                  </h2>
                </div>
                <span className="text-[13px] font-semibold text-[#141414]">
                  {remainingKm} km remaining
                </span>
              </div>

              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-semibold text-[#141414]">
                    Driving Distance Logged:
                  </span>
                  <span className="font-semibold text-[#141414]">
                    {currentKm} km of {student.targetKm} km
                  </span>
                </div>

                <div className="w-full h-3.5 bg-[#f0f0f0] rounded-full overflow-hidden p-0.5 border border-[#e0e0e0]">
                  <div
                    className="h-full bg-[#141414] rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#707070]">
                  <span>0 km (Start)</span>
                  <span>{Math.round(student.targetKm / 2)} km (Halfway)</span>
                  <span>{student.targetKm} km (Course Goal)</span>
                </div>

                <div className="bg-[#f3f3f3] rounded-[16px] p-3.5 flex items-center justify-between text-[12px] text-[#707070]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#141414]"></span>
                    <span>
                      {percentage >= 100
                        ? "Target distance completed! Ready for final RTO road test."
                        : percentage >= 50
                        ? "Highway sessions & advanced maneuver drills in progress."
                        : "Basic vehicle controls & steering drills active."}
                    </span>
                  </div>
                  <span className="font-semibold text-[#141414]">
                    {percentage}% Target Reached
                  </span>
                </div>
              </div>
            </div>
          ) : is2W ? (
            /* 2-Wheeler 15 Days Progress */
            <div className="bg-[#ffffff] border border-[#f0f0f0] rounded-[24px] p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#f0f0f0]">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f3f3f3] text-[#141414]">
                    2-Wheeler Practical Batch
                  </span>
                  <h2 className="text-[20px] font-semibold text-[#141414] tracking-tight mt-1">
                    15-Day Session Progress (1 hr/day).
                  </h2>
                </div>
                <span className="text-[13px] font-semibold text-[#141414]">
                  {Math.max(0, 15 - completedDays)} days remaining
                </span>
              </div>

              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-semibold text-[#141414]">
                    Practical Sessions Completed:
                  </span>
                  <span className="font-semibold text-[#141414]">
                    {completedDays} of 15 Days ({daysPercentage}%)
                  </span>
                </div>

                <div className="w-full h-3.5 bg-[#f0f0f0] rounded-full overflow-hidden p-0.5 border border-[#e0e0e0]">
                  <div
                    className="h-full bg-[#141414] rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${daysPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#707070]">
                  <span>Day 1 (Start)</span>
                  <span>Day 8 (Balance & Figure-8)</span>
                  <span>Day 15 (Final Test)</span>
                </div>

                <div className="bg-[#f3f3f3] rounded-[16px] p-3.5 flex items-center justify-between text-[12px] text-[#707070]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#141414]"></span>
                    <span>
                      {completedDays >= 15
                        ? "All 15 practical days completed! Prepared for RTO track test."
                        : completedDays >= 8
                        ? "Figure-8 riding & traffic maneuvering in progress."
                        : "Basic balance, throttle control & braking drills active."}
                    </span>
                  </div>
                  <span className="font-semibold text-[#141414]">
                    {daysPercentage}% Days Attended
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* License-Only Service Status */
            <div className="bg-[#ffffff] border border-[#f0f0f0] rounded-[24px] p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#f0f0f0]">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#141414] text-white">
                    Direct RTO Service
                  </span>
                  <h2 className="text-[20px] font-semibold text-[#141414] tracking-tight mt-1">
                    License Application Tracking.
                  </h2>
                </div>
                <span className="text-[13px] font-semibold text-emerald-600">
                  Application In Progress
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1 text-center">
                <div className="bg-[#f3f3f3] p-4 rounded-[16px] border border-[#e0e0e0]">
                  <span className="text-[20px] block mb-1">✓</span>
                  <span className="text-[13px] font-semibold text-[#141414] block">Documents</span>
                  <span className="text-[11px] text-[#707070]">KYC Verified</span>
                </div>
                <div className="bg-[#f3f3f3] p-4 rounded-[16px] border border-[#e0e0e0]">
                  <span className="text-[20px] block mb-1">✓</span>
                  <span className="text-[13px] font-semibold text-[#141414] block">Sarathi Portal</span>
                  <span className="text-[11px] text-[#707070]">Application Logged</span>
                </div>
                <div className="bg-[#f3f3f3] p-4 rounded-[16px] border border-[#e0e0e0]">
                  <span className="text-[20px] block mb-1">⏳</span>
                  <span className="text-[13px] font-semibold text-[#141414] block">RTO Slot</span>
                  <span className="text-[11px] text-[#707070]">Allotment In Review</span>
                </div>
                <div className="bg-[#f3f3f3] p-4 rounded-[16px] border border-[#e0e0e0]">
                  <span className="text-[20px] block mb-1">📬</span>
                  <span className="text-[13px] font-semibold text-[#141414] block">DL Dispatch</span>
                  <span className="text-[11px] text-[#707070]">Speed Post Tracking</span>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              CARD 2: FEES DUE & DIGITAL RECEIPTS (IN RUPEES ₹)
              ═══════════════════════════════════════════════════════ */}
          <div className="bg-[#ffffff] border border-[#f0f0f0] rounded-[24px] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f0f0f0]">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f3f3f3] text-[#141414]">
                  Financial Ledger
                </span>
                <h2 className="text-[20px] font-semibold text-[#141414] tracking-tight mt-1">
                  Course Fees & Payment Dues.
                </h2>
              </div>

              <div
                className={`px-4 py-2 rounded-full text-center ${
                  student.remainingDue === 0 ? "bg-[#f3f3f3] text-[#141414]" : "bg-[#141414] text-white"
                }`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider">Remaining Balance</div>
                <div className="text-[18px] font-semibold leading-tight">
                  ₹{student.remainingDue.toLocaleString("en-IN")}.00 INR
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#f3f3f3] rounded-[16px] p-3.5">
                <span className="text-[11px] text-[#707070] block font-semibold uppercase">Total Fee</span>
                <span className="text-[18px] font-semibold text-[#141414]">
                  ₹{student.totalCourseFee.toLocaleString("en-IN")}.00
                </span>
              </div>
              <div className="bg-[#f3f3f3] rounded-[16px] p-3.5">
                <span className="text-[11px] text-[#707070] block font-semibold uppercase">Paid to Date</span>
                <span className="text-[18px] font-semibold text-[#141414]">
                  ₹{student.totalPaid.toLocaleString("en-IN")}.00
                </span>
              </div>
              <div className="bg-[#f3f3f3] rounded-[16px] p-3.5">
                <span className="text-[11px] text-[#707070] block font-semibold uppercase">Amount Due</span>
                <span className="text-[18px] font-semibold text-[#141414]">
                  ₹{student.remainingDue.toLocaleString("en-IN")}.00
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#707070] block">
                Official Payment Receipts:
              </span>

              <div className="space-y-2">
                {student.payments.map((p: any) => (
                  <div
                    key={p.receiptNumber}
                    className="bg-[#f3f3f3]/70 border border-[#f0f0f0] rounded-[16px] p-3.5 flex items-center justify-between gap-3 text-[13px]"
                  >
                    <div>
                      <div className="font-semibold text-[#141414] flex items-center gap-2">
                        <span className="font-mono text-[12px]">{p.receiptNumber}</span>
                        <span className="text-[11px] font-normal text-[#707070]">· {p.date}</span>
                      </div>
                      <div className="text-[12px] text-[#707070] mt-0.5">
                        Paid via {p.method} ({p.recordedBy})
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-[#141414]">
                        ₹{p.amount.toLocaleString("en-IN")}.00
                      </span>
                      <button
                        onClick={() => setReceiptModalData({ student, payment: p })}
                        className="px-3.5 py-1.5 rounded-full bg-[#141414] hover:bg-[#262626] text-white text-[12px] font-semibold transition-colors cursor-pointer"
                      >
                        View Receipt ↗
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[12px] text-[#707070] pt-1">
                Note: {student.dueDateNote}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <ReceiptModal
        receiptData={receiptModalData}
        onClose={() => setReceiptModalData(null)}
      />
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <AuthGuard allowedRoles={["student", "user"]}>
      <StudentDashboardContent />
    </AuthGuard>
  );
}
