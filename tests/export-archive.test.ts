import assert from "node:assert/strict";
import test from "node:test";
import { buildArchiveName, buildArchiveEntries } from "../lib/export-archive.ts";

test("buildArchiveName appends a timestamp before zip suffix", () => {
  assert.equal(
    buildArchiveName("ideaCard.png", new Date("2026-04-01T09:08:07")),
    "ideaCard-20260401090807.zip",
  );
});

test("buildArchiveEntries keeps file order for multi-image exports", () => {
  assert.deepEqual(
    buildArchiveEntries([
      { fileName: "ideaCard-1.png", blob: new Blob(["1"]) },
      { fileName: "ideaCard-2.png", blob: new Blob(["2"]) },
    ]).map((entry) => entry.fileName),
    ["ideaCard-1.png", "ideaCard-2.png"],
  );
});
