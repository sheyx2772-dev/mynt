import { NextResponse } from "next/server";
import { isLang } from "@/lib/i18n";
import { LANG_COOKIE } from "@/lib/lang";
import { redirectTo } from "@/lib/redirect";

// Remembering a language choice.
//
// A POST rather than a link with a query, because the choice has to outlive the
// page it was made on and a cookie cannot be set from a server component. The
// destination is checked against being a path on this site: a redirect target
// taken from a request is an open redirect, and this one is reachable by
// anybody.

export async function POST(request: Request) {
  const form = await request.formData();
  const lang = String(form.get("til") ?? "");
  const rawNext = String(form.get("keyin") ?? "/");

  if (!isLang(lang)) {
    return NextResponse.json({ error: "unknown language" }, { status: 400 });
  }

  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const response = redirectTo(next);
  response.cookies.set(LANG_COOKIE, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: false,
  });

  return response;
}
