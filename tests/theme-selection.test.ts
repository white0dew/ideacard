import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { defaultThemeName, resolveThemeName, selectableThemeNames } from "@/lib/theme-selection";

test("theme selection defaults to 社交图文 and rejects removed themes", () => {
  assert.equal(defaultThemeName, "社交图文");
  assert.deepEqual(selectableThemeNames, ["社交图文", "留白文志", "终端纪要"]);
  assert.equal(resolveThemeName("默认"), "社交图文");
  assert.equal(resolveThemeName(undefined), "社交图文");
  assert.equal(resolveThemeName("终端纪要"), "终端纪要");
});

test("settings store persists the new default theme and migrates old theme names", async () => {
  const source = await readFile(new URL("../stores/settings-store.ts", import.meta.url), "utf8");

  assert.match(source, /selectedTheme: defaultThemeName/);
  assert.match(source, /resolveThemeName\(state\.selectedTheme\)/);
  assert.match(source, /version:\s*11/);
});

test("settings sidebar renders only the resolved supported theme list", async () => {
  const source = await readFile(new URL("../components/workbench/settings-sidebar.tsx", import.meta.url), "utf8");

  assert.match(source, /resolvedSelectedTheme/);
  assert.match(source, /configNames\.map/);
  assert.match(source, /value=\{resolvedSelectedTheme\}/);
});
