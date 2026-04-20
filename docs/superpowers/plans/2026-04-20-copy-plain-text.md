# Copy Plain Text Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在顶部工具栏新增“复制纯文本”按钮，复制 Markdown 渲染后的正文文本到剪贴板，且不包含 Markdown 语法符号与主题装饰文案。

**Architecture:** 新增一个独立的 Markdown→纯文本转换模块，直接从编辑器内容生成可复制文本，避免依赖分页 DOM 和主题结构。工具栏增加复制按钮，工作台使用 `navigator.clipboard.writeText` 触发复制，并复用顶部状态文案反馈结果。

**Tech Stack:** Next.js App Router, React, TypeScript, marked, node:test, agent-browser

---

## File Map

- Create: `lib/plain-text.ts`
  - 提供 Markdown→纯文本转换函数与输出归一化。
- Create: `tests/plain-text.test.ts`
  - 覆盖标题、引用、强调、链接、列表、表格与代码文本的纯文本结果。
- Modify: `components/workbench/top-bar.tsx`
  - 新增复制纯文本按钮与状态文案。
- Modify: `components/workbench/workbench.tsx`
  - 接入纯文本生成和剪贴板复制逻辑。

### Task 1: 为纯文本转换写失败测试

**Files:**
- Create: `tests/plain-text.test.ts`

- [ ] **Step 1: 写失败测试，覆盖引用、强调、链接和正文混合内容**

```ts
test("markdown plain text removes formatting syntax and keeps readable block breaks", async () => {
  const { parsePlainText } = await import("@/lib/plain-text");

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
```

- [ ] **Step 2: 写失败测试，覆盖列表、表格和代码块文本**

```ts
test("markdown plain text keeps list, table, and code content without markdown markers", async () => {
  const { parsePlainText } = await import("@/lib/plain-text");

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
```

- [ ] **Step 3: 跑测试确认红灯**

Run: `pnpm test tests/plain-text.test.ts`
Expected: FAIL，且报错指向 `@/lib/plain-text` 尚不存在或 `parsePlainText` 未实现。

### Task 2: 实现 Markdown→纯文本转换

**Files:**
- Create: `lib/plain-text.ts`
- Test: `tests/plain-text.test.ts`

- [ ] **Step 1: 建立纯文本 renderer，并为块级元素输出换行**

```ts
import { marked, Renderer, Tokens } from "marked";

function withBlockBreak(text: string) {
  return text ? `${text}\n\n` : "";
}

export async function parsePlainText(markdown: string) {
  const render = new Renderer();
  render.heading = ({ text }: Tokens.Heading) => withBlockBreak(text);
  render.paragraph = ({ text }: Tokens.Paragraph) => withBlockBreak(text);
  render.blockquote = ({ text }: Tokens.Blockquote) => withBlockBreak(text);
  return "";
}
```

- [ ] **Step 2: 补齐强调、链接、列表、表格、代码和文本节点映射**

```ts
render.link = ({ text }: Tokens.Link) => text;
render.strong = ({ text }: Tokens.Strong) => text;
render.em = ({ text }: Tokens.Em) => text;
render.codespan = ({ text }: Tokens.Codespan) => text;
render.list = ({ items }: Tokens.List) => withBlockBreak(items.map((item) => item.text).join("\n"));
render.table = ({ header, rows }: Tokens.Table) =>
  withBlockBreak(
    [header.map((cell) => cell.text).join("\t"), ...rows.map((row) => row.map((cell) => cell.text).join("\t"))]
      .join("\n"),
  );
render.code = ({ text }: Tokens.Code) => withBlockBreak(text);
render.image = () => "";
render.text = (token: Tokens.Text) => token.text;
```

- [ ] **Step 3: 归一化输出，只保留可读换行**

```ts
function normalizePlainText(input: string) {
  return input
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const parsed = await marked.parse(markdown, { renderer: render });
return normalizePlainText(typeof parsed === "string" ? parsed : "");
```

- [ ] **Step 4: 跑测试确认绿灯**

Run: `pnpm test tests/plain-text.test.ts`
Expected: PASS

### Task 3: 将复制动作接入顶部工具栏

**Files:**
- Modify: `components/workbench/top-bar.tsx`
- Modify: `components/workbench/workbench.tsx`
- Test: `tests/plain-text.test.ts`

- [ ] **Step 1: 在顶部栏新增复制按钮 props 与按钮文案**

```tsx
interface TopBarProps {
  copyStatus: "idle" | "copying";
  onCopyPlainText: () => void;
}

const copyButtonLabel = copyStatus === "copying" ? "复制中..." : "复制纯文本";
```

- [ ] **Step 2: 在工作台增加复制处理函数并调用剪贴板 API**

```ts
const content = useEditorStore((state) => state.content);

const handleCopyPlainText = async () => {
  const plainText = await parsePlainText(content);
  await navigator.clipboard.writeText(plainText);
  setExportMessage("纯文本已复制到剪贴板。");
};
```

- [ ] **Step 3: 处理空内容与失败文案，避免静默失败**

```ts
if (!plainText) {
  setExportStatus("error");
  setExportMessage("当前没有可复制的正文文本。");
  return;
}
```

- [ ] **Step 4: 跑纯文本测试，确认实现未回归**

Run: `pnpm test tests/plain-text.test.ts`
Expected: PASS

### Task 4: 验证 UI 集成与真实复制行为

**Files:**
- Modify: `components/workbench/top-bar.tsx`
- Modify: `components/workbench/workbench.tsx`

- [ ] **Step 1: 运行相关单测**

Run: `pnpm test tests/plain-text.test.ts tests/export-verification.test.ts`
Expected: PASS

- [ ] **Step 2: 用浏览器验证按钮可见并完成真实复制**

Run: `agent-browser open http://localhost:3000/ && agent-browser wait --load networkidle && agent-browser snapshot -i`
Expected: 顶部栏出现“复制纯文本”按钮。

- [ ] **Step 3: 在编辑器输入示例 Markdown，点击复制并读取剪贴板**

Run: `agent-browser fill <editor-ref> "<markdown>" && agent-browser click <copy-button-ref> && agent-browser clipboard read`
Expected: 剪贴板内容不包含 `#`、`**`、`>`、反引号等 Markdown 符号，仅保留纯文本正文。
