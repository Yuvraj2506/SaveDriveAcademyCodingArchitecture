"use client";

import React, { useState, useEffect } from "react";
import { CleanStudentData, CleanPendingRequest, PaymentMethod } from "@/types";

interface NewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: CleanStudentData[];
  defaultStudentPhone?: string;
  onRequestSubmitted: (request: CleanPendingRequest) => void;
}

export default function NewPaymentModal({
  isOpen,
  onClose,
  students,
  defaultStudentPhone,
  onRequestSubmitted,
}: NewPaymentModalProps) {
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [amount, setAmount] = useState<number | "">(2000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [utrNumber, setUtrNumber] = useState<string>("");
  const [chequeNumber, setChequeNumber] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [cashNote, setCashNote] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedInfo, setSubmittedInfo] = useState<{
    name: string;
    phone: string;
    amount: number;
    method: PaymentMethod;
  } | null>(null);

  useEffect(() => {
    if (defaultStudentPhone) {
      setSelectedPhone(defaultStudentPhone);
    } else if (students.length > 0 && !selectedPhone) {
      setSelectedPhone(students[0].phone);
    }
  }, [defaultStudentPhone, students, selectedPhone]);

  if (!isOpen) return null;

  const currentStudent = students.find((s) => s.phone === selectedPhone) || students[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!currentStudent) return;

    const parsedAmount = Number(amount) || 0;
    if (parsedAmount < 1) {
      setFormError("Payment amount must be at least ₹1.00.");
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
    const newReqId = `PAY-REQ-${randomSuffix}`;
    const today = new Date().toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    let formattedReference = "";
    if (paymentMethod === "UPI") {
      formattedReference = `UPI UTR: ${utrNumber.trim()}`;
    } else if (paymentMethod === "CHEQUE") {
      formattedReference = `Cheque No: ${chequeNumber.trim()}${bankName.trim() ? ` (${bankName.trim()})` : ""}`;
    } else {
      formattedReference = cashNote.trim() || "Cash payment recorded by staff";
    }

    const newRequest: CleanPendingRequest = {
      requestId: newReqId,
      type: "new_payment",
      name: currentStudent.name,
      phone: currentStudent.phone,
      course: currentStudent.vehicleType,
      categoryOption: currentStudent.coursePackage,
      paymentMethod,
      amountPaid: parsedAmount,
      amountDue: Math.max(0, currentStudent.remainingDue - parsedAmount),
      referenceNote: formattedReference,
      instructor: currentStudent.assignedInstructor,
      requestedBy: "Staff Desk (Instructor)",
      requestedDate: today,
      status: "Pending Owner Approval",
    };

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequest),
      });
      const data = await res.json();
      if (data.success && data.request) {
        setSubmittedInfo({
          name: currentStudent.name,
          phone: currentStudent.phone,
          amount: parsedAmount,
          method: paymentMethod,
        });
        onRequestSubmitted(data.request);
      } else {
        setSubmittedInfo({
          name: currentStudent.name,
          phone: currentStudent.phone,
          amount: parsedAmount,
          method: paymentMethod,
        });
        onRequestSubmitted(newRequest);
      }
    } catch {
      setSubmittedInfo({
        name: currentStudent.name,
        phone: currentStudent.phone,
        amount: parsedAmount,
        method: paymentMethod,
      });
      onRequestSubmitted(newRequest);
    }

    setTimeout(() => {
      setSubmitting(false);
      setSubmittedInfo(null);
      setUtrNumber("");
      setChequeNumber("");
      setBankName("");
      setCashNote("");
      setFormError(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-white border border-[#f0f0f0] rounded-[24px] p-6 sm:p-8 shadow-2xl"
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
        <div className="text-center space-y-1 pb-4 border-b border-[#f0f0f0]">
          <div className="w-9 h-9 squircle-icon bg-[#141414] text-white flex items-center justify-center mx-auto mb-2 text-sm font-bold">
            ₹
          </div>
          <h2 className="text-[20px] font-semibold text-[#141414] tracking-tight">
            Record Installment Payment.
          </h2>
          <p className="text-[13px] text-[#707070]">
            Staff Portal: Submit fee payment for Owner approval.
          </p>
        </div>

        {submittedInfo ? (
          <div className="py-8 text-center space-y-2 bg-[#f3f3f3] rounded-[16px] p-4 text-[#141414] my-4">
            <div className="text-2xl font-bold">✓</div>
            <div className="font-semibold text-[16px]">Payment Request Queued!</div>
            <div className="text-[13px] text-[#707070]">
              Student: <span className="font-semibold text-[#141414]">{submittedInfo.name}</span> ({submittedInfo.phone})
            </div>
            <div className="text-[15px] font-semibold text-[#141414] bg-white py-1.5 px-4 rounded-full inline-block border border-[#e0e0e0]">
              ₹{submittedInfo.amount.toLocaleString("en-IN")}.00 via {submittedInfo.method}
            </div>
            <p className="text-[11px] text-[#707070] pt-1">
              Receipt will be issued and balance adjusted once approved by Owner.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {/* 1. Select Student */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070] mb-1">
                Select Existing Student *
              </label>
              <select
                value={selectedPhone}
                onChange={(e) => setSelectedPhone(e.target.value)}
                className="w-full h-10 px-3 rounded-[16px] bg-[#f0f0f0] text-[14px] text-[#141414] focus-ring-mobbin outline-none cursor-pointer"
              >
                {students.map((s) => (
                  <option key={s.phone} value={s.phone}>
                    {s.name} ({s.phone}) · Due: ₹{s.remainingDue.toLocaleString("en-IN")}.00
                  </option>
                ))}
              </select>
            </div>

            {/* Student Due Snapshot */}
            {currentStudent && (
              <div className="bg-[#f3f3f3] p-3.5 rounded-[16px] grid grid-cols-2 gap-2 text-[12px]">
                <div>
                  <span className="text-[#707070] block">Course & Vehicle:</span>
                  <span className="font-semibold text-[#141414]">{currentStudent.coursePackage}</span>
                </div>
                <div className="text-right">
                  <span className="text-[#707070] block">Current Balance Due:</span>
                  <span className="font-bold text-[#141414]">
                    ₹{currentStudent.remainingDue.toLocaleString("en-IN")}.00 INR
                  </span>
                </div>
              </div>
            )}

            {/* 2. Amount and Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070] mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAmount(val === "" ? "" : Number(val));
                  }}
                  placeholder="0"
                  className="w-full h-10 px-3.5 rounded-[16px] bg-[#f0f0f0] text-[14px] text-[#141414] focus-ring-mobbin outline-none"
                />
              </div>

              {/* Payment Method Selector (UPI / CASH / CHEQUE) */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070] mb-1">
                  Payment Method *
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(["UPI", "CASH", "CHEQUE"]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(m as any);
                        setFormError(null);
                      }}
                      className={`py-2 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
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
            </div>

            {/* Dynamic Contextual Payment Reference (UTR / Cheque / Cash) */}
            {paymentMethod === "UPI" ? (
              <div className="space-y-1 bg-[#fafafa] p-3.5 rounded-[18px] border border-[#e5e5e5]">
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
                  className="w-full h-10 px-3.5 rounded-[14px] bg-white border border-[#e0e0e0] text-[13px] font-mono text-[#141414] focus-ring-mobbin outline-none"
                />
                {utrNumber.length > 0 && utrNumber.length < 12 && (
                  <p className="text-[11px] text-amber-700 font-medium">
                    Enter complete 12-digit UTR number ({12 - utrNumber.length} remaining)
                  </p>
                )}
              </div>
            ) : paymentMethod === "CHEQUE" ? (
              <div className="space-y-2 bg-[#fafafa] p-3.5 rounded-[18px] border border-[#e5e5e5]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#141414]">
                        6-Digit Cheque Number <span className="text-rose-600">*</span>
                      </label>
                      <span
                        className={`text-[11px] font-mono font-semibold ${
                          chequeNumber.length === 6 ? "text-[#047857]" : "text-[#707070]"
                        }`}
                      >
                        {chequeNumber.length}/6 digits
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
                      placeholder="e.g. 409124 (6 digits)"
                      className="w-full h-10 px-3.5 rounded-[14px] bg-white border border-[#e0e0e0] text-[13px] font-mono text-[#141414] focus-ring-mobbin outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070]">
                      Bank & Branch (Optional)
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank, Connaught Place"
                      className="w-full h-10 px-3.5 rounded-[14px] bg-white border border-[#e0e0e0] text-[13px] text-[#141414] focus-ring-mobbin outline-none"
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
              <div className="space-y-1 bg-[#fafafa] p-3.5 rounded-[18px] border border-[#e5e5e5]">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070]">
                  Cash Handover Note (Optional)
                </label>
                <input
                  type="text"
                  value={cashNote}
                  onChange={(e) => setCashNote(e.target.value)}
                  placeholder="e.g. Cash received directly at desk counter"
                  className="w-full h-10 px-3.5 rounded-[14px] bg-white border border-[#e0e0e0] text-[13px] text-[#141414] focus-ring-mobbin outline-none"
                />
              </div>
            )}

            {/* Error Banner */}
            {formError && (
              <div className="p-3 rounded-[14px] bg-rose-50 border border-rose-200 text-rose-800 text-[12px] font-medium flex items-center gap-2 animate-fade-in">
                <span>⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            {/* Projected Remaining Balance */}
            {currentStudent && (
              <div className="bg-[#f3f3f3] p-3 rounded-[16px] flex items-center justify-between text-[12px] text-[#707070]">
                <span>Projected Due after Approval:</span>
                <span className="font-semibold text-[#141414]">
                  ₹{Math.max(0, currentStudent.remainingDue - (Number(amount) || 0)).toLocaleString("en-IN")}.00 INR
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 h-10 rounded-full bg-[#f3f3f3] hover:bg-[#e0e0e0] text-[#141414] text-[13px] font-semibold transition-colors cursor-pointer"
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
          </form>
        )}
      </div>
    </div>
  );
}
