"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MailIcon, MessageCircleIcon, SaveIcon } from "lucide-react";
import { toast } from "sonner";
import { updateAdminPlatformContactAction } from "@/app/actions/admin-platform";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminPlatformContactSettings } from "@/lib/dal/admin-platform";

type AdminPlatformContactFormProps = {
  settings: AdminPlatformContactSettings;
};

function formatUpdatedAt(value: string | null) {
  if (!value) {
    return "Ainda nao atualizado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminPlatformContactForm({
  settings,
}: AdminPlatformContactFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [contactEmail, setContactEmail] = useState(settings.contactEmail ?? "");
  const [contactWhatsapp, setContactWhatsapp] = useState(
    settings.contactWhatsapp ?? "",
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateAdminPlatformContactAction(formData);

      if (result.status === "success") {
        toast.success(result.message);
        router.refresh();
        return;
      }

      toast.error(result.message ?? "Nao foi possivel atualizar o contato.");
    });
  }

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-col gap-3 border-b border-border sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Contato publico</CardTitle>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Defina para onde o formulario publico envia mensagens e qual WhatsApp aparece como alternativa na pagina de contato.
          </p>
        </div>
        <Badge variant="outline">Atualizado: {formatUpdatedAt(settings.updatedAt)}</Badge>
      </CardHeader>
      <CardContent className="pt-6">
        <form className="grid gap-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="platform-contact-email">E-mail de destino</Label>
              <div className="relative">
                <MailIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoComplete="email"
                  className="pl-9"
                  disabled={isPending}
                  id="platform-contact-email"
                  name="contactEmail"
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder="contato@direitonalente.com.br"
                  type="email"
                  value={contactEmail}
                />
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                Sem e-mail configurado, o formulario publico nao envia mensagens.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform-contact-whatsapp">WhatsApp publico</Label>
              <div className="relative">
                <MessageCircleIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  disabled={isPending}
                  id="platform-contact-whatsapp"
                  name="contactWhatsapp"
                  onChange={(event) => setContactWhatsapp(event.target.value)}
                  placeholder="(11) 99999-9999"
                  type="tel"
                  value={contactWhatsapp}
                />
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                Quando preenchido, aparece como opcao direta na pagina publica.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button disabled={isPending} type="submit">
              <SaveIcon className="size-4" />
              {isPending ? "Salvando..." : "Salvar contato"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
