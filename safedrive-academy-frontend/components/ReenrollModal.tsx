"use client";

import React, { useState, useEffect } from "react";
import { CleanStudentData, PaymentMethod, TrainingType } from "@/types";
import { apiClient } from "@/lib/apiClient";

interface ReenrollModalProps {
  isOpen: boolean;
  student: CleanStudentData | null;
  onClose: () => void;
  onStudentReenrolled: (updatedStudent: CleanStudentData) => void;
}

type MainCategory =
  | "4-Wheeler Training (With License)"
  | "4-Wheeler Training (Without License)"
  | "2-Wheeler Training (With License)"
  | "2-Wheeler Training (Without License)"
  | "License-Only Services";

const TIER_OPTIONS: Record<MainCategory, string[]> = {
  "4-Wheeler Training (With License)": [
    "Group Training (80 km Target)",
    "Personal Training (120 km Target)",
  ],
  "4-Wheeler Training (Without License)": [
    "Group Training (80 km Target)",
    "Personal Training (120 km Target)",
  ],
  "2-Wheeler Training (With License)": [
    "Motorcycle with Gear (15 Days · 1 hr/day)",
    "Gearless Scooty (15 Days · 1 hr/day)",
  ],
  "2-Wheeler Training (Without License)": [
    "Motorcycle with Gear (15 Days · 1 hr/day)",
    "Gearless Scooty (15 Days · 1 hr/day)",
  ],
  "License-Only Services": [
    "Learner License (LL) Only",
    "Permanent DL Assistance Only",
    "License Renewal / Duplicate",
    "Endorsement / Commercial RTO Assistance",
  ],
};

