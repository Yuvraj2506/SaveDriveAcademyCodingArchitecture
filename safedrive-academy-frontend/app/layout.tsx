import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SafeDrive Academy — Student Tracking & Digital Payment Receipts for Driving Schools",
  description:
    "Smarter student tracking for modern driving academies. Track student driving progress, road readiness milestones, and issue instant digital payment receipts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#ffffff] text-[#33332e]">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}