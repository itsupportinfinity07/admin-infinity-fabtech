"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/firebase/admin";

const STATUSES = ["new", "read", "replied"] as const;

export async function setInquiryStatus(id: string, status: (typeof STATUSES)[number]) {
  await requireUser("admin");
  if (!STATUSES.includes(status)) return { ok: false };
  await db().collection("inquiries").doc(id).update({ status });
  revalidatePath("/inquiries");
  return { ok: true };
}

export async function deleteInquiry(id: string) {
  await requireUser("admin");
  await db().collection("inquiries").doc(id).delete();
  revalidatePath("/inquiries");
  return { ok: true };
}
