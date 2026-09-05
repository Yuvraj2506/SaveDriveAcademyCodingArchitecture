import { NextRequest, NextResponse } from "next/server";
import { AuthController } from "@/backend/controllers/authController";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") || "";

  const { status, data } = await AuthController.verifySession(token);
  return NextResponse.json(data, { status });
}
