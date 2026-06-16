import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LegalSection = {
  title: string;
  paragraphs: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlightTitle: string;
  highlightText: string;
  sections: LegalSection[];
  updatedAt: string;
};

export function LegalPage({
  eyebrow,
  title,
  description,
  highlightTitle,
  highlightText,
  sections,
  updatedAt,
}: LegalPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div className="space-y-5">
          <p className="text-sm font-medium uppercase tracking-[0.32em] text-primary">
            {eyebrow}
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground lg:text-6xl">
            {title}
          </h1>
          <p className="max-w-3xl text-base leading-8 text-muted-foreground lg:text-lg">
            {description}
          </p>
          <p className="text-sm text-muted-foreground">Última atualização: {updatedAt}</p>
        </div>

        <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.92))] shadow-[0_18px_60px_rgba(37,99,235,0.08)]">
          <CardHeader>
            <CardTitle>{highlightTitle}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-muted-foreground">
            {highlightText}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        {sections.map((section) => (
          <Card key={section.title} className="bg-white/90 shadow-[0_14px_40px_rgba(37,99,235,0.05)]">
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground lg:text-base">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
