import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getInquiries } from "@/lib/inquiries";
import InquiryRow from "@/components/InquiryRow";
import { inputCls } from "@/components/ui";

type SP = { status?: string; from?: string; to?: string };

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser("admin");
  const sp = await searchParams;
  const items = await getInquiries(sp);
  const unread = items.filter((i) => i.status === "new").length;
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString();
  const exportHref = (format: string) => `/api/inquiries/export?format=${format}${qs ? `&${qs}` : ""}`;
  const btn = "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Enquiries</h1>
          <p className="text-sm text-slate-600">Messages from the Contact and Request-a-Quote forms. Visible to admins only. {items.length} shown, {unread} unread.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={exportHref("xlsx")} className={btn} download>Download Excel (.xlsx)</a>
          <a href={exportHref("csv")} className={btn} download>Download CSV</a>
          <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className={btn} title="Opens a blank Google Sheet. Then use File > Import > Upload and pick the downloaded CSV or Excel file.">Open Google Sheets ↗</a>
        </div>
      </div>
      <p className="text-xs text-slate-500">For Google Sheets: download the Excel or CSV file, then in a new Sheet choose File &gt; Import &gt; Upload. The download follows the filters below.</p>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <label className="text-xs font-semibold uppercase text-slate-600">Status
          <select name="status" defaultValue={sp.status ?? "all"} className={inputCls + " mt-1 font-normal normal-case"}>
            <option value="all">All</option><option value="new">Unread</option><option value="read">Read</option><option value="replied">Replied</option>
          </select>
        </label>
        <label className="text-xs font-semibold uppercase text-slate-600">From
          <input type="date" name="from" defaultValue={sp.from} className={inputCls + " mt-1 font-normal"} />
        </label>
        <label className="text-xs font-semibold uppercase text-slate-600">To
          <input type="date" name="to" defaultValue={sp.to} className={inputCls + " mt-1 font-normal"} />
        </label>
        <button className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">Apply</button>
        <Link href="/inquiries" className="px-2 py-2 text-sm text-slate-600 underline">Clear</Link>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {items.length === 0 && <p className="p-6 text-sm text-slate-500">No enquiries match.</p>}
        <ul className="divide-y divide-slate-100">{items.map((q) => <InquiryRow key={q.id} q={q} />)}</ul>
      </div>
    </div>
  );
}
