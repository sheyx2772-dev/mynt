import "server-only";

import { asReader } from "@/lib/backend/reader";
import { normalize } from "./handles";

// How many follow the number.
//
// Read from the public profile rather than the owner's row, because that is
// the only place the backend counts it (`PublicProfile.obunachilar`). Asked
// with the session attached so a closed profile answers its owner in full;
// what comes back for anybody else is the stranger's cut, which carries the
// same count and nothing this needs.
//
// Zero on any failure. A counter is not worth a broken home screen.
export async function followers(raw: string): Promise<number> {
  const raqam = normalize(raw);
  if (!raqam) return 0;
  const { api } = await asReader();
  try {
    const { data } = await api.GET("/profil/{raqam}", {
      params: { path: { raqam } },
    });
    return data?.profil.obunachilar ?? 0;
  } catch {
    return 0;
  }
}
