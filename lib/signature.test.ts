import assert from "node:assert/strict";
import test from "node:test";

const {
  SIGNATURE_CANVAS_HEIGHT,
  SIGNATURE_CANVAS_WIDTH,
  createSignatureRecord,
  serializeSignaturePayload,
  validateSignaturePayload,
} = await import(new URL("./signature.ts", import.meta.url).href);

test("validates and serializes a drawn signature payload", () => {
  const result = createSignatureRecord({
    mode: "draw",
    width: SIGNATURE_CANVAS_WIDTH,
    height: SIGNATURE_CANVAS_HEIGHT,
    signedName: "  Maria  Silva  ",
    strokes: [
      {
        points: [
          { x: 12.123, y: 28.55 },
          { x: 42.987, y: 44.234 },
          { x: 78.444, y: 58.951 },
        ],
      },
    ],
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.record.mode, "draw");
  assert.equal(result.record.signedName, "Maria Silva");
  if (result.record.payload.mode !== "draw") {
    assert.fail("Expected a drawn signature payload.");
  }

  assert.equal(result.record.payload.strokes[0]?.points.length, 3);
  assert.match(result.record.svg, /polyline/);
  assert.doesNotThrow(() => JSON.parse(serializeSignaturePayload(result.record.payload)));
});

test("validates a typed signature payload", () => {
  const result = createSignatureRecord({
    mode: "type",
    width: SIGNATURE_CANVAS_WIDTH,
    height: SIGNATURE_CANVAS_HEIGHT,
    signedName: "Ana Souza",
    typedText: "Ana Souza",
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.record.payload.mode, "type");
  assert.match(result.record.svg, /Ana Souza/);
  assert.match(result.record.svg, /Segoe Script/);
});

test("rejects an empty drawn signature", () => {
  const result = validateSignaturePayload({
    mode: "draw",
    width: SIGNATURE_CANVAS_WIDTH,
    height: SIGNATURE_CANVAS_HEIGHT,
    signedName: "Cliente Exemplo",
    strokes: [],
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.message, "Desenhe a assinatura no quadro antes de continuar.");
});
