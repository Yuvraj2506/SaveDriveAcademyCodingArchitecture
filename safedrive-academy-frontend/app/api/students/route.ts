import { NextResponse } from "next/server";
import { DBService } from "@/backend/services/dbService";

export async function GET() {
  try {
    const students = await DBService.getAllStudents();
    return NextResponse.json({ success: true, students });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching students";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
