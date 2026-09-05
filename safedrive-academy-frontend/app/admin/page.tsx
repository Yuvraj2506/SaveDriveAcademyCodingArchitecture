"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CleanStudentData, CleanPendingRequest, CleanPaymentRecord } from "@/types";
import { apiClient } from "@/lib/apiClient";
import NewStudentModal from "@/components/NewStudentModal";
import NewPaymentModal from "@/components/NewPaymentModal";
import ReceiptModal from "@/components/ReceiptModal";
import Footer from "@/components/Footer";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminRole, setAdminRole] = useState<"admin_staff" | "admin_owner">("admin_staff");
  const [adminName, setAdminName] = useState("Rajesh Kumar (Staff)");

  const [studentsList, setStudentsList] = useState<CleanStudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<CleanStudentData | null>(null);
  const [currentKm, setCurrentKm] = useState<number>(0);
  const [currentDays, setCurrentDays] = useState<number>(0);
  const [pendingRequests, setPendingRequests] = useState<CleanPendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"students" | "pending">("students");
  const [newStudentModalOpen, setNewStudentModalOpen] = useState(false);
  const [newPaymentModalOpen, setNewPaymentModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [receiptModalData, setReceiptModalData] = useState<{
    student: CleanStudentData;
    payment: CleanPaymentRecord;
  } | null>(null);

  // Load students & pending requests from backend database API
  async function loadData() {
    try {
      const [students, requests] = await Promise.allSettled([
        apiClient.getStudents(),
        apiClient.getPendingRequests(),
      ]);

      if (students.status === "fulfilled" && students.value && students.value.length > 0) {
        setStudentsList(students.value);
        if (!selectedStudent && students.value.length > 0) {
          setSelectedStudent(students.value[0]);
          setCurrentKm(students.value[0].completedKm || 0);
          setCurrentDays(students.value[0].completedDays || 0);
        } else if (selectedStudent) {
          const updated = students.value.find(
            (s: CleanStudentData) => s.phone === selectedStudent.phone
          );
          if (updated) {
            setSelectedStudent(updated);
            setCurrentKm(updated.completedKm || 0);
            setCurrentDays(updated.completedDays || 0);
          }
        }
      }

      if (requests.status === "fulfilled" && requests.value) {
        setPendingRequests(requests.value);
      }
    } catch (err) {
      console.warn("Notice: Initializing admin data loader:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserStr = localStorage.getItem("safedrive_user");
      if (storedUserStr) {
        try {
          const storedUser = JSON.parse(storedUserStr);
          const role = storedUser.Role || storedUser.role;
          const name = storedUser.FullName || storedUser.name;
          if (role === "student" || role === "user") {
            router.push("/dashboard");
            return;
          }
          if (role === "admin_owner") {
            setAdminRole("admin_owner");
            setAdminName(name || "Yuvraj Gupta (Owner)");
          } else {
            setAdminRole("admin_staff");
            setAdminName(name || "Ramesh Kumar (Staff)");
          }
        } catch {
          // fallback
        }
      }
    }

    loadData();
  }, [router]);

  useEffect(() => {
    if (selectedStudent) {
      setCurrentKm(selectedStudent.completedKm || 0);
      setCurrentDays(selectedStudent.completedDays || 0);
    }
  }, [selectedStudent]);

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("safedrive_auth_token");
      localStorage.removeItem("safedrive_user");
    }
    router.push("/");
  };

  const handleKmChange = async (newVal: number) => {
    if (!selectedStudent || adminRole !== "admin_owner") return;
    setCurrentKm(newVal);

    try {
      await fetch(`/api/students/${encodeURIComponent(selectedStudent.phone)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedKm: newVal }),
      });
      setStudentsList((prev: CleanStudentData[]) =>
        prev.map((s) => (s.phone === selectedStudent.phone ? { ...s, completedKm: newVal } : s))
      );
      setSelectedStudent((prev: CleanStudentData | null) => (prev ? { ...prev, completedKm: newVal } : null));
    } catch (err) {
      console.error("Error updating km:", err);
    }
  };

  const handleDaysChange = async (newDays: number) => {
    if (!selectedStudent || adminRole !== "admin_owner") return;
    setCurrentDays(newDays);

    try {
      await fetch(`/api/students/${encodeURIComponent(selectedStudent.phone)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedDays: newDays }),
      });
      setStudentsList((prev: CleanStudentData[]) =>
        prev.map((s) => (s.phone === selectedStudent.phone ? { ...s, completedDays: newDays } : s))
      );
      setSelectedStudent((prev: CleanStudentData | null) => (prev ? { ...prev, completedDays: newDays } : null));
    } catch (err) {
      console.error("Error updating days:", err);
    }
  };

  // Owner Action: Delete Student
  const handleDeleteStudent = async (studentPhone: string, studentName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete student "${studentName}" (${studentPhone}) from the database?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/students/${encodeURIComponent(studentPhone)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Student "${studentName}" deleted from database.`);
        setTimeout(() => setActionMessage(null), 3000);

        const remaining = studentsList.filter((s) => s.phone !== studentPhone);
        setStudentsList(remaining);
        if (selectedStudent?.phone === studentPhone) {
          setSelectedStudent(remaining[0] || null);
          if (remaining[0]) setCurrentKm(remaining[0].completedKm);
        }
      }
    } catch (err) {
      console.error("Error deleting student:", err);
    }
  };

  // Staff submits a request -> refetch from API
  const handleRequestSubmitted = () => {
    loadData();
    setActiveTab("pending");
  };

  // Owner Action: Approve Request -> updates database & refetches
  const handleApproveRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/requests/${requestId}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        const msg =
          data.type === "new_payment"
            ? "Payment approved and credited to student ledger!"
            : "Student registration approved and added to active roster!";
        setActionMessage(msg);
        setTimeout(() => setActionMessage(null), 3500);
        await loadData();
        setActiveTab("students");
      }
    } catch (err) {
      console.error("Error approving request:", err);
    }
  };

  // Owner Action: Reject Request
  const handleRejectRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setPendingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
        setActionMessage(`Request rejected and removed.`);
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err) {
      console.error("Error rejecting request:", err);
    }
  };

  const isOwner = adminRole === "admin_owner";
  const percentage = selectedStudent
    ? Math.min(100, Math.round((currentKm / selectedStudent.targetKm) * 100))
    : 0;
  const remainingKm = selectedStudent ? Math.max(0, selectedStudent.targetKm - currentKm) : 0;

  const filteredStudents = studentsList.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      s.phone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ffffff] text-[#141414]">
        <div className="flex items-center gap-2 text-[14px] text-[#707070]">
          <span className="w-4 h-4 border-2 border-[#141414] border-t-transparent rounded-full animate-spin"></span>
          <span>Loading admin dashboard from database...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#ffffff] text-[#141414]">
      {/* Top Floating Admin Navbar */}
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
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                isOwner ? "bg-[#141414] text-white" : "bg-white text-[#141414] border border-[#e0e0e0]"
              }`}
            >
              {isOwner ? "Owner Portal" : "Staff Portal"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setNewPaymentModalOpen(true)}
              className="px-3 sm:px-3.5 h-8 text-[11px] sm:text-[12px] font-semibold text-[#141414] hover:bg-[#e0e0e0] bg-white border border-[#e0e0e0] rounded-full transition-colors cursor-pointer flex items-center gap-1"
              title="Record installment payment for approval"
            >
              <span>+ Record Payment</span>
            </button>

            <button
              onClick={() => setNewStudentModalOpen(true)}
              className="px-3 sm:px-4 h-8 text-[11px] sm:text-[12px] font-semibold text-white bg-[#141414] hover:bg-[#262626] rounded-full transition-colors cursor-pointer shadow-none flex items-center gap-1"
            >
              <span>+ Request New Student</span>
            </button>

            <button
              onClick={handleSignOut}
              className="px-3 sm:px-4 h-8 text-[11px] sm:text-[12px] font-semibold text-[#141414] hover:bg-[#e0e0e0] bg-white border border-[#e0e0e0] rounded-full transition-colors cursor-pointer"
            >
              Sign Out →
            </button>
          </div>
        </header>
      </div>

      {/* Main Admin Content */}
      <main className="flex-1 w-full bg-[#f3f3f3] py-8 lg:py-12 mt-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Action Notification Banner */}
          {actionMessage && (
            <div className="p-3.5 rounded-[16px] bg-[#141414] text-white text-[13px] font-medium flex items-center justify-between animate-fade-in shadow-md">
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>{actionMessage}</span>
              </div>
              <button
                onClick={() => setActionMessage(null)}
                className="text-white/70 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Owner Executive Metrics in Indian Rupees (₹) */}
          {isOwner && (
            <div className="bg-[#141414] text-white p-6 rounded-[24px] grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[11px] text-[#adadad] block uppercase font-medium">Total Enrolled</span>
                <span className="text-[22px] font-semibold">{studentsList.length} Students</span>
              </div>
              <div>
                <span className="text-[11px] text-[#adadad] block uppercase font-medium">Total Revenue (₹)</span>
                <span className="text-[22px] font-semibold">
                  ₹{studentsList.reduce((acc, s) => acc + s.totalPaid, 0).toLocaleString("en-IN")}.00
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#adadad] block uppercase font-medium">Pending Dues (₹)</span>
                <span className="text-[22px] font-semibold">
                  ₹{studentsList.reduce((acc, s) => acc + s.remainingDue, 0).toLocaleString("en-IN")}.00
                </span>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STUDENTS DIRECTORY & SEARCH BAR
              ═══════════════════════════════════════════════════════ */}
          <div className="bg-[#ffffff] p-5 sm:p-6 rounded-[24px] border border-[#f0f0f0] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f0f0f0]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("students")}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all cursor-pointer ${
                    activeTab === "students"
                      ? "bg-[#141414] text-white"
                      : "bg-[#f3f3f3] text-[#707070] hover:text-[#141414]"
                  }`}
                >
                  All Students ({studentsList.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("pending")}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "pending"
                      ? "bg-[#141414] text-white"
                      : "bg-[#f3f3f3] text-[#707070] hover:text-[#141414]"
                  }`}
                >
                  <span>Pending Approval Queue</span>
                  {pendingRequests.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#e60023] text-white text-[10px] flex items-center justify-center font-bold">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>
              </div>

              <span className="text-[12px] text-[#707070]">
                {isOwner ? "Owner: Full management & delete access" : "Staff: Click student name to pop details"}
              </span>
            </div>

            {activeTab === "students" ? (
              <>
                {/* Search Input for Name / Mobile Number */}
                <div className="relative">
                  <div className="flex items-center gap-2.5 bg-[#f0f0f0] px-4 py-2.5 rounded-full border border-transparent focus-within:border-[#141414] transition-colors">
                    <svg className="w-4 h-4 text-[#707070] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search students by Name or Mobile No (+91)..."
                      className="w-full bg-transparent text-[13px] text-[#141414] placeholder-[#707070] outline-none"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-[11px] text-[#707070] hover:text-[#141414] cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Compact Student Names List */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#707070] block">
                    Select a student to view and edit details:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((stu) => (
                        <button
                          key={stu.phone}
                          onClick={() => {
                            setSelectedStudent(stu);
                            const el = document.getElementById("admin-student-details");
                            if (el) el.scrollIntoView({ behavior: "smooth" });
                          }}
                          className={`p-3.5 rounded-[16px] text-left transition-all border cursor-pointer flex flex-col justify-between ${
                            selectedStudent?.phone === stu.phone
                              ? "bg-[#141414] text-white border-[#141414] shadow-sm"
                              : "bg-[#f3f3f3] text-[#141414] border-transparent hover:bg-[#e0e0e0]/60"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-[14px] truncate">{stu.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                                selectedStudent?.phone === stu.phone
                                  ? "bg-white/20 text-white"
                                  : "bg-white text-[#141414]"
                              }`}
                            >
                              {stu.vehicleType}
                            </span>
                          </div>
                          <div
                            className={`text-[12px] mt-1 ${
                              selectedStudent?.phone === stu.phone ? "text-[#adadad]" : "text-[#707070]"
                            }`}
                          >
                            📞 {stu.phone}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="col-span-full py-4 text-center text-[13px] text-[#707070]">
                        No student record found matching "{searchQuery}".
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* PENDING OWNER APPROVAL QUEUE (New Student + New Payment) */
              <div className="space-y-3 pt-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#707070] block">
                  Pending Approvals Queue ({pendingRequests.length} requests waiting):
                </span>

                {pendingRequests.length > 0 ? (
                  <div className="space-y-2.5">
                    {pendingRequests.map((req) => (
                      <div
                        key={req.requestId}
                        className="p-4 rounded-[16px] bg-[#f3f3f3] border border-[#e0e0e0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[13px]"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                req.type === "new_payment"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : "bg-blue-100 text-blue-800 border border-blue-300"
                              }`}
                            >
                              {req.type === "new_payment" ? "FEE PAYMENT" : "NEW REGISTRATION"}
                            </span>
                            <span className="font-semibold text-[15px] text-[#141414]">{req.name}</span>
                            <span className="px-2 py-0.5 rounded-full bg-white text-[#141414] text-[11px] font-semibold border border-[#e0e0e0]">
                              Method: {req.paymentMethod || "UPI"}
                            </span>
                            <span className="text-[11px] text-[#707070]">
                              ID: {req.requestId}
                            </span>
                          </div>

                          <div className="text-[12px] text-[#707070]">
                            📞 {req.phone} · Course: {req.course} · Instructor: {req.instructor} · Date: {req.requestedDate}
                          </div>

                          <div className="text-[12px] font-medium text-[#141414]">
                            {req.type === "new_payment" ? (
                              <span>
                                Payment Amount: <strong className="text-emerald-700">₹{req.amountPaid.toLocaleString("en-IN")}.00</strong> (Remaining after approval: ₹{(req.amountDue || 0).toLocaleString("en-IN")}.00)
                              </span>
                            ) : (
                              <span>
                                Initial Paid: ₹{req.amountPaid.toLocaleString("en-IN")}.00 | Balance Due: ₹{(req.amountDue || 0).toLocaleString("en-IN")}.00 (Total: ₹{(req.amountPaid + (req.amountDue || 0)).toLocaleString("en-IN")}.00)
                              </span>
                            )}
                          </div>

                          {req.referenceNote && (
                            <div className="text-[11px] text-[#707070] italic">
                              Note: {req.referenceNote}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isOwner ? (
                            <>
                              <button
                                onClick={() => handleApproveRequest(req.requestId)}
                                className="px-4 py-2 rounded-full bg-[#141414] hover:bg-[#262626] text-white text-[12px] font-semibold transition-colors cursor-pointer shadow-none"
                              >
                                {req.type === "new_payment" ? "Approve Payment ✓" : "Approve Student ✓"}
                              </button>
                              <button
                                onClick={() => handleRejectRequest(req.requestId)}
                                className="px-3 py-2 rounded-full bg-white hover:bg-[#e0e0e0] text-[#141414] text-[12px] font-semibold border border-[#e0e0e0] transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="px-3 py-1.5 rounded-full bg-white text-[#707070] text-[11px] font-medium border border-[#e0e0e0]">
                              Waiting for Owner Approval
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-[13px] text-[#707070] bg-[#f3f3f3] rounded-[16px]">
                    No pending requests waiting for owner approval.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════
              POPPED STUDENT DETAILS: KM SLIDER & FINANCIAL LEDGER
              ═══════════════════════════════════════════════════════ */}
          {selectedStudent && (
            <div id="admin-student-details" className="space-y-6 pt-2">
              {/* Card 1: Adaptive Training Progress (4W Km vs 2W 15 Days vs License-Only) */}
              {selectedStudent.vehicleType === "4-Wheeler" ? (
                /* ─── 4-WHEELER PRACTICAL TRAINING (80 KM / 120 KM) ─── */
                <div className="bg-[#ffffff] border border-[#f0f0f0] rounded-[24px] p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#f0f0f0]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f3f3f3] text-[#141414]">
                          4-Wheeler Practical Training
                        </span>
                        <span className="text-[12px] text-[#707070]">📞 {selectedStudent.phone}</span>
                      </div>
                      <h2 className="text-[26px] font-semibold text-[#141414] tracking-tight mt-1">
                        {selectedStudent.name}.
                      </h2>
                      <p className="text-[13px] text-[#707070] mt-0.5">
                        Instructor: {selectedStudent.assignedInstructor} · {selectedStudent.coursePackage}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Owner Action: Delete Student Button */}
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteStudent(selectedStudent.phone, selectedStudent.name)}
                          className="px-3.5 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[12px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          title="Delete student permanently"
                        >
                          <span>🗑 Delete Student</span>
                        </button>
                      )}

                      <div className="bg-[#f3f3f3] rounded-full px-5 py-2.5 text-right sm:text-center self-start">
                        <div className="text-[24px] font-semibold text-[#141414] leading-none">
                          {currentKm} <span className="text-[14px] text-[#707070] font-normal">/ {selectedStudent.targetKm} km</span>
                        </div>
                        <div className="text-[11px] text-[#707070] font-medium mt-1">
                          {selectedStudent.targetKm > 0 ? Math.min(100, Math.round((currentKm / selectedStudent.targetKm) * 100)) : 0}% Completed
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Kilometers Component: Draggable Slider for Owner vs View-Only for Staff */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-semibold text-[#141414]">
                        {isOwner
                          ? "Adjust Student Completed Driving Kilometers (Syncs to DB):"
                          : "Training Kilometers Status (View-Only):"}
                      </span>
                      <span className="font-semibold text-[#141414]">
                        {currentKm} km logged ({Math.max(0, selectedStudent.targetKm - currentKm)} km remaining)
                      </span>
                    </div>

                    {isOwner ? (
                      /* Owner: Interactive Draggable Range Slider */
                      <div className="relative pt-1 pb-1">
                        <input
                          type="range"
                          min={0}
                          max={selectedStudent.targetKm}
                          value={currentKm}
                          onChange={(e) => handleKmChange(Number(e.target.value))}
                          className="w-full h-3 bg-[#f0f0f0] rounded-full appearance-none cursor-ew-resize accent-[#141414]"
                        />
                        <div className="flex justify-between text-[11px] text-[#707070] mt-2">
                          <span>0 km (Start)</span>
                          <span>{Math.round(selectedStudent.targetKm / 2)} km (Halfway)</span>
                          <span>{selectedStudent.targetKm} km (Goal)</span>
                        </div>
                      </div>
                    ) : (
                      /* Staff: View-Only Progress Bar */
                      <div className="space-y-2 pt-1">
                        <div className="w-full h-3.5 bg-[#f0f0f0] rounded-full overflow-hidden p-0.5 border border-[#e0e0e0]">
                          <div
                            className="h-full bg-[#141414] rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${
                                selectedStudent.targetKm > 0
                                  ? Math.min(100, Math.round((currentKm / selectedStudent.targetKm) * 100))
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-[#707070]">
                          <span>0 km (Start)</span>
                          <span className="font-semibold text-[#141414]">{currentKm} km driven</span>
                          <span>Target: {selectedStudent.targetKm} km</span>
                        </div>
                      </div>
                    )}

                    <div className="bg-[#f3f3f3] rounded-[16px] p-3.5 flex items-center justify-between text-[12px] text-[#707070]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#141414]"></span>
                        <span>
                          {currentKm >= selectedStudent.targetKm
                            ? "Course completed! Student has driven all required package kilometers."
                            : currentKm >= Math.round(selectedStudent.targetKm / 2)
                            ? "Advanced road maneuvers & highway sessions active."
                            : "Basic vehicle controls & steering drills in progress."}
                        </span>
                      </div>
                      <span className="font-semibold text-[#141414]">
                        {isOwner ? "Owner Slider Active" : "Staff View Mode"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : selectedStudent.vehicleType === "2-Wheeler" ? (
                /* ─── 2-WHEELER TRAINING (15 DAYS · 1 HR DAILY) ─── */
                <div className="bg-[#ffffff] border border-[#f0f0f0] rounded-[24px] p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#f0f0f0]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f3f3f3] text-[#141414]">
                          2-Wheeler Training (15 Days · 1 hr/day)
                        </span>
                        <span className="text-[12px] text-[#707070]">📞 {selectedStudent.phone}</span>
                      </div>
                      <h2 className="text-[26px] font-semibold text-[#141414] tracking-tight mt-1">
                        {selectedStudent.name}.
                      </h2>
                      <p className="text-[13px] text-[#707070] mt-0.5">
                        Instructor: {selectedStudent.assignedInstructor} · {selectedStudent.coursePackage}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteStudent(selectedStudent.phone, selectedStudent.name)}
                          className="px-3.5 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[12px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          title="Delete student permanently"
                        >
                          <span>🗑 Delete Student</span>
                        </button>
                      )}

                      <div className="bg-[#f3f3f3] rounded-full px-5 py-2.5 text-right sm:text-center self-start">
                        <div className="text-[24px] font-semibold text-[#141414] leading-none">
                          {currentDays} <span className="text-[14px] text-[#707070] font-normal">/ 15 Days</span>
                        </div>
                        <div className="text-[11px] text-[#707070] font-medium mt-1">
                          {Math.min(100, Math.round((currentDays / 15) * 100))}% Completed
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 15-Days Progress Tracker */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-semibold text-[#141414]">
                        {isOwner
                          ? "Update Completed Training Sessions (1 hr/day):"
                          : "15-Day Session Attendance (View-Only):"}
                      </span>
                      <span className="font-semibold text-[#141414]">
                        {currentDays} of 15 Days ({Math.max(0, 15 - currentDays)} days remaining)
                      </span>
                    </div>

                    {isOwner ? (
                      /* Owner: Stepper & Range for Days */
                      <div className="space-y-3">
                        <div className="relative pt-1 pb-1">
                          <input
                            type="range"
                            min={0}
                            max={15}
                            value={currentDays}
                            onChange={(e) => handleDaysChange(Number(e.target.value))}
                            className="w-full h-3 bg-[#f0f0f0] rounded-full appearance-none cursor-ew-resize accent-[#141414]"
                          />
                          <div className="flex justify-between text-[11px] text-[#707070] mt-2">
                            <span>Day 0 (Start)</span>
                            <span>Day 8 (Midway)</span>
                            <span>Day 15 (Final Test)</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleDaysChange(Math.max(0, currentDays - 1))}
                            className="px-3 py-1 rounded-full bg-[#f3f3f3] hover:bg-[#e0e0e0] text-[12px] font-semibold cursor-pointer"
                          >
                            - 1 Day
                          </button>
                          <button
                            onClick={() => handleDaysChange(Math.min(15, currentDays + 1))}
                            className="px-3 py-1 rounded-full bg-[#141414] hover:bg-[#262626] text-white text-[12px] font-semibold cursor-pointer"
                          >
                            + 1 Day Completed
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Staff: View-Only Days Progress */
                      <div className="space-y-2 pt-1">
                        <div className="w-full h-3.5 bg-[#f0f0f0] rounded-full overflow-hidden p-0.5 border border-[#e0e0e0]">
                          <div
                            className="h-full bg-[#141414] rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(100, Math.round((currentDays / 15) * 100))}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-[#707070]">
                          <span>Day 1</span>
                          <span className="font-semibold text-[#141414]">{currentDays} Days Completed</span>
                          <span>15 Days Total</span>
                        </div>
                      </div>
                    )}

                    <div className="bg-[#f3f3f3] rounded-[16px] p-3.5 flex items-center justify-between text-[12px] text-[#707070]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#141414]"></span>
                        <span>
                          {currentDays >= 15
                            ? "All 15 practical training days finished! Ready for final RTO track test."
                            : currentDays >= 8
                            ? "Balance, slalom & figure-8 riding drills in progress."
                            : "Basic clutch/brake control & low-speed balancing in progress."}
                        </span>
                      </div>
                      <span className="font-semibold text-[#141414]">
                        {isOwner ? "Owner Stepper Active" : "Staff View Mode"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* ─── LICENSE-ONLY SERVICE (NON-TRAINING / DIRECT RTO) ─── */
                <div className="bg-[#ffffff] border border-[#f0f0f0] rounded-[24px] p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#f0f0f0]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#141414] text-white">
                          📋 Direct RTO License Service
                        </span>
                        <span className="text-[12px] text-[#707070]">📞 {selectedStudent.phone}</span>
                      </div>
                      <h2 className="text-[26px] font-semibold text-[#141414] tracking-tight mt-1">
                        {selectedStudent.name}.
                      </h2>
                      <p className="text-[13px] text-[#707070] mt-0.5">
                        {selectedStudent.coursePackage} · Desk: RTO Documentation Desk
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteStudent(selectedStudent.phone, selectedStudent.name)}
                          className="px-3.5 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[12px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          title="Delete client permanently"
                        >
                          <span>🗑 Delete Client</span>
                        </button>
                      )}

                      <div className="bg-[#f3f3f3] rounded-full px-5 py-2.5 text-right sm:text-center self-start">
                        <div className="text-[16px] font-semibold text-[#141414]">
                          Direct RTO
                        </div>
                        <div className="text-[11px] text-[#707070] font-medium">
                          No Practical Km
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RTO Application Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1 text-center">
                    <div className="bg-[#f3f3f3] p-3 rounded-[16px] border border-[#e0e0e0]">
                      <span className="text-[18px] block mb-1">✓</span>
                      <span className="text-[12px] font-semibold text-[#141414] block">Documents</span>
                      <span className="text-[10px] text-[#707070]">KYC Verified</span>
                    </div>
                    <div className="bg-[#f3f3f3] p-3 rounded-[16px] border border-[#e0e0e0]">
                      <span className="text-[18px] block mb-1">✓</span>
                      <span className="text-[12px] font-semibold text-[#141414] block">Sarathi Portal</span>
                      <span className="text-[10px] text-[#707070]">Application Logged</span>
                    </div>
                    <div className="bg-[#f3f3f3] p-3 rounded-[16px] border border-[#e0e0e0]">
                      <span className="text-[18px] block mb-1">⏳</span>
                      <span className="text-[12px] font-semibold text-[#141414] block">RTO Slot</span>
                      <span className="text-[10px] text-[#707070]">Allotment In Review</span>
                    </div>
                    <div className="bg-[#f3f3f3] p-3 rounded-[16px] border border-[#e0e0e0]">
                      <span className="text-[18px] block mb-1">📬</span>
                      <span className="text-[12px] font-semibold text-[#141414] block">DL Dispatch</span>
                      <span className="text-[10px] text-[#707070]">Speed Post Tracking</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Card 2: Financial Dues & Payment Ledger (In Rupees ₹) */}
              <div className="bg-[#ffffff] border border-[#f0f0f0] rounded-[24px] p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#f0f0f0]">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f3f3f3] text-[#141414]">
                      Financial Ledger
                    </span>
                    <h3 className="text-[20px] font-semibold text-[#141414] tracking-tight mt-1">
                      Fees & Payment Status.
                    </h3>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Quick Record Payment for this student */}
                    <button
                      onClick={() => setNewPaymentModalOpen(true)}
                      className="px-4 py-2 rounded-full bg-[#141414] hover:bg-[#262626] text-white text-[12px] font-semibold transition-colors cursor-pointer"
                    >
                      + Record Payment
                    </button>

                    <div
                      className={`px-4 py-2 rounded-full text-center ${
                        selectedStudent.remainingDue === 0 ? "bg-[#f3f3f3] text-[#141414]" : "bg-[#141414] text-white"
                      }`}
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-wider">Remaining Balance</div>
                      <div className="text-[18px] font-semibold leading-tight">
                        ₹{selectedStudent.remainingDue.toLocaleString("en-IN")}.00 INR
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-[#f3f3f3] rounded-[16px] p-3.5">
                    <span className="text-[11px] text-[#707070] block font-semibold uppercase">Total Fee</span>
                    <span className="text-[18px] font-semibold text-[#141414]">
                      ₹{selectedStudent.totalCourseFee.toLocaleString("en-IN")}.00
                    </span>
                  </div>
                  <div className="bg-[#f3f3f3] rounded-[16px] p-3.5">
                    <span className="text-[11px] text-[#707070] block font-semibold uppercase">Paid to Date</span>
                    <span className="text-[18px] font-semibold text-[#141414]">
                      ₹{selectedStudent.totalPaid.toLocaleString("en-IN")}.00
                    </span>
                  </div>
                  <div className="bg-[#f3f3f3] rounded-[16px] p-3.5">
                    <span className="text-[11px] text-[#707070] block font-semibold uppercase">Amount Due</span>
                    <span className="text-[18px] font-semibold text-[#141414]">
                      ₹{selectedStudent.remainingDue.toLocaleString("en-IN")}.00
                    </span>
                  </div>
                </div>

                {/* Receipts List */}
                <div className="space-y-3 pt-2">
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-[#707070] block">
                    Payment History:
                  </span>

                  <div className="space-y-2">
                    {selectedStudent.payments.map((p: any) => (
                      <div
                        key={p.receiptNumber}
                        className="bg-[#f3f3f3]/70 border border-[#f0f0f0] rounded-[16px] p-3.5 flex items-center justify-between gap-3 text-[13px]"
                      >
                        <div>
                          <div className="font-semibold text-[#141414] flex items-center gap-2">
                            <span className="font-mono text-[12px]">{p.receiptNumber}</span>
                            <span className="text-[11px] font-normal text-[#707070]">· {p.date}</span>
                            <span className="px-2 py-0.5 rounded-full bg-white text-[#141414] text-[10px] font-semibold border border-[#e0e0e0]">
                              {p.method}
                            </span>
                          </div>
                          <div className="text-[12px] text-[#707070] mt-0.5">
                            Recorded: {p.recordedBy} {p.referenceNote ? `(${p.referenceNote})` : ""}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-[#141414]">
                            ₹{p.amount.toLocaleString("en-IN")}.00
                          </span>
                          <button
                            onClick={() => setReceiptModalData({ student: selectedStudent, payment: p })}
                            className="px-3.5 py-1.5 rounded-full bg-[#141414] hover:bg-[#262626] text-white text-[12px] font-semibold transition-colors cursor-pointer"
                          >
                            View Receipt ↗
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[12px] text-[#707070] pt-1">
                    Note: {selectedStudent.dueDateNote}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <NewStudentModal
        isOpen={newStudentModalOpen}
        onClose={() => setNewStudentModalOpen(false)}
        onRequestSubmitted={handleRequestSubmitted}
      />

      <NewPaymentModal
        isOpen={newPaymentModalOpen}
        onClose={() => setNewPaymentModalOpen(false)}
        students={studentsList}
        defaultStudentPhone={selectedStudent?.phone}
        onRequestSubmitted={handleRequestSubmitted}
      />

      <ReceiptModal
        receiptData={receiptModalData}
        onClose={() => setReceiptModalData(null)}
      />
    </div>
  );
}
