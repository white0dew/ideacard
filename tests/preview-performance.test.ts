import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("preview pane defers heavy preview work until persisted stores are hydrated", async () => {
  const source = await readFile(
    new URL("../components/workbench/preview-pane.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /useDeferredValue/);
  assert.match(source, /usePersistHydration/);
  assert.match(source, /deferredContent/);
  assert.match(source, /previewReady/);
});

test("preview pane exposes a dedicated vertical scroll area for the rendered card", async () => {
  const [previewSource, globalStyles] = await Promise.all([
    readFile(
      new URL("../components/workbench/preview-pane.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(previewSource, /preview-scroll-area/);
  assert.match(previewSource, /overflow-y-auto/);
  assert.match(globalStyles, /\.preview-scroll-area/);
  assert.match(globalStyles, /scrollbar-width:\s*thin/);
});

test("preview pane no longer exposes long-card or overflow clipping modes", async () => {
  const [previewSource, settingsSource] = await Promise.all([
    readFile(
      new URL("../components/workbench/preview-pane.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../stores/settings-store.ts", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(previewSource, /LongMarkdownViewer/);
  assert.doesNotMatch(previewSource, /hideOverflow/);
  assert.match(previewSource, /overflow-visible/);
  assert.match(settingsSource, /viewModes\s*=\s*\["短卡片"\]/);
  assert.doesNotMatch(settingsSource, /setHideOverflow/);
});

test("preview pane displays export image count from rendered pages", async () => {
  const source = await readFile(
    new URL("../components/workbench/preview-pane.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /exportImageCount/);
  assert.match(source, /MutationObserver/);
  assert.match(source, /querySelectorAll\("\.pages-wrapper > \*"\)/);
  assert.match(source, /导出图片 \{exportImageCount\} 张/);
});

test("editor pane waits for persisted editor state before mounting monaco", async () => {
  const source = await readFile(
    new URL("../components/workbench/editor-pane.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /usePersistHydration/);
  assert.match(source, /editorReady/);
  assert.match(source, /editorReady \? \(/);
});

test("paginator text splitting uses a binary-search helper instead of per-character scanning", async () => {
  const source = await readFile(
    new URL("../lib/paginator-utils.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /findHighestPassingIndex/);
  assert.doesNotMatch(source, /for \(let index = 1; index <= fullText\.length; index \+= 1\)/);
});
