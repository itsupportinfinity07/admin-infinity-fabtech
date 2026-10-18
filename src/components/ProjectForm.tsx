"use client";
import React, { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button, Card, Field, inputCls, ListEditor, Notice } from "@/components/ui";
import ImageManager from "@/components/ImageManager";
import RichTextEditor from "@/components/RichTextEditor";
import type { Place } from "@/components/LocationPicker";
import { deleteProject, saveProject, type ProjectInput } from "@/app/(dashboard)/projects/actions";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse rounded-xl bg-slate-100" />,
});

const TYPES = ["Industrial PEB Warehouse", "Government Industrial PEB", "Commercial Steel Structure", "Manufacturing Plant PEB", "Pharmaceutical Grade PEB", "Industrial Factory PEB"];

export default function ProjectForm({ initial, isNew }: { initial: ProjectInput & { place: Place }; isNew: boolean }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF((p) => ({ ...p, [k]: v })); setSaved(false); };

  function submit(status: "draft" | "published") {
    setError("");
    start(async () => {
      const res = await saveProject({ ...f, status }, isNew);
      if (!res.ok) return setError(res.error);
      setSaved(true);
      setF((p) => ({ ...p, status }));
      if (isNew) router.replace(`/projects/${res.slug}`);
      else router.refresh();
    });
  }

  function onPlace(p: Place) {
    setF((prev) => ({
      ...prev,
      place: p,
      locationLabel: prev.locationLabel && prev.locationLabel !== `${prev.place.city}, ${prev.place.state}, India`
        ? prev.locationLabel
        : [p.city, p.state, "India"].filter(Boolean).join(", "),
    }));
    setSaved(false);
  }

  function remove() {
    if (!confirm(`Delete “${f.name}” and its photos? This cannot be undone.`)) return;
    start(async () => {
      const res = await deleteProject(f.slug);
      if (!res.ok) return setError(res.error ?? "Delete failed");
      router.replace("/projects");
    });
  }

  return (
    <div className="space-y-5">
      <Card title="1 · Project info">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project name *" className="sm:col-span-2"><input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Client"><input className={inputCls} value={f.client} onChange={(e) => set("client", e.target.value)} /></Field>
          <Field label="Project type"><input list="project-types" className={inputCls} value={f.type} onChange={(e) => set("type", e.target.value)} />
            <datalist id="project-types">{TYPES.map((t) => <option key={t} value={t} />)}</datalist></Field>
          <Field label="Built-up area" hint="e.g. 55,000 sq.ft."><input className={inputCls} value={f.area} onChange={(e) => set("area", e.target.value)} /></Field>
          <Field label="Year completed"><input className={inputCls} value={f.year} onChange={(e) => set("year", e.target.value)} /></Field>
          <div className="sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Description *</span>
            <RichTextEditor value={f.description} onChange={(html) => set("description", html)} />
            <span className="mt-1 block text-xs text-slate-500">Use the toolbar for headings, bold text, lists and links. This is shown on the project page.</span>
          </div>
          <div className="sm:col-span-2"><ListEditor label="Highlights & performance" values={f.highlights} onChange={(v) => set("highlights", v)} /></div>
          <div className="sm:col-span-2"><ListEditor label="Engineering scope delivered" values={f.scope} onChange={(v) => set("scope", v)} /></div>
          {isNew && (
            <Field label="Page URL" hint="Leave blank to generate from the name. Cannot be changed later." className="sm:col-span-2">
              <input className={inputCls} value={f.slug} placeholder="auto" onChange={(e) => set("slug", e.target.value)} />
            </Field>
          )}
        </div>
      </Card>

      <Card title="2 · Location & map">
        <label className="mb-4 flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={f.showOnMap} onChange={(e) => set("showOnMap", e.target.checked)} />
          Show this project as a pin on the Projects map
        </label>
        <Field label="Location text shown on the project" hint="e.g. Mundra, Gujarat, India" className="mb-4">
          <input className={inputCls} value={f.locationLabel} onChange={(e) => set("locationLabel", e.target.value)} />
        </Field>
        {f.showOnMap && <LocationPicker value={f.place} onChange={onPlace} />}
      </Card>

      <Card title="3 · Site photos">
        <ImageManager images={f.images} coverId={f.coverImageId} onChange={(images, cover) => { setF((p) => ({ ...p, images, coverImageId: cover })); setSaved(false); }} />
      </Card>

      <Card title="4 · Publish">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
            <input type="checkbox" checked={f.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} />
            Feature on the home page
          </label>
          <Field label="SEO title" hint="Optional. Defaults to the project name."><input className={inputCls} maxLength={70} value={f.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} /></Field>
          <Field label="SEO description" hint="Optional. Defaults to the start of the description."><input className={inputCls} maxLength={170} value={f.seoDesc} onChange={(e) => set("seoDesc", e.target.value)} /></Field>
        </div>
      </Card>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-stone-100/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <Button onClick={() => submit("published")} disabled={pending}>{pending ? "Saving…" : f.status === "published" ? "Save & keep published" : "Publish"}</Button>
        <Button variant="secondary" onClick={() => submit("draft")} disabled={pending}>{f.status === "published" ? "Unpublish (save as draft)" : "Save draft"}</Button>
        {!isNew && <Button variant="danger" onClick={remove} disabled={pending} className="ml-auto">Delete</Button>}
        {error && <Notice kind="error">{error}</Notice>}
        {saved && !error && <Notice kind="success">Saved{f.status === "published" ? " and live on the website" : " as draft"}.</Notice>}
      </div>
    </div>
  );
}
