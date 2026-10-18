import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDocData } from "@/lib/db";
import ContentEditor from "@/components/ContentEditor";
import { PAGE_KEYS } from "@/lib/content-meta";

export default async function EditPage({ params }: { params: Promise<{ key: string }> }) {
  await requireUser();
  const { key } = await params;
  if (!(key in PAGE_KEYS)) notFound();
  const doc = await getDocData<{ content: Record<string, never> }>("pages", key);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-slate-900">{PAGE_KEYS[key]}</h1>
      {doc ? (
        <ContentEditor initial={doc.content} target={{ kind: "page", key }} />
      ) : (
        <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">This page has not been seeded yet. Run <code>npm run seed</code> first.</p>
      )}
    </div>
  );
}
