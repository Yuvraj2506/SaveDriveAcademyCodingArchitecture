"use client";

import React, { useState, useEffect } from "react";
import { AuthRole } from "./AuthModal";
import { PendingStudentRequest } from "@/types";

export interface PaymentRecord {
  receiptNumber: string;
  date: string;
  method: "Cash" | "Credit Card" | "Debit Card" | "UPI";
  amount: number;
  recordedBy: string;
}

export interface StudentData {
  id: string;
  name: string;
  phone: string;
  vehicleType: "4-Wheeler" | "2-Wheeler";
  coursePackage: string;
  assignedInstructor: string;
  targetKm: number;
  completedKm: number;
  totalCourseFee: number;
  totalPaid: number;
  remainingDue: number;
  dueDateNote: string;
  payments: PaymentRecord[];
}

export const INITIAL_DRIVING_STUDENTS: StudentData[] = [
  {
    id: "STU-8842",
    name: "Alex Rivera",
    phone: "+1 (555) 234-5678",
    vehicleType: "4-Wheeler",
    coursePackage: "4-Wheeler Driving Course (250 km Target)",
    assignedInstructor: "Ronald Hayes",
    targetKm: 250,
    completedKm: 185,
    totalCourseFee: 580,
    totalPaid: 450,
    remainingDue: 130,
    dueDateNote: "Due on or before Final DMV Mock Test Day",
    payments: [
      {
        receiptNumber: "REC-2026-0841",
        date: "Aug 10, 2026",
        method: "Credit Card",
        amount: 250,
        recordedBy: "Receptionist / Desk Staff",
      },
      {
        receiptNumber: "REC-2026-0855",
        date: "Aug 22, 2026",
        method: "Cash",
        amount: 200,
        recordedBy: "Ronald Hayes (Instructor)",
      },
    ],
  },
  {
    id: "STU-2201",
    name: "Priya Sharma",
    phone: "+1 (555) 912-3456",
    vehicleType: "2-Wheeler",
    coursePackage: "2-Wheeler Bike & Scooter Course (100 km Target)",
    assignedInstructor: "Vikram Singh",
    targetKm: 100,
    completedKm: 75,
    totalCourseFee: 280,
    totalPaid: 200,
    remainingDue: 80,
    dueDateNote: "Due before Figure-8 Road Test Session",
    payments: [
      {
        receiptNumber: "REC-2026-0848",
        date: "Aug 15, 2026",
        method: "UPI",
        amount: 200,
        recordedBy: "Receptionist / Desk Staff",
      },
    ],
  },
  {
    id: "STU-8844",
    name: "David Miller",
    phone: "+1 (555) 432-1098",
    vehicleType: "4-Wheeler",
    coursePackage: "4-Wheeler Zero-to-License (350 km Target)",
    assignedInstructor: "Marcus Vance",
    targetKm: 350,
    completedKm: 350,
    totalCourseFee: 750,
    totalPaid: 750,
    remainingDue: 0,
    dueDateNote: "All payments complete. License issued.",
    payments: [
      {
        receiptNumber: "REC-2026-0843",
        date: "Jul 26, 2026",
        method: "Credit Card",
        amount: 750,
        recordedBy: "Online Portal / Desk Staff",
      },
    ],
  },
];

interface StudentTrackerProps {
  currentRole: AuthRole;
  studentsList: StudentData[];
  pendingRequests: PendingStudentRequest[];
  selectedStudent: StudentData;
  onSelectStudent: (student: StudentData) => void;
  onApproveRequest: (request: PendingStudentRequest) => void;
  onRejectRequest: (requestId: string) => void;
  onUpdateKm: (studentId: string, newKm: number) => void;
  onOpenNewStudentModal: () => void;
  onViewReceipt: (student: StudentData, payment: PaymentRecord) => void;
  onSignOut: () => void;
}

