"use client";
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { Button, Field, inputCls, Notice } from "@/components/ui";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      const cred = await signInWithEmailAndPassword(
        clientAuth(),
        String(form.get("email")),
        String(form.get("password"))
      );
      // Force-refresh so the role custom claim is in the token.
      const idToken = await cred.user.getIdToken(true);
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        // A proxy or crashed server can answer with an HTML page instead of JSON.
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `Sign-in failed (server responded ${res.status}).`);
      }
      window.location.href = "/";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      setError(msg.includes("auth/") ? "Incorrect email or password." : msg);
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900">Infinity Fabtech</h1>
          <p className="text-sm text-slate-500">Admin sign in</p>
        </div>
        {error && <Notice kind="error">{error}</Notice>}
        <Field label="Email">
          <input name="email" type="email" required autoComplete="username" className={inputCls} />
        </Field>
        <Field label="Password">
          <input name="password" type="password" required autoComplete="current-password" className={inputCls} />
        </Field>
        <Button type="submit" disabled={busy} className="w-full">{busy ? "Signing in…" : "Sign in"}</Button>
      </form>
    </main>
  );
}
