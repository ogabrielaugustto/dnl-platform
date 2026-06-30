"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EraserIcon, PenToolIcon, TypeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  SIGNATURE_CANVAS_HEIGHT,
  SIGNATURE_CANVAS_WIDTH,
  type SignatureInputMode,
  type SignaturePoint,
  type SignatureStroke,
  buildSignatureSvg,
  parseSignaturePayloadJson,
  serializeSignaturePayload,
  validateSignaturePayload,
} from "@/lib/signature";

type ClientSignatureFieldProps = {
  defaultPayloadJson?: string | null;
  defaultSignedName?: string | null;
  description?: string;
  onValidityChange?: (isValid: boolean) => void;
  required?: boolean;
  suggestedSignedName?: string | null;
  title?: string;
};

function getInitialSignatureState(params: {
  defaultPayloadJson?: string | null;
  defaultSignedName?: string | null;
  suggestedSignedName?: string | null;
}) {
  const parsed = parseSignaturePayloadJson(params.defaultPayloadJson);
  const validated = parsed ? validateSignaturePayload(parsed) : null;

  if (validated?.ok) {
    return {
      mode: validated.payload.mode,
      signedName: validated.payload.signedName,
      strokes:
        validated.payload.mode === "draw" ? validated.payload.strokes : ([] as SignatureStroke[]),
      typedText:
        validated.payload.mode === "type" ? validated.payload.typedText : "",
    };
  }

  const fallbackName =
    params.defaultSignedName?.trim() ||
    params.suggestedSignedName?.trim() ||
    "";

  return {
    mode: "draw" as const,
    signedName: fallbackName,
    strokes: [] as SignatureStroke[],
    typedText: fallbackName,
  };
}

function isMeaningfulPoint(point: SignaturePoint, previous: SignaturePoint | null) {
  if (!previous) {
    return true;
  }

  const deltaX = point.x - previous.x;
  const deltaY = point.y - previous.y;

  return Math.hypot(deltaX, deltaY) >= 1.2;
}

