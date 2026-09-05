"use client";

import React from "react";

export default function Footer() {
  return (
    <footer className="w-full bg-[#141414] rounded-t-[24px] text-white pt-14 pb-10 text-[14px] mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12">
          {/* Col 1: Wordmark & Tagline */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 squircle-icon bg-white text-[#141414] flex items-center justify-center text-xs font-bold">
                S
              </div>
              <span className="text-[20px] font-semibold text-white tracking-tight">
                SafeDrive Academy.
              </span>
            </div>
            <p className="text-[14px] text-[#adadad] font-light max-w-sm leading-[1.4]">
              The transparent operating platform for driving students, in-car instructors, and academy administrators.
            </p>
          </div>

          {/* Col 2: Student Links */}
          <div className="space-y-2.5">
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-white">Student Portal</h4>
            <ul className="space-y-2 text-[13px] text-[#adadad]">
              <li><a href="#student-tracker" className="hover:text-white transition-colors">In-Car Lesson Log</a></li>
              <li><a href="#payment-dues" className="hover:text-white transition-colors">Payment Receipts</a></li>
              <li><a href="#payment-dues" className="hover:text-white transition-colors">Remaining Course Balance</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Lesson Packages</a></li>
            </ul>
          </div>

          {/* Col 3: Academy Links */}
          <div className="space-y-2.5">
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-white">Academy Admin</h4>
            <ul className="space-y-2 text-[13px] text-[#adadad]">
              <li><a href="#" className="hover:text-white transition-colors">Student Rosters</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cash & Card Receipts</a></li>
              <li><a href="#" className="hover:text-white transition-colors">DMV Test Scheduling</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Instructor Fleet Management</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="pt-8 border-t border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[#adadad]">
          <div>
            © {new Date().getFullYear()} SafeDrive Academy, Inc. All rights reserved.
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">DMV Compliance</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
