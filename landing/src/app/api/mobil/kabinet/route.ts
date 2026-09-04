import { userFromBearer, unauthorized } from "@/lib/auth/bearer";
import { listHandlesForUser } from "@/lib/handles";

// What the app opens on: everything the signed-in account owns or is holding.
//
// The same read the cabinet does, returned rather than rendered. It goes
// through `listHandlesForUser`, so the plan a handle is on — including the one
// its company pays for — is worked out in the one place that knows the rule,
// and the phone never has to reimplement it.

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await userFromBearer(request);
  if (!user) return unauthorized();

  // The id is the verified one. A handle list is not sensitive — profiles are
  // public — but reading it for whoever the request said it was would make an
  // ownership check somewhere else pointless.
  const handles = await listHandlesForUser(user.id);

  return Response.json({ handles });
}
