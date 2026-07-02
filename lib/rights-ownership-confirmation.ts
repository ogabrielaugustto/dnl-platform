export const RIGHTS_OWNERSHIP_CONFIRMATION_TEMPLATE_VERSION = "2026-06-30";

const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "marco",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

function toStatementDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid statement date.");
  }

  return date;
}

function buildStatementDateDisplay(signingCity: string, value: Date | string) {
  const date = toStatementDate(value);
  return `${signingCity}, ${date.getUTCDate()} de ${
    MONTH_NAMES[date.getUTCMonth()]
  } de ${date.getUTCFullYear()}.`;
}

function normalizeCpf(value: string) {
  return value.replace(/\D/g, "");
}

function formatCpf(value: string) {
  const digits = normalizeCpf(value);
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatAssetPublicId(value: number) {
  return String(value).padStart(6, "0");
}

export type RightsOwnershipConfirmationDocument = {
  documentType: "rights_ownership_confirmation";
  templateVersion: string;
  assetPublicIds: number[];
  signerFullName: string;
  signerCpf: string;
  signerCpfFormatted: string;
  signerRole: string;
  signingCity: string;
  statementDateIso: string;
  statementDateDisplay: string;
  body: string;
};

export function buildRightsOwnershipConfirmationDocument(input: {
  assetPublicIds: number[];
  signerFullName: string;
  signerCpf: string;
  signerRole: string;
  signingCity: string;
  statementDate: Date | string;
}): RightsOwnershipConfirmationDocument {
  const assetPublicIds = [...input.assetPublicIds];
  const statementDate = toStatementDate(input.statementDate);
  const statementDateDisplay = buildStatementDateDisplay(
    input.signingCity,
    statementDate,
  );
  const signerCpfFormatted = formatCpf(input.signerCpf);
  const imageLines = assetPublicIds
    .map((assetPublicId) => `Imagem: ${formatAssetPublicId(assetPublicId)}`)
    .join("\n");

  const body = [
    "CONFIRMACAO DE PROPRIEDADE DE DIREITOS",
    "",
    "",
    `A declaracao a seguir foi emitida por ${input.signerFullName}, ${input.signerRole}, inscrito`,
    `no CPF/ME sob o n ${signerCpfFormatted}, com relacao as imagens fotograficas a seguir:`,
    imageLines,
    `Confirmo por meio desta, que eu, ${input.signerFullName}, sou o detentor principal e autor`,
    "das imagens fotograficas supramencionadas, detendo os direitos de licenca e uso",
    "dessas imagens fotograficas diretamente ou por meio de minha rede de distribuicao e",
    "representacao.",
    "Isto inclui os direitos exclusivos para obter todas as tutelas judiciais disponiveis (ex.:",
    "cessar e desistir de demandas, reivindicacoes de pagamento e reembolso) com relacao",
    "a qualquer utilizacao nao autorizada da(s) imagem(s) fotografica(s).",
    "Como signatario autorizado, posso confirmar que as verificacoes internas de exigencias",
    "foram feitas para verificar a precisao do supramencionado.",
    statementDateDisplay,
    "_______________________________",
    `Nome Completo: ${input.signerFullName}`,
    `CPF: ${signerCpfFormatted}`,
  ].join("\n");

  return {
    documentType: "rights_ownership_confirmation",
    templateVersion: RIGHTS_OWNERSHIP_CONFIRMATION_TEMPLATE_VERSION,
    assetPublicIds,
    signerFullName: input.signerFullName,
    signerCpf: input.signerCpf,
    signerCpfFormatted,
    signerRole: input.signerRole,
    signingCity: input.signingCity,
    statementDateIso: statementDate.toISOString(),
    statementDateDisplay,
    body,
  };
}
