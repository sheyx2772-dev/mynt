"use client";

import { ArrowRight, Clock, Send, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Transfer } from "@/lib/cabinet/transfers";
import {
  cancelTransfer,
  createTransfer,
} from "@/app/(cabinet)/[locale]/cabinet/[handle]/transfer/actions";

export default function TransferPanel({
  raqam,
  initialTransfers,
  transferTitle,
  transferHint,
  recipientLabel,
  recipientPlaceholder,
  submitLabel,
  activeTransfersTitle,
  pendingLabel,
  cancelLabel,
  cancelSuccessLabel,
  createSuccessLabel,
}: {
  raqam: string;
  initialTransfers: Transfer[];
  transferTitle: string;
  transferHint: string;
  recipientLabel: string;
  recipientPlaceholder: string;
  submitLabel: string;
  activeTransfersTitle: string;
  pendingLabel: string;
  cancelLabel: string;
  cancelSuccessLabel: string;
  createSuccessLabel: string;
}) {
  const [transfers, setTransfers] = useState<Transfer[]>(initialTransfers);
  const [target, setTarget] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!target.trim() || submitting) return;

    setSubmitting(true);
    const res = await createTransfer(raqam, target);
    setSubmitting(false);

    if (res.ok) {
      toast.success(createSuccessLabel);
      setTarget("");
      // Add optimistic transfer item
      setTransfers((prev) => [
        {
          id: String(Date.now()),
          raqam,
          kimga: target,
          holat: "kutilmoqda",
          boshlangan: new Date().toISOString(),
        },
        ...prev,
      ]);
    } else {
      toast.error(res.error || "Xatolik yuz berdi");
    }
  }

  async function handleCancel(id: string) {
    setCancellingId(id);
    const res = await cancelTransfer(raqam, id);
    setCancellingId(null);

    if (res.ok) {
      toast.success(cancelSuccessLabel);
      setTransfers((prev) => prev.filter((t) => t.id !== id));
    }
  }

  const pending = transfers.filter((t) => t.holat === "kutilmoqda");

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-card border border-border bg-card p-6">
        <h3 className="text-base font-semibold">{transferTitle}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{transferHint}</p>

        <form onSubmit={handleSend} className="mt-5 flex flex-col gap-3">
          <label className="text-sm font-medium text-foreground">
            {recipientLabel}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={recipientPlaceholder}
              disabled={submitting}
              className="flex-1 font-mono text-sm"
            />
            <Button type="submit" disabled={!target.trim() || submitting}>
              <Send data-icon="inline-start" className="size-4" />
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>

      {pending.length > 0 && (
        <div className="rounded-card border border-border bg-card p-6">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {activeTransfersTitle}
          </h4>
          <div className="mt-4 divide-y divide-border">
            {pending.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">
                      {t.kimga}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
                      <Clock className="size-3" />
                      {pendingLabel}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Yuborildi: {t.boshlangan?.slice(0, 10)}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={cancellingId === t.id}
                  onClick={() => handleCancel(t.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X data-icon="inline-start" className="size-3.5" />
                  {cancelLabel}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
