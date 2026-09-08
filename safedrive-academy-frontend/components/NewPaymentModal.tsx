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
  const [referenceNote, setReferenceNote] = useState<string>("");
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
    if (!currentStudent) return;
    const parsedAmount = Number(amount) || 0;
    if (parsedAmount <= 0) return;
    setSubmitting(true);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newReqId = `PAY-REQ-${randomSuffix}`;
    const today = new Date().toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

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
      referenceNote: referenceNote.trim() || `${paymentMethod} payment recorded by staff`,
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
          amount: Number(amount),
          method: paymentMethod,
        });
        onRequestSubmitted(data.request);
      } else {
        setSubmittedInfo({
          name: currentStudent.name,
          phone: currentStudent.phone,
          amount: Number(amount),
          method: paymentMethod,
        });
        onRequestSubmitted(newRequest);
      }
    } catch {
      setSubmittedInfo({
        name: currentStudent.name,
        phone: currentStudent.phone,
        amount: Number(amount),
        method: paymentMethod,
      });
      onRequestSubmitted(newRequest);
    }

    setTimeout(() => {
      setSubmitting(false);
      setSubmittedInfo(null);
      setReferenceNote("");
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
                      onClick={() => setPaymentMethod(m as any)}
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

            {/* 3. Reference Note */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#707070] mb-1">
                Reference / Note (Optional)
              </label>
              <input
                type="text"
                value={referenceNote}
                onChange={(e) => setReferenceNote(e.target.value)}
                placeholder={
                  paymentMethod === "UPI"
                    ? "e.g. UPI Ref / UTR: 489201948291"
                    : paymentMethod === "CHEQUE"
                    ? "e.g. Cheque No: 409124 - HDFC Bank"
                    : "e.g. Cash handed to desk instructor"
                }
                className="w-full h-10 px-3.5 rounded-[16px] bg-[#f0f0f0] text-[13px] text-[#141414] focus-ring-mobbin outline-none"
              />
            </div>

            {/* Projected Remaining Balance */}
            {currentStudent && (
              <div className="bg-[#f3f3f3] p-3 rounded-[16px] flex items-center justify-between text-[12px] text-[#707070]">
                <span>Projected Due after Approval:</span>
                <span className="font-semibold text-[#141414]">
                  ₹{Math.max(0, currentStudent.remainingDue - Number(amount)).toLocaleString("en-IN")}.00 INR
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
