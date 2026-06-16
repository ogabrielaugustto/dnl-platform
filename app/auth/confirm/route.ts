import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";

function resolveSafeRedirect(origin: string, next: string | null) {
  if (!next || !next.startsWith("/")) {
    return new URL("/auth/login", origin);
  }

  return new URL(next, origin);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = requestUrl.searchParams.get("next");

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      new URL("/auth/login?message=invalid-link", requestUrl.origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(
      new URL("/auth/login?message=invalid-link", requestUrl.origin),
    );
  }

  return NextResponse.redirect(resolveSafeRedirect(requestUrl.origin, next));
}
