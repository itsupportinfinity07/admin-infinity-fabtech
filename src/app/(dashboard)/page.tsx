import Link from "next/link";
import { db } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui";

async function count(col: string, where?: [string, string]) {
  let q: FirebaseFirestore.Query = db().collection(col);
  if (where) q = q.where(where[0], "==", where[1]);
  return (await q.count().get()).data().count;
}

export default async function Dashboard() {
  const user = await requireUser();
  const isAdmin = user.role === "admin";
  const [projects, drafts, jobs, locations, inquiries] = await Promise.all([
    count("projects"),
    count("projects", ["status", "draft"]),
    count("jobs", ["status", "open"]),
    count("locations"),
    isAdmin ? count("inquiries", ["status", "new"]) : Promise.resolve(0),
  ]);
  const stats = [
    { label: "Projects", value: projects, sub: `${drafts} draft`, href: "/projects" },
    { label: "Map locations", value: locations, sub: "pins on the map", href: "/locations" },
    { label: "Open jobs", value: jobs, sub: "visible on Careers", href: "/jobs" },
    ...(isAdmin ? [{ label: "New enquiries", value: inquiries, sub: "from the website", href: "/inquiries" }] : []),
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition hover:border-red-700/40">
              <p className="text-xs font-semibold uppercase text-slate-500">{s.label}</p>
              <p className="mt-1 text-3xl font-black text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.sub}</p>
            </Card>
          </Link>
        ))}
      </div>
      <Card title="Quick actions">
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          <Link href="/projects/new" className="rounded-lg bg-red-700 px-4 py-2 text-white">+ Add project</Link>
          <Link href="/jobs/new" className="rounded-lg border border-slate-300 px-4 py-2">+ Post job</Link>
          <Link href="/content" className="rounded-lg border border-slate-300 px-4 py-2">Edit page content</Link>
        </div>
      </Card>
    </div>
  );
}
