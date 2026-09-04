import { saveProfile } from "@/lib/profile-save";
import { requireOwner } from "@/lib/mobil";

// Editing a profile from the phone.
//
// Multipart rather than JSON because a profile carries a photograph, and
// because `readProfileForm` reads a `FormData` — the same one the website's
// form posts. Sending the same shape means the phone gets the same validation
// rather than a second, more forgiving copy of it: the link builder that
// refuses `javascript:`, the tag reducer, the plan's service limit.
//
// Nothing about which handle is being edited comes from the body. It is a
// query parameter, checked against the caller's ownership before the form is
// read, so a photograph is never even buffered for a number somebody else owns.

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const check = await requireOwner(request, url.searchParams.get("raqam"));
  if (!check.ok) return check.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "So'rov o'qilmadi." }, { status: 400 });
  }

  const result = await saveProfile(check.context.normalized, check.context.user.id, form);
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });

  // Saved, but the picture did not reach the store. The rest of the edit is in
  // the database and the app has to say so rather than show a photograph that
  // is not there — see `readProfileForm`, where the same thing is decided for
  // the website.
  return Response.json({ ok: true, imageFailed: result.imageFailed ?? false });
}
