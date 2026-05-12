import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  MIN_CARD_HEIGHT,
  MIN_CARD_WIDTH,
  clampCardHeight,
  clampCardWidth,
} from "@/lib/card-dimensions";

test("card dimension clamps enforce the preview safety floor", () => {
  assert.equal(clampCardWidth(40), MIN_CARD_WIDTH);
  assert.equal(clampCardWidth(399), MIN_CARD_WIDTH);
  assert.equal(clampCardWidth(440), 440);

  assert.equal(clampCardHeight(53), MIN_CARD_HEIGHT);
  assert.equal(clampCardHeight(599), MIN_CARD_HEIGHT);
  assert.equal(clampCardHeight(640), 640);
});

test("settings store migrates and clamps persisted canvas dimensions", async () => {
  const source = await readFile(
    new URL("../stores/settings-store.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /version:\s*11/);
  assert.match(source, /clampCardWidth/);
  assert.match(source, /clampCardHeight/);
  assert.match(source, /cardWidth:\s*resolvedWidth/);
  assert.match(source, /cardHeight:\s*resolvedHeight/);
});

test("settings sidebar documents and enforces minimum width and height", async () => {
  const source = await readFile(
    new URL("../components/workbench/settings-sidebar.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /min=\{MIN_CARD_WIDTH\}/);
  assert.match(source, /min=\{MIN_CARD_HEIGHT\}/);
  assert.match(source, /onBlur=\{commitWidthInput\}/);
  assert.match(source, /onBlur=\{commitHeightInput\}/);
});
