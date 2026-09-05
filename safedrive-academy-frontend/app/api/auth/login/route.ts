import { NextRequest, NextResponse } from "next/server";
import { AuthController } from "@/backend/controllers/authController";
import { LoginCredentials } from "@/backend/types/auth";

export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json();
    const { status, data } = await AuthController.login(body);
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request payload format.",
        error: "BAD_REQUEST",
      },
      { status: 400 }
    );
  }
}
