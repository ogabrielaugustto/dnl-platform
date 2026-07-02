function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeDigits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function isValidCpf(value: string) {
  const digits = normalizeDigits(value);

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

function isValidCnpj(value: string) {
  const digits = normalizeDigits(value);

  if (!/^\d{14}$/.test(digits) || /^(\d)\1{13}$/.test(digits)) {
    return false;
  }

  const calculateCheckDigit = (base: string, factors: number[]) => {
    const sum = base
      .split("")
      .reduce((accumulator, digit, index) => accumulator + Number(digit) * factors[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calculateCheckDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateCheckDigit(`${digits.slice(0, 12)}${firstDigit}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return digits.endsWith(`${firstDigit}${secondDigit}`);
}

export type RegistrationDocument =
  | {
      type: "cpf";
      value: string;
    }
  | {
      type: "cnpj";
      value: string;
    };

export type BrasilApiCompany = {
  cnpj: string;
  legalName: string | null;
  tradeName: string | null;
  postalCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  billingEmail: string | null;
  contactPhone: string | null;
};

type BrasilApiCompanyLookupOptions = {
  fetchImplementation?: typeof fetch;
};

type ViaCepAddressLookupOptions = {
  fetchImplementation?: typeof fetch;
};

export type ViaCepAddress = {
  postalCode: string;
  street: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
};

export function normalizePhone(value: string | null | undefined) {
  return normalizeDigits(value);
}

export function normalizePostalCode(value: string | null | undefined) {
  return normalizeDigits(value);
}

export function formatPostalCode(value: string | null | undefined) {
  const digits = normalizePostalCode(value).slice(0, 8);
  const prefix = digits.slice(0, 5);
  const suffix = digits.slice(5, 8);

  return suffix ? `${prefix}-${suffix}` : prefix;
}

export function formatResolvedAddressLine(input: {
  street: string | null | undefined;
  neighborhood: string | null | undefined;
  city: string | null | undefined;
  state: string | null | undefined;
  number?: string | null | undefined;
  complement?: string | null | undefined;
}) {
  const primary = [
    normalizeOptionalText(input.street),
    normalizeOptionalText(input.number),
    normalizeOptionalText(input.complement),
  ].filter(Boolean).join(", ");

  const cityState = [
    normalizeOptionalText(input.city),
    normalizeOptionalText(input.state),
  ].filter(Boolean).join(" - ");

  return [
    primary || null,
    normalizeOptionalText(input.neighborhood),
    cityState || null,
  ].filter(Boolean).join(" • ");
}

export function formatRegistrationPhone(value: string | null | undefined) {
  const digits = normalizePhone(value).slice(0, 13);
  const countryCode = digits.length > 11 ? digits.slice(0, 2) : "";
  const localDigits = countryCode ? digits.slice(2) : digits;

  if (localDigits.length === 0) {
    return countryCode ? `+${countryCode}` : "";
  }

  if (localDigits.length <= 2) {
    return `${countryCode ? `+${countryCode} ` : ""}(${localDigits}`;
  }

  const areaCode = localDigits.slice(0, 2);
  const subscriberDigits = localDigits.slice(2);

  if (subscriberDigits.length <= 4) {
    return `${countryCode ? `+${countryCode} ` : ""}(${areaCode}) ${subscriberDigits}`;
  }

  const prefixLength = subscriberDigits.length > 8 ? 5 : 4;
  const prefix = subscriberDigits.slice(0, prefixLength);
  const suffix = subscriberDigits.slice(prefixLength, prefixLength + 4);

  return `${countryCode ? `+${countryCode} ` : ""}(${areaCode}) ${prefix}${suffix ? `-${suffix}` : ""}`;
}

export function formatRegistrationDocument(value: string | null | undefined) {
  const digits = normalizeDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    const part1 = digits.slice(0, 3);
    const part2 = digits.slice(3, 6);
    const part3 = digits.slice(6, 9);
    const part4 = digits.slice(9, 11);

    return [part1, part2, part3]
      .filter(Boolean)
      .map((part, index) => {
        if (index < 2 && part.length === 3) {
          return `${part}.`;
        }

        if (index === 2 && part.length === 3 && part4) {
          return `${part}-`;
        }

        return part;
      })
      .join("") + part4;
  }

  const part1 = digits.slice(0, 2);
  const part2 = digits.slice(2, 5);
  const part3 = digits.slice(5, 8);
  const part4 = digits.slice(8, 12);
  const part5 = digits.slice(12, 14);

  let formatted = part1;
  if (part2) {
    formatted += `.${part2}`;
  }
  if (part3) {
    formatted += `.${part3}`;
  }
  if (part4) {
    formatted += `/${part4}`;
  }
  if (part5) {
    formatted += `-${part5}`;
  }

  return formatted;
}

export function validateRegistrationPhone(value: string | null | undefined):
  | { ok: true; phone: string }
  | { ok: false; message: string } {
  const phone = normalizePhone(value);

  if (phone.length < 10 || phone.length > 13) {
    return {
      ok: false,
      message: "Informe um celular valido.",
    };
  }

  return {
    ok: true,
    phone,
  };
}

export function parseRegistrationDocument(value: string | null | undefined):
  | { ok: true; document: RegistrationDocument }
  | { ok: false; message: string } {
  const digits = normalizeDigits(value);

  if (digits.length === 11 && isValidCpf(digits)) {
    return {
      ok: true,
      document: {
        type: "cpf",
        value: digits,
      },
    };
  }

  if (digits.length === 14 && isValidCnpj(digits)) {
    return {
      ok: true,
      document: {
        type: "cnpj",
        value: digits,
      },
    };
  }

  return {
    ok: false,
    message: "Informe um CPF ou CNPJ valido.",
  };
}

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = collapseWhitespace(value ?? "");
  return normalized.length > 0 ? normalized : null;
}

export function normalizeBrasilApiCompany(input: {
  cnpj?: string | null;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  uf?: string | null;
  email?: string | null;
  ddd_telefone_1?: string | null;
}): BrasilApiCompany {
  return {
    cnpj: normalizeDigits(input.cnpj),
    legalName: normalizeOptionalText(input.razao_social),
    tradeName: normalizeOptionalText(input.nome_fantasia),
    postalCode: normalizeOptionalText(normalizePostalCode(input.cep)),
    street: normalizeOptionalText(input.logradouro),
    number: normalizeOptionalText(input.numero),
    complement: normalizeOptionalText(input.complemento),
    neighborhood: normalizeOptionalText(input.bairro),
    city: normalizeOptionalText(input.municipio),
    state: normalizeOptionalText(input.uf),
    billingEmail: normalizeOptionalText(input.email),
    contactPhone: normalizeOptionalText(normalizePhone(input.ddd_telefone_1)),
  };
}

export async function fetchBrasilApiCompany(
  cnpj: string,
  options: BrasilApiCompanyLookupOptions = {},
) {
  const fetchImplementation = options.fetchImplementation ?? fetch;

  try {
    const response = await fetchImplementation(
      `https://brasilapi.com.br/api/cnpj/v1/${normalizeDigits(cnpj)}`,
      {
        headers: {
          accept: "application/json",
        },
        next: {
          revalidate: 60 * 60 * 12,
        },
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      cnpj?: string | null;
      razao_social?: string | null;
      nome_fantasia?: string | null;
      cep?: string | null;
      logradouro?: string | null;
      numero?: string | null;
      complemento?: string | null;
      bairro?: string | null;
      municipio?: string | null;
      uf?: string | null;
      email?: string | null;
      ddd_telefone_1?: string | null;
    };

    return normalizeBrasilApiCompany(payload);
  } catch {
    return null;
  }
}

export async function fetchViaCepAddress(
  postalCode: string,
  options: ViaCepAddressLookupOptions = {},
) {
  const fetchImplementation = options.fetchImplementation ?? fetch;

  try {
    const response = await fetchImplementation(
      `https://viacep.com.br/ws/${normalizePostalCode(postalCode)}/json/`,
      {
        headers: {
          accept: "application/json",
        },
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      cep?: string | null;
      logradouro?: string | null;
      bairro?: string | null;
      localidade?: string | null;
      uf?: string | null;
      erro?: boolean;
    };

    if (payload.erro) {
      return null;
    }

    return {
      postalCode: normalizePostalCode(payload.cep ?? postalCode),
      street: normalizeOptionalText(payload.logradouro),
      neighborhood: normalizeOptionalText(payload.bairro),
      city: normalizeOptionalText(payload.localidade),
      state: normalizeOptionalText(payload.uf),
    } satisfies ViaCepAddress;
  } catch {
    return null;
  }
}

export function buildWorkspaceSuggestion(input: {
  fullName: string;
  documentType: RegistrationDocument["type"];
  company: Pick<BrasilApiCompany, "tradeName" | "legalName"> | null;
}) {
  if (input.documentType === "cnpj") {
    return (
      normalizeOptionalText(input.company?.tradeName) ??
      normalizeOptionalText(input.company?.legalName) ??
      `Workspace de ${collapseWhitespace(input.fullName)}`
    );
  }

  return `Workspace de ${collapseWhitespace(input.fullName)}`;
}

export function validateOnboardingAddress(input: {
  postalCode: string | null | undefined;
  number: string | null | undefined;
  complement: string | null | undefined;
  hasNoComplement: boolean;
}):
  | {
      ok: true;
      address: {
        postalCode: string;
        number: string;
        complement: string | null;
      };
    }
  | { ok: false; message: string } {
  const postalCode = normalizePostalCode(input.postalCode);
  if (postalCode.length !== 8) {
    return {
      ok: false,
      message: "Informe um CEP valido.",
    };
  }

  const number = collapseWhitespace(input.number ?? "");
  if (number.length === 0) {
    return {
      ok: false,
      message: "Informe o numero do endereco.",
    };
  }

  const complement = normalizeOptionalText(input.complement);
  if (!input.hasNoComplement && !complement) {
    return {
      ok: false,
      message: "Informe o complemento ou marque que o endereco nao possui complemento.",
    };
  }

  return {
    ok: true,
    address: {
      postalCode,
      number,
      complement: input.hasNoComplement ? null : complement,
    },
  };
}
