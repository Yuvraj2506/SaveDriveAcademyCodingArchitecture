"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CleanStudentData, CleanPendingRequest, CleanPaymentRecord } from "@/types";
import { apiClient, AUTH_KEYS } from "@/lib/apiClient";
import AuthGuard from "@/components/AuthGuard";
import NewStudentModal from "@/components/NewStudentModal";
import NewPaymentModal from "@/components/NewPaymentModal";
import ReceiptModal from "@/components/ReceiptModal";
import ReenrollModal from "@/components/ReenrollModal";
import Footer from "@/components/Footer";

type TimeFilter = "all" | "30d" | "90d" | "180d" | "365d" | "custom";

interface TimeFilterOption {
  id: TimeFilter;
  label: string;
  shortLabel: string;
  days: number | null;
}

const TIME_FILTER_OPTIONS: TimeFilterOption[] = [
  { id: "all", label: "All Time", shortLabel: "All Time", days: null },
  { id: "30d", label: "Last 30 Days", shortLabel: "30 Days", days: 30 },
  { id: "90d", label: "Last 3 Months", shortLabel: "3 Months", days: 90 },
  { id: "180d", label: "Last 6 Months", shortLabel: "6 Months", days: 180 },
  { id: "365d", label: "Last 1 Year", shortLabel: "1 Year", days: 365 },
  { id: "custom", label: "Custom Date Range", shortLabel: "Custom", days: null },
];

function parseFlexibleDate(dateStr?: string): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const direct = new Date(dateStr);
  if (!isNaN(direct.getTime()) && !/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(dateStr.trim())) {
    return direct;
  }
  const parts = dateStr.trim().split(/[-/ ]+/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        const dt = new Date(y, m, d);
        if (!isNaN(dt.getTime())) return dt;
      }
    } else {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      let y = parseInt(parts[2], 10);
      if (y < 100) y += 2000;
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        const dt = new Date(y, m, d);
        if (!isNaN(dt.getTime())) return dt;
      }
    }
  }
  return !isNaN(direct.getTime()) ? direct : null;
}

export function isStudentInactive(s: CleanStudentData): boolean {
  if (s.isInactive) return true;
  const refDateStr = s.approvedDate || s.registrationDate;
  const refDate = parseFlexibleDate(refDateStr);
  if (!refDate) return false;
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return refDate < sixMonthsAgo;
}

function isDateInRange(
  dateStr: string | undefined,
  days: number | null,
  customStart?: string,
  customEnd?: string
): boolean {
  if (customStart || customEnd) {
    const date = parseFlexibleDate(dateStr);
    if (!date) return true;
    if (customStart) {
      const start = new Date(customStart);
      start.setHours(0, 0, 0, 0);
      if (date < start) return false;
    }
    if (customEnd) {
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      if (date > end) return false;
    }
    return true;
  }

  if (days === null) return true;
  const date = parseFlexibleDate(dateStr);
  if (!date) return true;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}

