import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Condições de uso da plataforma Direito na Lente para clientes, usuários vinculados e equipe autorizada.",
};

const sections = [
  {
    title: "1. Objeto da plataforma",
    paragraphs: [
      "A Direito na Lente disponibiliza uma plataforma para cadastro de ativos visuais, acompanhamento de monitoramento, revisão de ocorrências e encaminhamento operacional de casos relacionados a possíveis usos não autorizados de imagem.",
      "A plataforma não substitui avaliação jurídica individualizada e não transforma automaticamente uma detecção em infração. Toda classificação depende de contexto, evidência e validação humana.",
    ],
  },
  {
    title: "2. Aceite e responsabilidade do usuário",
    paragraphs: [
      "Ao acessar ou utilizar a aplicação, o usuário declara que possui poderes para representar sua organização ou que está devidamente autorizado a operar a conta vinculada.",
      "O usuário é responsável pela veracidade das informações enviadas, pela segurança das credenciais de acesso e pela utilização adequada da plataforma dentro da legislação aplicável.",
    ],
  },
  {
    title: "3. Uso permitido",
    paragraphs: [
      "É permitido utilizar a plataforma para cadastrar imagens, acompanhar resultados, revisar ocorrências, organizar evidências e interagir com os fluxos internos disponibilizados pela Direito na Lente.",
      "Não é permitido utilizar a aplicação para práticas ilícitas, tentativa de acesso indevido, engenharia reversa maliciosa, compartilhamento indevido de credenciais ou inserção de conteúdos sem legitimidade de uso.",
    ],
  },
  {
    title: "4. Conta, acesso e segurança",
    paragraphs: [
      "O acesso a áreas autenticadas depende de credenciais válidas e, quando aplicável, vinculação do usuário a uma organização ou perfil administrativo apropriado.",
      "A Direito na Lente pode adotar medidas de segurança, suspensão preventiva de acesso ou revisão de permissões quando identificar risco operacional, uso indevido ou necessidade de preservação da integridade da plataforma.",
    ],
  },
  {
    title: "5. Limites do monitoramento",
    paragraphs: [
      "Resultados de monitoramento, screenshots, evidências e dados correlatos possuem natureza operacional de apoio, podendo depender de terceiros, disponibilidade de fontes externas e processamento assíncrono.",
      "A Direito na Lente não garante que toda ocorrência relevante será localizada, nem que toda evidência poderá ser capturada com sucesso em todos os cenários técnicos.",
    ],
  },
  {
    title: "6. Privacidade e LGPD",
    paragraphs: [
      "O tratamento de dados pessoais relacionado ao uso da plataforma segue a Política de Privacidade e observa princípios da Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018), incluindo necessidade, adequação, segurança e transparência.",
      "Ao utilizar a aplicação, o usuário declara estar ciente de que determinados dados técnicos e cadastrais podem ser tratados para autenticação, segurança, continuidade operacional e execução dos serviços contratados.",
    ],
  },
  {
    title: "7. Propriedade intelectual e continuidade",
    paragraphs: [
      "Os elementos da plataforma, incluindo interface, fluxos, marca, estrutura de informação e software, permanecem protegidos pela legislação aplicável, sem transferência de titularidade ao usuário.",
      "A Direito na Lente pode atualizar funcionalidades, textos institucionais, mecanismos de segurança e estes Termos de Uso sempre que necessário para evolução do serviço ou adequação legal.",
    ],
  },
];

export default function TermsOfUsePage() {
  return (
    <LegalPage
      description="Estas condições regulam o acesso e o uso da plataforma Direito na Lente por clientes, membros de organizações vinculadas e usuários administrativos autorizados."
      eyebrow="Termos legais"
      highlightText="A plataforma foi desenhada para apoiar monitoramento, revisão e organização operacional. Nenhuma detecção é tratada como conclusão automática de infração sem validação humana."
      highlightTitle="Resumo importante"
      sections={sections}
      title="Termos de Uso"
      updatedAt="12 de junho de 2026"
    />
  );
}
