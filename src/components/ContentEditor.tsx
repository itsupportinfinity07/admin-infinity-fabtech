"use client";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import JsonEditor from "@/components/JsonEditor";
import { Button, Notice } from "@/components/ui";
import { deleteItem, saveItem, savePage } from "@/app/(dashboard)/content/actions";

export default function ContentEditor({
  initial,
  target,
}: {
  initial: Record<string, never>;
  target: { kind: "page"; key: string } | { kind: "item"; col: string; id: string };
}) {
  const router = useRouter();
  const [data, setData] = useState<Record<string, never>>(initial);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [pending, start] = useTransition();

  function save() {
    setMsg(null);
    start(async () => {
      const res = target.kind === "page" ? await savePage(target.key, data) : await saveItem(target.col, target.id, data);
      setMsg(res.ok ? { kind: "success", text: "Saved. The website is updating." } : { kind: "error", text: res.error });
    });
  }
  function remove() {
    if (target.kind !== "item" || !confirm("Delete this item permanently?")) return;
    start(async () => { await deleteItem(target.col, target.id); router.replace(`/${target.col}`); });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <JsonEditor value={data} onChange={(v) => setData(v as Record<string, never>)} />
      </div>
      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-stone-100/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <Button onClick={save} disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
        {target.kind === "item" && <Button variant="danger" className="ml-auto" onClick={remove} disabled={pending}>Delete</Button>}
        {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      </div>
    </div>
  );
}
