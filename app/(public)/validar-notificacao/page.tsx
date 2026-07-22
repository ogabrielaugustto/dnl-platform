import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheckIcon,
  FileSearchIcon,
  ReplyIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPublicCaseValidationDetails } from "@/lib/dal/case-public-validation";
import { formatPublicId } from "@/lib/public-id";

export const metadata: Metadata = {
  title: "Validar notificação",
  description:
    "Confirme se uma notificação recebida em nome da Direito na Lente corresponde a um registro real.",
};

type ValidateNotificationPageProps = {
  searchParams: Promise<{
    codigo?: string | string[];
    chave?: string | string[];
  }>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseCasePublicIdInput(value: string | undefined) {
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  const parsed = Number.parseInt(digits, 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function PublicInfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border bg-white p-4 shadow-sm shadow-primary/5">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function PublicImagePanel({
  title,
  imageUrl,
  fallback,
}: {
  title: string;
  imageUrl: string | null;
  fallback: string;
}) {
  return (
    <section className="rounded-md border bg-white p-4 shadow-sm shadow-primary/5">
      <h2 className="font-heading text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md border bg-slate-50">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-contain"
          />
        ) : (
          <p className="max-w-xs px-4 text-center text-sm leading-6 text-muted-foreground">
            {fallback}
          </p>
        )}
      </div>
    </section>
  );
}

function InitialState() {
  return (
    <div className="rounded-md border bg-white p-5 shadow-sm shadow-primary/5">
      <div className="flex items-start gap-3">
        <ShieldCheckIcon className="mt-1 size-5 shrink-0 text-primary" />
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Confirme a origem da comunicação
          </h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Informe o ID do caso e a chave de validação recebidos no e-mail da
            Direito na Lente. A consulta mostra apenas os dados mínimos para
            conferência do registro.
          </p>
        </div>
      </div>
    </div>
  );
}

function InvalidState() {
  return (
    <Alert variant="destructive" className="bg-white">
      <FileSearchIcon className="size-4" />
      <AlertTitle>Não foi possível validar essa notificação.</AlertTitle>
      <AlertDescription>
        Confira o ID do caso e a chave recebidos no e-mail. Por segurança, a
        página não informa se apenas um dos campos está correto.
      </AlertDescription>
    </Alert>
  );
}

export default async function ValidateNotificationPage({
  searchParams,
}: ValidateNotificationPageProps) {
  const resolvedSearchParams = await searchParams;
  const codeInput = getSearchValue(resolvedSearchParams.codigo) ?? "";
  const validationCodeInput = getSearchValue(resolvedSearchParams.chave) ?? "";
  const hasSubmitted = Boolean(codeInput || validationCodeInput);
  const casePublicId = parseCasePublicIdInput(codeInput);
  const validation =
    hasSubmitted && casePublicId && validationCodeInput
      ? await getPublicCaseValidationDetails({
          casePublicId,
          validationCode: validationCodeInput,
        })
      : null;
  const originalImageUrl =
    validation?.hasOriginalImage && casePublicId
      ? `/api/public/case-validation/${casePublicId}/image/original?chave=${encodeURIComponent(validationCodeInput)}`
      : null;
  const matchedImageUrl =
    validation?.hasMatchedImage && casePublicId
      ? `/api/public/case-validation/${casePublicId}/image/matched?chave=${encodeURIComponent(validationCodeInput)}`
      : null;

  return (
    <div className="bg-[linear-gradient(180deg,#f5f8ff_0%,#ffffff_42%,#f8fbff_100%)]">
      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-16">
        <div className="space-y-6">
          <Badge variant="outline" className="h-7 rounded-md bg-white px-3">
            <BadgeCheckIcon className="size-3.5" />
            Canal oficial DNL
          </Badge>
          <div className="space-y-4">
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Validar notificação
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              Use esta página para confirmar se uma comunicação recebida em nome
              da Direito na Lente corresponde a um registro real da plataforma.
            </p>
          </div>

          <form
            action="/validar-notificacao"
            className="grid gap-4 rounded-md border bg-white p-5 shadow-sm shadow-primary/5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="codigo"
                >
                  ID do caso
                </label>
                <Input
                  id="codigo"
                  name="codigo"
                  placeholder="#123456"
                  defaultValue={codeInput}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="chave"
                >
                  Chave de validação
                </label>
                <Input
                  id="chave"
                  name="chave"
                  placeholder="ABCD-1234-EFGH-5678"
                  defaultValue={validationCodeInput}
                  autoComplete="off"
                />
              </div>
            </div>

            <Button className="h-10 w-full sm:w-fit" type="submit">
              <SearchIcon className="size-4" />
              Validar notificação
            </Button>
          </form>
        </div>

        <div className="space-y-4">
          {!hasSubmitted ? <InitialState /> : null}
          {hasSubmitted && !validation ? <InvalidState /> : null}
          {validation ? (
            <section className="space-y-4">
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
                <div className="flex items-start gap-3">
                  <BadgeCheckIcon className="mt-1 size-5 shrink-0" />
                  <div>
                    <h2 className="font-heading text-xl font-semibold tracking-tight">
                      Notificação validada
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-emerald-900/80">
                      Este ID e esta chave correspondem a um registro emitido
                      pela Direito na Lente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <PublicInfoBlock
                  label="Caso"
                  value={formatPublicId(validation.casePublicId)}
                />
                <PublicInfoBlock label="Domínio" value={validation.domain} />
                <PublicInfoBlock label="Site" value={validation.siteTitle} />
                <PublicInfoBlock
                  label="Data e hora"
                  value={formatDateTime(validation.capturedAt ?? validation.detectedAt)}
                />
              </div>
            </section>
          ) : null}
        </div>
      </section>

      {validation ? (
        <section className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20">
          <div className="grid gap-4 lg:grid-cols-2">
            <PublicImagePanel
              title="Imagem original"
              imageUrl={originalImageUrl}
              fallback="A imagem original não está disponível nesta validação pública."
            />
            <PublicImagePanel
              title="Imagem identificada"
              imageUrl={matchedImageUrl}
              fallback="A imagem identificada não está disponível nesta validação pública."
            />
          </div>

          <div className="mt-5 rounded-md border bg-white p-5 shadow-sm shadow-primary/5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2">
                  <ReplyIcon className="size-5 text-primary" />
                  <h2 className="font-heading text-xl font-semibold tracking-tight">
                    Responda pelo e-mail recebido
                  </h2>
                </div>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Caso você tenha ciência da notificação, já tenha removido o
                  conteúdo ou queira negociar uma composição, responda
                  diretamente ao e-mail recebido para manter o histórico da
                  tratativa.
                </p>
              </div>
              <Button asChild variant="outline" className="w-full md:w-auto">
                <Link href="/contato">Falar com a DNL</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
