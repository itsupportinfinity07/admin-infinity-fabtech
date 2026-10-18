import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDocData } from "@/lib/db";
import ContentEditor from "@/components/ContentEditor";
import { COLLECTIONS } from "@/lib/content-meta";

export default async function EditItem({ params }: { params: Promise<{ col: string; id: string }> }) {
  await requireUser();
  const { col, id } = await params;
  const meta = COLLECTIONS[col];
  if (!meta) notFound();
  const doc = await getDocData<Record<string, never>>(col, id);
  if (!doc) notFound();
  // Hide identity/system fields from the editor.
  const { id: _id, slug: _slug, updatedAt: _u, ...editable } = doc as Record<string, never> & { slug?: string; updatedAt?: string };
  void _id; void _slug; void _u;
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-slate-900">{String(doc[meta.nameField] ?? id)}</h1>
      <ContentEditor initial={editable} target={{ kind: "item", col, id }} />
    </div>
  );
}
