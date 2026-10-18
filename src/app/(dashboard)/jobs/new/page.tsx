import { requireUser } from "@/lib/auth";
import JobForm from "@/components/JobForm";

export default async function NewJob() {
  await requireUser();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-slate-900">Post a job</h1>
      <JobForm isNew initial={{ slug: "", title: "", department: "", location: "Indore, M.P.", type: "Full-time", experience: "", summary: "", responsibilities: [""], requirements: [""], status: "draft", closesAt: "" }} />
    </div>
  );
}
