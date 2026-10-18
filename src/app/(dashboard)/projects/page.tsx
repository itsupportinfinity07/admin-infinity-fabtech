import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listDocs } from "@/lib/db";
import type { Project } from "@/lib/types";
import { StatusBadge } from "@/components/ui";

export default async function ProjectsPage() {
  await requireUser();
  const projects = (await listDocs<Project>("projects")).sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">Projects</h1>
        <Link href="/projects/new" className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">+ Add project</Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {projects.length === 0 && <p className="p-6 text-sm text-slate-500">No projects yet.</p>}
        <ul className="divide-y divide-slate-100">
          {projects.map((p) => (
            <li key={p.id}>
              <Link href={`/projects/${p.id}`} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.coverImageId ? <img src={`/api/img/${p.coverImageId}`} alt="" className="h-14 w-20 rounded-md object-cover" /> : <div className="h-14 w-20 rounded-md bg-slate-200" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900">{p.name}</p>
                  <p className="truncate text-xs text-slate-500">{p.locationLabel || "No location"} · {p.year} · {p.images.length} photos{p.locationId ? " · on map" : ""}</p>
                </div>
                {p.isFeatured && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">Featured</span>}
                <StatusBadge status={p.status} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
