import "server-only";

import { asReader } from "@/lib/backend/client";

// Sovg'a stikerlar: bought for a number, shown on its profile.
//
// The catalogue, the prices and the delivery are the backend's. This side
// draws the shelf and hands the buyer to a payment page.

export type Tier = "oddiy" | "kumush" | "oltin" | "noyob";

export type Sticker = { id: string; name: string; emoji: string; price: number; tier: Tier };

export type Gift = {
  id: number;
  sticker: string;
  emoji: string;
  name: string;
  tier: Tier;
  note: string | null;
  shown: boolean;
  at: string;
  from: string;
  fromHandle: string | null;
  fromAvatar: string | null;
};

export type GiftCount = { sticker: string; emoji: string; name: string; tier: Tier; count: number };

export type Shelf = { gifts: Gift[]; counts: GiftCount[] };

export const EMPTY_SHELF: Shelf = { gifts: [], counts: [] };

export async function listStickers(): Promise<Sticker[]> {
  const client = await asReader();
  const { data, error } = await client.GET("/sovgalar");
  if (error || !data) return [];
  return (data.stikerlar ?? []).map((s) => ({
    id: s.id, name: s.nom, emoji: s.emoji, price: s.narx, tier: s.daraja as Tier,
  }));
}

export async function listGifts(handle: string): Promise<Shelf> {
  const client = await asReader();
  const { data, error } = await client.GET("/profil/{raqam}/sovgalar", {
    params: { path: { raqam: handle } },
  });
  if (error || !data) return EMPTY_SHELF;

  return {
    gifts: (data.sovgalar ?? []).map((g) => ({
      id: g.id,
      sticker: g.stiker,
      emoji: g.emoji,
      name: g.nom,
      tier: g.daraja as Tier,
      note: g.xabar ?? null,
      shown: g.korsatiladi,
      at: g.vaqt,
      from: g.kimdan,
      fromHandle: g.kimdan_raqam ?? null,
      fromAvatar: g.kimdan_rasm ?? null,
    })),
    counts: (data.jami ?? []).map((c) => ({
      sticker: c.stiker, emoji: c.emoji, name: c.nom, tier: c.daraja as Tier, count: c.soni,
    })),
  };
}

export type GiftResult =
  | { ok: true; paid: true }
  | { ok: true; paid: false; checkout: { click?: string; payme?: string } }
  | { ok: false; error: string; needsAuth?: true };

export async function sendGift(handle: string, sticker: string, note: string): Promise<GiftResult> {
  const client = await asReader();
  const { data, error, response } = await client.POST("/profil/{raqam}/sovga", {
    params: { path: { raqam: handle } },
    body: { stiker: sticker, xabar: note || undefined },
  });
  if (error || !data) {
    if (response?.status === 401) return { ok: false, error: "Avval hisobingizga kiring.", needsAuth: true };
    if (response?.status === 503) return { ok: false, error: "To'lov tizimi hali ulanmagan. Biz bilan bog'laning." };
    if (response?.status === 404) return { ok: false, error: "Bunday raqam yoki stiker yo'q." };
    return { ok: false, error: "Buyurtma yaratilmadi. Qaytadan urinib ko'ring." };
  }

  const o = data.buyurtma;
  if (o.holat === "paid") return { ok: true, paid: true };
  return { ok: true, paid: false, checkout: { click: o.tolov?.click, payme: o.tolov?.payme } };
}

/** The owner's switch: off the shelf, or back on it. */
export async function setGiftShown(handle: string, id: number, shown: boolean): Promise<boolean> {
  const client = await asReader();
  const { error } = await client.PUT("/raqamlar/{raqam}/sovgalar/{id}", {
    params: { path: { raqam: handle, id } },
    body: { korsatiladi: shown },
  });
  return !error;
}
