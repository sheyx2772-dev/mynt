import { listLeads } from "@/lib/leads";
import { requireOwner } from "@/lib/mobil";

// The contacts left on one profile.
//
// A route rather than a direct query from the phone, even though `leads` has a
// policy that would allow it: the policy joins through `handles` on every row,
// and the shape the cabinet already reads is `listLeads`. One reader means the
// phone and the website cannot drift into showing different lists.

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const check = await requireOwner(request, url.searchParams.get("raqam"));
  if (!check.ok) return check.response;

  const leads = await listLeads(check.context.normalized);

  return Response.json({ leads });
}
