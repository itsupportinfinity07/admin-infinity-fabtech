"use server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/firebase/admin";
import { revalidateSite } from "@/lib/revalidate";
import { slugify } from "@/lib/utils";

const schema = z.object({
  id: z.string().max(80),
  city: z.string().trim().min(1, "City is required").max(80),
  state: z.string().trim().max(80),
  lat: z.number().min(5).max(38),
  lng: z.number().min(67).max(98),
  showOnMap: z.boolean(),
  legacyClients: z.array(z.string().trim().max(200)).transform((a) => a.filter(Boolean)),
});
export type LocationInput = z.input<typeof schema>;

export async function saveLocation(input: LocationInput, isNew: boolean) {
  await requireUser();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  const { id: _omit, ...data } = parsed.data;
  void _omit;
  const id = isNew ? slugify(data.city) : input.id;
  const ref = db().collection("locations").doc(id);
  if (isNew && (await ref.get()).exists) return { ok: false as const, error: "That city already has a pin. Edit it instead." };
  await ref.set(data);
  await revalidateSite(["locations"]);
  return { ok: true as const, id };
}

export async function deleteLocation(id: string) {
  await requireUser();
  const used = await db().collection("projects").where("locationId", "==", id).limit(1).get();
  if (!used.empty) return { ok: false as const, error: "Projects still use this location. Move or untick them first." };
  await db().collection("locations").doc(id).delete();
  await revalidateSite(["locations"]);
  return { ok: true as const };
}
