import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDocData } from "@/lib/db";
import type { Location, Project } from "@/lib/types";
import { toHtml } from "@/lib/richtext";
import ProjectForm from "@/components/ProjectForm";

export default async function EditProject({ params }: { params: Promise<{ slug: string }> }) {
  await requireUser();
  const { slug } = await params;
  const p = await getDocData<Project>("projects", slug);
  if (!p) notFound();
  const loc = p.locationId ? await getDocData<Location>("locations", p.locationId) : null;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-slate-900">Edit project</h1>
      <ProjectForm
        isNew={false}
        initial={{
          slug: p.slug, name: p.name, client: p.client, type: p.type, area: p.area, year: p.year,
          description: toHtml(p.description), highlights: p.highlights.length ? p.highlights : [""], scope: p.scope.length ? p.scope : [""],
          showOnMap: Boolean(loc), locationLabel: p.locationLabel,
          place: { city: loc?.city ?? "", state: loc?.state ?? "", lat: loc?.lat ?? null, lng: loc?.lng ?? null },
          coverImageId: p.coverImageId, images: p.images, isFeatured: p.isFeatured, status: p.status,
          seoTitle: p.seoTitle, seoDesc: p.seoDesc,
        }}
      />
    </div>
  );
}
