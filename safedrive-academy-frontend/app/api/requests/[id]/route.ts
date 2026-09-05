import { NextRequest, NextResponse } from "next/server";
import { DBService } from "@/backend/services/dbService";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await DBService.rejectPendingRequest(id);
    return NextResponse.json({ success: true, message: "Request rejected successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error rejecting request";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
