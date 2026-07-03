"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PartyPopperIcon,
  SparklesIcon,
} from "lucide-react";
import { completeCustomerOnboardingAction } from "@/app/actions/auth";
import {
  fetchViaCepAddress,
  formatPostalCode,
  formatResolvedAddressLine,
  normalizePostalCode,
  type ViaCepAddress,
} from "@/lib/customer-onboarding";
import type { PendingSignupOnboarding } from "@/lib/pending-signup-onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: {
  message?: string;
  status?: "error" | "success";
} = {};

const professionOptions = [
  "Fotógrafo",
  "Videomaker",
  "Designer",
  "Agência/Estúdio",
  "Outro",
] as const;

const referralOptions = [
  "Indicação",
  "Google",
  "Instagram",
  "Outro",
] as const;

type CustomerOnboardingWizardProps = {
  initialWorkspaceName: string;
  pendingOnboarding: PendingSignupOnboarding;
};

const confettiPalette = ["#1d4ed8", "#2563eb", "#f59e0b", "#0f766e", "#14b8a6"];

const controlClassName =
  "h-12 rounded-lg border-slate-300 bg-white px-3.5 shadow-none transition-colors placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/15";

const secondaryButtonClassName =
  "h-11 gap-2 rounded-lg border-slate-300 bg-white px-5 text-slate-800 shadow-none hover:bg-slate-50";

const primaryButtonClassName =
  "h-11 gap-2 rounded-lg px-5 shadow-none";

function StepSection({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <section
      className={[
        "py-6 sm:py-8",
        align === "center" ? "text-center" : "",
      ].join(" ")}
    >
      {children}
    </section>
  );
}

function OnboardingProgress({ step, value }: { step: number; value: number }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/92 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-amber-700">
              Onboarding
            </p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              Passo {step} de 6
            </p>
          </div>
          <div className="text-right text-sm font-semibold text-slate-900">
            {value.toFixed(0)}%
            <span className="ml-1 hidden font-normal text-slate-500 sm:inline">
              concluído
            </span>
          </div>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-[width] duration-500"
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    </header>
  );
}

