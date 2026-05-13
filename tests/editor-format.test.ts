import assert from "node:assert/strict";
import test from "node:test";
import { formatSelection } from "@/lib/editor-format";

test("bold formatting inserts placeholder when selection is empty", () => {
  assert.equal(formatSelection("", "bold"), "**加粗文本**");
});

test("list formatting prefixes each selected line", () => {
  assert.equal(formatSelection("a\nb", "list"), "- a\n- b");
});

test("alignment formatting wraps content in an HTML block", () => {
  assert.equal(
    formatSelection("正文", "align-center"),
    '<div style="text-align: center;">\n正文\n</div>',
  );
});

test("blank-line formatting inserts explicit break markup", () => {
  assert.equal(formatSelection("", "blankLine"), "<br><br>");
});
