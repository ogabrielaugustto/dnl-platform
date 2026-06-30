type SupabaseAuthConfirmUrlParams = {
  appUrl: string;
  hashedToken: string;
  nextPath: string;
  type: "recovery" | "invite";
};

export function buildSupabaseAuthConfirmUrl({
  appUrl,
  hashedToken,
  nextPath,
  type,
}: SupabaseAuthConfirmUrlParams) {
  const normalizedAppUrl = appUrl.replace(/\/$/, "");

  return `${normalizedAppUrl}/auth/confirm?token_hash=${encodeURIComponent(hashedToken)}&type=${encodeURIComponent(type)}&next=${encodeURIComponent(nextPath)}`;
}