export function CustomerOnboardingWizard({
  initialWorkspaceName,
  pendingOnboarding,
}: CustomerOnboardingWizardProps) {
  const [state, formAction, pending] = useActionState(
    completeCustomerOnboardingAction,
    initialState,
  );
  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState(initialWorkspaceName);
  const [profession, setProfession] = useState<(typeof professionOptions)[number]>(
    "Fotógrafo",
  );
  const [postalCode, setPostalCode] = useState(
    pendingOnboarding.company?.postalCode ?? "",
  );
  const [addressNumber, setAddressNumber] = useState(
    pendingOnboarding.company?.number ?? "",
  );
  const [addressComplement, setAddressComplement] = useState(
    pendingOnboarding.company?.complement ?? "",
  );
  const [hasNoComplement, setHasNoComplement] = useState(
    !pendingOnboarding.company?.complement,
  );
  const [referralSource, setReferralSource] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState<ViaCepAddress | null>(
    pendingOnboarding.company
      ? {
          postalCode: pendingOnboarding.company.postalCode ?? "",
          street: pendingOnboarding.company.street,
          neighborhood: pendingOnboarding.company.neighborhood,
          city: pendingOnboarding.company.city,
          state: pendingOnboarding.company.state,
        }
      : null,
  );
  const [isPostalCodeLoading, setIsPostalCodeLoading] = useState(false);

  const currentStep = state.status === "success" ? 6 : step;
  const progressValue = useMemo(() => (currentStep / 6) * 100, [currentStep]);
  const companyAddressPreview = useMemo(() => {
    if (!pendingOnboarding.company) {
      return null;
    }

    return [
      pendingOnboarding.company.street,
      pendingOnboarding.company.neighborhood,
      pendingOnboarding.company.city,
      pendingOnboarding.company.state,
    ]
      .filter(Boolean)
      .join(" • ");
  }, [pendingOnboarding.company]);
  const resolvedAddressLine = useMemo(() => {
    if (!resolvedAddress) {
      return null;
    }

    return formatResolvedAddressLine({
      street: resolvedAddress.street,
      neighborhood: resolvedAddress.neighborhood,
      city: resolvedAddress.city,
      state: resolvedAddress.state,
      number: addressNumber,
      complement: hasNoComplement ? null : addressComplement,
    });
  }, [addressComplement, addressNumber, hasNoComplement, resolvedAddress]);

  useEffect(() => {
    const normalizedPostalCode = normalizePostalCode(postalCode);

    if (normalizedPostalCode.length !== 8) {
      return;
    }

    const controller = new AbortController();
    let isCurrent = true;

    async function loadPostalCode() {
      setIsPostalCodeLoading(true);
      const address = await fetchViaCepAddress(normalizedPostalCode, {
        fetchImplementation: (input, init) =>
          fetch(input, {
            ...init,
            signal: controller.signal,
          }),
      });

      if (!isCurrent) {
        return;
      }

      setResolvedAddress(address);
      setIsPostalCodeLoading(false);
    }

    void loadPostalCode();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [postalCode]);

  useEffect(() => {
    if (currentStep !== 6 || state.status !== "success") {
      return;
    }

    const duration = 2400;
    const animationEnd = Date.now() + duration;
    const defaults = {
      colors: confettiPalette,
      disableForReducedMotion: true,
      scalar: 0.95,
      startVelocity: 34,
      ticks: 220,
      zIndex: 40,
    };

    void confetti({
      ...defaults,
      particleCount: 120,
      spread: 78,
      origin: { y: 0.18 },
    });

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        window.clearInterval(interval);
        return;
      }

      const particleCount = Math.round(34 * (timeLeft / duration));

      void confetti({
        ...defaults,
        angle: 60,
        origin: { x: 0, y: 0.54 },
        particleCount,
        spread: 62,
      });
      void confetti({
        ...defaults,
        angle: 120,
        origin: { x: 1, y: 0.54 },
        particleCount,
        spread: 62,
      });
    }, 260);

    return () => {
      window.clearInterval(interval);
      confetti.reset();
    };
  }, [currentStep, state.status]);

  function goNext() {
    setStep((current) => Math.min(6, current + 1));
  }

  function goBack() {
    setStep((current) => Math.max(1, current - 1));
  }

  function canAdvance() {
    if (step === 1) {
      return true;
    }

    if (step === 2) {
      return workspaceName.trim().length >= 2;
    }

    if (step === 3) {
      return profession.trim().length >= 2;
    }

    if (step === 4) {
      if (postalCode.replace(/\D/g, "").length !== 8) {
        return false;
      }

      if (addressNumber.trim().length === 0) {
        return false;
      }

      if (!hasNoComplement && addressComplement.trim().length === 0) {
        return false;
      }
    }

    return true;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffaf1_0%,#ffffff_34%,#f8fafc_100%)] text-slate-950">
      <OnboardingProgress step={currentStep} value={progressValue} />

      <main className="mx-auto flex min-h-[calc(100svh-4.5rem)] w-full max-w-5xl flex-col px-4 pb-6 pt-8 sm:px-6 sm:pb-10">
        <form action={formAction} className="flex flex-1 flex-col">
            <input name="workspaceName" type="hidden" value={workspaceName} />
            <input name="profession" type="hidden" value={profession} />
            <input name="postalCode" type="hidden" value={postalCode} />
            <input name="addressNumber" type="hidden" value={addressNumber} />
            <input
              name="addressComplement"
              type="hidden"
              value={hasNoComplement ? "" : addressComplement}
            />
            <input
              name="hasNoComplement"
              type="hidden"
              value={hasNoComplement ? "on" : ""}
            />
            <input name="referralSource" type="hidden" value={referralSource} />

            {currentStep === 1 ? (
              <StepSection align="center">
                <div className="space-y-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-800">
                    <SparklesIcon className="h-8 w-8" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                      Sua conta foi criada
                    </p>
                    <h2 className="text-3xl font-semibold tracking-tight text-balance text-slate-950 sm:text-4xl">
                      Boas-vindas, {pendingOnboarding.fullName}
                    </h2>
                    <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                      Agora vamos preparar seu workspace em poucos passos, com tudo centralizado
                      e sem distração, para você começar a subir suas imagens com a conta pronta.
                    </p>
                  </div>
                </div>
              </StepSection>
            ) : null}

            {currentStep === 2 ? (
              <StepSection>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Identidade do workspace
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
                    Como você quer chamar seu workspace?
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600">
                    Você poderá ajustar esse nome depois nas configurações da organização.
                  </p>
                </div>

                <FieldGroup className="mt-8 gap-4">
                  <Field>
                    <FieldLabel
                      className="text-sm font-medium text-slate-900"
                      htmlFor="workspaceName"
                    >
                      Nome do workspace
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        className={controlClassName}
                        id="workspaceName"
                        onChange={(event) => setWorkspaceName(event.target.value)}
                        placeholder="Ex.: Studio Silva"
                        value={workspaceName}
                      />
                      <FieldDescription>
                        Sugestão inicial baseada no seu cadastro:{" "}
                        <strong>{initialWorkspaceName}</strong>
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldGroup>
              </StepSection>
            ) : null}

            {currentStep === 3 ? (
              <StepSection>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Perfil profissional
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
                    Qual é a sua profissão?
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600">
                    Isso nos ajuda a personalizar melhor sua experiência inicial.
                  </p>
                </div>

                <FieldGroup className="mt-8 gap-4">
                  <Field>
                    <FieldLabel className="text-sm font-medium text-slate-900">
                      Sua profissão
                    </FieldLabel>
                    <FieldContent>
                      <Select
                        onValueChange={(value) =>
                          setProfession(
                            value as (typeof professionOptions)[number],
                          )
                        }
                        value={profession}
                      >
                        <SelectTrigger className={`${controlClassName} w-full`}>
                          <SelectValue placeholder="Selecione uma profissão" />
                        </SelectTrigger>
                        <SelectContent>
                          {professionOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldContent>
                  </Field>
                </FieldGroup>
              </StepSection>
            ) : null}

            {currentStep === 4 ? (
              <StepSection>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Endereço
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
                    Vamos confirmar seu endereço
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600">
                    {pendingOnboarding.documentType === "cnpj"
                      ? "Trouxemos os dados principais do CNPJ para você apenas confirmar."
                      : "Precisamos só do CEP e do número para fechar o cadastro inicial."}
                  </p>
                </div>

                {companyAddressPreview ? (
                  <div className="mt-6 border-l-2 border-amber-400 bg-amber-50/70 px-4 py-3 text-sm leading-6 text-amber-950">
                    {companyAddressPreview}
                  </div>
                ) : null}

                <FieldGroup className="mt-8 gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel
                        className="text-sm font-medium text-slate-900"
                        htmlFor="postalCode"
                      >
                        CEP
                      </FieldLabel>
                      <FieldContent>
                        <div className="relative">
                          <Input
                            className={[
                              controlClassName,
                              isPostalCodeLoading ? "pr-10" : "",
                            ].join(" ")}
                            id="postalCode"
                            inputMode="numeric"
                            maxLength={9}
                            onChange={(event) => {
                              const formattedPostalCode = formatPostalCode(
                                event.target.value,
                              );
                              setPostalCode(formattedPostalCode);

                              if (
                                normalizePostalCode(formattedPostalCode).length !== 8
                              ) {
                                setIsPostalCodeLoading(false);
                                setResolvedAddress(null);
                              }
                            }}
                            placeholder="00000-000"
                            value={postalCode}
                          />
                          {isPostalCodeLoading ? (
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                              <Spinner className="size-4 text-muted-foreground" />
                            </span>
                          ) : null}
                        </div>
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel
                        className="text-sm font-medium text-slate-900"
                        htmlFor="addressNumber"
                      >
                        Número
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          className={controlClassName}
                          id="addressNumber"
                          onChange={(event) => setAddressNumber(event.target.value)}
                          placeholder="Ex.: 1000"
                          value={addressNumber}
                        />
                      </FieldContent>
                    </Field>
                  </div>

                  <Field>
                    <FieldContent>
                      <label
                        className="flex items-center gap-2 text-sm"
                        htmlFor="hasNoComplement"
                      >
                        <input
                          checked={hasNoComplement}
                          id="hasNoComplement"
                          onChange={(event) => setHasNoComplement(event.target.checked)}
                          type="checkbox"
                        />
                        <span>Marque se esse endereço não tem complemento.</span>
                      </label>
                    </FieldContent>
                  </Field>

                  {!hasNoComplement ? (
                    <Field>
                      <FieldLabel
                        className="text-sm font-medium text-slate-900"
                        htmlFor="addressComplement"
                      >
                        Complemento
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          className={controlClassName}
                          id="addressComplement"
                          onChange={(event) =>
                            setAddressComplement(event.target.value)
                          }
                          placeholder="Ex.: sala 4, conjunto 12"
                          value={addressComplement}
                        />
                      </FieldContent>
                    </Field>
                  ) : null}

                  {resolvedAddressLine ? (
                    <div className="border-l-2 border-blue-600 bg-blue-50/70 px-4 py-3 text-sm leading-6 text-slate-800">
                      <span className="font-medium text-slate-950">Endereço encontrado:</span>{" "}
                      {resolvedAddressLine}
                    </div>
                  ) : null}
                </FieldGroup>
              </StepSection>
            ) : null}

            {currentStep === 5 ? (
              <StepSection>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Origem
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
                    Como você nos encontrou?
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600">
                    Esse passo é opcional e nos ajuda a entender o que está funcionando.
                  </p>
                </div>

                <FieldGroup className="mt-8 gap-4">
                  <Field>
                    <FieldLabel className="text-sm font-medium text-slate-900">
                      Origem
                    </FieldLabel>
                    <FieldContent>
                      <Select onValueChange={setReferralSource} value={referralSource}>
                        <SelectTrigger className={`${controlClassName} w-full`}>
                          <SelectValue placeholder="Selecione uma opção" />
                        </SelectTrigger>
                        <SelectContent>
                          {referralOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldContent>
                  </Field>
                </FieldGroup>
              </StepSection>
            ) : null}

            {currentStep === 6 ? (
              <section className="flex flex-1 items-center justify-center py-8 text-center sm:py-10">
                <div className="relative space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800">
                    <PartyPopperIcon className="h-8 w-8" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                    Tudo pronto
                  </p>
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                    Cadastro finalizado
                  </h2>
                  <p className="mx-auto max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                    Seja bem-vindo. Seu workspace já está pronto e você poderá
                    seguir direto para a tela inicial para começar a subir suas imagens.
                  </p>
                  <div className="pt-4">
                    <Button asChild className="h-11 rounded-lg px-6 shadow-none">
                      <Link
                        href={
                          pendingOnboarding.preferredPlanCode
                            ? `/billing?plan=${pendingOnboarding.preferredPlanCode}`
                            : "/billing"
                        }
                      >
                        Escolher plano
                      </Link>
                    </Button>
                  </div>
                </div>
              </section>
            ) : null}

            {state.status === "error" && state.message ? (
              <FieldError>{state.message}</FieldError>
            ) : null}

            {currentStep < 6 ? (
              <div className="mt-auto flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-slate-500">
                  {currentStep === 5
                    ? "Ao continuar, salvaremos suas informações e concluiremos o cadastro."
                    : "Leva menos de um minuto para terminar."}
                </p>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {currentStep > 1 ? (
                    <Button
                      className={secondaryButtonClassName}
                      disabled={pending}
                      onClick={goBack}
                      type="button"
                      variant="outline"
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                      Voltar
                    </Button>
                  ) : null}

                  {currentStep < 5 ? (
                    <Button
                      className={primaryButtonClassName}
                      disabled={!canAdvance() || pending}
                      onClick={goNext}
                      type="button"
                    >
                      Avançar
                      <ArrowRightIcon className="h-4 w-4" />
                    </Button>
                  ) : null}

                  {currentStep === 5 ? (
                    <>
                      <Button
                        className={secondaryButtonClassName}
                        disabled={pending}
                        type="submit"
                        variant="outline"
                      >
                        {pending ? "Salvando..." : "Pular"}
                      </Button>
                      <Button
                        className={primaryButtonClassName}
                        disabled={!canAdvance() || pending}
                        type="submit"
                      >
                        {pending ? "Salvando..." : "Avançar"}
                        {!pending ? <ArrowRightIcon className="h-4 w-4" /> : null}
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
        </form>
      </main>
    </div>
  );
}