export default function ReenrollModal({
  isOpen,
  student,
  onClose,
  onStudentReenrolled,
}: ReenrollModalProps) {
  const [mainCategory, setMainCategory] = useState<MainCategory>("4-Wheeler Training (With License)");
  const [subOption, setSubOption] = useState<string>("Personal Training (120 km Target)");
  const [newCourseFee, setNewCourseFee] = useState<number | "">(9500);
  const [initialPayment, setInitialPayment] = useState<number | "">(5000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [utrNumber, setUtrNumber] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [cashNote, setCashNote] = useState("");
  const [instructor, setInstructor] = useState("Rajesh Kumar");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      if (student.assignedInstructor && student.assignedInstructor !== "Desk Instructor") {
        setInstructor(student.assignedInstructor);
      }
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleMainCategoryChange = (cat: MainCategory) => {
    setMainCategory(cat);
    const firstSub = TIER_OPTIONS[cat][0];
    setSubOption(firstSub);

    if (cat.includes("4-Wheeler")) {
      if (cat.includes("With License")) {
        setNewCourseFee(9500);
        setInitialPayment(5000);
      } else {
        setNewCourseFee(7500);
        setInitialPayment(4000);
      }
    } else if (cat.includes("2-Wheeler")) {
      if (cat.includes("With License")) {
        setNewCourseFee(4500);
        setInitialPayment(2500);
      } else {
        setNewCourseFee(3000);
        setInitialPayment(1500);
      }
    } else {
      setNewCourseFee(2500);
      setInitialPayment(2500);
    }
  };

  const getDerivedVehicleType = (): TrainingType => {
    if (mainCategory.includes("4-Wheeler")) return "4-Wheeler";
    if (mainCategory.includes("2-Wheeler")) return "2-Wheeler";
    return "License-Only";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedFee = Number(newCourseFee) || 0;
    const parsedPayment = Number(initialPayment) || 0;

    if (parsedFee < 1) {
      setFormError("New course fee must be at least ₹1.00.");
      return;
    }

    if (parsedPayment > 0) {
      if (paymentMethod === "UPI") {
        const cleanUtr = utrNumber.trim();
        if (!/^\d{12}$/.test(cleanUtr)) {
          setFormError("UPI payments require a valid 12-digit UTR Number.");
          return;
        }
      } else if (paymentMethod === "CHEQUE") {
        const cleanCheque = chequeNumber.trim();
        if (!/^\d{6}$/.test(cleanCheque)) {
          setFormError("Cheque payments require a valid 6-digit Cheque Number.");
          return;
        }
      }
    }

    setSubmitting(true);

    const fullPackageName = `${mainCategory} · ${subOption}`;
    const derivedCourse = getDerivedVehicleType();

    let formattedReference = "";
    if (parsedPayment > 0) {
      if (paymentMethod === "UPI") {
        formattedReference = `UPI UTR: ${utrNumber.trim()}`;
      } else if (paymentMethod === "CHEQUE") {
        formattedReference = `Cheque No: ${chequeNumber.trim()}${bankName.trim() ? ` (${bankName.trim()})` : ""}`;
      } else {
        formattedReference = cashNote.trim() || "Cash payment for re-enrollment";
      }
    }

    const payload = {
      CoursePackage: fullPackageName,
      VehicleType: derivedCourse,
      TrainingType: derivedCourse === "4-Wheeler" ? (subOption.includes("Personal") ? "4w_personal" : "4w_group") : derivedCourse === "2-Wheeler" ? "2w_batch" : "license_only",
      TargetKm: derivedCourse === "4-Wheeler" ? (subOption.includes("Personal") ? 120 : 80) : 0,
      TotalDays: derivedCourse === "2-Wheeler" ? 15 : 0,
      NewCourseFee: parsedFee,
      InitialPayment: parsedPayment,
      PaymentMethod: paymentMethod,
      ReferenceNote: formattedReference,
      AssignedInstructor: derivedCourse === "License-Only" ? "RTO Documentation Desk" : instructor,
    };

    try {
      const updated = await apiClient.reenrollStudent(student.id || student.phone, payload);
      setSuccessInfo(`Successfully re-enrolled ${student.name} into ${fullPackageName}!`);
      setTimeout(() => {
        setSubmitting(false);
        setSuccessInfo(null);
        onStudentReenrolled(updated);
        onClose();
      }, 1300);
    } catch (err: any) {
      setSubmitting(false);
      setFormError(err.message || "Failed to re-enroll student.");
    }
  };

  const isLicenseOnly = mainCategory === "License-Only Services";
  const is2W = mainCategory.includes("2-Wheeler");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-4xl bg-white border border-[#f0f0f0] rounded-[24px] p-6 sm:p-7 shadow-2xl"
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

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#f0f0f0] pr-10">
          <div className="w-10 h-10 rounded-[14px] bg-[#141414] text-white flex items-center justify-center text-lg font-bold shrink-0">
            ↻
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] font-semibold text-[#141414] tracking-tight leading-snug">
                Re-activate & Enroll in New Course
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                RE-ENROLLMENT
              </span>
            </div>
            <p className="text-[12px] text-[#707070]">
              Student: <strong className="text-[#141414] font-semibold">{student.name}</strong> · 📞 {student.phone} · Past metrics preserved in course history
            </p>
          </div>
        </div>

        {successInfo ? (
          <div className="py-8 text-center space-y-2.5 bg-[#f3f3f3] rounded-[16px] p-4 text-[#141414] my-4">
            <div className="text-2xl font-bold">✓</div>
            <div className="font-semibold text-[16px]">Student Re-activated!</div>
            <p className="text-[13px] text-[#707070]">{successInfo}</p>
            <p className="text-[11px] text-[#047857] font-semibold">
              Training metrics reset for new course. 6-month validity renewed starting today.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* ─── LEFT COLUMN: Course Selection ─── */}
              <div className="space-y-3">
                {/* Previous Course Summary Banner */}
                <div className="bg-[#fafafa] p-3 rounded-[16px] border border-[#e5e5e5] text-[12px] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#707070] block">
                    Expiring Course to be Archived:
                  </span>
                  <div className="font-semibold text-[#141414] flex items-center justify-between">
                    <span>{student.coursePackage}</span>
                    <span className="text-[11px] text-[#707070]">
                      {student.vehicleType === "4-Wheeler"
                        ? `${student.completedKm}/${student.targetKm} km`
                        : `${student.completedDays || 0}/15 days`}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#707070]">
                    Lifetime Paid: ₹{student.totalPaid.toLocaleString("en-IN")}.00 (Will carry over)
                  </div>
                </div>

                {/* 2-Tier Selector */}
                <div className="space-y-2.5 bg-[#f8f8f8] p-3 rounded-[18px] border border-[#f0f0f0]">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#141414] mb-1">
                      1. New Service Category *
                    </label>
                    <select
                      value={mainCategory}
                      onChange={(e) => handleMainCategoryChange(e.target.value as MainCategory)}
                      className="w-full h-9 px-3 rounded-[12px] bg-white border border-[#e0e0e0] text-[12px] font-medium text-[#141414] focus-ring-mobbin outline-none cursor-pointer"
                    >
                      <option value="4-Wheeler Training (With License)">
                        4-Wheeler Training (With License)
                      </option>
                      <option value="4-Wheeler Training (Without License)">
                        4-Wheeler Training (Without License)
                      </option>
                      <option value="2-Wheeler Training (With License)">
                        2-Wheeler Training (With License)
                      </option>
                      <option value="2-Wheeler Training (Without License)">
                        2-Wheeler Training (Without License)
                      </option>
                      <option value="License-Only Services">
                        License-Only Services (Non-Training / Direct RTO)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#141414] mb-1">
                      2. New Training / Service Type *
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {TIER_OPTIONS[mainCategory].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSubOption(opt)}
                          className={`p-2 rounded-[12px] text-left text-[11px] font-semibold border transition-all cursor-pointer leading-tight ${
                            subOption === opt
                              ? "bg-[#141414] text-white border-[#141414] shadow-xs"
                              : "bg-white text-[#141414] border-[#e0e0e0] hover:bg-[#f0f0f0]"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white px-3 py-1 rounded-[10px] border border-[#e0e0e0] flex items-center justify-between text-[11px]">
                    <span className="text-[#707070]">New Training Metric:</span>
                    <span className="font-semibold text-[#141414]">
                      {isLicenseOnly
                        ? "📋 RTO Direct Processing (0 km)"
                        : is2W
                        ? "🛵 15 Days Practical Batch (1 hr/day)"
                        : subOption.includes("Personal")
                        ? "🚘 120 km Target (Personal Batch)"
                        : "🚘 80 km Target (Group Batch)"}
                    </span>
                  </div>
                </div>

                {/* Assigned Instructor */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070] mb-1">
                    Assigned Instructor / Desk
                  </label>
                  <select
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    disabled={isLicenseOnly}
                    className="w-full h-9.5 px-3 rounded-[14px] bg-[#f0f0f0] text-[13px] text-[#141414] focus-ring-mobbin outline-none cursor-pointer disabled:opacity-60"
                  >
                    {isLicenseOnly ? (
                      <option value="RTO Documentation Desk">RTO Documentation Desk</option>
                    ) : (
                      <>
                        <option value="Rajesh Kumar">Rajesh Kumar</option>
                        <option value="Vikram Singh">Vikram Singh</option>
                        <option value="Suresh Menon">Suresh Menon</option>
                        <option value="Amit Sharma">Amit Sharma</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* ─── RIGHT COLUMN: Fees, Payment Verification & Actions ─── */}
              <div className="space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Financials Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070] mb-1">
                        New Course Fee (₹) *
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={newCourseFee}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewCourseFee(val === "" ? "" : Number(val));
                        }}
                        placeholder="0"
                        className="w-full h-10 px-3.5 rounded-[14px] bg-[#f0f0f0] text-[14px] text-[#141414] font-semibold focus-ring-mobbin outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070] mb-1">
                        Initial Paid (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={initialPayment}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInitialPayment(val === "" ? "" : Number(val));
                        }}
                        placeholder="0"
                        className="w-full h-10 px-3.5 rounded-[14px] bg-[#f0f0f0] text-[14px] text-[#141414] font-semibold focus-ring-mobbin outline-none"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070] mb-1">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["UPI", "CASH", "CHEQUE"] as PaymentMethod[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(m);
                            setFormError(null);
                          }}
                          className={`py-1.5 rounded-full text-[12px] font-semibold border transition-all cursor-pointer ${
                            paymentMethod === m
                              ? "bg-[#141414] text-white border-[#141414]"
                              : "bg-[#f3f3f3] text-[#141414] border-transparent hover:bg-[#e0e0e0]"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Reference Box */}
                  {Number(initialPayment) > 0 && (
                    <>
                      {paymentMethod === "UPI" ? (
                        <div className="space-y-1 bg-[#fafafa] p-3 rounded-[16px] border border-[#e5e5e5]">
                          <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#141414]">
                              UPI 12-Digit UTR Number <span className="text-rose-600">*</span>
                            </label>
                            <span
                              className={`text-[11px] font-mono font-semibold ${
                                utrNumber.length === 12 ? "text-[#047857]" : "text-[#707070]"
                              }`}
                            >
                              {utrNumber.length}/12 digits
                            </span>
                          </div>
                          <input
                            type="text"
                            required
                            maxLength={12}
                            value={utrNumber}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              setUtrNumber(val);
                              if (formError) setFormError(null);
                            }}
                            placeholder="e.g. 489201948291 (12 digits)"
                            className="w-full h-9.5 px-3 rounded-[12px] bg-white border border-[#e0e0e0] text-[13px] font-mono text-[#141414] focus-ring-mobbin outline-none"
                          />
                          {utrNumber.length > 0 && utrNumber.length < 12 && (
                            <p className="text-[11px] text-amber-700 font-medium">
                              Enter complete 12-digit UTR number ({12 - utrNumber.length} remaining)
                            </p>
                          )}
                        </div>
                      ) : paymentMethod === "CHEQUE" ? (
                        <div className="space-y-1.5 bg-[#fafafa] p-3 rounded-[16px] border border-[#e5e5e5]">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#141414]">
                                  6-Digit Cheque No. <span className="text-rose-600">*</span>
                                </label>
                                <span
                                  className={`text-[11px] font-mono font-semibold ${
                                    chequeNumber.length === 6 ? "text-[#047857]" : "text-[#707070]"
                                  }`}
                                >
                                  {chequeNumber.length}/6
                                </span>
                              </div>
                              <input
                                type="text"
                                required
                                maxLength={6}
                                value={chequeNumber}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, "");
                                  setChequeNumber(val);
                                  if (formError) setFormError(null);
                                }}
                                placeholder="e.g. 409124"
                                className="w-full h-9.5 px-3 rounded-[12px] bg-white border border-[#e0e0e0] text-[13px] font-mono text-[#141414] focus-ring-mobbin outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070]">
                                Bank & Branch
                              </label>
                              <input
                                type="text"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                placeholder="e.g. HDFC Bank"
                                className="w-full h-9.5 px-3 rounded-[12px] bg-white border border-[#e0e0e0] text-[12px] text-[#141414] focus-ring-mobbin outline-none"
                              />
                            </div>
                          </div>
                          {chequeNumber.length > 0 && chequeNumber.length < 6 && (
                            <p className="text-[11px] text-amber-700 font-medium">
                              Enter complete 6-digit Cheque number ({6 - chequeNumber.length} remaining)
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1 bg-[#fafafa] p-3 rounded-[16px] border border-[#e5e5e5]">
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070]">
                            Cash Receipt Note (Optional)
                          </label>
                          <input
                            type="text"
                            value={cashNote}
                            onChange={(e) => setCashNote(e.target.value)}
                            placeholder="e.g. Cash received for re-enrollment"
                            className="w-full h-9.5 px-3 rounded-[12px] bg-white border border-[#e0e0e0] text-[12px] text-[#141414] focus-ring-mobbin outline-none"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Financial Projection */}
                  <div className="bg-[#f3f3f3] px-3.5 py-2 rounded-[14px] text-[11px] text-[#707070] flex items-center justify-between">
                    <span>Lifetime Paid After Re-enrollment:</span>
                    <strong className="text-[#047857] text-[12px]">
                      ₹{(student.totalPaid + (Number(initialPayment) || 0)).toLocaleString("en-IN")}.00
                    </strong>
                  </div>

                  {/* Error Banner */}
                  {formError && (
                    <div className="p-2.5 rounded-[12px] bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-center gap-2 animate-fade-in">
                      <span>⚠️</span>
                      <span>{formError}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#f0f0f0]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 h-10 rounded-full bg-[#f3f3f3] hover:bg-[#e0e0e0] text-[#141414] text-[13px] font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 h-10 rounded-full bg-[#141414] hover:bg-[#262626] disabled:bg-[#707070] text-white text-[13px] font-semibold transition-colors cursor-pointer flex items-center gap-2"
                  >
                    {submitting ? "Re-enrolling..." : "Re-activate Student ↻"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
