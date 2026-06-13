import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("editor toolbar exposes a blank-line insertion button", async () => {
  const source = await readFile(
    new URL("../components/workbench/editor-pane.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /blankLine/);
  assert.match(source, /插入空行/);
  assert.match(source, /FiPlus/);
});

test("editor pane registers common cross-platform markdown shortcuts", async () => {
  const source = await readFile(
    new URL("../components/workbench/editor-pane.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /KeyMod\.CtrlCmd/);
  assert.match(source, /Ctrl\/Cmd\+B/);
  assert.match(source, /Ctrl\/Cmd\+I/);
  assert.match(source, /Ctrl\/Cmd\+K/);
  assert.match(source, /registerMarkdownShortcuts/);
});

test("editor pane displays total markdown character count in the footer", async () => {
  const source = await readFile(
    new URL("../components/workbench/editor-pane.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /markdownCharacterCount/);
  assert.match(source, /总字数/);
});
