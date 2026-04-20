import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("markdown plain text removes formatting syntax and keeps readable block breaks", async () => {
  const { parsePlainText } = await import("../lib/plain-text.ts");

  const output = await parsePlainText(
    [
      "# 标题",
      "",
      "> 我的产品帮 **[谁]** 完成 [任务](https://example.com)",
      "> 用户只需要 `步骤1` → **步骤2**",
      "",
      "普通正文",
    ].join("\n"),
  );

  assert.equal(
    output,
    ["标题", "", "我的产品帮 [谁] 完成 任务", "用户只需要 步骤1 → 步骤2", "", "普通正文"].join(
      "\n",
    ),
  );
});

test("markdown plain text keeps list, table, and code content without markdown markers", async () => {
  const { parsePlainText } = await import("../lib/plain-text.ts");

  const output = await parsePlainText(
    [
      "- 项目 A",
      "- 项目 B",
      "",
      "| 名称 | 分数 |",
      "| --- | --- |",
      "| Alice | 95 |",
      "",
      "```ts",
      "console.log('hi');",
      "```",
    ].join("\n"),
  );

  assert.equal(
    output,
    ["项目 A", "项目 B", "", "名称\t分数", "Alice\t95", "", "console.log('hi');"].join("\n"),
  );
});

test("top bar exposes a copy-plain-text button beside export", async () => {
  const topBarText = await readFile(
    new URL("../components/workbench/top-bar.tsx", import.meta.url),
    "utf8",
  );

  assert.match(topBarText, /复制纯文本/);
  assert.match(topBarText, /onCopyPlainText/);
  assert.match(topBarText, /copyStatus/);
});

test("workbench copies rendered plain text through the clipboard api", async () => {
  const workbenchText = await readFile(
    new URL("../components/workbench/workbench.tsx", import.meta.url),
    "utf8",
  );

  assert.match(workbenchText, /parsePlainText/);
  assert.match(workbenchText, /navigator\.clipboard\.writeText/);
  assert.match(workbenchText, /纯文本已复制到剪贴板/);
});
