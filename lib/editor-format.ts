export const alignmentOptions = ["left", "center", "right"] as const;

export type AlignmentOption = (typeof alignmentOptions)[number];
export type FormatAction =
  | "h1"
  | "h2"
  | "h3"
  | "bold"
  | "italic"
  | "underline"
  | "link"
  | "image"
  | "code"
  | "list"
  | "blankLine"
  | `align-${AlignmentOption}`;

const placeholders: Record<Exclude<FormatAction, `align-${AlignmentOption}`>, string> = {
  h1: "标题",
  h2: "小节标题",
  h3: "子标题",
  bold: "加粗文本",
  italic: "斜体文本",
  underline: "下划线文本",
  link: "链接文本",
  image: "图片描述",
  code: "代码",
  list: "列表项",
  blankLine: "",
};

function withFallback(selectedText: string, fallback: string) {
  return selectedText.trim() ? selectedText : fallback;
}

export function formatSelection(selectedText: string, action: FormatAction) {
  switch (action) {
    case "h1":
      return `# ${withFallback(selectedText, placeholders.h1)}`;
    case "h2":
      return `## ${withFallback(selectedText, placeholders.h2)}`;
    case "h3":
      return `### ${withFallback(selectedText, placeholders.h3)}`;
    case "bold":
      return `**${withFallback(selectedText, placeholders.bold)}**`;
    case "italic":
      return `*${withFallback(selectedText, placeholders.italic)}*`;
    case "underline":
      return `<u>${withFallback(selectedText, placeholders.underline)}</u>`;
    case "link":
      return `[${withFallback(selectedText, placeholders.link)}](https://example.com)`;
    case "image":
      return `![${withFallback(selectedText, placeholders.image)}](/placeholder-card.svg)`;
    case "code":
      return selectedText.includes("\n")
        ? `\`\`\`\n${selectedText}\n\`\`\``
        : `\`${withFallback(selectedText, placeholders.code)}\``;
    case "list":
      return selectedText.trim()
        ? selectedText
            .split("\n")
            .map((line) => `- ${line}`)
            .join("\n")
        : `- ${placeholders.list}`;
    case "blankLine":
      return "<br><br>";
    case "align-left":
      return `<div style="text-align: left;">\n${withFallback(selectedText, "左对齐内容")}\n</div>`;
    case "align-center":
      return `<div style="text-align: center;">\n${withFallback(selectedText, "居中内容")}\n</div>`;
    case "align-right":
      return `<div style="text-align: right;">\n${withFallback(selectedText, "右对齐内容")}\n</div>`;
    default:
      return selectedText;
  }
}
