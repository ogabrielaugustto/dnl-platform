import { z } from "zod";

export const adminPlanBillingIntervals = ["monthly", "yearly"] as const;
export const adminPlanScanFrequencies = ["hourly", "daily", "weekly", "monthly"] as const;

export type AdminPlanBillingInterval = (typeof adminPlanBillingIntervals)[number];
export type AdminPlanScanFrequency = (typeof adminPlanScanFrequencies)[number];

export type AdminPlanUpdateValues = {
  name: string;
  description: string | null;
  price_cents: number;
  currency: "BRL";
  billing_interval: AdminPlanBillingInterval;
  max_assets: number | null;
  max_team_members: number | null;
  scan_frequency_cap: AdminPlanScanFrequency | null;
  is_active: boolean;
};

export type ParsedAdminPlanForm =
  | {
      data: {
        planId: string;
        values: AdminPlanUpdateValues;
      };
      success: true;
    }
  | {
      message: string;
      success: false;
    };

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parsePriceCents(value: string) {
  const normalized = value
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return Number.NaN;
  }

  return Math.round(Number(normalized) * 100);
}

function parsePositiveIntegerOrNull(value: string) {
  if (!value) {
    return null;
  }

  if (!/^\d+$/.test(value)) {
    return Number.NaN;
  }

  const parsed = Number(value);
  return parsed > 0 ? parsed : Number.NaN;
}

const adminPlanFormSchema = z.object({
  billingInterval: z.enum(adminPlanBillingIntervals),
  description: z.string(),
  isActive: z.boolean(),
  maxAssets: z.number().int().positive().nullable(),
  maxTeamMembers: z.number().int().positive().nullable(),
  name: z.string().min(3, "Informe um nome com pelo menos 3 caracteres."),
  planId: z.uuid("Plano invalido."),
  priceCents: z.number().int().min(0, "Informe um preco maior ou igual a zero."),
  scanFrequencyCap: z.enum(adminPlanScanFrequencies).nullable(),
});

export function parseAdminPlanForm(formData: FormData): ParsedAdminPlanForm {
  const name = readString(formData, "name");

  if (name.length < 3) {
    return {
      message: "Informe um nome com pelo menos 3 caracteres.",
      success: false,
    };
  }

  const priceCents = parsePriceCents(readString(formData, "price"));
  const maxAssets = parsePositiveIntegerOrNull(readString(formData, "maxAssets"));
  const maxTeamMembers = parsePositiveIntegerOrNull(
    readString(formData, "maxTeamMembers"),
  );
  const rawScanFrequencyCap = readString(formData, "scanFrequencyCap");

  const parsed = adminPlanFormSchema.safeParse({
    billingInterval: readString(formData, "billingInterval"),
    description: readString(formData, "description"),
    isActive: readString(formData, "isActive") === "true",
    maxAssets,
    maxTeamMembers,
    name,
    planId: readString(formData, "planId"),
    priceCents,
    scanFrequencyCap: rawScanFrequencyCap === "none" ? null : rawScanFrequencyCap,
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Dados invalidos para o plano.",
      success: false,
    };
  }

  return {
    data: {
      planId: parsed.data.planId,
      values: {
        billing_interval: parsed.data.billingInterval,
        currency: "BRL",
        description: parsed.data.description || null,
        is_active: parsed.data.isActive,
        max_assets: parsed.data.maxAssets,
        max_team_members: parsed.data.maxTeamMembers,
        name: parsed.data.name,
        price_cents: parsed.data.priceCents,
        scan_frequency_cap: parsed.data.scanFrequencyCap,
      },
    },
    success: true,
  };
}

export function formatAdminPlanPriceInput(priceCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(priceCents / 100);
}
