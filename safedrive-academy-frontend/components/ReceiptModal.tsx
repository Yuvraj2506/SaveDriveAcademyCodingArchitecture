"use client";

import React from "react";
import { CleanStudentData, CleanPaymentRecord } from "@/backend/services/dbService";

interface ReceiptModalProps {
  receiptData: {
    student: CleanStudentData;
    payment: CleanPaymentRecord;
  } | null;
  onClose: () => void;
}

export default function ReceiptModal({ receiptData, onClose }: ReceiptModalProps) {
  if (!receiptData) return null;

  const { student, payment } = receiptData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-xl bg-white border border-[#f0f0f0] rounded-[24px] p-6 sm:p-8 overflow-hidden shadow-2xl"
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

        {/* Receipt Header */}
        <div className="flex items-start justify-between pb-5 border-b border-[#f0f0f0]">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 squircle-icon bg-[#141414] text-white flex items-center justify-center text-xs font-bold">
                S
              </div>
              <span className="text-[18px] font-semibold text-[#141414] tracking-tight">
                SafeDrive Academy.
              </span>
            </div>
            <p className="text-[12px] text-[#707070] mt-1">
              Official Driving Student Payment Receipt
            </p>
          </div>

          <div className="text-right pr-8">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f3f3f3] text-[#141414]">
              Verified
            </span>
            <div className="text-[12px] font-mono text-[#707070] mt-1">
              {payment.receiptNumber}
            </div>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="py-5 space-y-4 text-[14px]">
          {/* Student and Payment Info Grid */}
          <div className="grid grid-cols-2 gap-3 bg-[#f3f3f3] p-4 rounded-[16px]">
            <div>
              <span className="text-[11px] font-semibold uppercase text-[#707070] block">Student</span>
              <span className="text-[15px] font-semibold text-[#141414] block">{student.name}</span>
              <span className="text-[12px] text-[#707070] block">📞 {student.phone}</span>
              <span className="text-[12px] text-[#707070] block">Instructor: {student.assignedInstructor}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase text-[#707070] block">Payment Info</span>
              <span className="text-[14px] font-semibold text-[#141414] block">{payment.date}</span>
              <span className="text-[12px] text-[#707070] block">Method: {payment.method}</span>
              <span className="text-[12px] text-[#707070] block">By: {payment.recordedBy}</span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-[#f0f0f0] rounded-[16px] overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#f3f3f3] text-[11px] font-semibold uppercase text-[#707070] border-b border-[#f0f0f0]">
                <tr>
                  <th className="p-3">Course / Installment</th>
                  <th className="p-3 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0] text-[13px]">
                <tr>
                  <td className="p-3 font-medium text-[#141414]">
                    {student.coursePackage}
                    <div className="text-[11px] text-[#707070]">Course fee total: ${student.totalCourseFee}.00</div>
                  </td>
                  <td className="p-3 text-right font-semibold text-[#141414]">
                    ${payment.amount}.00 USD
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Balance Breakdown Row */}
          <div className="space-y-1.5 pt-2 text-right bg-[#f3f3f3] p-3 rounded-[16px]">
            <div className="flex justify-between text-[12px] text-[#707070]">
              <span>Total Course Fee:</span>
              <span className="font-semibold text-[#141414]">${student.totalCourseFee}.00</span>
            </div>
            <div className="flex justify-between text-[12px] text-[#707070]">
              <span>Paid to Date:</span>
              <span className="font-semibold text-[#141414]">${student.totalPaid}.00</span>
            </div>
            <div className="flex justify-between text-[14px] font-semibold text-[#141414] pt-1.5 border-t border-[#e0e0e0]/60">
              <span>Remaining Balance Due:</span>
              <span>${student.remainingDue}.00 USD</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-[#f0f0f0] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 h-9 rounded-full bg-[#f3f3f3] hover:bg-[#e0e0e0] text-[#141414] text-[13px] font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 h-9 rounded-full bg-[#141414] hover:bg-[#262626] text-white text-[13px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Print / Save PDF</span>
            <span>↗</span>
          </button>
        </div>
      </div>
    </div>
  );
}
