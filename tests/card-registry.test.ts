import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("card registry exposes the supported theme cards only", async () => {
  const registryText = await readFile(new URL("../lib/card-registry.ts", import.meta.url), "utf8");
  const socialCardText = await readFile(
    new URL("../components/cards/SocialNoteCard.tsx", import.meta.url),
    "utf8",
  );
  const editorialCardText = await readFile(
    new URL("../components/cards/EditorialCard.tsx", import.meta.url),
    "utf8",
  );
  const terminalCardText = await readFile(
    new URL("../components/cards/TerminalCard.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(registryText, /defaultCard/);
  assert.match(registryText, /socialNoteCard/);
  assert.match(registryText, /editorialCard/);
  assert.match(registryText, /terminalCard/);
  assert.match(registryText, /defaultThemeName/);
  assert.doesNotMatch(registryText, /glassCard/);
  assert.doesNotMatch(registryText, /warmCard/);
  assert.match(socialCardText, /社交图文/);
  assert.match(editorialCardText, /留白文志/);
  assert.match(terminalCardText, /终端纪要/);
});
