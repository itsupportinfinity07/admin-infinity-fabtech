import ExcelJS from "exceljs";
import { getApiUser } from "@/lib/auth";
import { EXPORT_COLUMNS, getInquiries, toRow } from "@/lib/inquiries";

export const runtime = "nodejs";

/** Cells starting with = + - @ are formulas in Excel/Sheets. Neutralise them (CSV injection). */
const safe = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
const csvCell = (v: string) => `"${safe(v).replace(/"/g, '""')}"`;

export async function GET(req: Request) {
  // Enquiries contain customers' personal details: admins only.
  const user = await getApiUser("admin");
  if (!user) return new Response("Forbidden", { status: 403 });

  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const rows = await getInquiries({
    status: url.searchParams.get("status") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `infinity-fabtech-enquiries-${stamp}.${format}`;

  if (format === "csv") {
    const lines = [EXPORT_COLUMNS.map(csvCell).join(","), ...rows.map((q) => toRow(q).map(csvCell).join(","))];
    // BOM so Excel and Google Sheets read the file as UTF-8.
    return new Response("﻿" + lines.join("\r\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Enquiries", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = EXPORT_COLUMNS.map((header, i) => ({ header, key: String(i), width: [20, 10, 22, 26, 16, 30, 22, 22, 24, 70, 10][i] }));
  rows.forEach((q) => ws.addRow(toRow(q)));
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB91C1C" } };
  ws.getColumn(10).alignment = { wrapText: true, vertical: "top" };
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: EXPORT_COLUMNS.length } };

  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
