import "server-only";

import { asReader } from "@/lib/backend/client";

// Tug'ilgan kun tabriklari — read by anyone, left by anyone signed in, and
// only in the week of the day. The window is the backend's decision; this
// side only draws the answer.

export type Greeting = {
  id: number;
  emoji: string;
  text: string | null;
  at: string;
  handle: string | null;
  name: string;
  avatarUrl: string | null;
  mine: boolean;
};

export async function listGreetings(handle: string): Promise<{ greetings: Greeting[]; count: number }> {
  const client = await asReader();
  const { data, error } = await client.GET("/profil/{raqam}/tabriklar", {
    params: { path: { raqam: handle } },
  });
  if (error || !data) return { greetings: [], count: 0 };

  return {
    count: data.soni,
    greetings: (data.tabriklar ?? []).map((g) => ({
      id: g.id,
      emoji: g.emoji,
      text: g.matn ?? null,
      at: g.vaqt,
      handle: g.raqam ?? null,
      name: g.ism,
      avatarUrl: g.rasm ?? null,
      mine: g.meniki,
    })),
  };
}

export type GreetResult = { ok: boolean; error?: string };

export async function sendGreeting(handle: string, emoji: string, text: string): Promise<GreetResult> {
  const client = await asReader();
  const { error, response } = await client.POST("/profil/{raqam}/tabriklar", {
    params: { path: { raqam: handle } },
    body: { emoji, matn: text || undefined },
  });
  if (!error) return { ok: true };

  if (response.status === 401) return { ok: false, error: "Avval hisobingizga kiring." };
  if (response.status === 409) return { ok: false, error: "Tabrik faqat tug'ilgan kun haftasida qabul qilinadi." };
  return { ok: false, error: "Yuborilmadi. Qaytadan urinib ko'ring." };
}
