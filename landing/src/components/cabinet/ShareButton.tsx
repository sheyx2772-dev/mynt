"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

// The address, handed to whatever the phone shares with.
//
// On a phone this opens the system sheet — Telegram is two taps away, which
// is where most of these addresses actually go. A desktop has no sheet, so
// the address is copied and the toast says so. Both are the same button
// because the owner does not care which mechanism carried it.
export default function ShareButton({
  url,
  title,
  label,
  copied,
}: {
  url: string;
  title: string;
  label: string;
  copied: string;
}) {
  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success(copied);
    } catch {
      // The sheet was dismissed, or the clipboard is not available in this
      // context. Neither is worth a message.
    }
  }

  return (
    <Button type="button" variant="secondary" size="lg" onClick={share}>
      <Share2 data-icon="inline-start" strokeWidth={2} />
      {label}
    </Button>
  );
}
