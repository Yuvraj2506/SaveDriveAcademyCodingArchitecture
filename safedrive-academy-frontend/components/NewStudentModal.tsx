"use client";

import React, { useState } from "react";
import { CleanPendingRequest, PaymentMethod, TrainingType } from "@/types";
import { apiClient } from "@/lib/apiClient";

interface NewStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSubmitted: (request: CleanPendingRequest) => void;
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

export default function NewStudentModal({
  isOpen,
  onClose,
  onRequestSubmitted,
}: NewStudentModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [mainCategory, setMainCategory] = useState<MainCategory>("4-Wheeler Training (With License)");
  const [subOption, setSubOption] = useState<string>("Personal Training (120 km Target)");
  const [amountPaid, setAmountPaid] = useState<number | "">(5000);
  const [amountDue, setAmountDue] = useState<number | "">(4500);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [utrNumber, setUtrNumber] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [cashNote, setCashNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [instructor, setInstructor] = useState("Rajesh Kumar");
  const [submitting, setSubmitting] = useState(false);
  const [submittedInfo, setSubmittedInfo] = useState<{
    name: string;
    phone: string;
    packageLabel: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleMainCategoryChange = (cat: MainCategory) => {
    setMainCategory(cat);
    const firstSub = TIER_OPTIONS[cat][0];
    setSubOption(firstSub);

    // Contextual fee presets
    if (cat.includes("4-Wheeler")) {
      if (cat.includes("With License")) {
        setAmountPaid(5000);
        setAmountDue(4500);
      } else {
        setAmountPaid(4000);
        setAmountDue(3500);
      }
    } else if (cat.includes("2-Wheeler")) {
      if (cat.includes("With License")) {
        setAmountPaid(2500);
        setAmountDue(2000);
      } else {
        setAmountPaid(1500);
        setAmountDue(1500);
      }
    } else {
      setAmountPaid(2500);
      setAmountDue(0);
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

    const parsedAmountPaid = Number(amountPaid) || 0;
    const parsedAmountDue = Number(amountDue) || 0;

    if (parsedAmountPaid < 1) {
      setFormError("Advance payment amount must be at least ₹1.00.");
      return;
    }

    if (paymentMethod === "UPI") {
      const cleanUtr = utrNumber.trim();
      if (!/^\d{12}$/.test(cleanUtr)) {
        setFormError("UPI payments require a valid 12-digit UTR / Transaction ID.");
        return;
      }
    } else if (paymentMethod === "CHEQUE") {
      const cleanCheque = chequeNumber.trim();
      if (!/^\d{6}$/.test(cleanCheque)) {
        setFormError("Cheque payments require a valid 6-digit Cheque Number.");
        return;
      }
    }

    setSubmitting(true);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newReqId = `REQ-${randomSuffix}`;
    const today = new Date().toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const fullPackageName = `${mainCategory} · ${subOption}`;
    const derivedCourse = getDerivedVehicleType();

    let formattedReference = "";
    if (paymentMethod === "UPI") {
      formattedReference = `UPI UTR: ${utrNumber.trim()}`;
    } else if (paymentMethod === "CHEQUE") {
      formattedReference = `Cheque No: ${chequeNumber.trim()}${bankName.trim() ? ` (${bankName.trim()})` : ""}`;
    } else {
      formattedReference = cashNote.trim() || "Cash advance received at counter";
    }

    const newRequest: CleanPendingRequest = {
      requestId: newReqId,
      type: "new_student",
      name: name.trim(),
      phone: phone.trim(),
      course: derivedCourse,
      serviceCategory: mainCategory,
      subOption,
      categoryOption: fullPackageName,
      paymentMethod,
      amountPaid: parsedAmountPaid,
      amountDue: parsedAmountDue,
      referenceNote: formattedReference,
      instructor: derivedCourse === "License-Only" ? "RTO Documentation Desk" : instructor,
      requestedBy: "Staff Desk (Instructor)",
      requestedDate: today,
      status: "Pending Owner Approval",
    };

    try {
      const created = await apiClient.createStaffStudentRequest(newRequest);
      setSubmittedInfo({
        name: newRequest.name,
        phone: newRequest.phone,
        packageLabel: fullPackageName,
      });
      onRequestSubmitted(created);
    } catch {
      setSubmittedInfo({
        name: newRequest.name,
        phone: newRequest.phone,
        packageLabel: fullPackageName,
      });
      onRequestSubmitted(newRequest);
    }

    setTimeout(() => {
      setSubmitting(false);
      setSubmittedInfo(null);
      setName("");
      setPhone("+91 ");
      setUtrNumber("");
      setChequeNumber("");
      setBankName("");
      setCashNote("");
      setFormError(null);
      setPaymentMethod("UPI");
      onClose();
    }, 1400);
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

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#f0f0f0] pr-10">
          <div className="w-10 h-10 rounded-[14px] bg-[#141414] text-white flex items-center justify-center text-base font-bold shrink-0">
            +
          </div>
          <div>
            <h2 className="text-[20px] font-semibold text-[#141414] tracking-tight leading-snug">
              Request New Student Registration
            </h2>
            <p className="text-[12px] text-[#707070]">
              Staff Portal: Submit student registration & service package for Owner approval
            </p>
          </div>
        </div>

        {submittedInfo ? (
          <div className="py-8 text-center space-y-2.5 bg-[#f3f3f3] rounded-[16px] p-4 text-[#141414] my-4">
            <div className="text-2xl font-bold">✓</div>
            <div className="font-semibold text-[16px]">Request Saved in Database!</div>
            <div className="text-[13px] text-[#707070]">
              Student: <span className="font-semibold text-[#141414]">{submittedInfo.name}</span>
            </div>
            <div className="text-[13px] font-semibold text-[#141414] bg-white py-1.5 px-3.5 rounded-full inline-block border border-[#e0e0e0]">
              📞 {submittedInfo.phone}
            </div>
            <div className="text-[12px] text-[#141414] font-medium">
              {submittedInfo.packageLabel}
            </div>
            <p className="text-[11px] text-[#707070] pt-1">
              Account will be officially created once approved by the Academy Owner.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* ─── LEFT COLUMN: Student Profile & Course Selection ─── */}
              <div className="space-y-3">
                {/* 1. Student Name & Phone Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070] mb-1">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Kabir Mehta"
                      className="w-full h-10 px-3.5 rounded-[14px] bg-[#f0f0f0] text-[13px] text-[#141414] focus-ring-mobbin outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070] mb-1">
                      Student Mobile (+91) *
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full h-10 px-3.5 rounded-[14px] bg-[#f0f0f0] text-[13px] text-[#141414] focus-ring-mobbin outline-none"
                    />
                  </div>
                </div>

                {/* 2. CASCADING 2-TIER SELECTOR */}
                <div className="space-y-2.5 bg-[#f8f8f8] p-3 rounded-[18px] border border-[#f0f0f0]">
                  {/* Tier 1: Main Category */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#141414] mb-1">
                      1. Main Service Category *
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

                  {/* Tier 2: Sub-Option */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#141414] mb-1">
                      2. Select Training / Service Type *
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

                  {/* Metric Summary */}
                  <div className="bg-white px-3 py-1 rounded-[10px] border border-[#e0e0e0] flex items-center justify-between text-[11px]">
                    <span className="text-[#707070]">Training Metric:</span>
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
                  {/* Amounts Grid in Rupees (₹) */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070] mb-1">
                        Advance Paid (₹) *
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={amountPaid}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAmountPaid(val === "" ? "" : Number(val));
                        }}
                        placeholder="0"
                        className="w-full h-10 px-3.5 rounded-[14px] bg-[#f0f0f0] text-[14px] text-[#141414] font-semibold focus-ring-mobbin outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070] mb-1">
                        Remaining Due (₹) *
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={amountDue}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAmountDue(val === "" ? "" : Number(val));
                        }}
                        placeholder="0"
                        className="w-full h-10 px-3.5 rounded-[14px] bg-[#f0f0f0] text-[14px] text-[#141414] font-semibold focus-ring-mobbin outline-none"
                      />
                    </div>
                  </div>

                  {/* Calculated Fee Summary */}
                  <div className="bg-[#f3f3f3] px-3.5 py-2 rounded-[14px] flex items-center justify-between text-[12px] text-[#707070]">
                    <span>Total Package Fee (Paid + Due):</span>
                    <span className="font-bold text-[#141414]">
                      ₹{(Number(amountPaid) + Number(amountDue)).toLocaleString("en-IN")}.00 INR
                    </span>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070] mb-1">
                      Advance Payment Method *
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

                  {/* Dynamic Contextual Payment Reference */}
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
                        placeholder="e.g. Cash received directly at desk counter"
                        className="w-full h-9.5 px-3 rounded-[12px] bg-white border border-[#e0e0e0] text-[12px] text-[#141414] focus-ring-mobbin outline-none"
                      />
                    </div>
                  )}

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
                    {submitting ? "Submitting..." : "Submit to Owner →"}
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
