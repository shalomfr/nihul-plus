import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "לא מורשה" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== "MANAGER") {
      return NextResponse.json({ success: false, error: "משתמש לא נמצא" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "שגיאה" }, { status: 500 });
  }
}
