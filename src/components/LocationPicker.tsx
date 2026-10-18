"use client";
import React, { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Button, inputCls } from "@/components/ui";

export interface Place {
  city: string;
  state: string;
  lat: number | null;
  lng: number | null;
}

const pin = L.divIcon({
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  html: '<div style="width:28px;height:28px;border-radius:9999px;background:#b91c1c;border:3px solid #fff;box-shadow:0 0 0 3px rgba(185,28,28,.3),0 2px 6px rgba(0,0,0,.4)"></div>',
});

function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function Recenter({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat !== null && lng !== null) map.flyTo([lat, lng], Math.max(map.getZoom(), 9), { duration: 0.6 });
  }, [lat, lng, map]);
  return null;
}

interface NominatimHit {
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
}

function cityOf(a: Record<string, string> = {}) {
  return a.city || a.town || a.village || a.municipality || a.suburb || a.county || a.state_district || "";
}

export default function LocationPicker({ value, onChange }: { value: Place; onChange: (p: Place) => void }) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<NominatimHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState("");

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setMsg("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=in&q=${encodeURIComponent(query)}`
      );
      const json = (await res.json()) as NominatimHit[];
      setHits(json);
      if (!json.length) setMsg("No match. Try a nearby city, or click the map to place the pin.");
    } catch {
      setMsg("Search failed. You can still click the map to place the pin.");
    }
    setSearching(false);
  }

  async function reverse(lat: number, lng: number) {
    // Drop the pin immediately, then try to fill in city/state.
    onChange({ ...value, lat, lng });
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`
      );
      const j = (await res.json()) as NominatimHit;
      onChange({ city: cityOf(j.address) || value.city, state: j.address?.state || value.state, lat, lng });
    } catch {
      /* keep manual city/state */
    }
  }

  function choose(h: NominatimHit) {
    onChange({ city: cityOf(h.address), state: h.address?.state ?? "", lat: Number(h.lat), lng: Number(h.lon) });
    setHits([]);
  }

  const center: [number, number] = value.lat !== null && value.lng !== null ? [value.lat, value.lng] : [22.9734, 78.6569];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
          placeholder="Search a town or city, e.g. Pithampur"
          className={inputCls}
        />
        <Button type="button" variant="secondary" onClick={search} disabled={searching}>{searching ? "…" : "Search"}</Button>
      </div>
      {msg && <p className="text-xs text-slate-500">{msg}</p>}
      {hits.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 shadow-sm">
          {hits.map((h, i) => (
            <li key={i}>
              <button type="button" onClick={() => choose(h)} className="w-full px-3 py-2 text-left text-slate-900 hover:bg-red-50">{h.display_name}</button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative z-0 h-80 overflow-hidden rounded-xl border border-slate-300">
        <MapContainer center={center} zoom={value.lat !== null ? 9 : 5} className="h-full w-full" scrollWheelZoom>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickToPlace onPick={reverse} />
          <Recenter lat={value.lat} lng={value.lng} />
          {value.lat !== null && value.lng !== null && (
            <Marker
              position={[value.lat, value.lng]}
              icon={pin}
              draggable
              eventHandlers={{ dragend: (e) => { const p = (e.target as L.Marker).getLatLng(); reverse(p.lat, p.lng); } }}
            />
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-slate-500">Click the map or drag the pin to fine-tune. Multiple projects in the same city share one pin.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold uppercase text-slate-600">City
          <input value={value.city} onChange={(e) => onChange({ ...value, city: e.target.value })} className={inputCls + " mt-1 font-normal normal-case"} />
        </label>
        <label className="block text-xs font-semibold uppercase text-slate-600">State
          <input value={value.state} onChange={(e) => onChange({ ...value, state: e.target.value })} className={inputCls + " mt-1 font-normal normal-case"} />
        </label>
      </div>
      <p className="text-xs text-slate-500">
        Coordinates: {value.lat !== null ? `${value.lat.toFixed(4)}, ${value.lng?.toFixed(4)}` : "not set"}
      </p>
    </div>
  );
}
