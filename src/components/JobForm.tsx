"use client";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, inputCls, ListEditor, Notice } from "@/components/ui";
import { deleteJob, saveJob, type JobInput } from "@/app/(dashboard)/jobs/actions";

export default function JobForm({ initial, isNew }: { initial: JobInput; isNew: boolean }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [pending, start] = useTransition();
  const set = <K extends keyof JobInput>(k: K, v: JobInput[K]) => { setF((p) => ({ ...p, [k]: v })); setSaved(""); };

  function submit(status: JobInput["status"]) {
    setError("");
    start(async () => {
      const res = await saveJob({ ...f, status }, isNew);
      if (!res.ok) return setError(res.error);
      setF((p) => ({ ...p, status }));
      setSaved(status === "open" ? "Published: live on the Careers page." : status === "closed" ? "Closed: removed from the Careers page." : "Saved as draft.");
      if (isNew) router.replace(`/jobs/${res.slug}`);
      else router.refresh();
    });
  }

  function remove() {
    if (!confirm(`Delete “${f.title}”?`)) return;
    start(async () => { await deleteJob(f.slug); router.replace("/jobs"); });
  }

  return (
    <div className="space-y-5">
      <Card title="Job details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job title *" className="sm:col-span-2"><input className={inputCls} value={f.title} onChange={(e) => set("title", e.target.value)} /></Field>
          <Field label="Department *"><input list="depts" className={inputCls} value={f.department} onChange={(e) => set("department", e.target.value)} />
            <datalist id="depts">{["Engineering", "Projects", "Sales", "Production", "Accounts", "HR"].map((d) => <option key={d} value={d} />)}</datalist></Field>
          <Field label="Location *"><input className={inputCls} placeholder="Indore, M.P." value={f.location} onChange={(e) => set("location", e.target.value)} /></Field>
          <Field label="Employment type *"><select className={inputCls} value={f.type} onChange={(e) => set("type", e.target.value)}>
            <option value="">Select…</option>{["Full-time", "Part-time", "Contract", "Internship"].map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Experience"><input className={inputCls} placeholder="2–5 years" value={f.experience} onChange={(e) => set("experience", e.target.value)} /></Field>
          <Field label="Short summary *" hint="Shown in the job list." className="sm:col-span-2"><textarea rows={2} maxLength={400} className={inputCls} value={f.summary} onChange={(e) => set("summary", e.target.value)} /></Field>
          <div className="sm:col-span-2"><ListEditor label="Responsibilities" values={f.responsibilities} onChange={(v) => set("responsibilities", v)} /></div>
          <div className="sm:col-span-2"><ListEditor label="Requirements" values={f.requirements} onChange={(v) => set("requirements", v)} /></div>
          <Field label="Closing date" hint="Optional. The job disappears from Careers after this date."><input type="date" className={inputCls} value={f.closesAt} onChange={(e) => set("closesAt", e.target.value)} /></Field>
        </div>
      </Card>
      <p className="text-xs text-slate-500">Applicants use the “Apply” button on the website, which opens an email to the company address.</p>
      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-stone-100/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <Button onClick={() => submit("open")} disabled={pending}>{f.status === "open" ? "Save changes" : "Publish job"}</Button>
        <Button variant="secondary" onClick={() => submit("draft")} disabled={pending}>Save draft</Button>
        {f.status === "open" && <Button variant="secondary" onClick={() => submit("closed")} disabled={pending}>Close job</Button>}
        {!isNew && <Button variant="danger" onClick={remove} disabled={pending} className="ml-auto">Delete</Button>}
        {error && <Notice kind="error">{error}</Notice>}
        {saved && !error && <Notice kind="success">{saved}</Notice>}
      </div>
    </div>
  );
}
