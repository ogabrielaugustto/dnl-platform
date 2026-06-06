import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { ProfileSettingsForm } from "@/app/(client)/settings/_components/profile-settings-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProfileSettingsData } from "@/lib/dal/settings";

export default async function ProfileSettingsPage() {
  const profile = await getProfileSettingsData();

  return (
    <section className="flex flex-1 flex-col gap-6 px-6 py-10 md:px-8">
      <div className="flex items-center gap-3">
        <Button asChild size="sm" variant="ghost">
          <Link href="/settings">
            <ChevronLeftIcon />
            Voltar
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>
              Atualize os dados da pessoa que acessa o painel. Essas informacoes aparecem na
              navegacao e ajudam a identificar quem esta operando a conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileSettingsForm
              defaultValues={{
                avatarUrl: profile.avatarUrl,
                email: profile.email,
                fullName: profile.fullName,
              }}
            />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Resumo da conta</CardTitle>
            <CardDescription>Informacoes uteis para conferir o acesso atual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">E-mail da conta</p>
              <p className="font-medium">{profile.email ?? "Nao informado"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ultimo acesso registrado</p>
              <p className="font-medium">{formatDateTime(profile.lastSignedInAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Conta criada em</p>
              <p className="font-medium">{formatDateTime(profile.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Ainda sem registro";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
