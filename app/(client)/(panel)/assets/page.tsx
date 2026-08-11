import { redirect } from "next/navigation";

type LegacyAssetsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function buildQueryString(params: Record<string, string | string[] | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      searchParams.set(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, item);
      }
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export default async function LegacyAssetsPage({
  searchParams,
}: LegacyAssetsPageProps) {
  const query = buildQueryString(await searchParams);
  redirect(`/gallery${query}`);
}
