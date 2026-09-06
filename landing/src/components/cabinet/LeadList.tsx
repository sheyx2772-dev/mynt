"use client";

import { Building2, Calendar, Download, Mail, Phone, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Lead } from "@/lib/cabinet/leads";
import { removeLead } from "@/app/(cabinet)/[locale]/cabinet/[handle]/leads/actions";

export default function LeadList({
  raqam,
  initialLeads,
  emptyTitle,
  emptyHint,
  downloadCsvLabel,
  deleteSuccessLabel,
}: {
  raqam: string;
  initialLeads: Lead[];
  emptyTitle: string;
  emptyHint: string;
  downloadCsvLabel: string;
  deleteSuccessLabel: string;
}) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    setDeletingId(id);
    const res = await removeLead(raqam, id);
    setDeletingId(null);
    if (res.ok) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast.success(deleteSuccessLabel);
    }
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border p-12 text-center">
        <Users className="size-10 text-muted-foreground" strokeWidth={1.5} />
        <p className="mt-3 text-base font-medium">{emptyTitle}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {emptyHint}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Jami: <strong className="font-semibold text-foreground">{leads.length}</strong> ta kontakt
        </span>
        <Button asChild variant="outline" size="sm">
          <a href={`/api/cabinet/${raqam}/leads/csv`} download={`${raqam}-kontaktlar.csv`}>
            <Download data-icon="inline-start" className="size-3.5" />
            {downloadCsvLabel}
          </a>
        </Button>
      </div>

      <div className="divide-y divide-border rounded-card border border-border bg-card">
        {leads.map((lead) => (
          <div key={lead.id} className="flex items-start justify-between gap-4 p-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{lead.ism}</span>
                {lead.manba && (
                  <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {lead.manba}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {lead.telefon && (
                  <a
                    href={`tel:${lead.telefon}`}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    <Phone className="size-3.5" />
                    <span>{lead.telefon}</span>
                  </a>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    <Mail className="size-3.5" />
                    <span>{lead.email}</span>
                  </a>
                )}
                {lead.kompaniya && (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="size-3.5" />
                    <span>{lead.kompaniya}</span>
                  </span>
                )}
              </div>

              {lead.izoh && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {lead.izoh}
                </p>
              )}

              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/80">
                <Calendar className="size-3" />
                <span>{lead.vaqt?.slice(0, 10)}</span>
              </span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={deletingId === lead.id}
              onClick={() => handleDelete(lead.id)}
              className="text-muted-foreground hover:text-destructive"
              title="O'chirish"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
