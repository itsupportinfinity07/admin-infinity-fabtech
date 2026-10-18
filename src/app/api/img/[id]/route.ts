import { db } from "@/lib/firebase/admin";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const snap = await db().collection("images").doc(id).get();
  const d = snap.data();
  if (!d?.data) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(d.data as string, "base64"), {
    headers: {
      "Content-Type": d.mime as string,
      // IDs are never reused, so the bytes behind a URL never change.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
