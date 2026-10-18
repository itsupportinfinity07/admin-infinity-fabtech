"use client";
import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, inputCls, Notice } from "@/components/ui";
import { createUser, removeUser } from "@/app/(dashboard)/users/actions";

export default function UsersManager({ users, me }: { users: { uid: string; email: string; role: string }[]; me: string }) {
  const router = useRouter();
  const [f, setF] = useState({ email: "", password: "", role: "editor" as "admin" | "editor" });
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="Accounts">
        <ul className="divide-y divide-slate-100">
          {users.map((u) => (
            <li key={u.uid} className="flex items-center justify-between py-3 text-sm">
              <span><span className="font-semibold">{u.email}</span> <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize">{u.role}</span></span>
              {u.uid !== me && <Button variant="danger" className="px-2 py-1 text-xs" disabled={pending} onClick={() => { if (confirm(`Remove ${u.email}?`)) start(async () => { const r = await removeUser(u.uid); if (!r.ok) setMsg({ kind: "error", text: r.error }); router.refresh(); }); }}>Remove</Button>}
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Add a user">
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); setMsg(null); start(async () => { const r = await createUser(f); if (!r.ok) return setMsg({ kind: "error", text: r.error }); setMsg({ kind: "success", text: "User created. Share the password securely." }); setF({ email: "", password: "", role: "editor" }); router.refresh(); }); }}>
          <Field label="Email"><input type="email" required className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Temporary password" hint="At least 10 characters."><input type="text" required minLength={10} className={inputCls} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="off" /></Field>
          <Field label="Role" hint="Editors can change content, projects and jobs. Admins can also manage users."><select className={inputCls} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as "admin" | "editor" })}><option value="editor">Editor</option><option value="admin">Admin</option></select></Field>
          <Button type="submit" disabled={pending}>Create user</Button>
          {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
        </form>
      </Card>
    </div>
  );
}
