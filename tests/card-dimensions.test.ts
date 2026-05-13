import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  MAX_CARD_WIDTH,
  MIN_CARD_HEIGHT,
  MIN_CARD_WIDTH,
  clampCardHeight,
  clampCardWidth,
} from "@/lib/card-dimensions";

test("card dimension clamps enforce the preview safety floor", () => {
  assert.equal(clampCardWidth(40), MIN_CARD_WIDTH);
  assert.equal(clampCardWidth(199), MIN_CARD_WIDTH);
  assert.equal(clampCardWidth(440), 440);
  assert.equal(clampCardWidth(501), MAX_CARD_WIDTH);
  assert.equal(clampCardWidth(Number.POSITIVE_INFINITY), MIN_CARD_WIDTH);

  assert.equal(clampCardHeight(53), MIN_CARD_HEIGHT);
  assert.equal(clampCardHeight(199), MIN_CARD_HEIGHT);
  assert.equal(clampCardHeight(640), 640);
});

test("settings store migrates and clamps persisted canvas dimensions", async () => {
  const source = await readFile(
    new URL("../stores/settings-store.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /version:\s*12/);
  assert.match(source, /clampCardWidth/);
  assert.match(source, /clampCardHeight/);
  assert.match(source, /cardWidth:\s*resolvedWidth/);
  assert.match(source, /cardHeight:\s*resolvedHeight/);
});

test("settings sidebar documents and enforces width and height limits", async () => {
  const source = await readFile(
    new URL("../components/workbench/settings-sidebar.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /MAX_CARD_WIDTH/);
  assert.match(source, /max=\{MAX_CARD_WIDTH\}/);
  assert.match(source, /min=\{MIN_CARD_WIDTH\}/);
  assert.match(source, /min=\{MIN_CARD_HEIGHT\}/);
  assert.match(source, /宽度范围\s*\{MIN_CARD_WIDTH\}-\{MAX_CARD_WIDTH\}px/);
  assert.match(source, /高度最低\s*\{MIN_CARD_HEIGHT\}px/);
  assert.match(source, /onBlur=\{commitWidthInput\}/);
  assert.match(source, /onBlur=\{commitHeightInput\}/);
});
