"use server";

import { submitTeamRequest } from "@/lib/team-requests";

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
