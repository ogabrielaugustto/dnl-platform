export type BillingPlanCode = "basic" | "professional";
export type ListedBillingPlanCode = BillingPlanCode | "custom";
export type BillingInterval = "monthly" | "yearly";
export type BillingCurrency = "BRL";

export type BillingPlanDefinition = {
  id: string;
  code: ListedBillingPlanCode;
  name: string;
  description: string;
  priceCents: number | null;
  currency: BillingCurrency;
  billingInterval: BillingInterval;
  isSelectable: boolean;
  isComingSoon: boolean;
};

export const BILLING_PLAN_CODES = ["basic", "professional"] as const;
export const LISTED_BILLING_PLAN_CODES = ["basic", "professional", "custom"] as const;

export type BillingPlanRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  billing_interval: string;
  is_active: boolean;
};

type ListedBillingPlanRow = BillingPlanRow & {
  code: ListedBillingPlanCode;
};

const listedPlanOrder = new Map(
  LISTED_BILLING_PLAN_CODES.map((code, index) => [code, index]),
);

function isListedBillingPlanRow(row: BillingPlanRow): row is ListedBillingPlanRow {
  return LISTED_BILLING_PLAN_CODES.includes(row.code as ListedBillingPlanCode);
}

function isBillingPlanCode(code: string): code is BillingPlanCode {
  return BILLING_PLAN_CODES.includes(code as BillingPlanCode);
}

export function normalizeBillingPlanRows(
  rows: readonly BillingPlanRow[],
): BillingPlanDefinition[] {
  return rows
    .filter(isListedBillingPlanRow)
    .map((row) => {
      const isCustom = row.code === "custom";
      const isMonthly = row.billing_interval === "monthly";
      const hasBillablePrice = row.price_cents > 0;

      return {
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description ?? "",
        priceCents: isCustom ? null : row.price_cents,
        currency: row.currency.toUpperCase() as BillingCurrency,
        billingInterval: row.billing_interval as BillingInterval,
        isSelectable:
          isBillingPlanCode(row.code) &&
          row.is_active &&
          isMonthly &&
          hasBillablePrice,
        isComingSoon: isCustom || !row.is_active,
      };
    })
    .sort(
      (left, right) =>
        (listedPlanOrder.get(left.code) ?? Number.MAX_SAFE_INTEGER) -
        (listedPlanOrder.get(right.code) ?? Number.MAX_SAFE_INTEGER),
    );
}

export function getSelectableBillingPlanFromRows(
  rows: readonly BillingPlanRow[],
  code: string | null | undefined,
) {
  return getSelectableBillingPlanFromPlans(normalizeBillingPlanRows(rows), code);
}

export function getSelectableBillingPlanFromPlans(
  plans: readonly BillingPlanDefinition[],
  code: string | null | undefined,
) {
  const plan = plans.find((item) => item.code === code) ?? null;

  return plan?.isSelectable ? plan : null;
}

export function formatPlanPrice(priceCents: number | null) {
  if (priceCents === null) {
    return "Em breve";
  }

  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "currency",
  })
    .format(priceCents / 100)
    .replace(/\u00a0/g, " ");
}
