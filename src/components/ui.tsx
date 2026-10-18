"use client";
import React from "react";
import { cn } from "@/lib/utils";

export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-700/15 disabled:bg-slate-100";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-700">{error}</span>}
    </label>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  const styles = {
    primary: "bg-red-700 text-white hover:bg-red-800",
    secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
    danger: "border border-red-300 bg-white text-red-700 hover:bg-red-50",
    ghost: "text-slate-600 hover:bg-slate-100",
  }[variant];
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        styles,
        className
      )}
    />
  );
}

export function Card({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      {title && <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">{title}</h2>}
      {children}
    </section>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const color =
    status === "published" || status === "open"
      ? "bg-emerald-100 text-emerald-800"
      : status === "closed"
        ? "bg-slate-200 text-slate-700"
        : "bg-amber-100 text-amber-800";
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", color)}>{status}</span>;
}

export function Notice({ kind, children }: { kind: "error" | "success"; children: React.ReactNode }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg px-3 py-2 text-sm",
        kind === "error" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"
      )}
    >
      {children}
    </p>
  );
}

/** Edits a string[] (highlights, scope, responsibilities…): add, remove, reorder. */
export function ListEditor({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const set = (i: number, v: string) => onChange(values.map((x, idx) => (idx === i ? v : x)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= values.length) return;
    const next = [...values];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</span>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2">
            <textarea
              rows={2}
              value={v}
              placeholder={placeholder}
              onChange={(e) => set(i, e.target.value)}
              className={inputCls}
            />
            <div className="flex flex-col gap-1">
              <Button type="button" variant="secondary" className="px-2 py-0.5" onClick={() => move(i, -1)} aria-label="Move up">↑</Button>
              <Button type="button" variant="secondary" className="px-2 py-0.5" onClick={() => move(i, 1)} aria-label="Move down">↓</Button>
            </div>
            <Button type="button" variant="danger" className="self-start px-2" onClick={() => onChange(values.filter((_, idx) => idx !== i))} aria-label="Remove">✕</Button>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={() => onChange([...values, ""])}>+ Add</Button>
      </div>
    </div>
  );
}
