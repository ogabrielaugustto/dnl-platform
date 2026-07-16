import "server-only";

import {
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "@/lib/env.server";

let r2Client: S3Client | null = null;

function getR2Client() {
  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return r2Client;
}

export async function uploadAssetToR2(params: {
  key: string;
  body: Buffer;
  contentType: string;
}) {
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_ASSETS,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );
}

export async function deleteAssetFromR2(key: string) {
  const client = getR2Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_ASSETS,
      Key: key,
    }),
  );
}

export async function readEvidenceFromR2(key: string) {
  const client = getR2Client();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: env.R2_BUCKET_EVIDENCE,
      Key: key,
    }),
  );

  const bytes = await response.Body?.transformToByteArray();

  if (!bytes) {
    throw new Error("Nao foi possivel ler a evidencia armazenada.");
  }

  return {
    body: Buffer.from(bytes),
    contentType: response.ContentType ?? "image/png",
  };
}

export async function uploadCaseDocumentToR2(params: {
  key: string;
  body: Buffer;
  contentType: string;
}) {
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_EVIDENCE,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );
}

export async function readCaseDocumentFromR2(key: string) {
  const client = getR2Client();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: env.R2_BUCKET_EVIDENCE,
      Key: key,
    }),
  );

  const bytes = await response.Body?.transformToByteArray();

  if (!bytes) {
    throw new Error("Nao foi possivel ler o documento armazenado.");
  }

  return {
    body: Buffer.from(bytes),
    contentType: response.ContentType ?? "application/octet-stream",
  };
}

export function buildAssetPublicUrl(key: string) {
  return `${env.R2_PUBLIC_BASE_URL.replace(/\/+$/, "")}/${key}`;
}
