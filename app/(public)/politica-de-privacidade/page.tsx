import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Informações sobre coleta, uso, armazenamento e direitos de titulares de dados na Direito na Lente, em conformidade com a LGPD.",
};

const sections = [
  {
    title: "1. Compromisso com a LGPD",
    paragraphs: [
      "A Direito na Lente trata dados pessoais em observância à Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018), adotando medidas de governança, segurança e minimização compatíveis com a natureza da plataforma.",
      "Nosso objetivo é utilizar apenas os dados necessários para autenticação, operação da conta, monitoramento contratado, suporte e melhoria controlada da experiência.",
    ],
  },
  {
    title: "2. Quais dados podem ser tratados",
    paragraphs: [
      "Podemos tratar dados cadastrais e de identificação, como nome, e-mail, informações da organização vinculada, cargo ou perfil de acesso, bem como dados técnicos relacionados à autenticação, cookies, navegação, logs e preferências essenciais da interface.",
      "Também podem ser tratados metadados e conteúdos operacionais inseridos na plataforma, como ativos cadastrados, ocorrências, evidências associadas, histórico de revisão e registros de auditoria necessários para o funcionamento do serviço.",
    ],
  },
  {
    title: "3. Finalidades do tratamento",
    paragraphs: [
      "Os dados são utilizados para criar e administrar contas, autenticar usuários, proteger a aplicação contra acessos indevidos, manter segregação por organização, executar fluxos de monitoramento e viabilizar suporte operacional.",
      "Também podemos utilizar dados para cumprimento de obrigações legais, prevenção a fraudes, auditoria, segurança da informação e aperfeiçoamento da experiência, sempre dentro de bases legais adequadas.",
    ],
  },
  {
    title: "4. Cookies e tecnologias semelhantes",
    paragraphs: [
      "Utilizamos cookies e tecnologias equivalentes principalmente para manter sessão autenticada, preservar preferências de navegação, registrar aceite legal, reforçar segurança da interface e melhorar estabilidade de uso.",
      "Ao continuar navegando e aceitar o banner de consentimento, o usuário reconhece esse uso conforme descrito nesta política e nos Termos de Uso.",
    ],
  },
  {
    title: "5. Compartilhamento e armazenamento",
    paragraphs: [
      "Os dados podem ser armazenados em provedores de infraestrutura, autenticação, banco de dados, e-mail transacional e armazenamento de arquivos estritamente relacionados à operação da plataforma, sempre com controles proporcionais de segurança.",
      "Não compartilhamos dados pessoais para finalidades alheias à execução do serviço, salvo quando houver obrigação legal, determinação de autoridade competente ou necessidade técnica vinculada ao funcionamento contratado.",
    ],
  },
  {
    title: "6. Segurança e retenção",
    paragraphs: [
      "Adotamos medidas técnicas e organizacionais razoáveis para proteger dados pessoais contra acesso não autorizado, perda acidental, alteração indevida e tratamento incompatível com a finalidade declarada.",
      "Os dados podem ser mantidos pelo período necessário para execução do serviço, cumprimento de obrigações legais, preservação de logs, defesa em processos e continuidade operacional legítima.",
    ],
  },
  {
    title: "7. Direitos do titular",
    paragraphs: [
      "O titular pode solicitar, nos limites da legislação aplicável, confirmação da existência de tratamento, acesso, correção, atualização, anonimização quando cabível, informação sobre compartilhamentos e revisão de dados inexatos.",
      "Solicitações relacionadas à privacidade e proteção de dados podem ser encaminhadas pelos canais institucionais disponibilizados pela Direito na Lente, observando validação de identidade e escopo legal de atendimento.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      description="Esta política explica como dados pessoais e dados técnicos podem ser coletados, utilizados, armazenados e protegidos durante o uso da plataforma Direito na Lente."
      eyebrow="Privacidade"
      highlightText="Destacamos a conformidade com a LGPD no uso de dados essenciais para autenticação, segurança, monitoramento contratado e continuidade operacional da plataforma."
      highlightTitle="LGPD em destaque"
      sections={sections}
      title="Política de Privacidade"
      updatedAt="12 de junho de 2026"
    />
  );
}
