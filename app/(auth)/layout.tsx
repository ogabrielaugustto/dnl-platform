export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="flex min-h-screen flex-col bg-muted/30">{children}</div>;
}
