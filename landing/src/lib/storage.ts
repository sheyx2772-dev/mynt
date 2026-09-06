import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Where the images go.
//
// Cloudflare R2 in production, and this talks to it through the S3 API rather
// than through anything of Cloudflare's — which is the reason the same file
// works against MinIO on a laptop. Development gets a bucket in a container
// and nobody needs a cloud credential to change an avatar; production keeps
// R2, whose egress is free and whose edge is in front of a page a stranger
// opens after tapping a card.
//
// The endpoint is the only difference, and it is configuration.

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL; // e.g. https://images.flex-nfc.uz or the r2.dev URL

/**
 * Set to reach something that is not R2 — MinIO in development, or any other
 * S3-compatible store later. Unset, the address is built from the R2 account.
 */
const endpoint =
  process.env.S3_ENDPOINT ?? (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

export const isStorageConfigured = Boolean(endpoint && accessKeyId && secretAccessKey && bucket);

const client = isStorageConfigured
  ? new S3Client({
      region: process.env.S3_REGION ?? "auto",
      endpoint,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
      // MinIO serves buckets as a path — `host/bucket/key` — where R2 and S3
      // put the bucket in the hostname. Asking for the wrong one is a 404 that
      // reads like a permission problem, so it is set from the endpoint rather
      // than left to be discovered.
      forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    })
  : null;

// Uploads a file and returns its public URL, or null if the upload did not
// happen — because no store is configured yet, or because it refused. Callers treat images as optional and were already written against
// null; the send used to be unguarded, so a rejected key threw straight through
// a server action and replaced the page with the error screen. Losing a
// photograph is a message. Losing the form somebody was filling in is not.
export async function uploadImage(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string | null> {
  if (!isStorageConfigured || !client) return null;

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
  } catch (error) {
    // Logged rather than swallowed: an upload that stops working is almost
    // always a rotated key or a bucket permission, and neither is visible from
    // the "could not upload" the owner sees.
    console.error("image upload failed:", key, error);
    return null;
  }

  return `${publicUrl}/${key}`;
}
