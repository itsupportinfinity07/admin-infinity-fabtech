"use server";
import { FieldValue } from "firebase-admin/firestore";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/firebase/admin";
import { revalidateSite } from "@/lib/revalidate";
import { slugify } from "@/lib/utils";

import { COLLECTIONS, PAGE_KEYS } from "@/lib/content-meta";

type Result = { ok: true; id?: string } | { ok: false; error: string };
const MAX_JSON = 200_000;

function checkSize(data: unknown): string | null {
  return JSON.stringify(data).length > MAX_JSON ? "Content is too large." : null;
}

export async function savePage(key: string, content: Record<string, unknown>): Promise<Result> {
  await requireUser();
  if (!(key in PAGE_KEYS)) return { ok: false, error: "Unknown page." };
  const err = checkSize(content);
  if (err) return { ok: false, error: err };
  await db().collection("pages").doc(key).set({ content, updatedAt: FieldValue.serverTimestamp() });
  await revalidateSite(["pages"]);
  return { ok: true };
}

export async function saveItem(col: string, id: string, data: Record<string, unknown>): Promise<Result> {
  await requireUser();
  if (!(col in COLLECTIONS)) return { ok: false, error: "Unknown collection." };
  const err = checkSize(data);
  if (err) return { ok: false, error: err };
  const ref = db().collection(col).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, error: "Item not found." };
  // Identity fields are not editable: keep what is stored.
  const { id: _i, slug: _s, ...rest } = data as Record<string, unknown>;
  void _i; void _s;
  const keep: Record<string, unknown> = {};
  if (snap.data()?.slug !== undefined) keep.slug = snap.data()?.slug;
  await ref.set({ ...rest, ...keep, updatedAt: FieldValue.serverTimestamp() });
  await revalidateSite([col]);
  return { ok: true };
}

/** Creates an item shaped like the existing ones, with every field emptied. */
export async function createItem(col: string, name: string): Promise<Result> {
  await requireUser();
  const meta = COLLECTIONS[col];
  if (!meta) return { ok: false, error: "Unknown collection." };
  const id = slugify(name);
  if (!id) return { ok: false, error: "Enter a name." };
  const ref = db().collection(col).doc(id);
  if ((await ref.get()).exists) return { ok: false, error: "An item with that name already exists." };

  const first = (await db().collection(col).limit(1).get()).docs[0]?.data() ?? {};
  const blankOf = (v: unknown): unknown =>
    typeof v === "string" ? "" : typeof v === "number" ? 0 : typeof v === "boolean" ? false
      : Array.isArray(v) ? [] : v && typeof v === "object" && !("toDate" in (v as object))
        ? Object.fromEntries(Object.entries(v as object).map(([k, x]) => [k, blankOf(x)])) : null;
  const doc = blankOf(first) as Record<string, unknown>;
  delete doc.updatedAt;
  doc[meta.nameField] = name;
  if ("slug" in doc) doc.slug = id;
  if ("category" in doc && !doc.category) doc.category = "General";
  doc.sortOrder = (await db().collection(col).count().get()).data().count;
  await ref.set({ ...doc, updatedAt: FieldValue.serverTimestamp() });
  await revalidateSite([col]);
  return { ok: true, id };
}

export async function deleteItem(col: string, id: string): Promise<Result> {
  await requireUser();
  if (!(col in COLLECTIONS)) return { ok: false, error: "Unknown collection." };
  await db().collection(col).doc(id).delete();
  await revalidateSite([col]);
  return { ok: true };
}
