"use client";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, StatusBadge } from "@/components/ui";
import { deleteInquiry, setInquiryStatus } from "@/app/(dashboard)/inquiries/actions";

export interface InquiryView {
  id: string; source: string; name: string; company: string; phone: string; email: string;
  productRequirement: string; otherRequirement?: string; location?: string; message: string;
  status: string; createdAt: string;
}

export default function InquiryRow({ q }: { q: InquiryView }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const when = q.createdAt ? new Date(q.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "";
  const set = (s: "new" | "read" | "replied") => start(async () => { await setInquiryStatus(q.id, s); router.refresh(); });

  return (
    <li className="p-4">
      <button
        className="flex w-full items-center gap-3 text-left"
        onClick={() => { setOpen(!open); if (!open && q.status === "new") set("read"); }}
      >
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${q.status === "new" ? "bg-red-600" : "bg-transparent"}`} aria-label={q.status === "new" ? "Unread" : ""} />
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm ${q.status === "new" ? "font-black" : "font-semibold"} text-slate-900`}>{q.name} · {q.company}</p>
          <p className="truncate text-xs text-slate-500">{q.message}</p>
        </div>
        <span className="hidden text-xs capitalize text-slate-500 sm:block">{q.source}</span>
        <span className="hidden text-xs text-slate-500 md:block">{when}</span>
        <StatusBadge status={q.status === "replied" ? "published" : q.status === "read" ? "closed" : "draft"} />
      </button>
      {open && (
        <div className="mt-3 space-y-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-800">
          <dl className="grid gap-2 sm:grid-cols-2">
            <div><dt className="text-xs font-semibold uppercase text-slate-500">Phone</dt><dd><a className="text-red-700 underline" href={`tel:${q.phone}`}>{q.phone}</a></dd></div>
            <div><dt className="text-xs font-semibold uppercase text-slate-500">Email</dt><dd><a className="text-red-700 underline" href={`mailto:${q.email}`}>{q.email}</a></dd></div>
            <div><dt className="text-xs font-semibold uppercase text-slate-500">Requirement</dt><dd>{q.productRequirement}{q.otherRequirement ? ` (${q.otherRequirement})` : ""}</dd></div>
            {q.location && <div><dt className="text-xs font-semibold uppercase text-slate-500">Site location</dt><dd>{q.location}</dd></div>}
            <div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase text-slate-500">Message</dt><dd className="whitespace-pre-wrap">{q.message}</dd></div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={pending} onClick={() => set("replied")}>Mark as replied</Button>
            <Button variant="secondary" disabled={pending} onClick={() => set("new")}>Mark as unread</Button>
            <Button variant="danger" disabled={pending} className="ml-auto" onClick={() => { if (confirm("Delete this enquiry?")) start(async () => { await deleteInquiry(q.id); router.refresh(); }); }}>Delete</Button>
          </div>
        </div>
      )}
    </li>
  );
}
