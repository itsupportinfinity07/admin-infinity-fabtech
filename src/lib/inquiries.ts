import "server-only";
import { listDocs } from "@/lib/db";

export interface Inquiry {
  id: string; source: string; name: string; company: string; phone: string; email: string;
  productRequirement: string; otherRequirement?: string; location?: string; message: string;
  status: string; createdAt: string;
}

export interface InquiryFilter { status?: string; from?: string; to?: string }

/** Newest first. `from` / `to` are yyyy-mm-dd (inclusive, in IST). */
export async function getInquiries(f: InquiryFilter = {}): Promise<Inquiry[]> {
  const all = await listDocs<Omit<Inquiry, "id">>("inquiries");
  const day = (iso: string) => new Date(new Date(iso).getTime() + 5.5 * 3600_000).toISOString().slice(0, 10);
  return all
    .filter((q) => !f.status || f.status === "all" || q.status === f.status)
    .filter((q) => !f.from || (q.createdAt && day(q.createdAt) >= f.from))
    .filter((q) => !f.to || (q.createdAt && day(q.createdAt) <= f.to))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export const EXPORT_COLUMNS = [
  "Date (IST)", "Source", "Name", "Company", "Phone", "Email", "Requirement", "Other requirement", "Site location", "Message", "Status",
] as const;

export function toRow(q: Inquiry): string[] {
  const when = q.createdAt
    ? new Date(q.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })
    : "";
  return [when, q.source, q.name, q.company, q.phone, q.email, q.productRequirement, q.otherRequirement ?? "", q.location ?? "", q.message, q.status];
}
