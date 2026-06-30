export const SIGNATURE_PAYLOAD_VERSION = 1 as const;
export const SIGNATURE_CANVAS_WIDTH = 560;
export const SIGNATURE_CANVAS_HEIGHT = 180;

const DRAW_SIGNATURE_MIN_POINTS = 2;
const SIGNATURE_NAME_MIN_LENGTH = 3;
const SIGNATURE_NAME_MAX_LENGTH = 120;
const TYPED_SIGNATURE_MIN_LENGTH = 2;
const TYPED_SIGNATURE_MAX_LENGTH = 120;

export type SignatureInputMode = "draw" | "type";

export type SignaturePoint = {
  x: number;
  y: number;
};

export type SignatureStroke = {
  points: SignaturePoint[];
};

export type DrawSignaturePayload = {
  version: typeof SIGNATURE_PAYLOAD_VERSION;
  mode: "draw";
  width: number;
  height: number;
  signedName: string;
  strokes: SignatureStroke[];
};

export type TypedSignaturePayload = {
  version: typeof SIGNATURE_PAYLOAD_VERSION;
  mode: "type";
  width: number;
  height: number;
  signedName: string;
  typedText: string;
};

export type SignaturePayload = DrawSignaturePayload | TypedSignaturePayload;

export type SignatureRecord = {
  mode: SignatureInputMode;
  payload: SignaturePayload;
  signedName: string;
  svg: string;
};

