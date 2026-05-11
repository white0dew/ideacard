import assert from "node:assert/strict";
import test from "node:test";
import { buildExportPlan } from "@/lib/export-plan";

test("buildExportPlan exports each short-card page as a separate png", () => {
  assert.deepEqual(
    buildExportPlan({
      cardCount: 3,
      fileName: "ideaCard.png",
      preset: "xiaohongshu",
      renderedHeight: 587,
      renderedWidth: 440,
    }),
    [
      { canvasHeight: 1440, canvasWidth: 1080, fileName: "ideaCard-1.png" },
      { canvasHeight: 1440, canvasWidth: 1080, fileName: "ideaCard-2.png" },
      { canvasHeight: 1440, canvasWidth: 1080, fileName: "ideaCard-3.png" },
    ],
  );
});

test("buildExportPlan keeps a single export for non-paginated content", () => {
  assert.deepEqual(
    buildExportPlan({
      cardCount: 1,
      fileName: "ideaCard.png",
      preset: "custom",
      renderedHeight: 900,
      renderedWidth: 600,
    }),
    [{ canvasHeight: 900, canvasWidth: 600, fileName: "ideaCard.png" }],
  );
});

test("buildExportPlan keeps separate files for custom multipage exports", () => {
  assert.deepEqual(
    buildExportPlan({
      cardCount: 3,
      fileName: "ideaCard.png",
      preset: "custom",
      renderedHeight: 420,
      renderedWidth: 440,
    }),
    [
      { canvasHeight: 420, canvasWidth: 440, fileName: "ideaCard-1.png" },
      { canvasHeight: 420, canvasWidth: 440, fileName: "ideaCard-2.png" },
      { canvasHeight: 420, canvasWidth: 440, fileName: "ideaCard-3.png" },
    ],
  );
});
