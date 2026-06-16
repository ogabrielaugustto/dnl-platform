"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONSENT_COOKIE_NAME = "dnl_legal_consent";
const CONSENT_STORAGE_KEY = "dnl-legal-consent";
const CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

function persistConsent() {
  const value = "accepted";
  window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; path=/; max-age=${CONSENT_MAX_AGE}; samesite=lax`;
}

function hasConsent() {
  const cookieAccepted = document.cookie
    .split("; ")
    .some((item) => item.startsWith(`${CONSENT_COOKIE_NAME}=accepted`));

  if (cookieAccepted) {
    return true;
  }

  return window.localStorage.getItem(CONSENT_STORAGE_KEY) === "accepted";
}

export function CookieConsentBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hasConsent()) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setOpen(true);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-4 sm:bottom-4 md:left-auto md:right-4 md:max-w-md">
      <div className="overflow-hidden rounded-3xl border bg-background/95 shadow-[0_24px_80px_rgba(37,99,235,0.18)] backdrop-blur">
        <div className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
          <span className="mt-0.5 flex size-10 min-h-10 min-w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheckIcon className="size-5" />
          </span>

          <div className="min-w-0 space-y-3">
            <div className="space-y-2">
              <p className="font-medium text-foreground">Privacidade, LGPD e cookies</p>
              <p className="text-sm leading-6 text-muted-foreground">
                Utilizamos cookies e dados essenciais para autenticação, segurança,
                preferências da interface e melhoria da experiência. Ao continuar,
                você concorda com nossos{" "}
                <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/termos-de-uso">
                  Termos de Uso
                </Link>{" "}
                e com a{" "}
                <Link
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  href="/politica-de-privacidade"
                >
                  Política de Privacidade
                </Link>
                .
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                className="w-full sm:w-auto"
                size="sm"
                onClick={() => {
                  persistConsent();
                  setOpen(false);
                }}
                type="button"
              >
                Aceitar e continuar
              </Button>
              <Button asChild className="w-full sm:w-auto" size="sm" variant="outline">
                <Link href="/politica-de-privacidade">Ler política</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
