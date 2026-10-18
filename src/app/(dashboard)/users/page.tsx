import { requireUser } from "@/lib/auth";
import { adminAuth } from "@/lib/firebase/admin";
import UsersManager from "@/components/UsersManager";

export default async function UsersPage() {
  const me = await requireUser("admin");
  const list = await adminAuth().listUsers(100);
  const users = list.users
    .filter((u) => u.customClaims?.role)
    .map((u) => ({ uid: u.uid, email: u.email ?? "", role: String(u.customClaims?.role) }));
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-slate-900">Users</h1>
      <UsersManager users={users} me={me.uid} />
    </div>
  );
}
