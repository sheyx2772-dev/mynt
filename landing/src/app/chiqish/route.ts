import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// Sign-out is a POST so a stray link preview or prefetch can't log people out.
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  await supabase?.auth.signOut();

  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
