"use client";
import React, { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button, Card, ListEditor, Notice } from "@/components/ui";
import type { Place } from "@/components/LocationPicker";
import type { Location } from "@/lib/types";
import { deleteLocation, saveLocation } from "@/app/(dashboard)/locations/actions";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), { ssr: false, loading: () => <div className="h-80 animate-pulse rounded-xl bg-slate-100" /> });

type Row = Location & { projectCount: number };
const empty: Location = { id: "", city: "", state: "", lat: 0, lng: 0, showOnMap: true, legacyClients: [] };

export default function LocationsManager({ locations }: { locations: Row[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<string>("");
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Location>(empty);
  const [place, setPlace] = useState<Place>({ city: "", state: "", lat: null, lng: null });
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [pending, start] = useTransition();

  function open(l: Row | null) {
    setMsg(null);
    if (l) { setSel(l.id); setIsNew(false); setForm(l); setPlace({ city: l.city, state: l.state, lat: l.lat, lng: l.lng }); }
    else { setSel("__new"); setIsNew(true); setForm(empty); setPlace({ city: "", state: "", lat: null, lng: null }); }
  }

  function save() {
    setMsg(null);
    start(async () => {
      const res = await saveLocation({ ...form, city: place.city, state: place.state, lat: place.lat ?? NaN, lng: place.lng ?? NaN }, isNew);
      if (!res.ok) return setMsg({ kind: "error", text: res.error.includes("expected number") ? "Place the pin on the map." : res.error });
      setMsg({ kind: "success", text: "Saved." });
      setSel(res.id); setIsNew(false);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm("Delete this location?")) return;
    start(async () => {
      const res = await deleteLocation(form.id);
      if (!res.ok) return setMsg({ kind: "error", text: res.error });
      setSel(""); router.refresh();
    });
  }

  const current = locations.find((l) => l.id === sel);

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <Button className="mb-3 w-full" onClick={() => open(null)}>+ Add location</Button>
        <ul className="max-h-[70vh] space-y-1 overflow-y-auto">
          {locations.map((l) => (
            <li key={l.id}>
              <button onClick={() => open(l)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 ${sel === l.id ? "bg-slate-100 font-bold" : ""}`}>
                <span>{l.city}<span className="block text-xs font-normal text-slate-500">{l.state}</span></span>
                <span className="text-xs text-slate-500">{l.projectCount} proj · {l.legacyClients.length} clients{!l.showOnMap && " · hidden"}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <div className="space-y-4 lg:col-span-2">
        {sel ? (
          <Card title={isNew ? "New location" : `Edit ${current?.city ?? ""}`}>
            <div className="space-y-4">
              <LocationPicker value={place} onChange={setPlace} />
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={form.showOnMap} onChange={(e) => setForm({ ...form, showOnMap: e.target.checked })} /> Show pin on the map
              </label>
              <ListEditor label="Other clients served here (not listed as projects)" values={form.legacyClients} onChange={(v) => setForm({ ...form, legacyClients: v })} placeholder="e.g. Flexi Flex, Indore (2015)" />
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={save} disabled={pending}>{pending ? "Saving…" : "Save location"}</Button>
                {!isNew && <Button variant="danger" onClick={remove} disabled={pending}>Delete</Button>}
                {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
              </div>
            </div>
          </Card>
        ) : (
          <p className="text-sm text-slate-500">Select a location to edit it, or add a new one. Projects you add on the Projects page create their city&apos;s pin automatically.</p>
        )}
      </div>
    </div>
  );
}
