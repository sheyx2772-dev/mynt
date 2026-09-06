import { NextResponse, type NextRequest } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import { currentAccount } from "@/lib/cabinet/session";
import { SITE_URL } from "@/lib/site";

// Image upload endpoint for profile avatars and cover banners.
//
// The file is checked for mime-type and reasonable size (max 10MB) before
// writing to public/uploads. The banner URL returns with an absolute https://
// scheme matching the database check constraint handles_banner_url_check.

const ALLOWED_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const account = await currentAccount();
  if (!account) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  }

  const ext = ALLOWED_TYPES.get(file.type.toLowerCase());
  if (!ext) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 400 });
  }

  const kind = (formData.get("type") as string) === "banner" ? "banner" : "avatar";
  const subFolder = kind === "banner" ? "banners" : "avatars";
  const targetDir = path.join(process.cwd(), "public", "uploads", subFolder);

  try {
    await mkdir(targetDir, { recursive: true });
  } catch (err) {
    console.error("upload: failed to create directory", err);
    return NextResponse.json({ error: "storage_error" }, { status: 500 });
  }

  const randomHash = crypto.randomBytes(8).toString("hex");
  const fileName = `${kind}_${Date.now()}_${randomHash}.${ext}`;
  const filePath = path.join(targetDir, fileName);

  try {
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));
  } catch (err) {
    console.error("upload: failed to write file", err);
    return NextResponse.json({ error: "storage_error" }, { status: 500 });
  }

  // Banners use SITE_URL so they satisfy handles_banner_url_check (^https://).
  // Avatars can use the relative path directly.
  const relativeUrl = `/uploads/${subFolder}/${fileName}`;
  const finalUrl = kind === "banner" ? `${SITE_URL}${relativeUrl}` : relativeUrl;

  return NextResponse.json({
    ok: true,
    url: finalUrl,
    relativeUrl,
  });
}