export function ClientSignatureField({
  defaultPayloadJson = null,
  defaultSignedName = null,
  description = "Desenhe com dedo ou mouse. Se preferir, use o modo digitado para gerar uma assinatura visual.",
  onValidityChange,
  required = true,
  suggestedSignedName = null,
  title = "Assinatura",
}: ClientSignatureFieldProps) {
  const initialState = useMemo(
    () =>
      getInitialSignatureState({
        defaultPayloadJson,
        defaultSignedName,
        suggestedSignedName,
      }),
    [defaultPayloadJson, defaultSignedName, suggestedSignedName],
  );
  const [mode, setMode] = useState<SignatureInputMode>(initialState.mode);
  const [signedName, setSignedName] = useState(initialState.signedName);
  const [strokes, setStrokes] = useState<SignatureStroke[]>(initialState.strokes);
  const [typedText, setTypedText] = useState(initialState.typedText);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);

  const validation = useMemo(
    () =>
      validateSignaturePayload({
        mode,
        width: SIGNATURE_CANVAS_WIDTH,
        height: SIGNATURE_CANVAS_HEIGHT,
        signedName,
        strokes,
        typedText,
      }),
    [mode, signedName, strokes, typedText],
  );

  const payload = validation.ok ? validation.payload : null;
  const previewSvg = payload ? buildSignatureSvg(payload) : null;

  useEffect(() => {
    onValidityChange?.(validation.ok);
  }, [onValidityChange, validation.ok]);

  function getCanvasPoint(event: ReactPointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();

    if (!rect || rect.width <= 0 || rect.height <= 0) {
      return null;
    }

    return {
      x: Math.min(
        SIGNATURE_CANVAS_WIDTH,
        Math.max(0, ((event.clientX - rect.left) / rect.width) * SIGNATURE_CANVAS_WIDTH),
      ),
      y: Math.min(
        SIGNATURE_CANVAS_HEIGHT,
        Math.max(0, ((event.clientY - rect.top) / rect.height) * SIGNATURE_CANVAS_HEIGHT),
      ),
    } satisfies SignaturePoint;
  }

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (mode !== "draw") {
      return;
    }

    const point = getCanvasPoint(event);

    if (!point || !svgRef.current) {
      return;
    }

    event.preventDefault();
    activePointerIdRef.current = event.pointerId;
    svgRef.current.setPointerCapture(event.pointerId);
    setStrokes((current) => [...current, { points: [point] }]);
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (mode !== "draw" || activePointerIdRef.current !== event.pointerId) {
      return;
    }

    const point = getCanvasPoint(event);

    if (!point) {
      return;
    }

    event.preventDefault();
    setStrokes((current) => {
      if (current.length === 0) {
        return current;
      }

      const next = [...current];
      const lastStroke = next.at(-1);

      if (!lastStroke) {
        return current;
      }

      const previousPoint = lastStroke.points.at(-1) ?? null;

      if (!isMeaningfulPoint(point, previousPoint)) {
        return current;
      }

      next[next.length - 1] = {
        points: [...lastStroke.points, point],
      };

      return next;
    });
  }

  function finishStroke(pointerId: number) {
    if (activePointerIdRef.current !== pointerId) {
      return;
    }

    activePointerIdRef.current = null;
    setStrokes((current) =>
      current.filter((stroke) => stroke.points.length >= 2),
    );
  }

  function handlePointerUp(event: ReactPointerEvent<SVGSVGElement>) {
    finishStroke(event.pointerId);
  }

  function handlePointerCancel(event: ReactPointerEvent<SVGSVGElement>) {
    finishStroke(event.pointerId);
  }

  return (
    <div className="min-w-0 space-y-5 rounded-3xl border border-border bg-muted/10 p-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {required ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
              Obrigatória
            </span>
          ) : null}
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setMode("draw")}
          type="button"
          variant={mode === "draw" ? "default" : "outline"}
        >
          <PenToolIcon className="size-4" />
          Desenhar
        </Button>
        <Button
          onClick={() => setMode("type")}
          type="button"
          variant={mode === "type" ? "default" : "outline"}
        >
          <TypeIcon className="size-4" />
          Digitar
        </Button>
        <Button
          onClick={() => {
            if (mode === "draw") {
              setStrokes([]);
              return;
            }

            setTypedText("");
          }}
          type="button"
          variant="ghost"
        >
          <EraserIcon className="size-4" />
          Limpar
        </Button>
      </div>

      <Field>
        <FieldLabel htmlFor="signatureSignedName">Nome do signatário</FieldLabel>
        <FieldContent>
          <Input
            autoComplete="name"
            id="signatureSignedName"
            name="signatureSignedName"
            onChange={(event) => setSignedName(event.target.value)}
            placeholder="Ex.: Maria Silva"
            required={required}
            type="text"
            value={signedName}
          />
          <FieldDescription>
            Esse nome fica associado à assinatura para uso em termos, contratos e trilhas de
            auditoria.
          </FieldDescription>
        </FieldContent>
      </Field>

      {mode === "draw" ? (
        <div className="space-y-3">
          <div className="rounded-[28px] border border-dashed border-border bg-background p-3">
            <svg
              ref={svgRef}
              aria-label="Quadro para desenhar assinatura"
              className="block w-full touch-none rounded-[20px] bg-white/90 shadow-inner"
              onPointerCancel={handlePointerCancel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              role="img"
              viewBox={`0 0 ${SIGNATURE_CANVAS_WIDTH} ${SIGNATURE_CANVAS_HEIGHT}`}
            >
              <rect
                fill="#ffffff"
                height={SIGNATURE_CANVAS_HEIGHT}
                rx="18"
                width={SIGNATURE_CANVAS_WIDTH}
              />
              {strokes.map((stroke, index) => (
                <polyline
                  key={`${index}-${stroke.points.length}`}
                  fill="none"
                  points={stroke.points.map((point) => `${point.x},${point.y}`).join(" ")}
                  stroke="#111827"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="4.5"
                />
              ))}
              <line
                stroke="#cbd5e1"
                strokeWidth="1.5"
                x1="14"
                x2={SIGNATURE_CANVAS_WIDTH - 14}
                y1={SIGNATURE_CANVAS_HEIGHT - 34}
                y2={SIGNATURE_CANVAS_HEIGHT - 34}
              />
            </svg>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            No celular, use o dedo. No computador, desenhe com o mouse ou trackpad.
          </p>
        </div>
      ) : (
        <Field>
          <FieldLabel htmlFor="signatureTypedText">Como a assinatura deve aparecer</FieldLabel>
          <FieldContent>
            <Input
              id="signatureTypedText"
              name="signatureTypedText"
              onChange={(event) => setTypedText(event.target.value)}
              placeholder="Ex.: Maria Silva"
              required={required}
              type="text"
              value={typedText}
            />
            <FieldDescription>
              Use este modo se preferir gerar uma assinatura visual digitada para reaproveitar em
              documentos.
            </FieldDescription>
          </FieldContent>
        </Field>
      )}

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Pré-visualização</p>
        <div
          className={cn(
            "overflow-hidden rounded-[28px] border bg-white/90 p-4 shadow-inner",
            previewSvg ? "border-border" : "border-dashed border-border",
          )}
        >
          {previewSvg ? (
            <div
              aria-label="Pré-visualização da assinatura"
              className="w-full [&>svg]:h-auto [&>svg]:max-w-full [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          ) : (
            <div className="flex min-h-36 items-center justify-center text-center text-sm leading-6 text-muted-foreground">
              {validation.ok
                ? "Sua assinatura aparecerá aqui."
                : validation.message}
            </div>
          )}
        </div>
      </div>

      <input
        name="signaturePayload"
        type="hidden"
        value={payload ? serializeSignaturePayload(payload) : ""}
      />
    </div>
  );
}
