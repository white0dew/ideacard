import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildLocalImageMarkdown,
  buildLocalImageSource,
  extractLocalImageIds,
  isLocalImageSource,
  replaceLocalImageSources,
} from "@/lib/local-images";

test("local image helpers build and detect markdown refs", () => {
  const source = buildLocalImageSource("abc-123");

  assert.equal(source, "local-image://abc-123");
  assert.equal(buildLocalImageMarkdown("abc-123", "封面图"), "![封面图](local-image://abc-123)");
  assert.equal(isLocalImageSource(source), true);
  assert.equal(isLocalImageSource("/placeholder-card.svg"), false);
});

test("local image helpers extract ids and replace sources", () => {
  const markdown = [
    "![一](local-image://image-1)",
    "",
    "![二](local-image://image-2)",
  ].join("\n");

  assert.deepEqual(extractLocalImageIds(markdown), ["image-1", "image-2"]);
  assert.equal(
    replaceLocalImageSources(
      markdown,
      new Map([
        ["local-image://image-1", "blob:https://example.com/1"],
        ["local-image://image-2", "/placeholder-card.svg"],
      ]),
    ),
    [
      "![一](blob:https://example.com/1)",
      "",
      "![二](/placeholder-card.svg)",
    ].join("\n"),
  );
});

test("editor pane wires paste and upload actions into local image storage", async () => {
  const source = await readFile(new URL("../components/workbench/editor-pane.tsx", import.meta.url), "utf8");

  assert.match(source, /onPasteCapture/);
  assert.match(source, /saveLocalImage/);
  assert.match(source, /buildLocalImageMarkdown/);
  assert.match(source, /type="file"/);
  assert.match(source, /localImageAccept/);
  assert.match(source, /local-image-insert/);
});

test("local image storage preprocesses uploaded files before persistence", async () => {
  const source = await readFile(new URL("../lib/local-images.ts", import.meta.url), "utf8");

  assert.match(source, /prepareLocalImageForStorage/);
  assert.match(source, /const storedFile = await prepareLocalImageForStorage\(file\)/);
  assert.match(source, /blob:\s*storedFile/);
  assert.match(source, /mimeType:\s*storedFile\.type/);
});

test("preview pane resolves local-image markdown before rendering cards", async () => {
  const source = await readFile(new URL("../components/workbench/preview-pane.tsx", import.meta.url), "utf8");

  assert.match(source, /resolveLocalImageMarkdown/);
  assert.match(source, /localImageCleanupRef/);
  assert.match(source, /resolveThemeName/);
});

test("export pipeline disables cache busting for blob-backed local images", async () => {
  const source = await readFile(new URL("../lib/export-to-image.ts", import.meta.url), "utf8");

  assert.match(source, /shouldCacheBustImages/);
  assert.match(source, /img\[src\^=\"blob:/);
  assert.match(source, /cacheBust: shouldCacheBustImages\(element\)/);
});
