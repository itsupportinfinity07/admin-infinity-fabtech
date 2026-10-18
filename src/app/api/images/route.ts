import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getApiUser } from "@/lib/auth";
import { db } from "@/lib/firebase/admin";

// Firestore documents max out at 1 MiB; keep the base64 payload safely below it.
const MAX_BASE64_CHARS = 850_000;
const ALLOWED_MIME = new Set(["image/webp", "image/jpeg", "image/png"]);
const BASE64_RE = /^[A-Za-z0-9+/]+=*$/;

export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    data?: string;
    mime?: string;
    width?: number;
    height?: number;
  } | null;

  if (!body?.data || !body.mime || !ALLOWED_MIME.has(body.mime)) {
    return NextResponse.json({ error: "Unsupported image type. Use JPG, PNG or WebP." }, { status: 400 });
  }
  if (body.data.length > MAX_BASE64_CHARS) {
    return NextResponse.json({ error: "Image is too large after compression (limit ~600 KB)." }, { status: 413 });
  }
  if (!BASE64_RE.test(body.data)) {
    return NextResponse.json({ error: "Invalid image data." }, { status: 400 });
  }

  const ref = db().collection("images").doc();
  await ref.set({
    data: body.data,
    mime: body.mime,
    width: Number(body.width) || 0,
    height: Number(body.height) || 0,
    size: Math.round((body.data.length * 3) / 4),
    uploadedBy: user.email,
    createdAt: FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ id: ref.id });
}
