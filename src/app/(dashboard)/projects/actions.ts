"use server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/firebase/admin";
import { revalidateSite } from "@/lib/revalidate";
import { slugify } from "@/lib/utils";
import { sanitizeRichText, stripTags } from "@/lib/richtext";

const text = (max: number) => z.string().trim().max(max);
const lines = z.array(z.string().trim().max(600)).transform((a) => a.filter(Boolean));

const schema = z.object({
  slug: z.string().trim().max(80),
  name: text(140).min(2, "Name is required"),
  client: text(200),
  type: text(120),
  area: text(60),
  year: text(20),
  description: text(30000),
  highlights: lines,
  scope: lines,
  showOnMap: z.boolean(),
  locationLabel: text(160),
  place: z.object({
    city: text(80),
    state: text(80),
    lat: z.number().min(5).max(38).nullable(),
    lng: z.number().min(67).max(98).nullable(),
  }),
  coverImageId: z.string().max(60),
  images: z.array(z.object({ id: z.string().max(60), alt: text(200) })).max(40),
  isFeatured: z.boolean(),
  status: z.enum(["draft", "published"]),
  seoTitle: text(70),
  seoDesc: text(170),
});

export type ProjectInput = z.input<typeof schema>;
export type ActionResult = { ok: true; slug: string } | { ok: false; error: string };

export async function saveProject(input: ProjectInput, isNew: boolean): Promise<ActionResult> {
  await requireUser();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  const d = parsed.data;
  d.description = sanitizeRichText(d.description);
  if (stripTags(d.description).length < 10) return { ok: false, error: "Add a description" };

  const slug = isNew ? slugify(d.slug || d.name) : d.slug;
  if (!slug) return { ok: false, error: "Could not build a URL slug from the name." };

  const firestore = db();
  const ref = firestore.collection("projects").doc(slug);
  const existing = await ref.get();
  if (isNew && existing.exists) return { ok: false, error: `A project with the URL "${slug}" already exists.` };
  if (!isNew && !existing.exists) return { ok: false, error: "Project not found." };

  if (d.status === "published" && d.images.length === 0)
    return { ok: false, error: "Add at least one photo before publishing." };

  // Link to a map location (reuse the city's pin if it already exists).
  let locationId = "";
  if (d.showOnMap) {
    if (!d.place.city || d.place.lat === null || d.place.lng === null)
      return { ok: false, error: "Place the pin on the map and enter a city, or untick “Show on map”." };
    locationId = slugify(d.place.city);
    const locRef = firestore.collection("locations").doc(locationId);
    if (!(await locRef.get()).exists) {
      await locRef.set({
        city: d.place.city,
        state: d.place.state,
        lat: d.place.lat,
        lng: d.place.lng,
        showOnMap: true,
        legacyClients: [],
      });
    }
  }

  const cover = d.images.some((i) => i.id === d.coverImageId) ? d.coverImageId : (d.images[0]?.id ?? "");
  const prev = existing.data();
  const prevCount = (await firestore.collection("projects").count().get()).data().count;

  await ref.set({
    slug,
    name: d.name,
    client: d.client,
    type: d.type,
    area: d.area,
    year: d.year,
    description: d.description,
    highlights: d.highlights,
    scope: d.scope,
    locationId,
    locationLabel: d.locationLabel,
    coverImageId: cover,
    images: d.images,
    imageIds: d.images.map((i) => i.id),
    isFeatured: d.isFeatured,
    sortOrder: prev?.sortOrder ?? prevCount,
    status: d.status,
    seoTitle: d.seoTitle,
    seoDesc: d.seoDesc,
    createdAt: prev?.createdAt ?? FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Delete photos removed from this project (never the seeded ones, which may be shared).
  const removed = ((prev?.imageIds as string[] | undefined) ?? []).filter((id) => !d.images.some((i) => i.id === id));
  await deleteUnusedImages(removed);

  await revalidateSite(["projects", "locations"]);
  revalidatePath("/projects");
  return { ok: true, slug };
}

export async function deleteProject(slug: string): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  const ref = db().collection("projects").doc(slug);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, error: "Project not found." };
  const ids = (snap.data()?.imageIds as string[] | undefined) ?? [];
  await ref.delete();
  await deleteUnusedImages(ids);
  await revalidateSite(["projects", "locations"]);
  revalidatePath("/projects");
  return { ok: true };
}

async function deleteUnusedImages(ids: string[]) {
  const firestore = db();
  for (const id of ids) {
    if (id.startsWith("seed-")) continue;
    const inUse = await firestore.collection("projects").where("imageIds", "array-contains", id).limit(1).get();
    if (inUse.empty) await firestore.collection("images").doc(id).delete();
  }
}
