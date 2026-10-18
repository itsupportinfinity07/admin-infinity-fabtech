/* eslint-disable @typescript-eslint/no-explicit-any */
// Copies the current website content (src/data/*) and images into Firestore.
// Safe to re-run: documents that already exist are left alone (so admin edits are never overwritten).
// Pages only get top-level keys that are missing. Use --force to overwrite everything.
// Usage: npm run seed            (WEBSITE_DIR defaults to ../Infinity-fabtech-website)
import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import { init } from "./env";

const WEBSITE = path.resolve(process.env.WEBSITE_DIR ?? "../Infinity-fabtech-website");
const { db } = init();
const FORCE = process.argv.includes("--force");

/** True when the doc exists and must be kept. */
async function keep(col: string, id: string) {
  return !FORCE && (await db.collection(col).doc(id).get()).exists;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const MAX_BASE64 = 800_000;

async function importData(file: string) {
  return import(path.join(WEBSITE, "src/data", file));
}

const imageIdCache = new Map<string, string>();
/** "/images/products/x.png" -> compressed base64 doc with deterministic id. Returns "/api/img/<id>". */
async function seedImage(publicPath: string): Promise<string> {
  const cached = imageIdCache.get(publicPath);
  if (cached) return cached;
  const id = "seed-" + slugify(publicPath.replace(/^\/images\//, "").replace(/\.\w+$/, ""));
  const input = await fs.readFile(path.join(WEBSITE, "public", publicPath));
  let width = 1600;
  let quality = 80;
  let out: Buffer = Buffer.alloc(0);
  for (;;) {
    out = await sharp(input).rotate().resize({ width, withoutEnlargement: true }).webp({ quality }).toBuffer();
    if (out.toString("base64").length <= MAX_BASE64) break;
    if (quality > 50) quality -= 10; else width = Math.round(width * 0.85);
  }
  const meta = await sharp(out).metadata();
  await db.collection("images").doc(id).set({
    data: out.toString("base64"), mime: "image/webp", width: meta.width ?? 0, height: meta.height ?? 0,
    size: out.length, uploadedBy: "seed", createdAt: new Date(),
  });
  const url = `/api/img/${id}`;
  imageIdCache.set(publicPath, url);
  console.log(`  image ${id} (${Math.round(out.length / 1024)} KB)`);
  return url;
}

async function main() {
  // ---- Pages (generic content) ----
  const landing = (await importData("landing.ts")).landingContent;
  const about = (await importData("about.ts")).aboutContent;
  const company = (await importData("company.ts")).companyConfig;
  const contact = (await importData("contact.ts")).contactContent;
  const footer = (await importData("footer.ts")).footerContent;
  const careers = (await importData("careers.ts")).careersContent;
  const projectsData = await importData("projects.ts");
  const servicesData = await importData("services.ts");

  const pages: Record<string, unknown> = {
    landing, about, company, contact, footer,
    careers: { hero: careers.hero, perks: careers.perks },
    projectsPage: projectsData.projectsPageContent,
    servicesPage: servicesData.servicesPageContent,
  };
  // About page: leadership photos, award + factory galleries live in Firestore too.
  const aboutDoc = JSON.parse(JSON.stringify(about));
  for (const leader of aboutDoc.leadership) if (leader.src) leader.src = await seedImage(leader.src);
  pages.about = aboutDoc;
  for (const [key, content] of Object.entries(pages)) {
    const ref = db.collection("pages").doc(key);
    const snap = await ref.get();
    const fresh = JSON.parse(JSON.stringify(content)) as Record<string, unknown>;
    if (snap.exists && !FORCE) {
      const current = (snap.data()?.content ?? {}) as Record<string, unknown>;
      const missing = Object.keys(fresh).filter((k) => !(k in current));
      if (missing.length) await ref.set({ content: { ...current, ...Object.fromEntries(missing.map((k) => [k, fresh[k]])) }, updatedAt: new Date() });
      console.log("page", key, missing.length ? `(added ${missing.join(", ")})` : "(kept)");
    } else {
      await ref.set({ content: fresh, updatedAt: new Date() });
      console.log("page", key);
    }
  }

  // ---- Locations (existing client map) ----
  const locs = (await importData("clientLocations.ts")).CLIENT_LOCATIONS as {
    id: string; city: string; state: string; lat: number; lng: number; clients: string[];
  }[];
  for (const l of locs) {
    if (await keep("locations", l.id)) continue;
    await db.collection("locations").doc(l.id).set({
      city: l.city, state: l.state, lat: l.lat, lng: l.lng, showOnMap: true, legacyClients: l.clients,
    });
  }
  console.log(`${locs.length} locations`);

  // ---- Products ----
  const products = (await importData("products.ts")).products as Record<string, any>[];
  for (const [i, p] of products.entries()) {
    const { slug, ...rest } = p;
    if (await keep("products", slug)) continue;
    const image = await seedImage(p.image);
    const images: string[] = [];
    for (const src of p.images ?? []) images.push(await seedImage(src));
    await db.collection("products").doc(slug).set({ ...rest, slug, image, images, sortOrder: i, updatedAt: new Date() });
  }
  console.log(`${products.length} products`);

  // ---- Services ----
  const services = servicesData.services as Record<string, any>[];
  for (const [i, s] of services.entries()) {
    if (await keep("services", s.id)) continue;
    await db.collection("services").doc(s.id).set({ ...s, sortOrder: i, updatedAt: new Date() });
  }
  console.log(`${services.length} services`);

  // ---- Testimonials ----
  const testimonials = (await importData("testimonials.ts")).testimonials as Record<string, any>[];
  for (const [i, t] of testimonials.entries()) {
    if (await keep("testimonials", `t-${t.id}`)) continue;
    await db.collection("testimonials").doc(`t-${t.id}`).set({ ...t, isVisible: false, sortOrder: i, updatedAt: new Date() });
  }
  console.log(`${testimonials.length} testimonials (hidden, as on the current site)`);

  // ---- Projects (link each to its city pin where one exists) ----
  const byCity = new Map(locs.map((l) => [l.city.toLowerCase(), l.id]));
  const projects = projectsData.projects as Record<string, any>[];
  for (const [i, p] of projects.entries()) {
    if (await keep("projects", p.id)) continue;
    const city = String(p.location).split(",")[0].trim().toLowerCase();
    const locationId = byCity.get(city) ?? "";
    const cover = await seedImage(p.image);
    const ids: string[] = [];
    for (const g of p.gallery ?? []) ids.push((await seedImage(g)).replace("/api/img/", ""));
    const coverId = cover.replace("/api/img/", "");
    if (!ids.includes(coverId)) ids.unshift(coverId);
    await db.collection("projects").doc(p.id).set({
      slug: p.id, name: p.name, client: p.client, type: p.type, area: p.area, year: p.year,
      description: p.description, highlights: p.highlights, scope: p.scope,
      locationId, locationLabel: p.location, coverImageId: coverId,
      images: ids.map((id) => ({ id, alt: p.name })), imageIds: ids,
      isFeatured: i < 2, sortOrder: i, status: "published", seoTitle: "", seoDesc: "",
      createdAt: new Date(), updatedAt: new Date(),
    });
    if (!locationId) console.log(`  note: "${p.name}" (${p.location}) has no map pin yet. Add one in the admin.`);
  }
  console.log(`${projects.length} projects`);

  // ---- Jobs (the 4 placeholder openings, as drafts so nothing fake goes live) ----
  for (const j of careers.openings as Record<string, any>[]) {
    if (await keep("jobs", j.slug)) continue;
    await db.collection("jobs").doc(j.slug).set({ ...j, status: "draft", closesAt: "", postedAt: null, updatedAt: new Date() });
  }
  console.log(`${careers.openings.length} jobs (as drafts: open the real ones in the admin)`);
  console.log("Seed complete.");
}

main().catch((e) => { console.error(e); process.exit(1); });
