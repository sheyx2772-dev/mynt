import "server-only";

import { backend } from "@/lib/backend/client";

// Whether anything is configured to take money.
//
// The merchant ids and secret keys live in the backend, which is the process
// that builds the checkout addresses and answers the providers' callbacks. This
// asks it rather than keeping a second copy of the settings: two places holding
// the same fact is one place for them to disagree, and the disagreement here
// would be a button that opens an empty checkout.

/** Can this number be bought right now? */
export async function isPayable(handle: string): Promise<boolean> {
  const { data, error } = await backend.GET("/qidirish/{raqam}", {
    params: { path: { raqam: handle } },
  });
  // A backend that cannot be reached is not one that can take money. Saying no
  // shows a quote without a button, which is the honest answer either way.
  return !error && Boolean(data?.tolash_mumkin);
}
