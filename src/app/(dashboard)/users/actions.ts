"use server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { adminAuth, db } from "@/lib/firebase/admin";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(10, "Password must be at least 10 characters"),
  role: z.enum(["admin", "editor"]),
});

export async function createUser(input: z.input<typeof schema>) {
  await requireUser("admin");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  try {
    const u = await adminAuth().createUser({ email: parsed.data.email, password: parsed.data.password });
    await adminAuth().setCustomUserClaims(u.uid, { role: parsed.data.role });
    await db().collection("users").doc(u.uid).set({ email: parsed.data.email, role: parsed.data.role });
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Could not create user" };
  }
}

export async function removeUser(uid: string) {
  const me = await requireUser("admin");
  if (me.uid === uid) return { ok: false as const, error: "You cannot delete your own account." };
  await adminAuth().deleteUser(uid);
  await db().collection("users").doc(uid).delete();
  return { ok: true as const };
}
