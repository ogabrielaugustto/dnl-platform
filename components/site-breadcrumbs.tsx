"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const labels: Record<string, string> = {
  admin: "Administracao",
  assets: "Galeria",
  audit: "Auditoria",
  dashboard: "Inicio",
  cases: "Casos",
  detections: "Ocorrencias",
  gallery: "Galeria",
  jobs: "Varreduras",
  new: "Novo",
  organization: "Minha organizacao",
  profile: "Perfil",
  reports: "Relatorios",
  scans: "Varreduras",
  settings: "Configuracoes",
};

function getLabel(segment: string) {
  if (labels[segment]) {
    return labels[segment];
  }

  if (/^[0-9a-f-]{6,}$/i.test(segment)) {
    return "Detalhe";
  }

  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function SiteBreadcrumbs() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .filter((segment, index) => !(isAdmin && index === 0));
  const items = segments.map((segment, index) => ({
    href: `${isAdmin ? "/admin" : ""}/${segments.slice(0, index + 1).join("/")}`,
    label: getLabel(segment),
  }));
  const collapsedItems = items.reduce<typeof items>((accumulator, item) => {
    const previousItem = accumulator[accumulator.length - 1];

    if (previousItem?.label === item.label) {
      previousItem.href = item.href;
      return accumulator;
    }

    accumulator.push({ ...item });
    return accumulator;
  }, []);

  const normalizedItems =
    collapsedItems.length > 0
      ? collapsedItems
      : [
          {
            href: isAdmin ? "/admin" : "/dashboard",
            label: isAdmin ? "Visao geral" : "Inicio",
          },
        ];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {normalizedItems.map((item, index) => {
          const isLast = index === normalizedItems.length - 1;

          return (
            <LinkFragment
              href={item.href}
              isFirst={index === 0}
              isLast={isLast}
              key={item.href}
              label={item.label}
            />
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function LinkFragment({
  href,
  isFirst,
  isLast,
  label,
}: {
  href: string;
  isFirst: boolean;
  isLast: boolean;
  label: string;
}) {
  return (
    <>
      {!isFirst ? <BreadcrumbSeparator /> : null}
      <BreadcrumbItem>
        {isLast ? (
          <BreadcrumbPage>{label}</BreadcrumbPage>
        ) : (
          <BreadcrumbLink asChild>
            <Link href={href}>{label}</Link>
          </BreadcrumbLink>
        )}
      </BreadcrumbItem>
    </>
  );
}
