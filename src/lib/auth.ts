import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";
import type { Role } from "@/lib/types";

export const SESSION_COOKIE = "__session";
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 5; // 5 days

export interface SessionUser {
  uid: string;
  email: string;
  role: Role;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, true);
    const role = decoded.role as Role | undefined;
    if (role !== "admin" && role !== "editor") return null;
    return { uid: decoded.uid, email: decoded.email ?? "", role };
  } catch {
    return null;
  }
}

/** Use at the top of every page, route handler and server action. */
export async function requireUser(role?: Role): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (role === "admin" && user.role !== "admin") redirect("/");
  return user;
}

/** For route handlers: returns null instead of redirecting. */
export async function getApiUser(role?: Role) {
  const user = await getSessionUser();
  if (!user) return null;
  if (role === "admin" && user.role !== "admin") return null;
  return user;
}
