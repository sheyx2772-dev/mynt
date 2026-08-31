import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL; // e.g. https://images.flex.uz or the r2.dev URL

export const isStorageConfigured = Boolean(accountId && accessKeyId && secretAccessKey && bucket);

const client = isStorageConfigured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    })
  : null;

// Uploads a file to Cloudflare R2 and returns its public URL, or null if
// R2 isn't configured yet (callers should treat images as optional until it is).
export async function uploadImage(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string | null> {
  if (!isStorageConfigured || !client) return null;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return `${publicUrl}/${key}`;
}
