import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { listDocs } from "@/lib/db";
import { COLLECTIONS } from "@/lib/content-meta";
import NewItem from "@/components/NewItem";

export default async function CollectionList({ params }: { params: Promise<{ col: string }> }) {
  await requireUser();
  const { col } = await params;
  const meta = COLLECTIONS[col];
  if (!meta) notFound();
  const items = (await listDocs<Record<string, unknown> & { sortOrder?: number }>(col)).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-slate-900">{meta.title}</h1>
      <NewItem col={col} />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-100">
          {items.map((it) => (
            <li key={it.id}>
              <Link href={`/${col}/${it.id}`} className="block p-4 font-semibold hover:bg-slate-50">{String(it[meta.nameField] ?? it.id)}</Link>
            </li>
          ))}
          {items.length === 0 && <li className="p-6 text-sm text-slate-500">Nothing here yet. Run <code>npm run seed</code> to import the current website content.</li>}
        </ul>
      </div>
    </div>
  );
}
