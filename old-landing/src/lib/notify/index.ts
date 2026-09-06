import "server-only";

import { asReader } from "@/lib/backend/client";

// What somebody finds in their cabinet, and where it is pushed.
//
// Recording a notice and delivering it both happen in the backend, which is
// where the rule between them lives: the row is written first and the channels
// run afterwards, so a notice that was recorded but not delivered is one the
// owner still finds here, and one delivered but not recorded is gone the moment
// the message scrolls away.
//
// Nothing on this side writes a notice. A site that could raise one could raise
// it for anybody, and the events worth telling somebody about — a lead, a
// table calling a waiter, a plan running out — all happen in Go now.

export type StoredNotification = {
  id: number;
  kind: string;
  handle: string | null;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

type Wire = {
  id: number;
  tur: string;
  raqam?: string;
  sarlavha: string;
  matn?: string;
  havola?: string;
  oqilgan?: string;
  vaqt: string;
};

function toNotification(row: Wire): StoredNotification {
  return {
    id: row.id,
    kind: row.tur,
    handle: row.raqam ?? null,
    title: row.sarlavha,
    body: row.matn ?? null,
    href: row.havola ?? null,
    readAt: row.oqilgan ?? null,
    createdAt: row.vaqt,
  };
}

export async function listNotifications(): Promise<StoredNotification[]> {
  const client = await asReader();
  const { data } = await client.GET("/xabarlar", {});
  return (data?.xabarlar ?? []).map(toNotification);
}

export async function markAllRead(): Promise<void> {
  const client = await asReader();
  await client.POST("/xabarlar/oqildi", {});
}
