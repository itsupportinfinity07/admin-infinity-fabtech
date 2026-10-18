import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { PAGE_KEYS } from "@/lib/content-meta";

export default async function ContentIndex() {
  await requireUser();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-slate-900">Page content</h1>
      <p className="text-sm text-slate-600">Choose a page to edit its headings, text, buttons and statistics.</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {Object.entries(PAGE_KEYS).map(([key, label]) => (
          <li key={key}>
            <Link href={`/content/${key}`} className="block rounded-xl border border-slate-200 bg-white p-4 font-semibold hover:border-red-700/40">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
