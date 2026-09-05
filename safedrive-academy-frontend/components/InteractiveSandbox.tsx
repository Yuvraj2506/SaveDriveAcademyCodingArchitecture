"use client";

import React, { useState } from "react";

export interface Transaction {
  id: string;
  receiptNumber: string;
  studentName: string;
  studentId: string;
  packageName: string;
  amount: number;
  paymentMethod: "Credit Card" | "Cash" | "UPI" | "Bank Transfer";
  date: string;
  status: "Verified & Paid" | "Pending Approval";
  instructor: string;
  hoursIncluded: number;
}

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: "TX-9021",
    receiptNumber: "REC-2026-0841",
    studentName: "Alex Rivera",
    studentId: "STU-8842",
    packageName: "10-Hour Practical & Test Day Bundle",
    amount: 580,
    paymentMethod: "Credit Card",
    date: "Aug 28, 2026",
    status: "Verified & Paid",
    instructor: "Capt. Ronald Hayes",
    hoursIncluded: 10,
  },
  {
    id: "TX-9022",
    receiptNumber: "REC-2026-0842",
    studentName: "Sarah Chen",
    studentId: "STU-8843",
    packageName: "5-Hour Highway & Night Mastery Pack",
    amount: 320,
    paymentMethod: "UPI",
    date: "Aug 26, 2026",
    status: "Verified & Paid",
    instructor: "Elena Rostova",
    hoursIncluded: 5,
  },
  {
    id: "TX-9023",
    receiptNumber: "REC-2026-0843",
    studentName: "David Miller",
    studentId: "STU-8844",
    packageName: "Comprehensive Zero-to-License Course (20h)",
    amount: 1150,
    paymentMethod: "Bank Transfer",
    date: "Aug 24, 2026",
    status: "Verified & Paid",
    instructor: "Marcus Vance",
    hoursIncluded: 20,
  },
  {
    id: "TX-9024",
    receiptNumber: "REC-2026-0844",
    studentName: "Jessica Taylor",
    studentId: "STU-8845",
    packageName: "Defensive Driving & Skid Control Module",
    amount: 240,
    paymentMethod: "Cash",
    date: "Aug 22, 2026",
    status: "Verified & Paid",
    instructor: "Capt. Ronald Hayes",
    hoursIncluded: 4,
  },
];

interface StudentProfile {
  id: string;
  name: string;
  avatar: string;
  instructor: string;
  readinessScore: number;
  hoursCompleted: number;
  totalHoursNeeded: number;
  nightHours: number;
  highwayHours: number;
  nextLesson: string;
  skills: {
    name: string;
    status: "Mastered" | "In Progress" | "Upcoming";
    instructorScore: number;
  }[];
}

const SAMPLE_STUDENTS: StudentProfile[] = [
  {
    id: "STU-8842",
    name: "Alex Rivera",
    avatar: "AR",
    instructor: "Capt. Ronald Hayes",
    readinessScore: 85,
    hoursCompleted: 34,
    totalHoursNeeded: 40,
    nightHours: 8,
    highwayHours: 10,
    nextLesson: "Tomorrow at 10:00 AM (Mock Test Route)",
    skills: [
      { name: "Parallel & Bay Parking", status: "Mastered", instructorScore: 5 },
      { name: "3-Point Turn & Reversing", status: "Mastered", instructorScore: 5 },
      { name: "Highway Lane Merging", status: "Mastered", instructorScore: 4 },
      { name: "Emergency Stop & Hazard Reaction", status: "In Progress", instructorScore: 4 },
      { name: "Complex Roundabouts & Intersections", status: "In Progress", instructorScore: 3 },
      { name: "Inclement Weather & Night Drills", status: "Upcoming", instructorScore: 0 },
    ],
  },
  {
    id: "STU-8843",
    name: "Sarah Chen",
    avatar: "SC",
    instructor: "Elena Rostova",
    readinessScore: 48,
    hoursCompleted: 14,
    totalHoursNeeded: 40,
    nightHours: 2,
    highwayHours: 3,
    nextLesson: "Friday at 2:30 PM (Hill Starts & Clutch)",
    skills: [
      { name: "Cockpit Drill & Mirror Checks", status: "Mastered", instructorScore: 5 },
      { name: "Steering & Smooth Braking", status: "Mastered", instructorScore: 4 },
      { name: "Hill Starts & Angle Parking", status: "In Progress", instructorScore: 3 },
      { name: "3-Point Turn & Reversing", status: "In Progress", instructorScore: 3 },
      { name: "Highway Lane Merging", status: "Upcoming", instructorScore: 0 },
      { name: "Mock DMV Road Test", status: "Upcoming", instructorScore: 0 },
    ],
  },
  {
    id: "STU-8844",
    name: "David Miller",
    avatar: "DM",
    instructor: "Marcus Vance",
    readinessScore: 96,
    hoursCompleted: 40,
    totalHoursNeeded: 40,
    nightHours: 10,
    highwayHours: 12,
    nextLesson: "Monday at 8:00 AM (Official DMV Road Test Day)",
    skills: [
      { name: "Parallel & Bay Parking", status: "Mastered", instructorScore: 5 },
      { name: "3-Point Turn & Reversing", status: "Mastered", instructorScore: 5 },
      { name: "Highway Lane Merging", status: "Mastered", instructorScore: 5 },
      { name: "Emergency Stop & Hazard Reaction", status: "Mastered", instructorScore: 5 },
      { name: "Complex Roundabouts", status: "Mastered", instructorScore: 5 },
      { name: "DMV Mock Exam Simulation", status: "Mastered", instructorScore: 5 },
    ],
  },
];

