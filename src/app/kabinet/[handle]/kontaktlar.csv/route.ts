import { getUser } from "@/lib/auth";
import { listLeads } from "@/lib/leads";
import { parseHandle } from "@/lib/pricing";

// A list you cannot get out of is a list you do not trust with anything that
// matters, so the contacts collected are exportable from the first day rather
// than as a later feature.
//
// The file is built from the same ownership-filtered read as the panel, so the
// route needs no separate authorization: a handle the signed-in user does not
// own returns nothing to export.

function csvCell(value: string | null): string {
  const text = value ?? "";
  // A leading =, +, - or @ makes a spreadsheet treat the cell as a formula,
  // and these cells hold text a stranger typed. Prefixing an apostrophe keeps
  // Excel from executing what somebody wrote in a name field.
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ handle: string }> },
) {
  const user = await getUser();
  if (!user) return new Response("Kirish kerak", { status: 401 });

  const { handle } = await ctx.params;
  const parsed = parseHandle(handle);
  if (!parsed) return new Response("Topilmadi", { status: 404 });

  const normalized = `${parsed.letters}${parsed.digits}`;
  const leads = await listLeads(normalized, user.id);

  const header = ["Ism", "Telefon", "Email", "Kompaniya", "Izoh", "Manba", "Sana"];
  const rows = leads.map((lead) =>
    [
      lead.name,
      lead.phone,
      lead.email,
      lead.company,
      lead.note,
      lead.source,
      lead.createdAt.slice(0, 10),
    ]
      .map(csvCell)
      .join(","),
  );

  // Excel reads a CSV as the system codepage unless the file says otherwise,
  // and without the byte order mark every o‘ and ʻ in an Uzbek name arrives
  // broken.
  const body = "﻿" + [header.map(csvCell).join(","), ...rows].join("\r\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${normalized}-kontaktlar.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
