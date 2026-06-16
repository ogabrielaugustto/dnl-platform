import { MarketingSiteShell } from "@/components/marketing/site-shell";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MarketingSiteShell>{children}</MarketingSiteShell>;
}
