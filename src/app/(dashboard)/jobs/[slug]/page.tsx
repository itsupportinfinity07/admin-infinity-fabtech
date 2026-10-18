import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDocData } from "@/lib/db";
import type { Job } from "@/lib/types";
import JobForm from "@/components/JobForm";

export default async function EditJob({ params }: { params: Promise<{ slug: string }> }) {
  await requireUser();
  const { slug } = await params;
  const j = await getDocData<Job>("jobs", slug);
  if (!j) notFound();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-slate-900">Edit job</h1>
      <JobForm isNew={false} initial={{
        slug: j.slug, title: j.title, department: j.department, location: j.location, type: j.type, experience: j.experience,
        summary: j.summary, responsibilities: j.responsibilities.length ? j.responsibilities : [""], requirements: j.requirements.length ? j.requirements : [""],
        status: j.status, closesAt: j.closesAt ?? "",
      }} />
    </div>
  );
}
