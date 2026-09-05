import { NextRequest, NextResponse } from "next/server";
import { DBService } from "@/backend/services/dbService";

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid registered mobile number." },
        { status: 400 }
      );
    }

    const result = await DBService.verifyRegisteredStudentPhone(phone);

    if (!result.registered) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Mobile number not found in approved students. Please contact school desk or wait for Owner approval.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      registered: true,
      studentName: result.studentName,
      message: `Verified! Welcome, ${result.studentName}. Please create your new password.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error verifying phone number";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
