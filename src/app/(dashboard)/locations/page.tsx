import { requireUser } from "@/lib/auth";
import { listDocs } from "@/lib/db";
import type { Location, Project } from "@/lib/types";
import LocationsManager from "@/components/LocationsManager";

export default async function LocationsPage() {
  await requireUser();
  const [locations, projects] = await Promise.all([listDocs<Location>("locations"), listDocs<Project>("projects")]);
  const rows = locations
    .map((l) => ({ ...l, projectCount: projects.filter((p) => p.locationId === l.id).length }))
    .sort((a, b) => a.city.localeCompare(b.city));
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-slate-900">Map locations</h1>
      <p className="text-sm text-slate-600">Every pin on the Projects map. Each pin shows the projects built there plus any other clients you list.</p>
      <LocationsManager locations={rows} />
    </div>
  );
}
