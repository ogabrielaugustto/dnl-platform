import "server-only";

import { requirePanelAccess, type OrganizationMemberRole } from "@/lib/auth";
import { createClient } from "@/lib/server";

type ProfileSettingsRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  last_signed_in_at: string | null;
  created_at: string;
};

type OrganizationSettingsRow = {
  id: string;
  name: string;
  document: string | null;
  billing_email: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website_url?: string | null;
  instagram_handle?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfileSettingsData = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  lastSignedInAt: string | null;
  createdAt: string;
};

export type OrganizationSettingsData = {
  id: string;
  name: string;
  document: string | null;
  billingEmail: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  instagramHandle: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: OrganizationMemberRole;
  activeMembersCount: number;
  missingFields: string[];
  hasExtendedWorkspaceFields: boolean;
};

function hasMissingOrganizationFieldsError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    message?: string;
    details?: string;
  };
  const combinedMessage = `${candidate.message ?? ""} ${candidate.details ?? ""}`;

  return (
    candidate.code === "42703" ||
    combinedMessage.includes("contact_email") ||
    combinedMessage.includes("contact_phone") ||
    combinedMessage.includes("website_url") ||
    combinedMessage.includes("instagram_handle")
  );
}

function canManageOrganization(role: OrganizationMemberRole) {
  return role === "owner" || role === "admin";
}

function computeOrganizationMissingFields(organization: {
  name: string;
  document: string | null;
  billingEmail: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  instagramHandle: string | null;
}) {
  const missingFields: string[] = [];

  if (!organization.name.trim()) {
    missingFields.push("Nome da organizacao");
  }

  if (!organization.document?.trim()) {
    missingFields.push("Documento");
  }

  if (!organization.billingEmail?.trim()) {
    missingFields.push("E-mail financeiro");
  }

  if (!organization.contactEmail?.trim()) {
    missingFields.push("E-mail principal");
  }

  if (!organization.contactPhone?.trim()) {
    missingFields.push("Telefone");
  }

  if (!organization.websiteUrl?.trim()) {
    missingFields.push("Site oficial");
  }

  if (!organization.instagramHandle?.trim()) {
    missingFields.push("Instagram");
  }

  return missingFields;
}

export async function requireManageableOrganization() {
  const context = await requirePanelAccess("client");
  const membership = context.membership;

  if (!membership) {
    throw new Error("Organizacao ativa nao encontrada.");
  }

  if (!canManageOrganization(membership.role)) {
    throw new Error("Voce nao tem permissao para editar esta organizacao.");
  }

  return {
    context,
    membership,
    organizationId: membership.organizationId,
    userId: context.userId,
  };
}

export async function getProfileSettingsData(): Promise<ProfileSettingsData> {
  const context = await requirePanelAccess("client");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, last_signed_in_at, created_at")
    .eq("id", context.userId)
    .maybeSingle<ProfileSettingsRow>();

  if (error || !data) {
    throw new Error("Nao foi possivel carregar os dados do perfil.");
  }

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
    lastSignedInAt: data.last_signed_in_at,
    createdAt: data.created_at,
  };
}

export async function getOrganizationSettingsData(): Promise<OrganizationSettingsData> {
  const context = await requirePanelAccess("client");
  const membership = context.membership;

  if (!membership) {
    throw new Error("Organizacao ativa nao encontrada.");
  }

  const supabase = await createClient();
  const [organizationResponse, membersResponse] = await Promise.all([
    supabase
      .from("organizations")
      .select(
        "id, name, document, billing_email, contact_email, contact_phone, website_url, instagram_handle, is_active, created_at, updated_at",
      )
      .eq("id", membership.organizationId)
      .maybeSingle<OrganizationSettingsRow>(),
    supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", membership.organizationId)
      .eq("is_active", true),
  ]);

  let organization = organizationResponse.data;
  let hasExtendedWorkspaceFields = true;

  if (organizationResponse.error && hasMissingOrganizationFieldsError(organizationResponse.error)) {
    const fallback = await supabase
      .from("organizations")
      .select("id, name, document, billing_email, is_active, created_at, updated_at")
      .eq("id", membership.organizationId)
      .maybeSingle<OrganizationSettingsRow>();

    if (fallback.error) {
      throw new Error("Nao foi possivel carregar os dados da organizacao.");
    }

    organization = fallback.data
      ? {
          ...fallback.data,
          contact_email: null,
          contact_phone: null,
          website_url: null,
          instagram_handle: null,
        }
      : null;
    hasExtendedWorkspaceFields = false;
  } else if (organizationResponse.error) {
    throw new Error("Nao foi possivel carregar os dados da organizacao.");
  }

  if (!organization) {
    throw new Error("Organizacao ativa nao encontrada.");
  }

  if (membersResponse.error) {
    throw new Error("Nao foi possivel carregar o resumo da equipe.");
  }

  const normalizedOrganization = {
    id: organization.id,
    name: organization.name,
    document: organization.document,
    billingEmail: organization.billing_email ?? null,
    contactEmail: organization.contact_email ?? null,
    contactPhone: organization.contact_phone ?? null,
    websiteUrl: organization.website_url ?? null,
    instagramHandle: organization.instagram_handle ?? null,
    isActive: organization.is_active,
    createdAt: organization.created_at,
    updatedAt: organization.updated_at,
    role: membership.role,
    hasExtendedWorkspaceFields,
  };

  return {
    ...normalizedOrganization,
    activeMembersCount: membersResponse.count ?? 0,
    missingFields: computeOrganizationMissingFields(normalizedOrganization),
  };
}
