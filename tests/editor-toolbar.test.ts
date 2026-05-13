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
