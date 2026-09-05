"use client";

import React from "react";

interface PricingTableProps {
  onOpenAuth: (tab: "student" | "admin") => void;
}

export default function PricingTable({ onOpenAuth }: PricingTableProps) {
  const packages = [
    {
      name: "Single Hourly Lesson",
      price: 65,
      unit: "per 1-hour session",
      description: "Ideal for brush-up practice, parking drills, or trying out an instructor.",
      features: [
        "1 full hour one-on-one in-car instruction",
        "Dual-control training vehicle included",
        "Home/School pickup & drop-off",
        "Digital receipt issued instantly",
      ],
      paymentTerms: "Pay per session (Cash / Card / UPI)",
      isPopular: false,
    },
    {
      name: "5-Class Refresher Pack",
      price: 300,
      unit: "5 hours total ($60/hr)",
      description: "Great for intermediate drivers wanting highway, parking, and test prep.",
      features: [
        "5 x 1-hour in-car driving lessons",
        "Parallel parking & 3-point turn mastery",
        "Highway merging & speed regulation",
        "Flexible 2-installment payment option",
      ],
      paymentTerms: "$150 deposit + $150 at Class #3",
      isPopular: false,
    },
    {
      name: "10-Class Full License Course",
      price: 580,
      unit: "10 hours total ($58/hr)",
      description: "Our comprehensive beginner-to-license program with full road test prep.",
      features: [
        "10 x 1-hour structured in-car sessions",
        "Complete DMV road-test curriculum",
        "Mock road exam with examiner scoring",
        "Online student portal & receipt tracking",
        "Flexible 3-installment payment plan",
      ],
      paymentTerms: "$250 deposit + $200 mid-course + $130 before test",
      isPopular: true,
    },
    {
      name: "DMV Road Test Day Bundle",
      price: 190,
      unit: "Test Day Car Rental & Prep",
      description: "Use our dual-control car for your official DMV/state driving exam.",
      features: [
        "45-minute warmup drive before test",
        "Dual-control car rental for examiner",
        "Instructor escort to test center",
        "Full insurance coverage included",
      ],
      paymentTerms: "Paid upon booking road test date",
      isPopular: false,
    },
  ];

  return (
    <section id="pricing" className="w-full bg-[#ffffff] py-14 lg:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f3f3f3] text-[12px] font-semibold text-[#141414]">
            Transparent Lesson Rates
          </div>
          <h2 className="text-[28px] sm:text-[36px] font-semibold text-[#141414] tracking-tight">
            Simple course rates and flexible terms.
          </h2>
          <p className="text-[15px] font-light text-[#707070] leading-[1.38]">
            No hidden fees. All courses include certified dual-control vehicles, pickup service, and digital payment receipts with installment options.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {packages.map((pkg, idx) => (
            <div
              key={idx}
              className={`rounded-[24px] p-6 flex flex-col justify-between transition-all ${
                pkg.isPopular
                  ? "bg-[#f3f3f3]"
                  : "bg-[#ffffff] border border-[#f0f0f0]"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between min-h-[24px]">
                  {pkg.isPopular ? (
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#0066ff] text-white text-[11px] font-semibold">
                      Popular
                    </span>
                  ) : (
                    <span></span>
                  )}
                </div>

                <div>
                  <h3 className="text-[18px] font-semibold text-[#141414] leading-snug">{pkg.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-[32px] font-semibold text-[#141414] tracking-tight">
                      ${pkg.price}
                    </span>
                    <span className="text-[12px] text-[#707070]">USD</span>
                  </div>
                  <span className="text-[12px] text-[#707070] block mt-0.5 font-normal">
                    {pkg.unit}
                  </span>
                </div>

                <p className="text-[13px] text-[#707070] leading-[1.38]">
                  {pkg.description}
                </p>

                <div className="pt-3 border-t border-[#e0e0e0]/60 space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#707070] block">
                    What's Included:
                  </span>
                  <ul className="space-y-1.5 text-[12px] text-[#141414]">
                    {pkg.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <span className="text-[#141414] font-bold">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 text-[11px] bg-[#ffffff] p-2.5 rounded-[16px] border border-[#f0f0f0]">
                  <span className="font-semibold text-[#707070] block uppercase">Terms:</span>
                  <span className="text-[#141414] font-medium">{pkg.paymentTerms}</span>
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-[#e0e0e0]/60">
                <button
                  onClick={() => onOpenAuth("student")}
                  className={`w-full h-10 rounded-full text-[13px] font-semibold transition-colors cursor-pointer flex items-center justify-center ${
                    pkg.isPopular
                      ? "bg-[#141414] hover:bg-[#262626] text-white"
                      : "bg-[#ffffff] hover:bg-[#f3f3f3] text-[#141414] border border-[#e0e0e0]"
                  }`}
                >
                  Enroll / Book Pack
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
