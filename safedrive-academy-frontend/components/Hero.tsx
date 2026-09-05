"use client";

import React from "react";

interface HeroProps {
  onOpenAuth: (role?: "user" | "admin") => void;
  onExploreCourses: () => void;
}

export default function Hero({ onOpenAuth, onExploreCourses }: HeroProps) {
  return (
    <section className="relative w-full bg-[#ffffff] pt-14 pb-12 lg:pt-20 lg:pb-16 text-center">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f3f3f3] text-[12px] font-semibold text-[#141414]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#141414]"></span>
          <span>SafeDrive Academy · Driving Training & Student Portal</span>
        </div>

        {/* Hero Title & Subtitle */}
        <h1 className="text-[36px] sm:text-[50px] lg:text-[58px] font-semibold text-[#141414] leading-[1.08] tracking-tight">
          Master safe driving with certified training.
        </h1>

        <p className="text-[16px] sm:text-[19px] font-light text-[#707070] leading-[1.38] max-w-xl mx-auto">
          Comprehensive 4-Wheeler and 2-Wheeler driving courses. Sign in to your portal to track training kilometers and payment dues.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onOpenAuth("user")}
            className="w-full sm:w-auto px-6 h-11 rounded-full bg-[#141414] hover:bg-[#262626] text-white text-[13px] font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-none"
          >
            <span>Student Sign In</span>
            <span>→</span>
          </button>

          <button
            onClick={onExploreCourses}
            className="w-full sm:w-auto px-6 h-11 rounded-full bg-[#f3f3f3] hover:bg-[#e0e0e0] text-[#141414] text-[13px] font-semibold transition-colors flex items-center justify-center cursor-pointer"
          >
            Explore Courses
          </button>
        </div>
      </div>
    </section>
  );
}
