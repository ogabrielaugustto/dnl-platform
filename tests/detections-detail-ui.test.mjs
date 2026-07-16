import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const actionsPanel = readFileSync(
  new URL("../app/(client)/detections/[id]/_components/incident-actions-panel.tsx", import.meta.url),
  "utf8",
);

const detailsTabs = readFileSync(
  new URL("../app/(client)/detections/[id]/_components/detection-details-tabs.tsx", import.meta.url),
  "utf8",
);

const detectionUi = readFileSync(
  new URL("../lib/detection-ui.ts", import.meta.url),
  "utf8",
);

test("occurrence action panel uses accented Portuguese copy", () => {
  assert.match(actionsPanel, /Ações/);
  assert.match(actionsPanel, /Não é a mesma imagem/);
  assert.match(actionsPanel, /Uso não autorizado/);
  assert.match(actionsPanel, /decisão/);
  assert.match(actionsPanel, /domínio/);
  assert.doesNotMatch(actionsPanel, /Nenhuma decisao registrada ainda/);
});

test("unauthorized-use modal owns responsive width and prevents horizontal overflow", () => {
  assert.match(actionsPanel, /w-\[calc\(100vw-2rem\)\]/);
  assert.match(actionsPanel, /sm:!max-w-3xl/);
  assert.match(actionsPanel, /overflow-hidden/);
  assert.doesNotMatch(actionsPanel, /AlertDialogContent className="[^"]*overflow-y-auto/);
  assert.match(
    actionsPanel,
    /className="grid max-h-\[calc\(100svh-2rem\)\] min-w-0 grid-rows-\[auto_minmax\(0,1fr\)_auto\]"/,
  );
  assert.match(actionsPanel, /<div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">/);
});

test("unauthorized-use modal is split into objective steps", () => {
  assert.match(actionsPanel, /type UnauthorizedDecisionStep = "review" \| "signer" \| "confirm"/);
  assert.match(actionsPanel, /useState<UnauthorizedDecisionStep>\("review"\)/);
  assert.match(actionsPanel, /Ocorrência/);
  assert.match(actionsPanel, /Signatário/);
  assert.match(actionsPanel, /Confirmação/);
  assert.match(actionsPanel, /setStep\("signer"\)/);
  assert.match(actionsPanel, /setStep\("confirm"\)/);
  assert.doesNotMatch(actionsPanel, /lg:grid-cols-\[0\.85fr_1\.15fr\]/);
  assert.doesNotMatch(actionsPanel, /xl:grid-cols-\[minmax\(0,0\.95fr\)_minmax\(0,1\.05fr\)\]/);
});

test("unauthorized-use modal limits and validates CPF input", () => {
  assert.match(actionsPanel, /formatCpfInput\(event\.target\.value\)/);
  assert.match(actionsPanel, /maxLength=\{14\}/);
  assert.match(actionsPanel, /inputMode="numeric"/);
  assert.match(actionsPanel, /autoComplete="off"/);
  assert.match(actionsPanel, /CPF deve ter 11 dígitos válidos\./);
});

test("detection detail tabs only scroll horizontally", () => {
  assert.match(detailsTabs, /Análise/);
  assert.match(detailsTabs, /Páginas/);
  assert.match(detailsTabs, /Evidências/);
  assert.match(detailsTabs, /overflow-x-auto/);
  assert.match(detailsTabs, /overflow-y-hidden/);
});

test("shared detection status copy uses accented Portuguese", () => {
  assert.match(detectionUi, /Aguardando validação/);
  assert.match(detectionUi, /Uso não autorizado/);
  assert.match(detectionUi, /Notificação enviada/);
  assert.doesNotMatch(detectionUi, /Uso nao autorizado/);
});
