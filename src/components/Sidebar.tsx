"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/locations", label: "Map locations" },
  { href: "/jobs", label: "Jobs" },
  { href: "/content", label: "Page content" },
  { href: "/products", label: "Products" },
  { href: "/services", label: "Services" },
  { href: "/testimonials", label: "Testimonials" },
];

export default function Sidebar({ email, role }: { email: string; role: string }) {
  const pathname = usePathname();
  // Enquiries hold customers' personal details, and Users manages accounts: admins only.
  const items =
    role === "admin"
      ? [links[0], { href: "/inquiries", label: "Enquiries" }, ...links.slice(1), { href: "/users", label: "Users" }]
      : links;

  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <aside className="flex w-full shrink-0 flex-col bg-stone-900 text-stone-200 lg:min-h-screen lg:w-60">
      <div className="px-5 py-5">
        <p className="text-lg font-black text-white">Infinity Fabtech</p>
        <p className="text-xs text-stone-400">Admin panel</p>
      </div>
      <nav className="flex flex-1 gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
        {items.map((l) => {
          const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
                active ? "bg-red-700 text-white" : "hover:bg-stone-800"
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-stone-800 px-5 py-4 text-xs">
        <p className="truncate text-stone-300">{email}</p>
        <p className="capitalize text-stone-500">{role}</p>
        <button onClick={logout} className="mt-2 font-semibold text-red-400 hover:text-red-300">Sign out</button>
      </div>
    </aside>
  );
}
