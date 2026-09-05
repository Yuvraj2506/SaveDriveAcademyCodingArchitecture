"use client";

import React from "react";

export const OFFICE_PHONE_NUMBER = "+91 98765 43210";
export const OFFICE_TEL_LINK = "tel:+919876543210";

export default function CourseCards() {
  const courses = [
    {
      id: "4-wheeler" as const,
      title: "4-Wheeler Training Course",
      badge: "Car Training",
      description:
        "Comprehensive in-car driving instruction covering steering control, parallel parking, highway driving, and official RTO road test preparation.",
      highlights: [
        "Dual-control training cars",
        "Parallel parking & 3-point turn mastery",
        "Highway & night driving sessions",
        "Official RTO test simulation",
      ],
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 17a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10l2-4h14l2 4M3 10v7h2m16 0h2v-7M3 10h18" />
        </svg>
      ),
    },
    {
      id: "2-wheeler" as const,
      title: "2-Wheeler Training Course",
      badge: "Bike / Scooter Training",
      description:
        "Step-by-step two-wheeler instruction covering balance, clutch & gear shifting, figure-8 maneuvers, emergency braking, and road traffic safety.",
      highlights: [
        "Geared and automatic 2-wheelers",
        "Balance, clutch & braking control",
        "Figure-8 and slalom test track",
        "Traffic road sense & defensive riding",
      ],
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <circle cx="6" cy="17" r="3" strokeWidth="1.8" />
          <circle cx="18" cy="17" r="3" strokeWidth="1.8" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 17l4-9h4l2 4h2M10 8l3 5h5M9 5h3" />
        </svg>
      ),
    },
  ];

  return (
    <section className="w-full bg-[#ffffff] py-10 lg:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-[26px] sm:text-[32px] font-semibold text-[#141414] tracking-tight">
            Our Training Courses.
          </h2>
          <p className="text-[15px] font-light text-[#707070] leading-[1.38]">
            Click Enroll Now to call our academy office and reserve your driving training slot.
          </p>
        </div>

        {/* 2 Minimal Course Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((c) => (
            <div
              key={c.id}
              className="bg-[#f3f3f3] rounded-[24px] p-7 flex flex-col justify-between transition-all hover:bg-[#e0e0e0]/40"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 squircle-icon bg-[#141414] text-white flex items-center justify-center">
                    {c.icon}
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white text-[#141414] text-[11px] font-semibold">
                    {c.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-[20px] font-semibold text-[#141414] leading-snug">
                    {c.title}
                  </h3>
                  <p className="text-[13px] text-[#707070] font-light leading-[1.4] mt-2">
                    {c.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#e0e0e0]/60 space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#707070] block mb-1">
                    Course Highlights:
                  </span>
                  {c.highlights.map((h, hIdx) => (
                    <div key={hIdx} className="flex items-center gap-2 text-[12px] text-[#141414]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#141414]"></span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Office Mobile Number Redirect */}
              <div className="pt-6 mt-6 border-t border-[#e0e0e0]/60 space-y-2">
                <a
                  href={OFFICE_TEL_LINK}
                  className="w-full h-11 rounded-full bg-[#141414] hover:bg-[#262626] text-white text-[13px] font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-none"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span>Enroll Now (Call Office)</span>
                  <span>→</span>
                </a>
                <div className="text-center text-[11px] text-[#707070]">
                  Office Helpline: <span className="font-semibold text-[#141414]">{OFFICE_PHONE_NUMBER}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
