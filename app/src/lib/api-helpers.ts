import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export function apiResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  status?: string;
  organizationId?: string;
};

export async function getAuthSession(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as SessionUser;
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getAuthSession();
  if (!user) throw new AuthError("לא מחובר", 401);
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") throw new AuthError("אין הרשאה", 403);
  return user;
}

export async function requireManager(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "MANAGER" || user.status !== "APPROVED")
    throw new AuthError("אין הרשאה", 403);
  if (!user.organizationId) throw new AuthError("לא שויך לארגון", 403);
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withErrorHandler(handler: (...args: any[]) => Promise<NextResponse>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof AuthError) {
        return apiError(err.message, err.status);
      }
      return apiError("שגיאה פנימית", 500);
    }
  };
}
