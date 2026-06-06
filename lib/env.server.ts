import "server-only";

import { z } from "zod";

function isInvalidR2PublicBaseUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname.endsWith(".r2.cloudflarestorage.com");
  } catch {
    return false;
  }
}

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_ASSETS: z.string().min(1),
  R2_BUCKET_EVIDENCE: z.string().min(1),
  R2_PUBLIC_BASE_URL: z
    .url()
    .refine((value) => !isInvalidR2PublicBaseUrl(value), {
      message:
        "R2_PUBLIC_BASE_URL precisa ser uma URL publica de entrega do bucket, como um dominio customizado ou r2.dev. Nao use o endpoint *.r2.cloudflarestorage.com.",
    }),
  WORKER_BASE_URL: z.string().min(1),
  INTERNAL_API_SECRET: z.string().min(1),
});

export const env = envSchema.parse(process.env);