export default function StudentTracker({
  currentRole,
  studentsList,
  pendingRequests,
  selectedStudent,
  onSelectStudent,
  onApproveRequest,
  onRejectRequest,
  onUpdateKm,
  onOpenNewStudentModal,
  onViewReceipt,
  onSignOut,
}: StudentTrackerProps) {
  const [currentKm, setCurrentKm] = useState(selectedStudent.completedKm);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"students" | "pending">("students");

  useEffect(() => {
    setCurrentKm(selectedStudent.completedKm);
  }, [selectedStudent]);

  const handleKmChange = (newVal: number) => {
    setCurrentKm(newVal);
    onUpdateKm(selectedStudent.id, newVal);
  };

  const percentage = Math.min(
    100,
    Math.round((currentKm / selectedStudent.targetKm) * 100)
  );
  const remainingKm = Math.max(0, selectedStudent.targetKm - currentKm);

  const isAdmin = currentRole === "admin_staff" || currentRole === "admin_owner";
  const isOwner = currentRole === "admin_owner";

  // Filter students by Name or Mobile No.
  const filteredStudents = studentsList.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      s.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
      s.id.toLowerCase().includes(q)
    );
  });

  return (
    <section id="student-tracker" className="w-full bg-[#f3f3f3] py-10 lg:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Role Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#ffffff] p-4 rounded-[24px] border border-[#f0f0f0]">
          <div className="flex items-center gap-2.5">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                isOwner
                  ? "bg-[#141414] text-white"
                  : isAdmin
                  ? "bg-[#141414] text-white"
                  : "bg-[#f3f3f3] text-[#141414]"
              }`}
            >
              {isOwner ? "Owner Portal" : isAdmin ? "Staff Portal" : "Student View"}
            </span>
            <span className="text-[13px] text-[#707070]">
              {isAdmin ? "Admin management active" : "Personal Student Record"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={onOpenNewStudentModal}
                className="px-4 h-8 rounded-full bg-[#141414] hover:bg-[#262626] text-white text-[12px] font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-none"
              >
                <span>+ Request New Student</span>
              </button>
            )}

            <button
              onClick={onSignOut}
              className="px-4 h-8 rounded-full bg-[#f3f3f3] hover:bg-[#e0e0e0] text-[#141414] text-[12px] font-semibold transition-colors cursor-pointer"
            >
              ← Sign Out
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            ADMIN SECTION: SEARCH BAR & COMPACT NAME LIST
            ═══════════════════════════════════════════════════════ */}
        {isAdmin && (
          <div className="bg-[#ffffff] p-5 rounded-[24px] border border-[#f0f0f0] space-y-4">
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f0f0f0]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("students")}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all cursor-pointer ${
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
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "pending"
                      ? "bg-[#141414] text-white"
                      : "bg-[#f3f3f3] text-[#707070] hover:text-[#141414]"
                  }`}
                >
                  <span>Pending Approval</span>
                  {pendingRequests.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#e60023] text-white text-[10px] flex items-center justify-center font-bold">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>
              </div>

              <span className="text-[12px] text-[#707070]">
                {isOwner ? "Owner: Full approval authority" : "Staff: Click student name to pop details"}
              </span>
            </div>

            {activeTab === "students" ? (
              <>
                {/* Search Bar for Name / Mobile Number */}
                <div className="relative">
                  <div className="flex items-center gap-2.5 bg-[#f0f0f0] px-3.5 py-2 rounded-full border border-transparent focus-within:border-[#141414] transition-colors">
                    <svg className="w-4 h-4 text-[#707070] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search student by Name or Mobile No..."
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

                {/* Compact Student Names List (Clicking pops full details) */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#707070] block">
                    Click on student name to pop full details:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((stu) => (
                        <button
                          key={stu.id}
                          onClick={() => {
                            onSelectStudent(stu);
                            const el = document.getElementById("student-details-cards");
                            if (el) el.scrollIntoView({ behavior: "smooth" });
                          }}
                          className={`p-3 rounded-[16px] text-left transition-all border cursor-pointer flex flex-col justify-between ${
                            selectedStudent.id === stu.id
                              ? "bg-[#141414] text-white border-[#141414] shadow-sm"
                              : "bg-[#f3f3f3] text-[#141414] border-transparent hover:bg-[#e0e0e0]/60"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-[14px] truncate">{stu.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                                selectedStudent.id === stu.id
                                  ? "bg-white/20 text-white"
                                  : "bg-white text-[#141414]"
                              }`}
                            >
                              {stu.vehicleType}
                            </span>
                          </div>
                          <div
                            className={`text-[12px] mt-1 ${
                              selectedStudent.id === stu.id ? "text-[#adadad]" : "text-[#707070]"
                            }`}
                          >
                            📞 {stu.phone}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="col-span-full py-4 text-center text-[13px] text-[#707070]">
                        No student found matching "{searchQuery}".
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* PENDING OWNER APPROVAL REQUESTS QUEUE */
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#707070]">
                    New Student Login Requests Submitted by Staff:
                  </span>
                </div>

                {pendingRequests.length > 0 ? (
                  <div className="space-y-2.5">
                    {pendingRequests.map((req) => (
                      <div
                        key={req.requestId}
                        className="p-4 rounded-[16px] bg-[#f3f3f3] border border-[#e0e0e0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[13px]"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[15px] text-[#141414]">{req.name}</span>
                            <span className="px-2 py-0.5 rounded-full bg-white text-[#141414] text-[11px] font-medium border border-[#e0e0e0]">
                              {req.course}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#f3f3f3] text-[#707070] text-[10px] font-mono">
                              {req.requestId}
                            </span>
                          </div>
                          <div className="text-[12px] text-[#707070]">
                            📞 {req.phone} · Instructor: {req.instructor} · Requested on {req.requestedDate}
                          </div>
                          <div className="text-[12px] font-medium text-[#141414]">
                            Paid: ${req.amountPaid}.00 | Due: ${req.amountDue}.00 (Total Fee: ${req.amountPaid + req.amountDue}.00)
                          </div>
                        </div>

                        {/* Owner Approval Action */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isOwner ? (
                            <>
                              <button
                                onClick={() => onApproveRequest(req)}
                                className="px-4 py-2 rounded-full bg-[#141414] hover:bg-[#262626] text-white text-[12px] font-semibold transition-colors cursor-pointer shadow-none"
                              >
                                Approve & Create Account ✓
                              </button>
                              <button
                                onClick={() => onRejectRequest(req.requestId)}
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
                    No pending student requests waiting for approval.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            POPPED DETAILS: CARD 1 (KM SLIDER) & CARD 2 (PAYMENT DUES)
            ═══════════════════════════════════════════════════════ */}
        <div id="student-details-cards" className="space-y-6 pt-2">
          {/* Card 1: Driving Progress & Kilometer Slider */}
          <div className="bg-[#ffffff] border border-[#f0f0f0] rounded-[24px] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#f0f0f0]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f3f3f3] text-[#141414]">
                    {selectedStudent.vehicleType} Training
                  </span>
                  <span className="text-[12px] font-mono text-[#707070]">{selectedStudent.id}</span>
                </div>
                <h2 className="text-[26px] font-semibold text-[#141414] tracking-tight mt-1">
                  {selectedStudent.name}.
                </h2>
                <p className="text-[13px] text-[#707070] mt-0.5">
                  Instructor: {selectedStudent.assignedInstructor} · {selectedStudent.phone}
                </p>
              </div>

              {/* Total km badge */}
              <div className="bg-[#f3f3f3] rounded-full px-5 py-2.5 text-right sm:text-center self-start">
                <div className="text-[24px] font-semibold text-[#141414] leading-none">
                  {currentKm} <span className="text-[14px] text-[#707070] font-normal">/ {selectedStudent.targetKm} km</span>
                </div>
                <div className="text-[11px] text-[#707070] font-medium mt-1">
                  {percentage}% Distance Completed
                </div>
              </div>
            </div>

            {/* Interactive Kilometers Slider */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-semibold text-[#141414]">
                  Driving Kilometers Completed (Drag Slider):
                </span>
                <span className="font-semibold text-[#141414]">
                  {currentKm} km completed ({remainingKm} km remaining)
                </span>
              </div>

              {/* Slider Control */}
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

              {/* Status note */}
              <div className="bg-[#f3f3f3] rounded-[16px] p-3.5 flex items-center justify-between text-[12px] text-[#707070]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#141414]"></span>
                  <span>
                    {percentage >= 100
                      ? "Goal achieved! Student has completed all required training kilometers."
                      : percentage >= 50
                      ? "Advanced road training & maneuver phase in progress."
                      : "Basic controls & initial road practice phase."}
                  </span>
                </div>
                <span className="font-semibold text-[#141414]">
                  {isAdmin ? "Admin: Drag to update student km" : "Draggable distance slider"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Payment Dues & Digital Receipts */}
          <div id="payment-dues" className="bg-[#ffffff] border border-[#f0f0f0] rounded-[24px] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#f0f0f0]">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f3f3f3] text-[#141414]">
                  Financial Summary
                </span>
                <h3 className="text-[20px] font-semibold text-[#141414] tracking-tight mt-1">
                  Fees & Payment Dues.
                </h3>
              </div>

              {/* Remaining Due Badge */}
              <div
                className={`px-4 py-2 rounded-full text-center ${
                  selectedStudent.remainingDue === 0
                    ? "bg-[#f3f3f3] text-[#141414]"
                    : "bg-[#141414] text-white"
                }`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider">Remaining Balance</div>
                <div className="text-[18px] font-semibold leading-tight">
                  ${selectedStudent.remainingDue}.00 USD
                </div>
              </div>
            </div>

            {/* Numbers Overview */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#f3f3f3] rounded-[16px] p-3.5">
                <span className="text-[11px] text-[#707070] block font-semibold uppercase">Total Fee</span>
                <span className="text-[18px] font-semibold text-[#141414]">${selectedStudent.totalCourseFee}.00</span>
              </div>
              <div className="bg-[#f3f3f3] rounded-[16px] p-3.5">
                <span className="text-[11px] text-[#707070] block font-semibold uppercase">Paid to Date</span>
                <span className="text-[18px] font-semibold text-[#141414]">${selectedStudent.totalPaid}.00</span>
              </div>
              <div className="bg-[#f3f3f3] rounded-[16px] p-3.5">
                <span className="text-[11px] text-[#707070] block font-semibold uppercase">Amount Due</span>
                <span className="text-[18px] font-semibold text-[#141414]">${selectedStudent.remainingDue}.00</span>
              </div>
            </div>

            {/* Receipts List */}
            <div className="space-y-3 pt-2">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#707070] block">
                Payment Receipts:
              </span>

              <div className="space-y-2">
                {selectedStudent.payments.length > 0 ? (
                  selectedStudent.payments.map((p) => (
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
                          ${p.amount}.00
                        </span>
                        <button
                          onClick={() => onViewReceipt(selectedStudent, p)}
                          className="px-3.5 py-1.5 rounded-full bg-[#141414] hover:bg-[#262626] text-white text-[12px] font-semibold transition-colors cursor-pointer"
                        >
                          View Receipt ↗
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[12px] text-[#707070] bg-[#f3f3f3] p-3 rounded-[16px] text-center">
                    No initial payments recorded yet.
                  </div>
                )}
              </div>

              <div className="text-[12px] text-[#707070] pt-1">
                Note: {selectedStudent.dueDateNote}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
