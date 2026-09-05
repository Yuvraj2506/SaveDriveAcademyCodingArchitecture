import { NextRequest, NextResponse } from "next/server";
import { DBService, CleanPendingRequest } from "@/backend/services/dbService";

export async function GET() {
  try {
    const requests = await DBService.getAllPendingRequests();
    return NextResponse.json({ success: true, requests });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching requests";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CleanPendingRequest = await request.json();
    const created = await DBService.createPendingRequest(body);
    return NextResponse.json({ success: true, request: created });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error creating request";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
