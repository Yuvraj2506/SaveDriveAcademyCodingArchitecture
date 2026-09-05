import { NextRequest, NextResponse } from "next/server";
import { DBService } from "@/backend/services/dbService";

export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json();

    if (!phone || !password || password.length < 4) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 4 characters long." },
        { status: 400 }
      );
    }

    const result = await DBService.setStudentPassword(phone, password);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Failed to set password. Student not registered." },
        { status: 400 }
      );
    }

    const token = `sess_${Buffer.from(`${phone}_${Date.now()}`).toString("base64")}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return NextResponse.json({
      success: true,
      message: "Password set successfully! Logging in...",
      user: {
        id: phone,
        name: result.name || "Student",
        phone,
        role: "user",
        permissions: ["view_own_progress", "view_own_dues", "download_receipts"],
      },
      session: {
        token,
        expiresAt,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error setting student password";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
