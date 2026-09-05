"use client";

import React from "react";

interface RoleBreakdownProps {
  onOpenAuth: (role: "student" | "instructor" | "admin") => void;
}

export default function RoleBreakdown({ onOpenAuth }: RoleBreakdownProps) {
  const roles = [
    {
      roleKey: "admin" as const,
      badge: "For Driving Academies & Owners",
      title: "School Administration & Fleet Operations",
      description:
        "Centralize student rosters, automate payment receipts, monitor instructor schedules, and track school-wide DMV pass rates.",
      features: [
        "Full student roster & registration pipeline",
        "Automated digital invoice & receipt delivery",
        "Dual-control vehicle & instructor assignment",
        "Revenue analytics & package settlement reports",
      ],
      cta: "Explore School Portal",
      accent: "#e60023",
    },
    {
      roleKey: "instructor" as const,
      badge: "For In-Car Instructors",
      title: "Effortless Lesson Logging & Digital Rubrics",
      description:
        "Say goodbye to clipboards. Score maneuvers with a single tap, track mandatory night/highway hours, and sync feedback instantly.",
      features: [
        "1-tap maneuver checklist (Parking, Merging, Stops)",
        "GPS-verified hour logbook with zero math",
        "Instant debrief notes & parent notifications",
        "Mock road-test readiness scoring calculator",
      ],
      cta: "Explore Instructor App",
      accent: "#000000",
    },
    {
      roleKey: "student" as const,
      badge: "For Students & Parents",
      title: "Road Test Readiness & Verified Receipts",
      description:
        "Watch your road-test readiness percentage climb, review instructor notes after every drive, and download verified payment receipts.",
      features: [
        "Live road-test readiness percentage meter",
        "Itemized digital payment receipts with 1-click PDF download",
        "Lesson countdown and remaining state-required hours",
        "Detailed maneuver feedback from your instructor",
      ],
      cta: "Explore Student Portal",
      accent: "#000000",
    },
  ];

  return (
    <section id="roles" className="w-full bg-[#ffffff] py-16 lg:py-24 border-b border-[#dadad3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f6f6f3] border border-[#dadad3] text-[12px] font-bold uppercase tracking-wider text-[#62625b]">
            Three-Way Unified Portals
          </div>
          <h2 className="text-[28px] sm:text-[36px] font-bold text-[#000000] tracking-display">
            Built for everyone involved in the driving journey
          </h2>
          <p className="text-[16px] text-[#33332e] leading-[1.4]">
            SafeDrive Academy bridges the communication gap between driving schools, certified instructors, and learner students with dedicated role-tailored views.
          </p>
        </div>

        {/* 3 Role Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {roles.map((r, idx) => (
            <div
              key={idx}
              className="bg-[#f6f6f3] border border-[#dadad3] rounded-2xl p-7 flex flex-col justify-between hover:border-[#91918c] transition-colors"
            >
              <div className="space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-white border border-[#dadad3] text-[12px] font-bold text-[#262622]">
                  {r.badge}
                </span>

                <h3 className="text-[22px] font-bold text-[#000000] tracking-tight leading-[1.25]">
                  {r.title}
                </h3>

                <p className="text-[14px] text-[#33332e] leading-[1.45]">
                  {r.description}
                </p>

                <div className="pt-2 border-t border-[#dadad3]">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#62625b] block mb-3">
                    Key Portal Capabilities:
                  </span>
                  <ul className="space-y-2.5">
                    {r.features.map((f, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-[13px] text-[#262622]">
                        <span className="w-4 h-4 rounded-full bg-[#e60023] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[#dadad3]">
                <button
                  onClick={() => onOpenAuth(r.roleKey)}
                  className="w-full h-11 rounded-2xl bg-[#000000] hover:bg-[#262622] text-white text-[14px] font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {r.cta} →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
