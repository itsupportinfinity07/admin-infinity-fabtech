"use client";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, inputCls, Notice } from "@/components/ui";
import { createItem } from "@/app/(dashboard)/content/actions";

export default function NewItem({ col }: { col: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        start(async () => {
          const res = await createItem(col, name.trim());
          if (!res.ok) return setError(res.error);
          router.push(`/${col}/${res.id}`);
        });
      }}
    >
      <input className={inputCls + " max-w-xs"} placeholder="Name of the new item" value={name} onChange={(e) => setName(e.target.value)} required />
      <Button type="submit" disabled={pending}>+ Add</Button>
      {error && <Notice kind="error">{error}</Notice>}
    </form>
  );
}
