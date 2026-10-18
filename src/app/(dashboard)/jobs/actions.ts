"use server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/firebase/admin";
import { revalidateSite } from "@/lib/revalidate";
import { slugify } from "@/lib/utils";

const text = (max: number) => z.string().trim().max(max);
const lines = z.array(z.string().trim().max(600)).transform((a) => a.filter(Boolean));

const schema = z.object({
  slug: z.string().trim().max(80),
  title: text(120).min(2, "Job title is required"),
  department: text(60).min(1, "Department is required"),
  location: text(80).min(1, "Location is required"),
  type: text(40).min(1, "Employment type is required"),
  experience: text(40),
  summary: text(400).min(10, "Add a short summary"),
  responsibilities: lines,
  requirements: lines,
  status: z.enum(["draft", "open", "closed"]),
  closesAt: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Invalid closing date"),
});

export type JobInput = z.input<typeof schema>;
export type JobResult = { ok: true; slug: string } | { ok: false; error: string };

export async function saveJob(input: JobInput, isNew: boolean): Promise<JobResult> {
  await requireUser();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  const d = parsed.data;

  const slug = isNew ? slugify(d.slug || d.title) : d.slug;
  if (!slug) return { ok: false, error: "Could not build a URL from the title." };
  const ref = db().collection("jobs").doc(slug);
  const existing = await ref.get();
  if (isNew && existing.exists) return { ok: false, error: `A job with the URL "${slug}" already exists.` };
  if (!isNew && !existing.exists) return { ok: false, error: "Job not found." };
  if (d.status === "open" && (!d.responsibilities.length || !d.requirements.length))
    return { ok: false, error: "Add responsibilities and requirements before opening the job." };

  const prev = existing.data();
  await ref.set({
    ...d,
    slug,
    // postedAt is set the first time the job goes open and kept afterwards.
    postedAt: prev?.postedAt ?? (d.status === "open" ? FieldValue.serverTimestamp() : null),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await revalidateSite(["jobs"]);
  return { ok: true, slug };
}

export async function deleteJob(slug: string) {
  await requireUser();
  await db().collection("jobs").doc(slug).delete();
  await revalidateSite(["jobs"]);
  return { ok: true };
}
