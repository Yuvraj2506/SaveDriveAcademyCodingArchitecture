import { NextRequest, NextResponse } from "next/server";
import { DBService } from "@/backend/services/dbService";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const phone = decodeURIComponent(id);
    const body = await request.json();

    if (body.completedKm !== undefined) {
      await DBService.updateStudentKm(phone, Number(body.completedKm));
    }
    if (body.completedDays !== undefined) {
      await DBService.updateStudentDays(phone, Number(body.completedDays));
    }

    return NextResponse.json({ success: true, message: "Student progress updated successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error updating student progress";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const phone = decodeURIComponent(id);

    await DBService.deleteStudent(phone);
    return NextResponse.json({ success: true, message: "Student deleted successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error deleting student";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
