"use server";

import { z } from "zod";
import { sendContactLeadEmail } from "@/lib/email/service";

type PublicActionState = {
  message?: string;
  status?: "error" | "success";
};

const contactSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome."),
  email: z.email("Informe um e-mail valido."),
  organization: z.string().trim().optional(),
  message: z.string().trim().min(20, "Descreva sua necessidade com um pouco mais de contexto."),
});

export async function submitContactFormAction(
  _: PublicActionState,
  formData: FormData,
): Promise<PublicActionState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    organization: formData.get("organization"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados invalidos.",
    };
  }

  try {
    await sendContactLeadEmail({
      name: parsed.data.name,
      email: parsed.data.email,
      organization: parsed.data.organization?.trim() || null,
      message: parsed.data.message,
    });
  } catch {
    return {
      status: "error",
      message:
        "Nao foi possivel enviar sua mensagem agora. Tente novamente em instantes.",
    };
  }

  return {
    status: "success",
    message:
      "Mensagem enviada. Nossa equipe vai retornar usando o e-mail informado.",
  };
}
