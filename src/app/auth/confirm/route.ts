import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";

// Landing point for the emailed sign-in link. Exchanges the one-time token
// for a session cookie, then forwards the user to wherever they started.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("keyin") ?? "/";

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/kirish?xato=havola`);
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/kirish?xato=baza`);
  }

  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    // Expired or already-used links land here. Logged because a link that
    // should have worked is a bug, not a user mistake.
    console.error("auth/confirm verifyOtp failed:", error.status, error.code, error.message);
    return NextResponse.redirect(`${origin}/kirish?xato=havola`);
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
