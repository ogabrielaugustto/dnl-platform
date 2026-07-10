export type LandingCta = {
  label: string;
  href: string;
};

export type LandingHero = {
  eyebrow: string;
  headline: string;
  description: string;
  primaryCta: LandingCta;
  secondaryCta: LandingCta;
};

export type LandingContentItem = {
  title: string;
  description: string;
};

export type LandingWorkflowStep = LandingContentItem & {
  label: string;
};

export type LandingFaqItem = {
  question: string;
  answer: string;
};

export const homeHero: LandingHero = {
  eyebrow: "Monitoramento de imagens com revisão humana",
  headline:
    "Monitore onde suas imagens aparecem antes que o uso não autorizado vire prejuízo.",
  description:
    "Direito na Lente ajuda fotógrafos, agências, estúdios e marcas a subir seus ativos visuais, encontrar ocorrências na web e revisar cada sinal com contexto, evidências e apoio da DNL.",
  primaryCta: {
    label: "Começar teste grátis",
    href: "/auth/register",
  },
  secondaryCta: {
    label: "Falar com a DNL",
    href: "/contato",
  },
};

export const homeHeroHighlights = [
  "Teste grátis para começar pelo painel",
  "Ocorrências organizadas por status e evidência",
  "Apoio humano quando houver uso não autorizado",
];

export const homeProblemPoints: LandingContentItem[] = [
  {
    title: "Busca manual não escala",
    description:
      "Quando o acervo cresce, procurar imagem por imagem vira uma rotina lenta, incompleta e difícil de repetir.",
  },
  {
    title: "Print solto não conta a história",
    description:
      "Sem histórico, status e contexto, a equipe perde tempo tentando entender se uma ocorrência merece revisão agora.",
  },
  {
    title: "Ação jurídica começa depois da validação",
    description:
      "Uma ocorrência não é automaticamente uma infração. Primeiro você revisa o uso, depois a DNL apoia o encaminhamento quando houver uso não autorizado.",
  },
];

export const homeWorkflowSteps: LandingWorkflowStep[] = [
  {
    label: "01",
    title: "Suba seus ativos visuais",
    description:
      "Organize imagens relevantes para monitoramento sem depender de planilhas paralelas.",
  },
  {
    label: "02",
    title: "Acompanhe a varredura",
    description:
      "Veja o que está aguardando, processando ou já trouxe ocorrências para revisão.",
  },
  {
    label: "03",
    title: "Revise com contexto",
    description:
      "Cada ocorrência aparece com status, origem, evidência disponível e leitura operacional.",
  },
  {
    label: "04",
    title: "Acione a DNL quando fizer sentido",
    description:
      "Ao marcar uso não autorizado, o fluxo vira um caso para acompanhamento interno da equipe DNL.",
  },
];

export const homeProductStats = [
  { label: "Ativos monitorados", value: "128" },
  { label: "Ocorrências em revisão", value: "24" },
  { label: "Casos encaminhados", value: "7" },
];

export const homeProductRows = [
  {
    asset: "Campanha editorial - Look 04",
    status: "Aguardando revisão",
    source: "Blog comercial",
    evidence: "Screenshot capturado",
  },
  {
    asset: "Retrato institucional - Cliente B",
    status: "Processando evidência",
    source: "Marketplace",
    evidence: "Em processamento",
  },
  {
    asset: "Produto premium - Coleção 2026",
    status: "Uso não autorizado",
    source: "Anúncio ativo",
    evidence: "Contexto validado",
  },
];

export const homeBenefitCards: LandingContentItem[] = [
  {
    title: "Menos busca manual",
    description:
      "Você troca checagens avulsas por uma rotina de monitoramento com estados claros.",
  },
  {
    title: "Mais clareza antes de agir",
    description:
      "A plataforma separa ocorrência, evidência e validação para evitar decisões apressadas.",
  },
  {
    title: "Histórico centralizado",
    description:
      "Ativos, varreduras, ocorrências e encaminhamentos ficam conectados no mesmo painel.",
  },
  {
    title: "Handoff para a equipe certa",
    description:
      "Quando existe uso não autorizado, a DNL continua o acompanhamento no fluxo administrativo.",
  },
];

export const homeAudienceItems = [
  "Fotógrafos profissionais com acervo comercial recorrente",
  "Agências e estúdios que entregam imagens licenciadas para clientes",
  "Marcas que precisam acompanhar campanhas, produtos e ativos próprios",
  "Times que querem visibilidade antes de transformar ocorrência em caso",
];

export const homeTrustItems: LandingContentItem[] = [
  {
    title: "LGPD como diretriz operacional",
    description:
      "A experiência deixa termos, privacidade e cookies acessíveis desde o início da jornada.",
  },
  {
    title: "Acesso autenticado",
    description:
      "O monitoramento acontece em conta protegida, com separação entre painel do cliente e operação interna da DNL.",
  },
  {
    title: "Leitura responsável",
    description:
      "O produto não trata toda ocorrência como infração automática. A validação humana continua central.",
  },
];

export const homeFaqItems: LandingFaqItem[] = [
  {
    question: "O que acontece depois que eu crio a conta?",
    answer:
      "Você entra no painel, organiza seus dados iniciais e pode começar a cadastrar imagens para monitoramento conforme o plano escolhido.",
  },
  {
    question: "Toda ocorrência encontrada é uma infração?",
    answer:
      "Não. A plataforma apresenta ocorrências para revisão. A decisão sobre autorização, ignorar ou marcar como uso não autorizado depende da validação humana.",
  },
  {
    question: "Quando a DNL entra no processo?",
    answer:
      "A DNL entra com mais força quando uma ocorrência é marcada como uso não autorizado. Esse encaminhamento transforma a revisão em caso para acompanhamento interno.",
  },
  {
    question: "Preciso falar com vendas para começar?",
    answer:
      "Não necessariamente. O caminho principal é cadastro direto com teste grátis. Se sua operação tiver volume, contexto jurídico sensível ou necessidade comercial específica, você pode falar com a DNL.",
  },
  {
    question: "Os planos e valores são reais?",
    answer:
      "Sim. A seção de planos usa os dados cadastrados no sistema, sem tabela fictícia na página.",
  },
];
