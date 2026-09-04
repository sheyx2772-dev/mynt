"use server";

import { submitTeamRequest, submitVenueRequest, type VenueRequestError } from "@/lib/team-requests";

export type TeamFormState = {
  ok: boolean;
  error?: string;
  fallback?: true;
  sent?: true;
};

export async function requestTeamOrder(
  _prevState: TeamFormState,
  formData: FormData
): Promise<TeamFormState> {
  const result = await submitTeamRequest({
    company: String(formData.get("company") ?? ""),
    contactName: String(formData.get("contactName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    teamSize: String(formData.get("teamSize") ?? ""),
    note: String(formData.get("note") ?? ""),
  });

  if (!result.ok) {
    return { ok: false, error: result.error, fallback: result.fallback };
  }
  return { ok: true, sent: true };
}

// The venue form answers with a code rather than a sentence: the page it sits
// on is rendered in three languages, and the words belong in the dictionary.
export type VenueFormState = {
  ok: boolean;
  code?: VenueRequestError;
  fallback?: true;
  sent?: true;
};

export async function requestVenueQuote(
  _prevState: VenueFormState,
  formData: FormData,
): Promise<VenueFormState> {
  const result = await submitVenueRequest({
    company: String(formData.get("company") ?? ""),
    contactName: String(formData.get("contactName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    points: String(formData.get("points") ?? ""),
    vertical: String(formData.get("vertical") ?? ""),
    note: String(formData.get("note") ?? ""),
  });

  if (!result.ok) {
    return { ok: false, code: result.code, fallback: result.fallback };
  }
  return { ok: true, sent: true };
}
