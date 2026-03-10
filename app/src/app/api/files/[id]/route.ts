import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/api-helpers";
import { getFile } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthSession();
    if (!user) {
      return NextResponse.json({ success: false, error: "לא מחובר" }, { status: 401 });
    }

    const { id } = await params;
    const file = await getFile(id);
    if (!file) {
      return NextResponse.json({ success: false, error: "קובץ לא נמצא" }, { status: 404 });
    }

    // Ensure user belongs to the same organization
    if (user.role !== "ADMIN" && file.organizationId !== user.organizationId) {
      return NextResponse.json({ success: false, error: "אין הרשאה" }, { status: 403 });
    }

    return new Response(file.buffer, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.originalName)}"`,
        "Content-Length": String(file.fileSize),
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "שגיאה פנימית" }, { status: 500 });
  }
}
