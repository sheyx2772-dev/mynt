import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL; // e.g. https://images.flex.com.uz or the r2.dev URL

export const isStorageConfigured = Boolean(accountId && accessKeyId && secretAccessKey && bucket);

const client = isStorageConfigured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    })
  : null;

// Uploads a file to Cloudflare R2 and returns its public URL, or null if the
// upload did not happen — because R2 is not configured yet, or because it
// refused. Callers treat images as optional and were already written against
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
    console.error("R2 upload failed:", key, error);
    return null;
  }

  return `${publicUrl}/${key}`;
}
