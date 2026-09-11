import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";

type AppRole = "SUPER_ADMIN" | "INSPECTOR" | "COMPANY_ADMIN" | "STUDENT";

/**
 * Server-side guard for pages and server actions. Redirects to /login if
 * there's no session, and to / if the session doesn't have one of the
 * allowed roles. Route-level protection also happens in middleware.ts —
 * this is the defense-in-depth layer for server actions, which middleware
 * does not cover.
 */
export async function requireRole(allowed: AppRole[]) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!allowed.includes(session.user.role)) redirect("/");
  return session;
}

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return session;
}
