import "server-only";

/**
 * Tells the public website to refresh cached content. Best-effort: a failure
 * (site down, env not set) must never block saving in the admin.
 */
export async function revalidateSite(tags: string[]) {
  const url = process.env.WEBSITE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret) return;
  try {
    await fetch(`${url.replace(/\/$/, "")}/api/revalidate`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-revalidate-secret": secret },
      body: JSON.stringify({ tags }),
      cache: "no-store",
    });
  } catch (err) {
    console.warn("Website revalidation failed:", err);
  }
}
