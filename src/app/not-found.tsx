import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-5xl font-black text-slate-300">404</p>
      <p className="text-sm text-slate-600">That page or item could not be found.</p>
      <Link href="/" className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white">Back to dashboard</Link>
    </div>
  );
}
