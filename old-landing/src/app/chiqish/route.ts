import { asReader } from "@/lib/backend/client";
import { endSession } from "@/lib/backend/session";
import { redirectTo } from "@/lib/redirect";

// Sign-out is a POST so a stray link preview or prefetch cannot log people out.
export async function POST() {
  // Told to the backend so the session is revoked there rather than merely
  // forgotten here — a token that still works is a token that still works,
  // whoever has stopped holding it.
  const client = await asReader();
  await client.POST("/chiqish", {}).catch(() => {});

  // Cleared whatever the backend said. Somebody who pressed sign out on a
  // phone with no signal must still end up signed out on the phone in their
  // hand; the server-side session expires on its own.
  await endSession();

  return redirectTo("/");
}