function AdminDashboardContent() {
  const router = useRouter();
  const [adminRole, setAdminRole] = useState<"admin_staff" | "admin_owner">("admin_staff");
  const [adminName, setAdminName] = useState("Rajesh Kumar (Staff)");

  const [studentsList, setStudentsList] = useState<CleanStudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<CleanStudentData | null>(null);
  const [currentKm, setCurrentKm] = useState<number>(0);
  const [currentDays, setCurrentDays] = useState<number>(0);
  const [pendingRequests, setPendingRequests] = useState<CleanPendingRequest[]>([]);
  const [archivedStudents, setArchivedStudents] = useState<CleanStudentData[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "inactive" | "pending" | "archived">("active");
  const [pendingFilter, setPendingFilter] = useState<"all" | "new_student" | "new_payment">("all");
  const [isPendingFilterOpen, setIsPendingFilterOpen] = useState(false);
  const pendingFilterRef = useRef<HTMLDivElement>(null);

  const [newStudentModalOpen, setNewStudentModalOpen] = useState(false);
  const [newPaymentModalOpen, setNewPaymentModalOpen] = useState(false);
  const [reenrollModalStudent, setReenrollModalStudent] = useState<CleanStudentData | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [receiptModalData, setReceiptModalData] = useState<{
    student: CleanStudentData;
    payment: CleanPaymentRecord;
  } | null>(null);

  // Custom in-app delete modal state & Trash operations
  const [studentToDelete, setStudentToDelete] = useState<CleanStudentData | null>(null);
  const [isDeletingStudent, setIsDeletingStudent] = useState<boolean>(false);
  const [restoringPhone, setRestoringPhone] = useState<string | null>(null);
  const [permanentDeletingPhone, setPermanentDeletingPhone] = useState<string | null>(null);

  // Time filter & Custom date range state for executive cards
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false);
  const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");
  const timeFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (timeFilterRef.current && !timeFilterRef.current.contains(e.target as Node)) {
        setIsTimeFilterOpen(false);
      }
      if (pendingFilterRef.current && !pendingFilterRef.current.contains(e.target as Node)) {
        setIsPendingFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load students & pending requests from backend database API
  async function loadData() {
    try {
      const [students, requests, archived] = await Promise.allSettled([
        apiClient.getStudents(),
        apiClient.getPendingRequests(),
        apiClient.getArchivedStudents(),
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

      if (archived.status === "fulfilled" && archived.value) {
        setArchivedStudents(archived.value);
      }
    } catch (err) {
      console.warn("Notice: Initializing admin data loader:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserStr = localStorage.getItem(AUTH_KEYS.USER) || localStorage.getItem("safedrive_user");
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

  const handleSignOut = async () => {
    await apiClient.logout();
    router.push("/");
  };

  const handleKmChange = async (newVal: number) => {
    if (!selectedStudent || adminRole !== "admin_owner") return;
    setCurrentKm(newVal);

    try {
      await apiClient.updateStudentKm(selectedStudent.phone, newVal);
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
      await apiClient.updateStudentDays(selectedStudent.phone, newDays);
      setStudentsList((prev: CleanStudentData[]) =>
        prev.map((s) => (s.phone === selectedStudent.phone ? { ...s, completedDays: newDays } : s))
      );
      setSelectedStudent((prev: CleanStudentData | null) => (prev ? { ...prev, completedDays: newDays } : null));
    } catch (err) {
      console.error("Error updating days:", err);
    }
  };

  // Owner Action: Prompt Delete Student Modal
  const promptDeleteStudent = (student: CleanStudentData) => {
    setStudentToDelete(student);
  };

  // Owner Action: Confirm & Execute Delete Student via Backend API (30-Day Trash Soft-Delete)
  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    setIsDeletingStudent(true);

    const deletedCopy = { ...studentToDelete };

    try {
      const success = await apiClient.deleteStudent(studentToDelete.phone);
      if (success) {
        // Immediate UI Cleanup: remove student from both active list AND pending approval queue
        const remaining = studentsList.filter((s) => s.phone !== deletedCopy.phone);
        setStudentsList(remaining);
        setPendingRequests((prev) =>
          prev.filter((r) => r.phone !== deletedCopy.phone && r.id !== deletedCopy.id)
        );

        if (selectedStudent?.phone === deletedCopy.phone) {
          setSelectedStudent(remaining[0] || null);
          if (remaining[0]) {
            setCurrentKm(remaining[0].completedKm);
            setCurrentDays(remaining[0].completedDays || 0);
          }
        }
        setStudentToDelete(null);

        setActionMessage(
          `Student "${deletedCopy.name}" moved to Trash (retained for 30 days).`
        );
        setTimeout(() => setActionMessage(null), 5000);

        // Re-sync archived list
        apiClient.getArchivedStudents().then(setArchivedStudents).catch(console.error);
      } else {
        setActionMessage("Failed to delete student from database.");
        setTimeout(() => setActionMessage(null), 3500);
      }
    } catch (err: any) {
      console.error("Error deleting student:", err);
      setActionMessage(err.message || "Failed to delete student.");
      setTimeout(() => setActionMessage(null), 3500);
    } finally {
      setIsDeletingStudent(false);
    }
  };

  // Owner Action: Restore Student from Trash
  const handleRestoreStudent = async (studentPhone: string, studentName: string) => {
    setRestoringPhone(studentPhone);
    try {
      await apiClient.restoreStudent(studentPhone);
      setActionMessage(`Student "${studentName}" restored to active records!`);
      setTimeout(() => setActionMessage(null), 3500);
      await loadData();
    } catch (err: any) {
      console.error("Error restoring student:", err);
      setActionMessage(err.message || "Failed to restore student.");
      setTimeout(() => setActionMessage(null), 3500);
    } finally {
      setRestoringPhone(null);
    }
  };

  // Owner Action: Permanently Delete Student from Database
  const handlePermanentlyDeleteStudent = async (studentPhone: string, studentName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently erase "${studentName}" (${studentPhone}) immediately? This cannot be recovered.`
      )
    ) {
      return;
    }

    setPermanentDeletingPhone(studentPhone);
    try {
      await apiClient.permanentlyDeleteStudent(studentPhone);
      setArchivedStudents((prev) => prev.filter((s) => s.phone !== studentPhone));
      setActionMessage(`Student "${studentName}" permanently deleted.`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      console.error("Error permanently deleting student:", err);
      setActionMessage(err.message || "Failed to delete permanently.");
      setTimeout(() => setActionMessage(null), 3500);
    } finally {
      setPermanentDeletingPhone(null);
    }
  };

  // Staff submits a request -> refetch from API
  const handleRequestSubmitted = () => {
    loadData();
    setActiveTab("pending");
  };

  // Owner Action: Approve Request -> updates database & refetches
  const handleApproveRequest = async (idOrPhone: string) => {
    try {
      await apiClient.approveOwnerStudentRequest(idOrPhone);
      setActionMessage("Student registration approved! Student can now activate their account.");
      setTimeout(() => setActionMessage(null), 3500);
      await loadData();
      setActiveTab("active");
    } catch (err: any) {
      console.error("Error approving request:", err);
      setActionMessage(err.message || "Failed to approve request.");
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  // Owner Action: Student Re-enrolled with New Course -> updates database & refetches
  const handleStudentReenrolled = async (updatedStudent: CleanStudentData) => {
    setReenrollModalStudent(null);
    setActionMessage(`Student "${updatedStudent.name}" re-enrolled with new course & active status!`);
    setTimeout(() => setActionMessage(null), 5000);
    await loadData();
    setSelectedStudent(updatedStudent);
    setActiveTab("active");
  };

  // Owner Action: Reject Request
  const handleRejectRequest = async (idOrPhone: string) => {
    try {
      await apiClient.rejectOwnerStudentRequest(idOrPhone, "Declined by owner");
      setActionMessage("Request rejected and marked.");
      setTimeout(() => setActionMessage(null), 3000);
      await loadData();
    } catch (err: any) {
      console.error("Error rejecting request:", err);
      setActionMessage(err.message || "Failed to reject request.");
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const isOwner = adminRole === "admin_owner";
  const percentage = selectedStudent
    ? Math.min(100, Math.round((currentKm / selectedStudent.targetKm) * 100))
    : 0;
  const remainingKm = selectedStudent ? Math.max(0, selectedStudent.targetKm - currentKm) : 0;

  const activeStudentsList = useMemo(() => {
    return studentsList.filter((s) => !isStudentInactive(s));
  }, [studentsList]);

  const inactiveStudentsList = useMemo(() => {
    return studentsList.filter((s) => isStudentInactive(s));
  }, [studentsList]);

  const filteredActiveStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return activeStudentsList;
    return activeStudentsList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.phone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
    );
  }, [activeStudentsList, searchQuery]);

  const filteredInactiveStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return inactiveStudentsList;
    return inactiveStudentsList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.phone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
    );
  }, [inactiveStudentsList, searchQuery]);

  const filteredPendingRequests = useMemo(() => {
    if (pendingFilter === "new_student") {
      return pendingRequests.filter((r) => r.type !== "new_payment");
    }
    if (pendingFilter === "new_payment") {
      return pendingRequests.filter((r) => r.type === "new_payment");
    }
    return pendingRequests;
  }, [pendingRequests, pendingFilter]);

  const filteredArchivedStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return archivedStudents;
    return archivedStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.phone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
    );
  }, [archivedStudents, searchQuery]);

  // Time-filtered executive metrics for Owner cards
  const activeTimeFilterOption =
    TIME_FILTER_OPTIONS.find((o) => o.id === timeFilter) || TIME_FILTER_OPTIONS[0];

  const timeFilteredStudents = useMemo(() => {
    if (timeFilter === "all") return studentsList;
    if (timeFilter === "custom") {
      if (!customStartDate && !customEndDate) return studentsList;
      return studentsList.filter((s) =>
        isDateInRange(s.registrationDate, null, customStartDate, customEndDate)
      );
    }
    if (!activeTimeFilterOption.days) return studentsList;
    return studentsList.filter((s) =>
      isDateInRange(s.registrationDate, activeTimeFilterOption.days)
    );
  }, [studentsList, timeFilter, activeTimeFilterOption.days, customStartDate, customEndDate]);

  const timeFilteredRevenue = useMemo(() => {
    if (timeFilter === "all") {
      return studentsList.reduce((acc, s) => acc + (s.totalPaid || 0), 0);
    }
    let paymentSum = 0;
    let foundPayments = false;
    studentsList.forEach((s) => {
      if (s.payments && s.payments.length > 0) {
        s.payments.forEach((p) => {
          const match =
            timeFilter === "custom"
              ? isDateInRange(p.date, null, customStartDate, customEndDate)
              : isDateInRange(p.date, activeTimeFilterOption.days);
          if (match) {
            paymentSum += p.amount || 0;
            foundPayments = true;
          }
        });
      }
    });
    if (!foundPayments) {
      return timeFilteredStudents.reduce((acc, s) => acc + (s.totalPaid || 0), 0);
    }
    return paymentSum;
  }, [studentsList, timeFilteredStudents, timeFilter, activeTimeFilterOption.days, customStartDate, customEndDate]);

  const timeFilteredPendingDues = useMemo(() => {
    return timeFilteredStudents.reduce((acc, s) => acc + (s.remainingDue || 0), 0);
  }, [timeFilteredStudents]);

  const totalExpectedMetrics = timeFilteredRevenue + timeFilteredPendingDues;
  const metricsCollectionRate =
    totalExpectedMetrics > 0 ? Math.round((timeFilteredRevenue / totalExpectedMetrics) * 100) : 100;
  const metricsActiveCount = timeFilteredStudents.filter((s) => s.status === "active").length;
  const metricsCompletedCount = timeFilteredStudents.filter((s) => s.status === "completed").length;
  const metricsStudentsWithDues = timeFilteredStudents.filter((s) => (s.remainingDue || 0) > 0).length;

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
                SafeDrive.
              </span>
            </a>
            {isOwner && (
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#141414] text-white shadow-sm">
                Owner Portal
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setNewPaymentModalOpen(true)}
              className="px-3 sm:px-3.5 h-8 text-[11px] sm:text-[12px] font-semibold text-[#141414] bg-white border border-[#e0e0e0] hover:border-[#141414] hover:bg-[#f9f9f9] rounded-full transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Record installment payment for approval"
            >
              <svg className="w-3.5 h-3.5 text-[#505050]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
              <span className="sm:hidden">Payment</span>
              <span className="hidden sm:inline">Record Payment</span>
            </button>

            <button
              onClick={() => setNewStudentModalOpen(true)}
              className="px-3 sm:px-4 h-8 text-[11px] sm:text-[12px] font-semibold text-white bg-[#141414] hover:bg-[#262626] rounded-full transition-all cursor-pointer shadow-sm hover:shadow flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span className="sm:hidden">+ Request</span>
              <span className="hidden sm:inline">+ Request New Student</span>
            </button>

            <button
              onClick={handleSignOut}
              className="px-2.5 sm:px-3.5 h-8 text-[11px] sm:text-[12px] font-semibold text-[#707070] hover:text-[#141414] hover:bg-[#e8e8e8] rounded-full transition-colors cursor-pointer"
            >
              <span className="sm:hidden">Exit</span>
              <span className="hidden sm:inline">Sign Out →</span>
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

          {/* Owner Executive Metrics in Indian Rupees (₹) with Time Filter */}
          {isOwner && (
            <div className="space-y-4">
              {/* Executive Header Row & Time Filter Dropdown */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                  <h2 className="text-[16px] font-bold text-[#141414] tracking-tight">
                    Executive Performance Overview
                  </h2>
                  <p className="text-[12px] text-[#707070] mt-0.5">
                    Real-time fee collections, outstanding balances, and student roster activity
                  </p>
                </div>

                {/* Time Filter Dropdown */}
                <div className="relative self-start sm:self-auto" ref={timeFilterRef}>
                  <button
                    type="button"
                    onClick={() => setIsTimeFilterOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#e5e5e5] hover:border-[#141414] text-[#141414] text-[12px] font-semibold transition-all cursor-pointer shadow-sm focus-ring-mobbin"
                    aria-expanded={isTimeFilterOpen}
                    aria-haspopup="listbox"
                  >
                    <svg className="w-3.5 h-3.5 text-[#707070]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      Period:{" "}
                      <strong className="font-bold text-[#141414]">
                        {timeFilter === "custom"
                          ? customStartDate && customEndDate
                            ? `${customStartDate} – ${customEndDate}`
                            : customStartDate
                            ? `From ${customStartDate}`
                            : customEndDate
                            ? `Until ${customEndDate}`
                            : "Custom Range"
                          : activeTimeFilterOption.label}
                      </strong>
                    </span>
                    <motion.svg
                      animate={{ rotate: isTimeFilterOpen ? 180 : 0 }}
                      transition={{ duration: 0.18 }}
                      className="w-3.5 h-3.5 text-[#707070]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </motion.svg>
                  </button>

                  <AnimatePresence>
                    {isTimeFilterOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 mt-1.5 w-52 bg-white rounded-[20px] shadow-xl border border-[#eaeaea] p-1.5 z-40"
                        role="listbox"
                      >
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#adadad]">
                          Filter Timeframe
                        </div>
                        {TIME_FILTER_OPTIONS.map((opt) => {
                          const isSelected = opt.id === timeFilter;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => {
                                if (opt.id === "custom") {
                                  setTempStartDate(customStartDate);
                                  setTempEndDate(customEndDate);
                                  setIsCustomDateModalOpen(true);
                                  setIsTimeFilterOpen(false);
                                } else {
                                  setTimeFilter(opt.id);
                                  setIsTimeFilterOpen(false);
                                }
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-[14px] text-[13px] font-medium transition-colors text-left cursor-pointer ${
                                isSelected
                                  ? "bg-[#f3f3f3] text-[#141414] font-semibold"
                                  : "text-[#505050] hover:bg-[#f9f9f9] hover:text-[#141414]"
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isSelected && (
                                <svg className="w-4 h-4 text-[#141414]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Three Reimagined Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Total Enrolled */}
                <div className="bg-gradient-to-b from-[#f5f8ff] to-[#ffffff] p-5 rounded-[24px] border border-[#e0e7ff] shadow-sm hover:shadow-md hover:border-[#c7d2fe] transition-all flex flex-col justify-between min-h-[145px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[#4f46e5] uppercase tracking-wider">
                      Total Enrolled
                    </span>
                    <div className="w-9 h-9 rounded-[12px] bg-[#eef2ff] text-[#4338ca] border border-[#e0e7ff] flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>

                  <div className="my-2">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${timeFilter}-enrolled`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18 }}
                        className="text-[26px] font-bold text-[#141414] tracking-tight leading-none"
                      >
                        {timeFilteredStudents.length}{" "}
                        <span className="text-[15px] font-medium text-[#475569]">
                          {timeFilteredStudents.length === 1 ? "Student" : "Students"}
                        </span>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="pt-2 border-t border-[#eef2ff] flex items-center justify-between text-[11px] text-[#475569]">
                    {timeFilteredStudents.length > 0 ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 font-medium text-[#4338ca]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4338ca]"></span>
                          <span>{metricsActiveCount} Active</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[#64748b]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]"></span>
                          <span>{metricsCompletedCount} Completed</span>
                        </span>
                      </>
                    ) : (
                      <span className="text-[#94a3b8]">No enrollments in period</span>
                    )}
                  </div>
                </div>

                {/* 2. Total Revenue (₹) */}
                <div className="bg-gradient-to-b from-[#f2faf5] to-[#ffffff] p-5 rounded-[24px] border border-[#d1fae5] shadow-sm hover:shadow-md hover:border-[#a7f3d0] transition-all flex flex-col justify-between min-h-[145px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[#047857] uppercase tracking-wider">
                      Total Revenue (₹)
                    </span>
                    <div className="w-9 h-9 rounded-[12px] bg-[#ecfdf5] text-[#047857] border border-[#d1fae5] flex items-center justify-center font-bold text-[16px]">
                      ₹
                    </div>
                  </div>

                  <div className="my-2">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${timeFilter}-revenue`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18 }}
                        className="text-[26px] font-bold text-[#141414] tracking-tight leading-none"
                      >
                        ₹{timeFilteredRevenue.toLocaleString("en-IN")}.00
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="pt-2 border-t border-[#e6f4ea] flex items-center justify-between text-[11px]">
                    {timeFilteredRevenue > 0 ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 text-[#047857] font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#047857]"></span>
                          <span>{metricsCollectionRate}% collection rate</span>
                        </span>
                        <span className="text-[#065f46] font-medium">Cash Collected</span>
                      </>
                    ) : (
                      <span className="text-[#94a3b8]">₹0 collections in period</span>
                    )}
                  </div>
                </div>

                {/* 3. Pending Dues (₹) */}
                <div className="bg-gradient-to-b from-[#fff7f2] to-[#ffffff] p-5 rounded-[24px] border border-[#fed7aa] shadow-sm hover:shadow-md hover:border-[#fdba74] transition-all flex flex-col justify-between min-h-[145px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[#c2410c] uppercase tracking-wider">
                      Pending Dues (₹)
                    </span>
                    <div className="w-9 h-9 rounded-[12px] bg-[#fff7ed] text-[#c2410c] border border-[#ffedd5] flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>

                  <div className="my-2">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${timeFilter}-dues`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18 }}
                        className="text-[26px] font-bold text-[#141414] tracking-tight leading-none"
                      >
                        ₹{timeFilteredPendingDues.toLocaleString("en-IN")}.00
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="pt-2 border-t border-[#ffedd5] flex items-center justify-between text-[11px]">
                    {timeFilteredPendingDues > 0 ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 text-[#c2410c] font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#c2410c]"></span>
                          <span>
                            Across {metricsStudentsWithDues} {metricsStudentsWithDues === 1 ? "student" : "students"}
                          </span>
                        </span>
                        <span className="text-[#9a3412] font-medium">Outstanding</span>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#047857] font-medium">
                        ✓ All dues cleared
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STUDENTS DIRECTORY, INACTIVE LIST, PENDING QUEUE & ARCHIVE TABS
              ═══════════════════════════════════════════════════════ */}
          <div className="bg-[#ffffff] p-5 sm:p-6 rounded-[24px] border border-[#f0f0f0] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f0f0f0]">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab("active")}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all cursor-pointer ${
                    activeTab === "active"
                      ? "bg-[#141414] text-white"
                      : "bg-[#f3f3f3] text-[#707070] hover:text-[#141414]"
                  }`}
                >
                  Active Students ({activeStudentsList.length})
                </button>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("inactive")}
                    className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "inactive"
                        ? "bg-[#141414] text-white"
                        : "bg-[#f3f3f3] text-[#707070] hover:text-[#141414]"
                    }`}
                  >
                    <span>Inactive Students (&gt;6 Mos)</span>
                    {inactiveStudentsList.length > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        activeTab === "inactive" ? "bg-amber-400 text-[#141414]" : "bg-amber-100 text-amber-900 border border-amber-300"
                      }`}>
                        {inactiveStudentsList.length}
                      </span>
                    )}
                  </button>
                )}

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

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("archived")}
                    className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "archived"
                        ? "bg-[#141414] text-white"
                        : "bg-[#f3f3f3] text-[#707070] hover:text-[#141414]"
                    }`}
                  >
                    <span>🗑️ Trash / Archived</span>
                    {archivedStudents.length > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        activeTab === "archived" ? "bg-white/20 text-white" : "bg-[#e0e0e0] text-[#141414]"
                      }`}>
                        {archivedStudents.length}
                      </span>
                    )}
                  </button>
                )}
              </div>

              <span className="text-[12px] text-[#707070]">
                {isOwner ? "Owner: Full management, re-enrollment & recovery" : "Staff: Click student name to view details"}
              </span>
            </div>

            {activeTab === "active" ? (
              <>
                {/* Search Input for Active Students */}
                <div className="relative">
                  <div className="flex items-center gap-2.5 bg-[#f0f0f0] px-4 py-2.5 rounded-full border border-transparent focus-within:border-[#141414] transition-colors">
                    <svg className="w-4 h-4 text-[#707070] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search active students by Name or Mobile No (+91)..."
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

                {/* Active Students Cards Grid */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#707070] block">
                    Active Enrolled Students ({filteredActiveStudents.length}):
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {filteredActiveStudents.length > 0 ? (
                      filteredActiveStudents.map((stu) => (
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
                        No active student record found matching "{searchQuery}".
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : activeTab === "inactive" ? (
              /* ─── INACTIVE STUDENTS (>6 CALENDAR MONTHS) ─── */
              <div className="space-y-4 pt-1">
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-[18px] p-4 text-[12px] text-amber-900 flex items-start gap-3">
                  <span className="text-[18px] leading-none">⏳</span>
                  <div>
                    <strong className="font-semibold">6-Month Inactivity & Course Re-activation:</strong> Students who passed 6 calendar months from approval are categorized as Inactive. All historical payments and previous metrics are permanently preserved. Click <strong>"Re-activate with New Course ↻"</strong> to enroll them in a new package with fresh 6-month validity while keeping cumulative financial records.
                  </div>
                </div>

                {/* Search in Inactive Students */}
                <div className="relative">
                  <div className="flex items-center gap-2.5 bg-[#f0f0f0] px-4 py-2.5 rounded-full border border-transparent focus-within:border-[#141414] transition-colors">
                    <svg className="w-4 h-4 text-[#707070] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search inactive students by Name or Mobile No (+91)..."
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

                {filteredInactiveStudents.length > 0 ? (
                  <div className="space-y-3">
                    {filteredInactiveStudents.map((stu) => {
                      const approvalDate = stu.approvedDate
                        ? new Date(stu.approvedDate)
                        : stu.registrationDate
                        ? new Date(stu.registrationDate)
                        : null;

                      return (
                        <div
                          key={stu.phone}
                          className="p-4 sm:p-5 rounded-[20px] bg-[#fafafa] border border-[#e5e5e5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-[#d4d4d4]"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="font-bold text-[16px] text-[#141414]">{stu.name}</span>
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                                ⏳ VALIDITY EXPIRED (&gt;6 MOS)
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-[#f0f0f0] text-[#141414] text-[11px] font-semibold">
                                {stu.vehicleType}
                              </span>
                            </div>

                            <div className="text-[12px] text-[#707070] flex items-center gap-3 flex-wrap">
                              <span>📞 {stu.phone}</span>
                              <span>·</span>
                              <span>Past Course: {stu.coursePackage}</span>
                              <span>·</span>
                              <span>Instructor: {stu.assignedInstructor}</span>
                              {approvalDate && (
                                <>
                                  <span>·</span>
                                  <span>Approved: {approvalDate.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                                </>
                              )}
                            </div>

                            <div className="text-[12px] text-[#707070]">
                              Past Progress: {stu.vehicleType === "4-Wheeler" ? `${stu.completedKm}/${stu.targetKm} km` : `${stu.completedDays || 0}/15 days`} · Total Paid to date: ₹{stu.totalPaid.toLocaleString("en-IN")}.00 / Total Fee: ₹{stu.totalCourseFee.toLocaleString("en-IN")}.00
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f0f0f0]">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudent(stu);
                                const el = document.getElementById("admin-student-details");
                                if (el) el.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="px-3.5 py-2 rounded-full bg-white hover:bg-[#f5f5f5] text-[#141414] text-[12px] font-semibold border border-[#e0e0e0] transition-all cursor-pointer shadow-sm"
                            >
                              Inspect Details
                            </button>

                            <button
                              type="button"
                              onClick={() => setReenrollModalStudent(stu)}
                              className="px-4 py-2 rounded-full bg-[#141414] hover:bg-[#262626] text-white text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                            >
                              <span>↻</span>
                              <span>Re-activate with New Course</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center rounded-[20px] bg-[#f9f9f9] border border-[#ececec] space-y-2">
                    <div className="w-12 h-12 rounded-full bg-[#f0f0f0] text-[#707070] flex items-center justify-center mx-auto text-[20px]">
                      ✓
                    </div>
                    <div className="text-[14px] font-semibold text-[#141414]">No Inactive Students</div>
                    <p className="text-[12px] text-[#707070] max-w-sm mx-auto">
                      {searchQuery
                        ? `No inactive students match "${searchQuery}".`
                        : "All currently enrolled students are within their active 6-month course window."}
                    </p>
                  </div>
                )}
              </div>
            ) : activeTab === "pending" ? (
              /* ─── PENDING OWNER APPROVAL QUEUE (With Dropdown Filter) ─── */
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#707070] block">
                    Pending Approvals ({filteredPendingRequests.length} showing of {pendingRequests.length} total):
                  </span>

                  {/* Pending Queue Category Dropdown Filter */}
                  <div className="relative" ref={pendingFilterRef}>
                    <button
                      type="button"
                      onClick={() => setIsPendingFilterOpen(!isPendingFilterOpen)}
                      className="px-3.5 py-1.5 rounded-full bg-[#f3f3f3] hover:bg-[#eaeaea] border border-[#e0e0e0] text-[12px] font-semibold text-[#141414] transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                    >
                      <svg className="w-3.5 h-3.5 text-[#707070]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      <span>
                        {pendingFilter === "all"
                          ? `All Requests (${pendingRequests.length})`
                          : pendingFilter === "new_student"
                          ? `New Students (${pendingRequests.filter((r) => r.type !== "new_payment").length})`
                          : `Fee Payments (${pendingRequests.filter((r) => r.type === "new_payment").length})`}
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 text-[#707070] transition-transform ${
                          isPendingFilterOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isPendingFilterOpen && (
                      <div className="absolute right-0 mt-1.5 w-60 bg-white border border-[#e5e5e5] rounded-[18px] shadow-xl p-1.5 z-30 space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setPendingFilter("all");
                            setIsPendingFilterOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 rounded-[12px] text-[12px] font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                            pendingFilter === "all"
                              ? "bg-[#141414] text-white"
                              : "hover:bg-[#f3f3f3] text-[#141414]"
                          }`}
                        >
                          <span>All Requests</span>
                          <span className="text-[11px] opacity-80">{pendingRequests.length}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPendingFilter("new_student");
                            setIsPendingFilterOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 rounded-[12px] text-[12px] font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                            pendingFilter === "new_student"
                              ? "bg-[#141414] text-white"
                              : "hover:bg-[#f3f3f3] text-[#141414]"
                          }`}
                        >
                          <span>New Student Registrations</span>
                          <span className="text-[11px] opacity-80">
                            {pendingRequests.filter((r) => r.type !== "new_payment").length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPendingFilter("new_payment");
                            setIsPendingFilterOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 rounded-[12px] text-[12px] font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                            pendingFilter === "new_payment"
                              ? "bg-[#141414] text-white"
                              : "hover:bg-[#f3f3f3] text-[#141414]"
                          }`}
                        >
                          <span>Fee Payment Approvals</span>
                          <span className="text-[11px] opacity-80">
                            {pendingRequests.filter((r) => r.type === "new_payment").length}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {filteredPendingRequests.length > 0 ? (
                  <div className="space-y-2.5">
                    {filteredPendingRequests.map((req) => (
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
                                onClick={() => handleApproveRequest(req.id || req.phone)}
                                className="px-4 py-2 rounded-full bg-[#141414] hover:bg-[#262626] text-white text-[12px] font-semibold transition-colors cursor-pointer shadow-none"
                              >
                                {req.type === "new_payment" ? "Approve Payment ✓" : "Approve Student ✓"}
                              </button>
                              <button
                                onClick={() => handleRejectRequest(req.id || req.phone)}
                                className="px-3 py-2 rounded-full bg-white hover:bg-rose-50 text-rose-700 text-[12px] font-semibold border border-rose-200 transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
                              Awaiting Owner Decision
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-[13px] text-[#707070] bg-[#f3f3f3] rounded-[16px] space-y-1">
                    <p className="font-semibold text-[#141414]">No pending requests found</p>
                    <p className="text-[12px]">
                      {pendingFilter === "all"
                        ? "The approval queue is completely clear."
                        : `No pending ${pendingFilter === "new_student" ? "new student registration" : "payment approval"} requests.`}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* ─── TRASH / ARCHIVED STUDENTS (30-Day Recovery Queue) ─── */
              <div className="space-y-4 pt-1">
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-[18px] p-4 text-[12px] text-amber-900 flex items-start gap-3">
                  <span className="text-[18px] leading-none">ℹ️</span>
                  <div>
                    <strong className="font-semibold">30-Day Soft Delete & Safe Recovery:</strong> Deleted students are preserved in this Trash archive for 30 days before being automatically purged permanently. You can restore a student back to the active directory or permanently erase their record at any time.
                  </div>
                </div>

                {/* Search in Trash */}
                <div className="relative">
                  <div className="flex items-center gap-2.5 bg-[#f0f0f0] px-4 py-2.5 rounded-full border border-transparent focus-within:border-[#141414] transition-colors">
                    <svg className="w-4 h-4 text-[#707070] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search trash by Name or Mobile No (+91)..."
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

                {filteredArchivedStudents.length > 0 ? (
                  <div className="space-y-3">
                    {filteredArchivedStudents.map((stu) => {
                      const deletedDate = stu.deletedAt ? new Date(stu.deletedAt) : new Date();
                      const daysPassed = Math.floor((Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
                      const daysLeft = Math.max(0, 30 - daysPassed);

                      return (
                        <div
                          key={stu.phone}
                          className="p-4 sm:p-5 rounded-[20px] bg-[#fafafa] border border-[#e5e5e5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-[#d4d4d4]"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="font-bold text-[16px] text-[#141414]">{stu.name}</span>
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                                DELETED / ARCHIVED
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-[#f0f0f0] text-[#141414] text-[11px] font-semibold">
                                {stu.vehicleType}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300">
                                ⏳ {daysLeft} {daysLeft === 1 ? "day" : "days"} until permanent purge
                              </span>
                            </div>

                            <div className="text-[12px] text-[#707070] flex items-center gap-3 flex-wrap">
                              <span>📞 {stu.phone}</span>
                              <span>·</span>
                              <span>Course: {stu.coursePackage}</span>
                              <span>·</span>
                              <span>Instructor: {stu.assignedInstructor}</span>
                              <span>·</span>
                              <span>Deleted: {deletedDate.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                            </div>

                            <div className="text-[12px] text-[#707070]">
                              Financials at deletion: Paid ₹{stu.totalPaid.toLocaleString("en-IN")}.00 / Total ₹{stu.totalCourseFee.toLocaleString("en-IN")}.00 ({stu.remainingDue > 0 ? `₹${stu.remainingDue.toLocaleString("en-IN")}.00 due` : "Fully Settled"})
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f0f0f0]">
                            <button
                              type="button"
                              onClick={() => handleRestoreStudent(stu.phone, stu.name)}
                              disabled={restoringPhone === stu.phone || permanentDeletingPhone === stu.phone}
                              className="px-4 py-2 rounded-full bg-[#141414] hover:bg-[#262626] text-white text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                            >
                              {restoringPhone === stu.phone ? (
                                <>
                                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                  </svg>
                                  <span>Restoring...</span>
                                </>
                              ) : (
                                <>
                                  <span>↺</span>
                                  <span>Restore Student</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePermanentlyDeleteStudent(stu.phone, stu.name)}
                              disabled={permanentDeletingPhone === stu.phone || restoringPhone === stu.phone}
                              className="px-3.5 py-2 rounded-full bg-white hover:bg-rose-50 text-rose-700 text-[12px] font-semibold border border-rose-200 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                            >
                              {permanentDeletingPhone === stu.phone ? (
                                <>
                                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                  </svg>
                                  <span>Purging...</span>
                                </>
                              ) : (
                                <>
                                  <span>✕</span>
                                  <span>Delete Permanently</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center rounded-[20px] bg-[#f9f9f9] border border-[#ececec] space-y-2">
                    <div className="w-12 h-12 rounded-full bg-[#f0f0f0] text-[#707070] flex items-center justify-center mx-auto text-[20px]">
                      🗑️
                    </div>
                    <div className="text-[14px] font-semibold text-[#141414]">Trash is empty</div>
                    <p className="text-[12px] text-[#707070] max-w-sm mx-auto">
                      {searchQuery
                        ? `No archived students match "${searchQuery}".`
                        : "No students are currently soft-deleted or archived."}
                    </p>
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
              {/* Inactive Student Notice Banner */}
              {isStudentInactive(selectedStudent) && (
                <div className="bg-amber-50 border border-amber-300 rounded-[20px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-[20px] leading-none">⏳</span>
                    <div>
                      <div className="font-bold text-[14px]">
                        Inactive Student Record (&gt;6 Calendar Months Validity Expired)
                      </div>
                      <div className="text-[12px] text-amber-850 mt-0.5">
                        This student's original 6-month validity window has expired. All past payment receipts and historical progress are permanently preserved.
                      </div>
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setReenrollModalStudent(selectedStudent)}
                      className="px-4 py-2 rounded-full bg-[#141414] hover:bg-[#262626] text-white text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <span>↻</span>
                      <span>Re-activate with New Course</span>
                    </button>
                  )}
                </div>
              )}

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

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 self-start sm:self-center">
                      {/* Owner Action: Delete Student Button */}
                      {isOwner && (
                        <button
                          onClick={() => promptDeleteStudent(selectedStudent)}
                          className="px-3.5 py-2 rounded-[14px] bg-rose-50/80 hover:bg-rose-100 text-rose-700 border border-rose-200/80 text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                          title="Delete student permanently"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete Student</span>
                        </button>
                      )}

                      <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-[18px] p-3 sm:px-4 sm:py-2.5 min-w-[150px] shadow-sm">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[20px] font-bold text-[#141414] leading-none">
                            {currentKm}
                            <span className="text-[13px] text-[#707070] font-normal ml-1">/ {selectedStudent.targetKm} km</span>
                          </span>
                          <span className="text-[11px] font-semibold text-[#047857]">
                            {selectedStudent.targetKm > 0
                              ? Math.min(100, Math.round((currentKm / selectedStudent.targetKm) * 100))
                              : 0}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#e5e5e5] rounded-full overflow-hidden mt-2">
                          <div
                            className="h-full bg-[#141414] rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                selectedStudent.targetKm > 0
                                  ? Math.min(100, Math.round((currentKm / selectedStudent.targetKm) * 100))
                                  : 0
                              }%`,
                            }}
                          />
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

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 self-start sm:self-center">
                      {isOwner && (
                        <button
                          onClick={() => promptDeleteStudent(selectedStudent)}
                          className="px-3.5 py-2 rounded-[14px] bg-rose-50/80 hover:bg-rose-100 text-rose-700 border border-rose-200/80 text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                          title="Delete student permanently"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete Student</span>
                        </button>
                      )}

                      <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-[18px] p-3 sm:px-4 sm:py-2.5 min-w-[150px] shadow-sm">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[20px] font-bold text-[#141414] leading-none">
                            {currentDays}
                            <span className="text-[13px] text-[#707070] font-normal ml-1">/ 15 Days</span>
                          </span>
                          <span className="text-[11px] font-semibold text-[#047857]">
                            {Math.min(100, Math.round((currentDays / 15) * 100))}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#e5e5e5] rounded-full overflow-hidden mt-2">
                          <div
                            className="h-full bg-[#141414] rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.round((currentDays / 15) * 100))}%` }}
                          />
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

                        <div className="w-full grid grid-cols-2 gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => handleDaysChange(Math.max(0, currentDays - 1))}
                            disabled={currentDays <= 0}
                            className="h-12 sm:h-13 rounded-[16px] bg-[#f3f3f3] hover:bg-[#e5e5e5] active:scale-[0.99] text-[#141414] text-[14px] sm:text-[15px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 border border-[#e0e0e0] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                            </svg>
                            <span>- 1 Day</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDaysChange(Math.min(15, currentDays + 1))}
                            disabled={currentDays >= 15}
                            className="h-12 sm:h-13 rounded-[16px] bg-[#141414] hover:bg-[#262626] active:scale-[0.99] text-white text-[14px] sm:text-[15px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm hover:shadow disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>+ 1 Day Completed</span>
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

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 self-start sm:self-center">
                      {isOwner && (
                        <button
                          onClick={() => promptDeleteStudent(selectedStudent)}
                          className="px-3.5 py-2 rounded-[14px] bg-rose-50/80 hover:bg-rose-100 text-rose-700 border border-rose-200/80 text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                          title="Delete client permanently"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete Client</span>
                        </button>
                      )}

                      <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-[18px] p-3 sm:px-4 sm:py-2.5 min-w-[150px] shadow-sm text-right sm:text-left">
                        <div className="text-[16px] font-bold text-[#141414] leading-tight">
                          Direct RTO
                        </div>
                        <div className="text-[11px] text-[#707070] font-medium mt-0.5">
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
                {/* Header: Title, Status Badge, and Record Payment Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#f0f0f0]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f3f3f3] text-[#141414]">
                        Financial Ledger
                      </span>
                      {selectedStudent.remainingDue === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#047857] border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#047857]"></span>
                          Paid in Full
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-[#c2410c] border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#c2410c]"></span>
                          Installment Active
                        </span>
                      )}
                    </div>
                    <h3 className="text-[22px] font-bold text-[#141414] tracking-tight mt-1.5">
                      Fees & Payment Status.
                    </h3>
                    <p className="text-[12px] text-[#707070] mt-0.5">
                      {selectedStudent.dueDateNote || "Standard installment schedule and verified digital receipts"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setNewPaymentModalOpen(true)}
                      className="px-4 py-2.5 rounded-full bg-[#141414] hover:bg-[#262626] text-white text-[12px] font-semibold transition-all cursor-pointer shadow-sm hover:shadow flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Record Payment</span>
                    </button>
                  </div>
                </div>

                {/* Dual-Tone Collection Progress Ratio */}
                <div className="bg-[#fafafa] border border-[#eaeaea] rounded-[20px] p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-[#141414] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#047857]"></span>
                      <span>Collection Progress:</span>
                      <strong className="text-[#047857]">
                        {selectedStudent.totalCourseFee > 0
                          ? Math.min(100, Math.round((selectedStudent.totalPaid / selectedStudent.totalCourseFee) * 100))
                          : 100}% Paid
                      </strong>
                    </span>
                    <span className="text-[#707070] text-[11px]">
                      {selectedStudent.remainingDue > 0
                        ? `₹${selectedStudent.remainingDue.toLocaleString("en-IN")}.00 remaining`
                        : "✓ All installments cleared"}
                    </span>
                  </div>

                  {/* Dual-tone Progress Bar */}
                  <div className="w-full h-2.5 bg-[#f0f0f0] rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-[#047857] transition-all duration-500 rounded-l-full"
                      style={{
                        width: `${
                          selectedStudent.totalCourseFee > 0
                            ? Math.min(100, (selectedStudent.totalPaid / selectedStudent.totalCourseFee) * 100)
                            : 100
                        }%`,
                      }}
                    />
                    {selectedStudent.remainingDue > 0 && (
                      <div
                        className="h-full bg-[#fed7aa] transition-all duration-500 rounded-r-full"
                        style={{
                          width: `${
                            selectedStudent.totalCourseFee > 0
                              ? Math.min(100, (selectedStudent.remainingDue / selectedStudent.totalCourseFee) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* 3 Harmonic FinTech Milestone Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Total Agreed Fee */}
                  <div className="bg-gradient-to-b from-[#f9fafb] to-[#ffffff] border border-[#eaedf0] rounded-[20px] p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                        Total Course Fee
                      </span>
                      <div className="w-8 h-8 rounded-[10px] bg-[#f1f5f9] text-[#475569] flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-[20px] font-bold text-[#141414] tracking-tight">
                        ₹{selectedStudent.totalCourseFee.toLocaleString("en-IN")}.00
                      </div>
                      <div className="text-[11px] text-[#707070] mt-0.5">
                        Fixed Package Pricing
                      </div>
                    </div>
                  </div>

                  {/* Paid to Date */}
                  <div className="bg-gradient-to-b from-[#f2faf5] to-[#ffffff] border border-[#d1fae5] rounded-[20px] p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#047857] uppercase tracking-wider">
                        Paid to Date
                      </span>
                      <div className="w-8 h-8 rounded-[10px] bg-[#ecfdf5] text-[#047857] border border-[#d1fae5] flex items-center justify-center font-bold text-[14px]">
                        ₹
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-[20px] font-bold text-[#047857] tracking-tight">
                        ₹{selectedStudent.totalPaid.toLocaleString("en-IN")}.00
                      </div>
                      <div className="text-[11px] text-[#065f46] mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#047857]"></span>
                        <span>
                          {selectedStudent.totalCourseFee > 0
                            ? Math.min(100, Math.round((selectedStudent.totalPaid / selectedStudent.totalCourseFee) * 100))
                            : 100}% Collected
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Remaining Due */}
                  <div
                    className={`rounded-[20px] p-4 shadow-sm border ${
                      selectedStudent.remainingDue > 0
                        ? "bg-gradient-to-b from-[#fff7f2] to-[#ffffff] border-[#fed7aa]"
                        : "bg-gradient-to-b from-[#f2faf5] to-[#ffffff] border-[#d1fae5]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] font-semibold uppercase tracking-wider ${
                          selectedStudent.remainingDue > 0 ? "text-[#c2410c]" : "text-[#047857]"
                        }`}
                      >
                        {selectedStudent.remainingDue > 0 ? "Amount Due" : "Settlement"}
                      </span>
                      <div
                        className={`w-8 h-8 rounded-[10px] flex items-center justify-center ${
                          selectedStudent.remainingDue > 0
                            ? "bg-[#fff7ed] text-[#c2410c] border border-[#ffedd5]"
                            : "bg-[#ecfdf5] text-[#047857] border border-[#d1fae5]"
                        }`}
                      >
                        {selectedStudent.remainingDue > 0 ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      <div
                        className={`text-[20px] font-bold tracking-tight ${
                          selectedStudent.remainingDue > 0 ? "text-[#c2410c]" : "text-[#047857]"
                        }`}
                      >
                        ₹{selectedStudent.remainingDue.toLocaleString("en-IN")}.00
                      </div>
                      <div className="text-[11px] text-[#707070] mt-0.5">
                        {selectedStudent.remainingDue > 0
                          ? "Pending settlement"
                          : "Fully paid & closed"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Receipts List */}
                <div className="space-y-3 pt-3 border-t border-[#f0f0f0]">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold uppercase tracking-wider text-[#141414] flex items-center gap-2">
                      <span>Payment History</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f3f3f3] text-[#707070]">
                        {selectedStudent.payments?.length || 0}
                      </span>
                    </span>
                    <span className="text-[11px] text-[#707070]">Official SafeDrive Receipts</span>
                  </div>

                  {selectedStudent.payments && selectedStudent.payments.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedStudent.payments.map((p: any) => (
                        <div
                          key={p.receiptNumber}
                          className="bg-white border border-[#e5e5e5] hover:border-[#d4d4d4] rounded-[18px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px] shadow-sm transition-all"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="w-9 h-9 rounded-[12px] bg-[#f5f5f5] text-[#141414] flex items-center justify-center shrink-0 border border-[#e0e0e0]">
                              {p.method?.toLowerCase().includes("upi") ? (
                                <svg className="w-4 h-4 text-[#2563eb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              ) : p.method?.toLowerCase().includes("cash") ? (
                                <svg className="w-4 h-4 text-[#047857]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-[#475569]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                              )}
                            </div>

                            <div>
                              <div className="font-semibold text-[#141414] flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[13px] tracking-tight">{p.receiptNumber}</span>
                                <span className="text-[11px] font-normal text-[#707070]">· {p.date}</span>
                                <span className="px-2 py-0.5 rounded-full bg-[#f3f3f3] text-[#141414] text-[10px] font-bold uppercase tracking-wider">
                                  {p.method}
                                </span>
                              </div>
                              <div className="text-[12px] text-[#707070] mt-0.5">
                                Recorded by {p.recordedBy || "Staff"} {p.referenceNote ? `· "${p.referenceNote}"` : ""}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f0f0f0]">
                            <span className="text-[16px] font-bold text-[#047857]">
                              +₹{p.amount.toLocaleString("en-IN")}.00
                            </span>
                            <button
                              type="button"
                              onClick={() => setReceiptModalData({ student: selectedStudent, payment: p })}
                              className="px-3.5 py-1.5 rounded-full bg-[#141414] hover:bg-[#262626] text-white text-[12px] font-semibold transition-all cursor-pointer shadow-sm hover:shadow flex items-center gap-1"
                            >
                              <span>Receipt ↗</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-[20px] bg-[#fafafa] border border-[#eaeaea] text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-[#f0f0f0] text-[#707070] flex items-center justify-center mx-auto text-[16px]">
                        🧾
                      </div>
                      <div className="text-[13px] font-semibold text-[#141414]">No payments logged yet</div>
                      <p className="text-[12px] text-[#707070] max-w-sm mx-auto">
                        Record the first student installment to generate an official numbered receipt and update the ledger.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Previous Course History (if any archived courses exist) */}
              {selectedStudent.courseHistory && selectedStudent.courseHistory.length > 0 && (
                <div className="bg-[#ffffff] border border-[#f0f0f0] rounded-[24px] p-6 sm:p-8 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#141414]"></span>
                      <h3 className="text-[18px] font-bold text-[#141414] tracking-tight">
                        Previous Course History ({selectedStudent.courseHistory.length})
                      </h3>
                    </div>
                    <span className="text-[11px] text-[#707070]">Lifetime Course Archives</span>
                  </div>

                  <div className="space-y-3">
                    {selectedStudent.courseHistory.map((hist, idx) => (
                      <div
                        key={idx}
                        className="bg-[#fafafa] border border-[#e5e5e5] rounded-[18px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[#141414] text-[14px]">
                              {hist.coursePackage}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#f0f0f0] text-[#141414] text-[10px] font-semibold">
                              {hist.vehicleType}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
                              {hist.trainingType || "Standard"}
                            </span>
                          </div>

                          <div className="text-[12px] text-[#707070] flex items-center gap-3 flex-wrap">
                            <span>Instructor: {hist.assignedInstructor || "SafeDrive Trainer"}</span>
                            <span>·</span>
                            <span>Fee: ₹{(hist.fee || 0).toLocaleString("en-IN")}.00</span>
                            {hist.enrolledDate && (
                              <>
                                <span>·</span>
                                <span>Enrolled: {hist.enrolledDate}</span>
                              </>
                            )}
                            {hist.completedDate && (
                              <>
                                <span>·</span>
                                <span>Completed/Archived: {hist.completedDate}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 text-right sm:text-right">
                          <div className="text-[13px] font-bold text-[#141414]">
                            {hist.vehicleType === "4-Wheeler"
                              ? `${hist.completedKm || 0} / ${hist.targetKm || 0} km driven`
                              : `${hist.completedDays || 0} / ${hist.totalDays || 15} days`}
                          </div>
                          <div className="text-[10px] text-[#707070]">Course Metrics Preserved</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

      <ReenrollModal
        isOpen={!!reenrollModalStudent}
        student={reenrollModalStudent}
        onClose={() => setReenrollModalStudent(null)}
        onStudentReenrolled={handleStudentReenrolled}
      />

      {/* ─── CUSTOM DATE RANGE FILTER MODAL ─── */}
      <AnimatePresence>
        {isCustomDateModalOpen && (
          <motion.div
            key="custom-date-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="custom-date-modal-title"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-white rounded-[24px] border border-[#e5e5e5] p-6 sm:p-7 shadow-2xl space-y-5"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsCustomDateModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f3f3f3] hover:bg-[#e0e0e0] text-[#141414] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="space-y-1">
                <div className="w-9 h-9 rounded-full bg-[#f3f3f3] text-[#141414] flex items-center justify-center mb-2 text-base">
                  📅
                </div>
                <h3 id="custom-date-modal-title" className="text-[19px] font-bold text-[#141414] tracking-tight">
                  Custom Date Range Filter
                </h3>
                <p className="text-[13px] text-[#707070]">
                  Filter fee collections, pending dues, and admissions between specific dates.
                </p>
              </div>

              <div className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#707070] mb-1.5">
                    Start Date (From)
                  </label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-[16px] bg-[#f5f5f5] border border-[#e5e5e5] text-[14px] font-medium text-[#141414] focus-ring-mobbin outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#707070] mb-1.5">
                    End Date (To)
                  </label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-[16px] bg-[#f5f5f5] border border-[#e5e5e5] text-[14px] font-medium text-[#141414] focus-ring-mobbin outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-[#f0f0f0]">
                <button
                  type="button"
                  onClick={() => {
                    setTempStartDate("");
                    setTempEndDate("");
                    setCustomStartDate("");
                    setCustomEndDate("");
                    setTimeFilter("all");
                    setIsCustomDateModalOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-full bg-[#f3f3f3] hover:bg-[#e8e8e8] text-[#707070] hover:text-[#141414] text-[13px] font-semibold transition-colors cursor-pointer"
                >
                  Clear Range
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomDateModalOpen(false)}
                    className="px-4 py-2.5 rounded-full bg-white border border-[#e0e0e0] hover:bg-[#f9f9f9] text-[#141414] text-[13px] font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStartDate(tempStartDate);
                      setCustomEndDate(tempEndDate);
                      setTimeFilter("custom");
                      setIsCustomDateModalOpen(false);
                    }}
                    className="px-5 py-2.5 rounded-full bg-[#141414] hover:bg-[#262626] text-white text-[13px] font-semibold transition-all cursor-pointer shadow-sm hover:shadow"
                  >
                    Apply Range →
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── IN-APP DELETE STUDENT CONFIRMATION MODAL ─── */}
      <AnimatePresence>
        {studentToDelete && (
          <motion.div
            key="delete-student-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-student-modal-title"
            aria-describedby="delete-student-modal-desc"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-white rounded-[24px] border border-rose-100 p-6 sm:p-7 shadow-2xl space-y-4"
            >
              <div className="w-11 h-11 rounded-[16px] bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center text-xl font-bold">
                <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              <div className="space-y-1">
                <h3 id="delete-student-modal-title" className="text-[19px] font-bold text-[#141414] tracking-tight">
                  Delete Student Account?
                </h3>
                <p id="delete-student-modal-desc" className="text-[13px] text-[#707070] leading-relaxed">
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-[#141414] font-semibold">{studentToDelete.name}</strong>{" "}
                  (<span>{studentToDelete.phone}</span>)? This will remove all associated driving training records, attendance sessions, and payment history from the database.
                </p>
              </div>

              <div className="p-3 bg-rose-50/60 border border-rose-200/70 rounded-[16px] text-[12px] text-rose-800">
                ⚠️ <strong>Warning:</strong> This action is immediate and cannot be undone.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#f0f0f0]">
                <button
                  type="button"
                  disabled={isDeletingStudent}
                  onClick={() => setStudentToDelete(null)}
                  className="px-4 py-2.5 rounded-full bg-[#f3f3f3] hover:bg-[#e8e8e8] text-[#141414] text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingStudent}
                  onClick={confirmDeleteStudent}
                  className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-[13px] font-semibold transition-all cursor-pointer shadow-sm hover:shadow flex items-center gap-2"
                >
                  {isDeletingStudent ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Deleting Record...</span>
                    </>
                  ) : (
                    <span>Yes, Delete Student</span>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AuthGuard allowedRoles={["admin_staff", "admin_owner"]}>
      <AdminDashboardContent />
    </AuthGuard>
  );
}
