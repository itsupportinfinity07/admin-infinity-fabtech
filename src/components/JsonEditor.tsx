"use client";
import React, { useRef, useState } from "react";
import { Button, inputCls } from "@/components/ui";
import { compressAndUpload } from "@/components/ImageManager";
import { humanize } from "@/lib/utils";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

/** Same structure, with every leaf emptied. Used as the template for a new array item. */
export function blank(v: Json): Json {
  if (typeof v === "string") return "";
  if (typeof v === "number") return 0;
  if (typeof v === "boolean") return false;
  if (Array.isArray(v)) return [];
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)]));
  return "";
}

const IMAGE_KEYS = new Set(["image", "images", "src", "photo", "gallery"]);
const isImageField = (key: string, value: string) =>
  IMAGE_KEYS.has(key) || value.startsWith("/api/img/") || value.startsWith("/images/");

function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      onChange(`/api/img/${await compressAndUpload(file)}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    }
    setBusy(false);
  }
  return (
    <div className="flex items-center gap-3">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value.startsWith("/api/img/") ? value : ""} alt="" className="h-16 w-24 rounded-md border border-slate-200 bg-slate-100 object-cover" />
      ) : (
        <div className="h-16 w-24 rounded-md bg-slate-100" />
      )}
      <div className="space-y-1">
        <Button type="button" variant="secondary" disabled={busy} onClick={() => ref.current?.click()}>{busy ? "Uploading…" : value ? "Replace image" : "Upload image"}</Button>
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pick(e.target.files?.[0])} />
        {value && !value.startsWith("/api/img/") && <p className="text-xs text-amber-700">Old file path ({value}). Upload to replace.</p>}
        {err && <p className="text-xs text-red-700">{err}</p>}
      </div>
    </div>
  );
}

function Node({ name, value, onChange, depth }: { name: string; value: Json; onChange: (v: Json) => void; depth: number }) {
  const label = /^\d+$/.test(name) ? `#${Number(name) + 1}` : humanize(name);

  if (typeof value === "string") {
    if (isImageField(name, value)) return <Row label={label}><ImageField value={value} onChange={onChange} /></Row>;
    const long = value.length > 80 || value.includes("\n");
    return (
      <Row label={label}>
        {long ? (
          <textarea rows={Math.min(10, Math.max(3, Math.ceil(value.length / 90)))} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
        )}
      </Row>
    );
  }
  if (typeof value === "number")
    return <Row label={label}><input type="number" className={inputCls} value={value} onChange={(e) => onChange(Number(e.target.value))} /></Row>;
  if (typeof value === "boolean")
    return <Row label={label}><input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} /></Row>;
  if (value === null) return null;

  if (Array.isArray(value)) {
    const primitive = value.every((x) => typeof x === "string");
    const imageList = IMAGE_KEYS.has(name);
    return (
      <fieldset className={depth ? "rounded-lg border border-slate-200 p-3" : ""}>
        {depth > 0 && <legend className="px-1 text-xs font-bold uppercase tracking-wide text-slate-700">{label} ({value.length})</legend>}
        <div className="space-y-3">
          {value.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="min-w-0 flex-1 rounded-lg bg-slate-50 p-3">
                <Node name={primitive && !imageList ? String(i) : imageList ? "image" : String(i)} value={item} depth={depth + 1} onChange={(v) => onChange(value.map((x, idx) => (idx === i ? v : x)))} />
              </div>
              <div className="flex flex-col gap-1">
                <Button type="button" variant="secondary" className="px-2 py-0.5" onClick={() => { if (i > 0) { const n = [...value]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; onChange(n); } }}>↑</Button>
                <Button type="button" variant="secondary" className="px-2 py-0.5" onClick={() => { if (i < value.length - 1) { const n = [...value]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; onChange(n); } }}>↓</Button>
                <Button type="button" variant="danger" className="px-2 py-0.5" onClick={() => onChange(value.filter((_, idx) => idx !== i))}>✕</Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => onChange([...value, value.length ? blank(value[0]) : ""])}>+ Add</Button>
        </div>
      </fieldset>
    );
  }

  const entries = Object.entries(value);
  const stringMap = entries.length > 0 && entries.every(([, v]) => typeof v === "string") && name === "specifications";
  return (
    <fieldset className={depth ? "space-y-3 rounded-lg border border-slate-200 p-3" : "space-y-4"}>
      {depth > 0 && <legend className="px-1 text-xs font-bold uppercase tracking-wide text-slate-700">{label}</legend>}
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-start gap-2">
          <div className="min-w-0 flex-1"><Node name={k} value={v} depth={depth + 1} onChange={(nv) => onChange({ ...value, [k]: nv })} /></div>
          {stringMap && <Button type="button" variant="danger" className="mt-5 px-2 py-0.5" onClick={() => { const n = { ...value }; delete n[k]; onChange(n); }}>✕</Button>}
        </div>
      ))}
      {stringMap && (
        <Button type="button" variant="secondary" onClick={() => { const k = prompt("Name of the new field (e.g. Material)")?.trim(); if (k && !(k in value)) onChange({ ...value, [k]: "" }); }}>+ Add field</Button>
      )}
    </fieldset>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</span>
      {children}
    </div>
  );
}

export default function JsonEditor({ value, onChange }: { value: Record<string, Json>; onChange: (v: Record<string, Json>) => void }) {
  return <Node name="root" value={value} depth={0} onChange={(v) => onChange(v as Record<string, Json>)} />;
}
