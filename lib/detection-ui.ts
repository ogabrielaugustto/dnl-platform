import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

export type DetectionStatus =
  | "pending"
  | "possible_infringement"
  | "authorized"
  | "unauthorized"
  | "takedown_sent"
  | "resolved"
  | "ignored";

export type EvidenceCaptureStatus =
  | "pending"
  | "processing"
  | "captured"
  | "failed"
  | "skipped";

export type EvidenceCoverageStatus = "captured" | "partial" | "failed" | "pending";

export type DetectionMatchType = "full" | "partial" | "page" | "unknown";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

export function formatDetectionStatus(status: string) {
  switch (status as DetectionStatus) {
    case "pending":
      return "Aguardando validação";
    case "possible_infringement":
      return "Uso não autorizado";
    case "authorized":
      return "Uso autorizado";
    case "unauthorized":
      return "Uso não autorizado";
    case "takedown_sent":
      return "Notificação enviada";
    case "resolved":
      return "Resolvido";
    case "ignored":
      return "Ignorado";
    default:
      return status.replaceAll("_", " ");
  }
}

export function getDetectionStatusHelp(status: string) {
  switch (status as DetectionStatus) {
    case "pending":
      return "A ocorrência foi encontrada, mas ainda precisa da sua análise.";
    case "possible_infringement":
      return "Este registro veio do fluxo anterior e está sendo tratado como uso não autorizado na interface.";
    case "authorized":
      return "O uso encontrado foi considerado permitido ou esperado.";
    case "unauthorized":
      return "Você identificou que o uso não tem autorização.";
    case "takedown_sent":
      return "Já houve uma ação de notificação ou pedido de remoção.";
    case "resolved":
      return "A situação foi tratada e não exige novas ações no momento.";
    case "ignored":
      return "A ocorrência não será acompanhada neste momento.";
    default:
      return "Status da ocorrência.";
  }
}

export function getDetectionStatusVariant(status: string): BadgeVariant {
  switch (status as DetectionStatus) {
    case "possible_infringement":
    case "unauthorized":
      return "destructive";
    case "authorized":
    case "resolved":
      return "secondary";
    case "takedown_sent":
      return "default";
    default:
      return "outline";
  }
}

export function formatEvidenceStatus(status: string) {
  switch (status as EvidenceCaptureStatus) {
    case "pending":
      return "Na fila";
    case "processing":
      return "Capturando";
    case "captured":
      return "Capturada";
    case "failed":
      return "Falhou";
    case "skipped":
      return "Ignorada";
    default:
      return status.replaceAll("_", " ");
  }
}

export function getEvidenceStatusHelp(status: string) {
  switch (status as EvidenceCaptureStatus) {
    case "pending":
      return "A captura da página foi registrada e deve acontecer em breve.";
    case "processing":
      return "A captura visual da página está sendo feita agora.";
    case "captured":
      return "A evidência visual foi capturada com sucesso.";
    case "failed":
      return "Não foi possível capturar a evidência desta vez.";
    case "skipped":
      return "A captura foi ignorada para esta evidência.";
    default:
      return "Status da evidência.";
  }
}

export function getEvidenceStatusVariant(status: string): BadgeVariant {
  switch (status as EvidenceCaptureStatus) {
    case "captured":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}

export function formatEvidenceCoverage(status: string) {
  switch (status as EvidenceCoverageStatus) {
    case "captured":
      return "Cobertura completa";
    case "partial":
      return "Cobertura parcial";
    case "failed":
      return "Sem captura útil";
    case "pending":
      return "Captura pendente";
    default:
      return status.replaceAll("_", " ");
  }
}

export function getEvidenceCoverageHelp(status: string) {
  switch (status as EvidenceCoverageStatus) {
    case "captured":
      return "Cada página deste incidente já possui ao menos uma evidência visual aproveitável.";
    case "partial":
      return "Parte das páginas já tem evidência pronta, mas ainda faltam capturas em outras.";
    case "failed":
      return "Ainda não existe captura útil para as páginas deste recorte.";
    case "pending":
      return "As capturas ainda estão em fila, em processamento ou aguardando nova tentativa.";
    default:
      return "Cobertura de evidência deste recorte.";
  }
}

export function getEvidenceCoverageVariant(status: string): BadgeVariant {
  switch (status as EvidenceCoverageStatus) {
    case "captured":
      return "secondary";
    case "partial":
      return "default";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}

export function formatDetectionMatchType(matchType: string) {
  switch (matchType as DetectionMatchType) {
    case "full":
      return "Correspondência total";
    case "partial":
      return "Correspondência parcial";
    case "page":
      return "Página relacionada";
    default:
      return "Tipo não informado";
  }
}

export function formatSimilarityScore(score: number | null) {
  if (score === null || Number.isNaN(score)) {
    return "Não informado";
  }

  return `${Math.round(score * 100)}%`;
}
