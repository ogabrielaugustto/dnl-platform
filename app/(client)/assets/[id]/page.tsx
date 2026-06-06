import { redirect } from "next/navigation";

type LegacyAssetDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
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

export default async function LegacyAssetDetailsPage({
  params,
  searchParams,
}: LegacyAssetDetailsPageProps) {
  const [{ id }, currentSearchParams] = await Promise.all([params, searchParams]);
  const query = buildQueryString(currentSearchParams);
  redirect(`/gallery/${id}${query}`);
}
