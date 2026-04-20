import { marked } from "marked";

type MarkdownToken = {
  type: string;
  text?: string;
  raw?: string;
  tokens?: MarkdownToken[];
  items?: MarkdownListItem[];
  header?: MarkdownTableCell[];
  rows?: MarkdownTableCell[][];
};

type MarkdownListItem = {
  text?: string;
  tokens?: MarkdownToken[];
};

type MarkdownTableCell = {
  text?: string;
  tokens?: MarkdownToken[];
};

function stripHtmlTags(input: string) {
  return input.replace(/<[^>]+>/g, "");
}

function normalizeInlineText(input: string) {
  return input.replace(/\r/g, "").replace(/\u00a0/g, " ");
}

function normalizePlainText(input: string) {
  return normalizeInlineText(input)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function withBlockBreak(text: string) {
  const normalized = normalizePlainText(text);
  return normalized ? `${normalized}\n\n` : "";
}

function renderInlineTokens(tokens: MarkdownToken[] | undefined) {
  if (!tokens?.length) {
    return "";
  }

  return tokens.map(renderInlineToken).join("");
}

function renderInlineToken(token: MarkdownToken) {
  switch (token.type) {
    case "strong":
    case "em":
    case "del":
    case "link":
      return token.tokens?.length ? renderInlineTokens(token.tokens) : token.text ?? "";
    case "codespan":
    case "text":
      return token.tokens?.length ? renderInlineTokens(token.tokens) : token.text ?? "";
    case "br":
      return "\n";
    case "image":
      return "";
    case "escape":
      return token.text ?? "";
    case "html":
      return stripHtmlTags(token.raw ?? token.text ?? "");
    default:
      return token.tokens?.length ? renderInlineTokens(token.tokens) : token.text ?? "";
  }
}

function renderTableCell(cell: MarkdownTableCell) {
  return cell.tokens?.length ? renderInlineTokens(cell.tokens) : cell.text ?? "";
}

function renderListItem(item: MarkdownListItem) {
  if (!item.tokens?.length) {
    return item.text ?? "";
  }

  return normalizePlainText(renderBlockTokens(item.tokens));
}

function renderBlockToken(token: MarkdownToken): string {
  switch (token.type) {
    case "space":
      return "";
    case "heading":
    case "paragraph":
      return withBlockBreak(
        token.tokens?.length ? renderInlineTokens(token.tokens) : token.text ?? "",
      );
    case "blockquote":
      return withBlockBreak(renderBlockTokens(token.tokens ?? []));
    case "list":
      return withBlockBreak((token.items ?? []).map(renderListItem).filter(Boolean).join("\n"));
    case "table": {
      const headerRow = (token.header ?? []).map(renderTableCell).join("\t");
      const bodyRows = (token.rows ?? []).map((row) => row.map(renderTableCell).join("\t"));
      return withBlockBreak([headerRow, ...bodyRows].filter(Boolean).join("\n"));
    }
    case "code":
      return withBlockBreak(token.text ?? "");
    case "html":
      return withBlockBreak(stripHtmlTags(token.raw ?? token.text ?? ""));
    case "hr":
      return "";
    default:
      return withBlockBreak(
        token.tokens?.length ? renderInlineTokens(token.tokens) : token.text ?? "",
      );
  }
}

function renderBlockTokens(tokens: MarkdownToken[]) {
  return tokens.map(renderBlockToken).join("");
}

export async function parsePlainText(markdown: string) {
  const tokens = marked.lexer(markdown) as MarkdownToken[];
  return normalizePlainText(renderBlockTokens(tokens));
}
