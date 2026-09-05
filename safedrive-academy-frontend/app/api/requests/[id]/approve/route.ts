import { NextRequest, NextResponse } from "next/server";
import { DBService } from "@/backend/services/dbService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = await DBService.approvePendingRequest(id);
    if (!student) {
      return NextResponse.json(
        { success: false, message: "Request not found or already processed" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, student });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error approving request";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
