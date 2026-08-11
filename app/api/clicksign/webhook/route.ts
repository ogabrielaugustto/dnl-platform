import { NextResponse } from "next/server";
import { verifyClicksignWebhookSignature } from "@/lib/clicksign/representation-documents";
import { applyClicksignCaseSraWebhook } from "@/lib/dal/admin-case-sra";
import { applyClicksignRepresentationWebhook } from "@/lib/dal/client-representation-documents";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const webhookSecret = process.env.CLICKSIGN_WEBHOOK_HMAC_SECRET?.trim();

  if (!webhookSecret) {
    console.error("clicksign_webhook_secret_missing");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const signature =
    request.headers.get("content-hmac") ??
    request.headers.get("x-clicksign-signature");

  if (!verifyClicksignWebhookSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const [representation, caseSra] = await Promise.all([
      applyClicksignRepresentationWebhook(payload),
      applyClicksignCaseSraWebhook(payload),
    ]);
    return NextResponse.json({ ok: true, representation, caseSra });
  } catch (error) {
    console.error("clicksign_webhook_processing_failed", {
      message: error instanceof Error ? error.message : "unknown_error",
    });

    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
