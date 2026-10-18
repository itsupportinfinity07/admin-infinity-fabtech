import { requireUser } from "@/lib/auth";
import ProjectForm from "@/components/ProjectForm";

export default async function NewProject() {
  await requireUser();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-slate-900">Add project</h1>
      <ProjectForm
        isNew
        initial={{
          slug: "", name: "", client: "", type: "", area: "", year: String(new Date().getFullYear()),
          description: "", highlights: [""], scope: [""], showOnMap: true, locationLabel: "",
          place: { city: "", state: "", lat: null, lng: null },
          coverImageId: "", images: [], isFeatured: false, status: "draft", seoTitle: "", seoDesc: "",
        }}
      />
    </div>
  );
}
