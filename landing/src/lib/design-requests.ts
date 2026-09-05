import "server-only";

import { asReader } from "@/lib/backend/client";

import { buildDesignPrompt, screenWish } from "@/lib/ai-design";

// A buyer asks for a card, in their own words, and gets one back.
//
// No generator is called here. Image models have no free tier, so the request
// is queued and filled by hand for now. The row is shaped for the automated
// version so that swapping one in later changes who fills the queue, not what
// the buyer sees or what the database holds.

export type DesignRequest = {
  id: string;
  handle: string;
  wish: string;
  status: "pending" | "filled" | "refused";
  imageUrl: string | null;
  note: string | null;
  createdAt: string;
};

export type RequestResult = { ok: true } | { ok: false; error: string };

export async function listDesignRequests(handle: string): Promise<DesignRequest[]> {
  const client = await asReader();
  const { data, error } = await client.GET("/raqamlar/{raqam}/dizayn", {
    params: { path: { raqam: handle } },
  });
  if (error || !data) return [];

  return (data.sorovlar ?? []).map((r) => ({
    id: r.id,
    handle: r.raqam,
    wish: r.tilak,
    status: r.holat as DesignRequest["status"],
    imageUrl: r.rasm ?? null,
    note: r.izoh ?? null,
    createdAt: r.vaqt,
  }));
}

/**
 * Asking for a card to be drawn.
 *
 * Screened here before anything is sent, so the buyer is told why immediately
 * rather than waiting in a queue for a refusal.
 */
export async function requestDesign(handle: string, wish: string): Promise<RequestResult> {
  const verdict = screenWish(wish);
  if (!verdict.ok) return { ok: false, error: verdict.reason };

  const client = await asReader();
  const { error } = await client.POST("/raqamlar/{raqam}/dizayn", {
    params: { path: { raqam: handle } },
    body: { tilak: wish },
  });
  return error ? { ok: false, error: "Bu handle sizniki emas." } : { ok: true };
}
