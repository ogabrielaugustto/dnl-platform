export const assetLicenseOptions = [
  {
    value: "exclusive",
    label: "Exclusiva",
  },
  {
    value: "non_exclusive",
    label: "Nao exclusiva",
  },
  {
    value: "editorial",
    label: "Editorial",
  },
  {
    value: "institutional",
    label: "Institucional",
  },
  {
    value: "commercial_campaign",
    label: "Campanha comercial",
  },
  {
    value: "licensed_stock",
    label: "Banco de imagem licenciado",
  },
] as const;

export type AssetLicenseType = (typeof assetLicenseOptions)[number]["value"];

const assetLicenseLabelMap = new Map<string, string>(
  assetLicenseOptions.map((option) => [option.value, option.label]),
);

export function getAssetLicenseLabel(value: string | null) {
  if (!value) {
    return null;
  }

  return assetLicenseLabelMap.get(value) ?? value;
}
