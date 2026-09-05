import "server-only";

import { asReader } from "@/lib/backend/client";


// A company holding numbers for its staff.
//
// Three decisions sit under this, all taken from how the market already works,
// and all of them have to be visible to the buyer rather than buried:
//
//   The company pays, on one account, by the seat.
//   A seat is bought, not a person — a leaver frees one rather than burning it.
//   The number stays with the company when its holder leaves.
//
// The last is the one that has to be said out loud at the point of sale and to
// the employee carrying the card. A number that is not yours should never be a
// surprise.

export type Team = {
  id: string;
  name: string;
  role: "owner" | "member";
  seats: number;
  planExpiresAt: string | null;
};

export type TeamHandle = {
  normalized: string;
  holderName: string | null;
  position: string | null;
  viewCount: number;
  /** Empty while the number is back in the company's pool. */
  holder: string | null;
  /** What the screen draws differently: a number in the pool has no holder. */
  assigned: boolean;
  status: string;
  claimedAt: string | null;
};

export type TeamStats = { views: number; assigned: number; taken: number };

type TeamScreen = { team: Team; handles: TeamHandle[]; stats: TeamStats };

/**
 * The company, its numbers and its figures, in one read.
 *
 * Three questions that are always asked together on one screen, so they are
 * one request. The requisites come back only for the owner — a member holding
 * a number has no reason to see the company's bank account.
 */
export async function getTeamScreen(): Promise<TeamScreen | null> {
  const client = await asReader();
  const { data, error } = await client.GET("/men/jamoa", {});
  if (error || !data?.jamoa) return null;

  const t = data.jamoa;
  return {
    team: {
      id: t.id,
      name: t.nom,
      role: t.rol,
      seats: t.orinlar,
      planExpiresAt: t.tarif_tugashi ?? null,
    },
    handles: (data.raqamlar ?? []).map((h) => ({
      normalized: h.raqam,
      holderName: h.ism ?? null,
      position: h.lavozim ?? null,
      viewCount: h.korishlar,
      holder: h.kimda ?? null,
      assigned: h.berilgan,
      status: h.holat,
      claimedAt: h.olingan ?? null,
    })),
    stats: {
      views: data.hisob.korishlar,
      assigned: data.hisob.berilgan,
      taken: data.hisob.olingan,
    },
  };
}

export async function getTeamForUser(): Promise<Team | null> {
  return (await getTeamScreen())?.team ?? null;
}

export async function listTeamHandles(): Promise<TeamHandle[]> {
  return (await getTeamScreen())?.handles ?? [];
}

export async function getTeamStats(): Promise<TeamStats> {
  return (await getTeamScreen())?.stats ?? { views: 0, assigned: 0, taken: 0 };
}

/**
 * Taking a number back from somebody who has left.
 *
 * The number stays with the company; only the holder is cleared. That is the
 * promise made at the point of sale, and it is the one the employee carrying
 * the card has to have been told about.
 */
export async function releaseTeamHandle(handle: string): Promise<boolean> {
  const client = await asReader();
  const { error } = await client.PUT("/jamoa/raqamlar/{raqam}", {
    params: { path: { raqam: handle } },
    body: {},
  });
  return !error;
}

export type AssignResult = { ok: true } | { ok: false; error: string };

/**
 * Handing a number to somebody, by address.
 *
 * By address rather than by account, because the person may not have one yet:
 * buying numbers for a team and mailing them out is the ordinary case. The
 * account is created if it does not exist, and following the link is what
 * proves the address — exactly as the sign-in door works.
 */
export async function assignTeamHandle(handle: string, email: string): Promise<AssignResult> {
  const client = await asReader();
  const { error, response } = await client.PUT("/jamoa/raqamlar/{raqam}", {
    params: { path: { raqam: handle } },
    body: { kimga: email },
  });
  if (!error) return { ok: true };

  const said = (error as { detail?: string })?.detail;
  if (response.status === 409 || response.status === 404) {
    return { ok: false, error: said ?? "Bu raqam firmangizga tegishli emas." };
  }
  return { ok: false, error: "Hozir bo'lmadi." };
}
