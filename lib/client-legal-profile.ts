function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeCpf(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export function formatCpf(value: string) {
  const digits = normalizeCpf(value);
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function isValidCpf(value: string) {
  const digits = normalizeCpf(value);

  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(digits[index]) * (10 - index);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  if (remainder !== Number(digits[9])) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(digits[index]) * (11 - index);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10) {
    remainder = 0;
  }

  return remainder === Number(digits[10]);
}

export type ClientLegalProfile = {
  fullName: string;
  cpf: string;
  formattedCpf: string;
  signerRole: string;
  signingCity: string;
};

export function hasMissingProfileLegalFieldsError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    message?: string;
    details?: string;
  };
  const combinedMessage = `${candidate.message ?? ""} ${candidate.details ?? ""}`;

  return (
    candidate.code === "42703" ||
    combinedMessage.includes("cpf") ||
    combinedMessage.includes("signer_role") ||
    combinedMessage.includes("signing_city")
  );
}

export function validateClientLegalProfile(input: {
  fullName: unknown;
  cpf: unknown;
  signerRole: unknown;
  signingCity: unknown;
}):
  | { ok: true; profile: ClientLegalProfile }
  | { ok: false; message: string } {
  const fullName =
    typeof input.fullName === "string" ? collapseWhitespace(input.fullName) : "";
  if (fullName.length < 3 || fullName.length > 120) {
    return {
      ok: false,
      message: "Informe o nome completo do signatario.",
    };
  }

  const cpf = normalizeCpf(typeof input.cpf === "string" ? input.cpf : "");
  if (!isValidCpf(cpf)) {
    return {
      ok: false,
      message: "Informe um CPF valido para o signatario.",
    };
  }

  const signerRole =
    typeof input.signerRole === "string" ? collapseWhitespace(input.signerRole) : "";
  if (signerRole.length < 2 || signerRole.length > 120) {
    return {
      ok: false,
      message: "Informe a qualificacao do signatario.",
    };
  }

  const signingCity =
    typeof input.signingCity === "string" ? collapseWhitespace(input.signingCity) : "";
  if (signingCity.length < 2 || signingCity.length > 120) {
    return {
      ok: false,
      message: "Informe a cidade de assinatura.",
    };
  }

  return {
    ok: true,
    profile: {
      fullName,
      cpf,
      formattedCpf: formatCpf(cpf),
      signerRole,
      signingCity,
    },
  };
}
