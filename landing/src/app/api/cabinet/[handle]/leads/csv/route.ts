import { listLeads } from "@/lib/cabinet/leads";
import { normalize, ownedHandle } from "@/lib/cabinet/handles";
import { requireAccount } from "@/lib/cabinet/session";

function csvCell(value: string | null | undefined): string {
  const text = value ?? "";
  // Guard against spreadsheet formula injection (=, +, -, @)
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
}

// Exports all collected leads for this handle as an Excel-compatible CSV.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  try {
    await requireAccount();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const { handle } = await params;
  const raqam = normalize(handle);
  if (!raqam) {
    return new Response("Not found", { status: 404 });
  }

  const owned = await ownedHandle(raqam);
  if (!owned) {
    return new Response("Not found", { status: 404 });
  }

  const leads = await listLeads(raqam);

  const header = ["Ism", "Telefon", "Email", "Kompaniya", "Izoh", "Manba", "Sana"];
  const rows = leads.map((lead) =>
    [
      lead.ism,
      lead.telefon,
      lead.email,
      lead.kompaniya,
      lead.izoh,
      lead.manba,
      lead.vaqt?.slice(0, 10),
    ]
      .map(csvCell)
      .join(","),
  );

  // UTF-8 BOM ensures Cyrillic / Uzbek letters render correctly in Microsoft Excel
  const body = "\uFEFF" + [header.map(csvCell).join(","), ...rows].join("\r\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${raqam}-kontaktlar.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
