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
      return "Aguardando validacao";
    case "possible_infringement":
      return "Possivel infracao";
    case "authorized":
      return "Uso autorizado";
    case "unauthorized":
      return "Uso nao autorizado";
    case "takedown_sent":
      return "Notificacao enviada";
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
      return "A ocorrencia foi encontrada, mas ainda precisa da sua analise.";
    case "possible_infringement":
      return "Ha sinais de uso indevido, mas a confirmacao final ainda depende da sua avaliacao.";
    case "authorized":
      return "O uso encontrado foi considerado permitido ou esperado.";
    case "unauthorized":
      return "Voce identificou que o uso nao tem autorizacao.";
    case "takedown_sent":
      return "Ja houve uma acao de notificacao ou pedido de remocao.";
    case "resolved":
      return "A situacao foi tratada e nao exige novas acoes no momento.";
    case "ignored":
      return "A ocorrencia nao sera acompanhada neste momento.";
    default:
      return "Status da ocorrencia.";
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
      return "A captura da pagina foi registrada e deve acontecer em breve.";
    case "processing":
      return "A captura visual da pagina esta sendo feita agora.";
    case "captured":
      return "A evidencia visual foi capturada com sucesso.";
    case "failed":
      return "Nao foi possivel capturar a evidencia desta vez.";
    case "skipped":
      return "A captura foi ignorada para esta evidencia.";
    default:
      return "Status da evidencia.";
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
      return "Sem captura util";
    case "pending":
      return "Captura pendente";
    default:
      return status.replaceAll("_", " ");
  }
}

export function getEvidenceCoverageHelp(status: string) {
  switch (status as EvidenceCoverageStatus) {
    case "captured":
      return "Cada pagina deste incidente ja possui ao menos uma evidencia visual aproveitavel.";
    case "partial":
      return "Parte das paginas ja tem evidencia pronta, mas ainda faltam capturas em outras.";
    case "failed":
      return "Ainda nao existe captura util para as paginas deste recorte.";
    case "pending":
      return "As capturas ainda estao em fila, em processamento ou aguardando nova tentativa.";
    default:
      return "Cobertura de evidencia deste recorte.";
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
      return "Correspondencia total";
    case "partial":
      return "Correspondencia parcial";
    case "page":
      return "Pagina relacionada";
    default:
      return "Tipo nao informado";
  }
}

export function formatSimilarityScore(score: number | null) {
  if (score === null || Number.isNaN(score)) {
    return "Nao informado";
  }

  return `${Math.round(score * 100)}%`;
}
