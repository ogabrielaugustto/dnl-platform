import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { OrganizationSettingsForm } from "@/app/(client)/(panel)/settings/_components/organization-settings-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOrganizationSettingsData } from "@/lib/dal/settings";

export default async function OrganizationSettingsPage() {
  const organization = await getOrganizationSettingsData();

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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Minha organizacao</CardTitle>
            <CardDescription>
              Mantenha o workspace com dados institucionais claros para operacao, suporte e
              referencia oficial da marca.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationSettingsForm
              defaultValues={{
                billingEmail: organization.billingEmail,
                contactEmail: organization.contactEmail,
                contactPhone: organization.contactPhone,
                document: organization.document,
                instagramHandle: organization.instagramHandle,
                name: organization.name,
                websiteUrl: organization.websiteUrl,
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workspace atual</CardTitle>
              <CardDescription>Visao rapida do estado da organizacao ativa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Papel atual</p>
                <p className="font-medium">{translateRole(organization.role)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Equipe ativa</p>
                <p className="font-medium">
                  {organization.activeMembersCount}{" "}
                  {organization.activeMembersCount === 1 ? "pessoa" : "pessoas"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">
                  {organization.isActive ? "Workspace ativo" : "Workspace inativo"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Atualizado em</p>
                <p className="font-medium">{formatDateTime(organization.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campos recomendados</CardTitle>
              <CardDescription>
                O formulario foi expandido com contatos e referencias oficiais da organizacao.
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
                  Os principais dados do workspace ja estao preenchidos.
                </p>
              )}
              {!organization.hasExtendedWorkspaceFields ? (
                <p className="mt-4 text-sm text-amber-700 dark:text-amber-300">
                  O schema atual ainda nao tem todos os campos novos. A interface continua
                  funcionando, mas a migration precisa ser aplicada no dnl-worker para salvar site,
                  telefone e Instagram.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
