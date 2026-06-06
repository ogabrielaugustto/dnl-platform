import Link from "next/link";
import { ArrowRightIcon, Building2Icon, CircleUserRoundIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrganizationSettingsData, getProfileSettingsData } from "@/lib/dal/settings";

export default async function SettingsPage() {
  const [profile, organization] = await Promise.all([
    getProfileSettingsData(),
    getOrganizationSettingsData(),
  ]);

  const hasMissingOrganizationFields = organization.missingFields.length > 0;

  return (
    <section className="flex flex-1 flex-col gap-6 px-6 py-10 md:px-8">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Configuracoes
        </p>
        <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight">
          Conta e workspace
        </h1>
        <p className="mt-3 max-w-3xl text-base text-muted-foreground">
          Atualize os dados pessoais e revise as informacoes da organizacao para manter o
          workspace pronto para operacao, faturamento e suporte.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CircleUserRoundIcon className="size-5 text-muted-foreground" />
                <Badge variant="outline">Perfil</Badge>
              </div>
              <CardTitle>Dados de acesso</CardTitle>
              <CardDescription>
                Revise nome, avatar e os dados que aparecem na navegacao da equipe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{profile.fullName ?? "Sem nome definido"}</p>
              <p>{profile.email ?? "Sem e-mail"}</p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline">
                <Link href="/settings/profile">
                  Editar perfil
                  <ArrowRightIcon />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <Building2Icon className="size-5 text-muted-foreground" />
                <Badge variant={hasMissingOrganizationFields ? "outline" : "secondary"}>
                  {hasMissingOrganizationFields
                    ? `${organization.missingFields.length} pendencias`
                    : "Completo"}
                </Badge>
              </div>
              <CardTitle>Minha organizacao</CardTitle>
              <CardDescription>
                Centralize dados institucionais, contato principal e referencias oficiais da
                marca.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{organization.name}</p>
              <p>
                {organization.activeMembersCount}{" "}
                {organization.activeMembersCount === 1 ? "membro ativo" : "membros ativos"}
              </p>
              <p>Papel atual: {translateRole(organization.role)}</p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline">
                <Link href="/settings/organization">
                  Editar organizacao
                  <ArrowRightIcon />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>O que revisar agora</CardTitle>
            <CardDescription>
              Estes campos ajudam a deixar o workspace mais claro para operacao e suporte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {organization.missingFields.length > 0 ? (
              <ul className="space-y-2 text-sm text-muted-foreground">
                {organization.missingFields.map((field) => (
                  <li key={field} className="rounded-lg border border-dashed border-border px-3 py-2">
                    {field}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                O perfil da organizacao ja tem os campos essenciais preenchidos.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function translateRole(role: "owner" | "admin" | "member") {
  if (role === "owner") {
    return "Proprietario";
  }

  if (role === "admin") {
    return "Administrador";
  }

  return "Membro";
}
