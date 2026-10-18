import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";

/** Recursively converts Firestore Timestamps to ISO strings so data is safe to pass to client components. */
export function plain<T>(value: unknown): T {
  if (value instanceof Timestamp) return value.toDate().toISOString() as T;
  if (Array.isArray(value)) return value.map((v) => plain(v)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, plain(v)])
    ) as T;
  }
  return value as T;
}

export async function listDocs<T>(collection: string, orderBy?: string): Promise<(T & { id: string })[]> {
  let q: FirebaseFirestore.Query = db().collection(collection);
  if (orderBy) q = q.orderBy(orderBy);
  const snap = await q.get();
  return snap.docs.map((d) => ({ ...plain<T>(d.data()), id: d.id }));
}

export async function getDocData<T>(collection: string, id: string): Promise<(T & { id: string }) | null> {
  const snap = await db().collection(collection).doc(id).get();
  return snap.exists ? { ...plain<T>(snap.data()), id: snap.id } : null;
}