type SignatureValidationResult =
  | {
      ok: true;
      payload: SignaturePayload;
    }
  | {
      ok: false;
      message: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeDimension(value: unknown, fallback: number) {
  if (!isFiniteNumber(value) || value <= 0) {
    return fallback;
  }

  return Math.round(value);
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeSignedName(value: unknown) {
  return typeof value === "string" ? collapseWhitespace(value) : "";
}

function normalizeTypedText(value: unknown) {
  return typeof value === "string" ? collapseWhitespace(value) : "";
}

function sanitizePoints(
  value: unknown,
  width: number,
  height: number,
): SignaturePoint[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((point) => {
      if (!isRecord(point) || !isFiniteNumber(point.x) || !isFiniteNumber(point.y)) {
        return null;
      }

      return {
        x: clamp(Math.round(point.x * 100) / 100, 0, width),
        y: clamp(Math.round(point.y * 100) / 100, 0, height),
      } satisfies SignaturePoint;
    })
    .filter((point): point is SignaturePoint => point !== null);
}

function sanitizeStrokes(
  value: unknown,
  width: number,
  height: number,
): SignatureStroke[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((stroke) => {
      if (!isRecord(stroke)) {
        return null;
      }

      const points = sanitizePoints(stroke.points, width, height);

      if (points.length < DRAW_SIGNATURE_MIN_POINTS) {
        return null;
      }

      return {
        points,
      } satisfies SignatureStroke;
    })
    .filter((stroke): stroke is SignatureStroke => stroke !== null);
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildDrawSignatureSvg(payload: DrawSignaturePayload) {
  const lines = payload.strokes
    .map((stroke) => {
      const points = stroke.points.map((point) => `${point.x},${point.y}`).join(" ");

      return `<polyline points="${points}" fill="none" stroke="#111827" stroke-linecap="round" stroke-linejoin="round" stroke-width="4.5" />`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${payload.width}" height="${payload.height}" viewBox="0 0 ${payload.width} ${payload.height}" role="img" aria-label="Assinatura de ${escapeXml(payload.signedName)}"><rect width="100%" height="100%" fill="#ffffff" fill-opacity="0" />${lines}<line x1="14" y1="${payload.height - 34}" x2="${payload.width - 14}" y2="${payload.height - 34}" stroke="#cbd5e1" stroke-width="1.5" /><text x="18" y="${payload.height - 12}" font-size="15" font-family="Outfit, Arial, sans-serif" fill="#475569">${escapeXml(payload.signedName)}</text></svg>`;
}

function buildTypedSignatureSvg(payload: TypedSignaturePayload) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${payload.width}" height="${payload.height}" viewBox="0 0 ${payload.width} ${payload.height}" role="img" aria-label="Assinatura digitada de ${escapeXml(payload.signedName)}"><rect width="100%" height="100%" fill="#ffffff" fill-opacity="0" /><text x="18" y="98" font-size="58" font-family="'Snell Roundhand', 'Brush Script MT', 'Segoe Script', cursive" fill="#111827">${escapeXml(payload.typedText)}</text><line x1="14" y1="${payload.height - 34}" x2="${payload.width - 14}" y2="${payload.height - 34}" stroke="#cbd5e1" stroke-width="1.5" /><text x="18" y="${payload.height - 12}" font-size="15" font-family="Outfit, Arial, sans-serif" fill="#475569">${escapeXml(payload.signedName)}</text></svg>`;
}

export function buildSignatureSvg(payload: SignaturePayload) {
  if (payload.mode === "draw") {
    return buildDrawSignatureSvg(payload);
  }

  return buildTypedSignatureSvg(payload);
}

export function validateSignaturePayload(input: unknown): SignatureValidationResult {
  if (!isRecord(input)) {
    return {
      ok: false,
      message: "Configure a assinatura antes de continuar.",
    };
  }

  const signedName = normalizeSignedName(input.signedName);

  if (
    signedName.length < SIGNATURE_NAME_MIN_LENGTH ||
    signedName.length > SIGNATURE_NAME_MAX_LENGTH
  ) {
    return {
      ok: false,
      message: "Informe o nome do signatário para salvar a assinatura.",
    };
  }

  const width = normalizeDimension(input.width, SIGNATURE_CANVAS_WIDTH);
  const height = normalizeDimension(input.height, SIGNATURE_CANVAS_HEIGHT);
  const mode = input.mode;

  if (mode === "draw") {
    const strokes = sanitizeStrokes(input.strokes, width, height);

    if (strokes.length === 0) {
      return {
        ok: false,
        message: "Desenhe a assinatura no quadro antes de continuar.",
      };
    }

    return {
      ok: true,
      payload: {
        version: SIGNATURE_PAYLOAD_VERSION,
        mode,
        width,
        height,
        signedName,
        strokes,
      },
    };
  }

  if (mode === "type") {
    const typedText = normalizeTypedText(input.typedText);

    if (
      typedText.length < TYPED_SIGNATURE_MIN_LENGTH ||
      typedText.length > TYPED_SIGNATURE_MAX_LENGTH
    ) {
      return {
        ok: false,
        message: "Digite como a assinatura deve aparecer antes de continuar.",
      };
    }

    return {
      ok: true,
      payload: {
        version: SIGNATURE_PAYLOAD_VERSION,
        mode,
        width,
        height,
        signedName,
        typedText,
      },
    };
  }

  return {
    ok: false,
    message: "Escolha como deseja configurar a assinatura.",
  };
}

export function createSignatureRecord(input: unknown) {
  const validation = validateSignaturePayload(input);

  if (!validation.ok) {
    return validation;
  }

  return {
    ok: true as const,
    record: {
      mode: validation.payload.mode,
      payload: validation.payload,
      signedName: validation.payload.signedName,
      svg: buildSignatureSvg(validation.payload),
    } satisfies SignatureRecord,
  };
}

export function parseSignaturePayloadJson(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

export function serializeSignaturePayload(payload: SignaturePayload) {
  return JSON.stringify(payload);
}

export function hasMeaningfulSignature(payload: SignaturePayload | null) {
  if (!payload) {
    return false;
  }

  if (payload.mode === "draw") {
    return payload.strokes.length > 0;
  }

  return payload.typedText.trim().length >= TYPED_SIGNATURE_MIN_LENGTH;
}
