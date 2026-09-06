import "server-only";

import { asReader } from "@/lib/backend/reader";
import type { components } from "@/lib/backend/schema";
import { normalize } from "./handles";

// A design drawn to order, which is what "custom" means in this product today.
//
// `handles.card_design` is a closed set of ten (migration 00013) and the
// public page draws one look for all of them; there is no column for a
// colour somebody chose. What the backend has instead is `design_requests`
// (migration 00014): the owner writes what they want, the studio draws it,
// and the finished artwork lands in `handles.custom_design_url`, which the
// owner's row carries as `maxsus_dizayn`. So the cabinet offers that — a
// wish and a queue — and a colour picker is the first line of the wish-list.
//
// Both calls are filtered on the backend by owner: another account's number
// is an empty list or a 404, and nothing here compares ids.

export type DesignRequest = components["schemas"]["DesignRequest"];

export async function designRequests(raw: string): Promise<DesignRequest[]> {
  const raqam = normalize(raw);
  if (!raqam) return [];
  const { api } = await asReader();
  const { data, error } = await api.GET("/raqamlar/{raqam}/dizayn", {
    params: { path: { raqam } },
  });
  if (error || !data) return [];
  // Newest first: the one in flight is the one being looked for.
  return [...(data.sorovlar ?? [])].sort((a, b) =>
    b.vaqt.localeCompare(a.vaqt),
  );
}

export type AskResult = "ok" | "short" | "pending" | "notFound" | "server";

/** The wish, cut to the column's own limit before it goes. */
const MIN_WISH = 3;
const MAX_WISH = 400;

export async function askForDesign(
  raw: string,
  wish: string,
): Promise<AskResult> {
  const raqam = normalize(raw);
  if (!raqam) return "notFound";
  const tilak = wish.trim().slice(0, MAX_WISH);
  if (tilak.length < MIN_WISH) return "short";

  const { api } = await asReader();
  try {
    const { error, response } = await api.POST("/raqamlar/{raqam}/dizayn", {
      params: { path: { raqam } },
      body: { tilak },
    });
    if (!error) return "ok";
    if (response.status === 404) return "notFound";
    // One request in flight per number is a unique index; a second lands as
    // a conflict. The status and problem document stay in the log.
    if (response.status === 409) return "pending";
    console.error("cabinet: design not asked", response.status);
    return "server";
  } catch (cause) {
    console.error("cabinet: design not asked", cause);
    return "server";
  }
}
