import "server-only";

import { asReader } from "@/lib/backend/reader";
import type { components } from "@/lib/backend/schema";
import { normalize } from "./handles";

// Contacts (leads) collected by the profile from strangers who visited it.
//
// Every call is filtered by the backend on owner identity; a number the caller
// does not own returns an empty list or fails with 404.

export type Lead = components["schemas"]["Lead"];

export async function listLeads(raw: string): Promise<Lead[]> {
  const raqam = normalize(raw);
  if (!raqam) return [];

  const { api } = await asReader();
  const { data, error } = await api.GET("/raqamlar/{raqam}/vizitkalar", {
    params: { path: { raqam } },
  });

  if (error || !data) return [];
  return data.vizitkalar ?? [];
}

export async function deleteLead(raw: string, id: number): Promise<boolean> {
  const raqam = normalize(raw);
  if (!raqam || !Number.isInteger(id) || id <= 0) return false;

  const { api } = await asReader();
  const { error } = await api.DELETE("/raqamlar/{raqam}/vizitkalar/{id}", {
    params: { path: { raqam, id } },
  });

  return !error;
}
