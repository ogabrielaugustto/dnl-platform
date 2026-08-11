export type CaseSiteSnapshotForSignals = {
  siteName: string | null;
  cnpjCandidates: string[];
  emails: string[];
  phones: string[];
};

export type CaseSiteIntelDomainOwner = {
  name: string | null;
  organization: string | null;
  document: string | null;
  email: string | null;
  sourceType: string | null;
  sourceUrl: string | null;
  contactStatus: string | null;
};

export type CaseSiteIntelForSignals = {
  primaryEmail: string | null;
  primaryPhone: string | null;
  primaryCnpj: string | null;
  contactCandidates: Array<Record<string, unknown>>;
  domainOwner: CaseSiteIntelDomainOwner | null;
};

export type CaseSiteSignals = {
  cnpjCandidates: string[];
  emails: string[];
  phones: string[];
  siteName: string | null;
  domainOwner: CaseSiteIntelDomainOwner | null;
};

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value && value.trim().length > 0))),
  );
}

function readCandidateValue(candidate: Record<string, unknown>, type: string) {
  return candidate.type === type && typeof candidate.value === "string" ? candidate.value : null;
}

export function isMissingSiteIntelDomainOwnerSchemaError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    message?: string;
    details?: string;
  };
  const message = `${candidate.message ?? ""} ${candidate.details ?? ""}`.toLowerCase();

  return (
    (candidate.code === "42703" || candidate.code === "PGRST204") &&
    message.includes("domain_owner_")
  );
}

export function buildCaseSiteSignals(params: {
  siteSnapshots: CaseSiteSnapshotForSignals[];
  investigations: CaseSiteIntelForSignals[];
}): CaseSiteSignals {
  const domainOwner =
    params.investigations.find((investigation) => investigation.domainOwner?.email)?.domainOwner ??
    params.investigations.find((investigation) => investigation.domainOwner)?.domainOwner ??
    null;

  const candidateEmails = params.investigations.flatMap((investigation) =>
    investigation.contactCandidates.map((candidate) => readCandidateValue(candidate, "email")),
  );
  const candidatePhones = params.investigations.flatMap((investigation) =>
    investigation.contactCandidates.map((candidate) => readCandidateValue(candidate, "phone")),
  );
  const candidateCnpjs = params.investigations.flatMap((investigation) =>
    investigation.contactCandidates.map((candidate) => readCandidateValue(candidate, "cnpj")),
  );

  return {
    cnpjCandidates: uniqueStrings([
      domainOwner?.document,
      ...params.investigations.map((investigation) => investigation.primaryCnpj),
      ...candidateCnpjs,
      ...params.siteSnapshots.flatMap((snapshot) => snapshot.cnpjCandidates),
    ]),
    emails: uniqueStrings([
      domainOwner?.email,
      ...params.investigations.map((investigation) => investigation.primaryEmail),
      ...candidateEmails,
      ...params.siteSnapshots.flatMap((snapshot) => snapshot.emails),
    ]),
    phones: uniqueStrings([
      ...params.investigations.map((investigation) => investigation.primaryPhone),
      ...candidatePhones,
      ...params.siteSnapshots.flatMap((snapshot) => snapshot.phones),
    ]),
    siteName: uniqueStrings(params.siteSnapshots.map((snapshot) => snapshot.siteName))[0] ?? null,
    domainOwner,
  };
}
