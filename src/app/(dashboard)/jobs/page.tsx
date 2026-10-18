import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listDocs } from "@/lib/db";
import type { Job } from "@/lib/types";
import { StatusBadge } from "@/components/ui";

export default async function JobsPage() {
  await requireUser();
  const jobs = (await listDocs<Job>("jobs")).sort((a, b) => (b.postedAt ?? "").localeCompare(a.postedAt ?? ""));
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">Jobs</h1>
        <Link href="/jobs/new" className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">+ Post job</Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {jobs.length === 0 && <p className="p-6 text-sm text-slate-500">No jobs yet.</p>}
        <ul className="divide-y divide-slate-100">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link href={`/jobs/${j.id}`} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900">{j.title}</p>
                  <p className="truncate text-xs text-slate-500">{j.department} · {j.location} · {j.type}{j.closesAt ? ` · closes ${j.closesAt}` : ""}</p>
                </div>
                {j.status === "open" && j.closesAt && j.closesAt < today && <span className="text-xs font-semibold text-amber-700">Expired</span>}
                <StatusBadge status={j.status} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
