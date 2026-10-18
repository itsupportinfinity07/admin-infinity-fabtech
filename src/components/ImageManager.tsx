"use client";
import React, { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, inputCls, Notice } from "@/components/ui";
import type { ImageRef } from "@/lib/types";

const MAX_BYTES = 600 * 1024;

export async function compressAndUpload(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error(`${file.name}: use JPG, PNG or WebP.`);
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: 1600,
    maxSizeMB: MAX_BYTES / (1024 * 1024),
    fileType: "image/webp",
    initialQuality: 0.82,
    useWebWorker: true,
  });
  if (compressed.size > MAX_BYTES * 1.2) throw new Error(`${file.name}: still too large after compression.`);

  const bitmap = await createImageBitmap(compressed);
  const buf = new Uint8Array(await compressed.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));

  const res = await fetch("/api/images", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ data: btoa(bin), mime: "image/webp", width: bitmap.width, height: bitmap.height }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${file.name}: ${json.error ?? "upload failed"}`);
  return json.id as string;
}

function Thumb({
  img,
  isCover,
  onAlt,
  onCover,
  onRemove,
}: {
  img: ImageRef;
  isCover: boolean;
  onAlt: (v: string) => void;
  onCover: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: img.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="overflow-hidden rounded-lg border border-slate-200 bg-white"
    >
      <div {...attributes} {...listeners} className="relative aspect-[4/3] cursor-grab bg-slate-100 active:cursor-grabbing" title="Drag to reorder">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/img/${img.id}`} alt={img.alt} className="h-full w-full object-cover" draggable={false} />
        {isCover && <span className="absolute left-2 top-2 rounded bg-red-700 px-2 py-0.5 text-xs font-bold text-white">Cover</span>}
      </div>
      <div className="space-y-2 p-2">
        <input value={img.alt} onChange={(e) => onAlt(e.target.value)} placeholder="Alt text (describe the photo)" className={inputCls} />
        <div className="flex gap-2">
          {!isCover && <Button type="button" variant="secondary" className="flex-1 px-2 py-1 text-xs" onClick={onCover}>Make cover</Button>}
          <Button type="button" variant="danger" className="px-2 py-1 text-xs" onClick={onRemove}>Remove</Button>
        </div>
      </div>
    </div>
  );
}

export default function ImageManager({
  images,
  coverId,
  onChange,
}: {
  images: ImageRef[];
  coverId: string;
  onChange: (images: ImageRef[], coverId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  async function addFiles(files: FileList | File[]) {
    setBusy(true);
    setError("");
    const added: ImageRef[] = [];
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      try {
        added.push({ id: await compressAndUpload(file), alt: "" });
      } catch (e) {
        errors.push(e instanceof Error ? e.message : "Upload failed");
      }
    }
    if (added.length) {
      const next = [...images, ...added];
      onChange(next, coverId || next[0].id);
    }
    if (errors.length) setError(errors.join(" "));
    setBusy(false);
  }

  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const from = images.findIndex((i) => i.id === e.active.id);
    const to = images.findIndex((i) => i.id === e.over!.id);
    onChange(arrayMove(images, from, to), coverId);
  }

  function remove(id: string) {
    const next = images.filter((i) => i.id !== id);
    onChange(next, coverId === id ? (next[0]?.id ?? "") : coverId);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center"
      >
        <p className="text-sm text-slate-600">Drag photos here, or</p>
        <Button type="button" variant="secondary" className="mt-2" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? "Compressing & uploading…" : "Choose photos"}
        </Button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
        <p className="mt-2 text-xs text-slate-500">Photos are resized to 1600 px and compressed to about 600 KB each automatically.</p>
      </div>
      {error && <Notice kind="error">{error}</Notice>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {images.map((img) => (
              <Thumb
                key={img.id}
                img={img}
                isCover={img.id === coverId}
                onAlt={(alt) => onChange(images.map((i) => (i.id === img.id ? { ...i, alt } : i)), coverId)}
                onCover={() => onChange(images, img.id)}
                onRemove={() => remove(img.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {images.length === 0 && <p className="text-sm text-slate-500">No photos yet. The first photo you add becomes the cover.</p>}
    </div>
  );
}