interface InteractiveSandboxProps {
  onSelectReceipt: (tx: Transaction) => void;
}

export default function InteractiveSandbox({ onSelectReceipt }: InteractiveSandboxProps) {
  const [activeTab, setActiveTab] = useState<"tracker" | "receipts">("tracker");
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);
  const currentStudent = SAMPLE_STUDENTS[selectedStudentIndex];

  return (
    <section id="sandbox" className="w-full bg-[#fbfbf9] py-16 lg:py-24 border-b border-[#dadad3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f6f6f3] border border-[#dadad3] text-[12px] font-bold uppercase tracking-wider text-[#62625b]">
            Live Interactive Sandbox
          </div>
          <h2 className="text-[28px] sm:text-[36px] font-bold text-[#000000] tracking-display">
            Experience the Unified Driving Academy Dashboard
          </h2>
          <p className="text-[16px] text-[#33332e] leading-[1.4]">
            Test out real-time student skill checklists, road-test readiness scoring, and automated payment receipts just as your instructors and students would experience them.
          </p>

          {/* Tab Switcher Pills */}
          <div className="inline-flex p-1.5 rounded-full bg-[#e5e5e0] gap-1.5 mt-4">
            <button
              onClick={() => setActiveTab("tracker")}
              className={`px-5 py-2 rounded-full text-[14px] font-bold transition-all cursor-pointer ${
                activeTab === "tracker"
                  ? "bg-[#000000] text-white shadow-sm"
                  : "text-[#262622] hover:bg-[#ffffff]/50"
              }`}
            >
              1. Live Student Progress Tracker
            </button>
            <button
              onClick={() => setActiveTab("receipts")}
              className={`px-5 py-2 rounded-full text-[14px] font-bold transition-all cursor-pointer ${
                activeTab === "receipts"
                  ? "bg-[#000000] text-white shadow-sm"
                  : "text-[#262622] hover:bg-[#ffffff]/50"
              }`}
            >
              2. Payment Receipts & Ledger
            </button>
          </div>
        </div>

        {/* Sandbox Content Container */}
        <div className="bg-[#ffffff] border border-[#dadad3] rounded-[32px] p-6 sm:p-8 lg:p-10 shadow-none">
          {activeTab === "tracker" ? (
            /* TAB 1: DRIVING PROGRESS TRACKER */
            <div className="space-y-8">
              {/* Student Selector Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#dadad3]">
                <div>
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#62625b] block">
                    Select Active Student Profile:
                  </span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SAMPLE_STUDENTS.map((s, idx) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStudentIndex(idx)}
                        className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-[13px] font-bold border transition-colors cursor-pointer ${
                          selectedStudentIndex === idx
                            ? "bg-[#000000] text-white border-[#000000]"
                            : "bg-[#f6f6f3] text-[#262622] border-[#dadad3] hover:bg-[#e5e5e0]"
                        }`}
                      >
                        <span className="w-6 h-6 rounded-full bg-[#e60023] text-white text-[11px] font-bold flex items-center justify-center">
                          {s.avatar}
                        </span>
                        {s.name} ({s.readinessScore}% Ready)
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#f6f6f3] border border-[#dadad3] rounded-2xl px-4 py-2 text-right">
                  <span className="text-[11px] font-bold uppercase text-[#62625b] block">Assigned Instructor</span>
                  <span className="text-[14px] font-bold text-[#000000]">{currentStudent.instructor}</span>
                </div>
              </div>

              {/* Progress Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Score Card */}
                <div className="bg-[#f6f6f3] border border-[#dadad3] rounded-2xl p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-[#62625b]">Road Test Readiness</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-[#c7f0da] text-[#103c25]">
                      {currentStudent.readinessScore >= 80 ? "Exam Ready" : "In Training"}
                    </span>
                  </div>
                  <div className="my-4">
                    <div className="text-[44px] font-bold text-[#000000] leading-none">
                      {currentStudent.readinessScore}%
                    </div>
                    <div className="w-full bg-[#e5e5e0] h-3 rounded-full overflow-hidden mt-3">
                      <div
                        className="bg-[#e60023] h-full rounded-full transition-all duration-500"
                        style={{ width: `${currentStudent.readinessScore}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-[12px] text-[#62625b]">Based on 6 core DMV grading competencies</span>
                </div>

                {/* Logged Hours */}
                <div className="bg-[#f6f6f3] border border-[#dadad3] rounded-2xl p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-[#62625b]">Logged Driving Hours</span>
                    <span className="text-[12px] font-bold text-[#000000]">
                      {currentStudent.hoursCompleted} / {currentStudent.totalHoursNeeded} hrs
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 my-3">
                    <div className="bg-white border border-[#dadad3] rounded-xl p-2.5 text-center">
                      <div className="text-[18px] font-bold text-[#000000]">{currentStudent.nightHours} hrs</div>
                      <div className="text-[11px] text-[#62625b]">Night Driving</div>
                    </div>
                    <div className="bg-white border border-[#dadad3] rounded-xl p-2.5 text-center">
                      <div className="text-[18px] font-bold text-[#000000]">{currentStudent.highwayHours} hrs</div>
                      <div className="text-[11px] text-[#62625b]">Highway Driving</div>
                    </div>
                  </div>
                  <span className="text-[12px] text-[#62625b]">Automatic GPS time sync verified</span>
                </div>

                {/* Next Drive */}
                <div className="bg-[#f6f6f3] border border-[#dadad3] rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[13px] font-bold text-[#62625b] block">Next Scheduled In-Car Session</span>
                    <div className="text-[16px] font-bold text-[#000000] mt-2">
                      {currentStudent.nextLesson}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#dadad3] flex items-center justify-between">
                    <span className="text-[12px] text-[#62625b]">Student Status: Active</span>
                    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#e60023]">
                      Vehicle #04 (Dual Control)
                    </span>
                  </div>
                </div>
              </div>

              {/* Driving Skills Mastery Checklist */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[18px] font-bold text-[#000000]">
                    Competency Checklist & Skill Scores
                  </h3>
                  <span className="text-[12px] text-[#62625b]">
                    Graded by Certified Instructor (1-5 Scale)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentStudent.skills.map((skill, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-[#f6f6f3] border border-[#dadad3] flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[14px] font-bold text-[#000000]">{skill.name}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                            skill.status === "Mastered"
                              ? "bg-[#c7f0da] text-[#103c25]"
                              : skill.status === "In Progress"
                              ? "bg-[#e5e5e0] text-[#262622]"
                              : "bg-[#ffffff] text-[#91918c] border border-[#dadad3]"
                          }`}
                        >
                          {skill.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[12px] text-[#62625b] pt-2 border-t border-[#dadad3]">
                        <span>Instructor Rating</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-[13px] ${
                                star <= skill.instructorScore ? "text-[#e60023]" : "text-[#dadad3]"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: DIGITAL PAYMENT RECEIPTS & TRANSACTION LEDGER */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dadad3]">
                <div>
                  <h3 className="text-[20px] font-bold text-[#000000]">
                    Digital Payment Receipts & Transaction Ledger
                  </h3>
                  <p className="text-[14px] text-[#62625b]">
                    Every lesson pack, deposit, or test-day booking automatically generates a verified digital receipt with immediate PDF download.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold px-3 py-1.5 rounded-full bg-[#c7f0da] text-[#103c25]">
                    ● Real-Time Sync Active
                  </span>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#dadad3] text-[12px] font-bold uppercase text-[#62625b]">
                      <th className="pb-3 px-3">Receipt #</th>
                      <th className="pb-3 px-3">Student Name</th>
                      <th className="pb-3 px-3">Course / Package</th>
                      <th className="pb-3 px-3">Amount</th>
                      <th className="pb-3 px-3">Method</th>
                      <th className="pb-3 px-3">Date</th>
                      <th className="pb-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dadad3] text-[14px]">
                    {SAMPLE_TRANSACTIONS.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#f6f6f3] transition-colors">
                        <td className="py-4 px-3 font-mono text-[13px] font-bold text-[#000000]">
                          {tx.receiptNumber}
                        </td>
                        <td className="py-4 px-3">
                          <div className="font-bold text-[#000000]">{tx.studentName}</div>
                          <div className="text-[12px] text-[#62625b]">{tx.studentId}</div>
                        </td>
                        <td className="py-4 px-3 font-medium text-[#262622]">
                          {tx.packageName}
                          <span className="text-[11px] text-[#62625b] block">({tx.hoursIncluded} driving hours)</span>
                        </td>
                        <td className="py-4 px-3 font-bold text-[#000000]">
                          ${tx.amount}.00
                        </td>
                        <td className="py-4 px-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#e5e5e0] text-[#262622]">
                            {tx.paymentMethod}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-[13px] text-[#62625b]">
                          {tx.date}
                        </td>
                        <td className="py-4 px-3 text-right">
                          <button
                            onClick={() => onSelectReceipt(tx)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#000000] hover:bg-[#262622] text-white text-[12px] font-bold transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Ledger Summary Footer */}
              <div className="p-4 rounded-2xl bg-[#f6f6f3] border border-[#dadad3] flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-[#62625b]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#103c25]"></span>
                  <span>Instant receipt generation connected to SMS & Parent Email notification system.</span>
                </div>
                <span className="font-bold text-[#000000]">Total August Receipts: $2,290.00 (All Settled)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
