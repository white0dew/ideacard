"use client";

import type { CSSProperties, FC, Ref } from "react";
import styled from "styled-components";
import { Renderer, Tokens } from "marked";
import { getSocialNoteUsableHeight } from "@/lib/card-measurements";
import type { CardConfig, CardProps } from "@/lib/card-types";
import {
  defaultSocialNoteAccentColor,
  defaultSocialNoteBackgroundColor,
} from "@/lib/social-note-colors";
import {
  defaultSocialNoteFontFamily,
  getSocialNoteFontFamily,
} from "@/lib/social-note-fonts";
import {
  getDefaultSocialProfileTimeLabel,
  resolveSocialProfile,
} from "@/lib/social-profile";
import { splitSocialNoteTitle } from "@/lib/social-note-title";
import useSettingsStore from "@/stores/settings-store";

const DEFAULT_FONT_SCALE = 1;
const BASE_PROFILE_NAME_FONT_SIZE = 22;
const BASE_TIME_FONT_SIZE = 14;
const BASE_SOCIAL_TITLE_FONT_SIZE = 31;
const BASE_BODY_FONT_SIZE = 17;
const BASE_H1_FONT_SIZE = 27;
const BASE_H2_FONT_SIZE = 23;
const BASE_H3_FONT_SIZE = 20;
const BASE_H4_FONT_SIZE = 18;
const BASE_H5_FONT_SIZE = 17;
const BASE_TABLE_FONT_SIZE = 15;
const BASE_PRE_FONT_SIZE = 14;
const SOCIAL_NOTE_IMAGE_MAX_HEIGHT_RATIO = 0.38;

function toPx(size: number) {
  return `${size}px`;
}

function toScaledFontSize(size: number) {
  return `calc(${size}px * var(--social-all-font-scale, ${DEFAULT_FONT_SCALE}))`;
}

function toBodyScaledFontSize(size: number) {
  return `calc(${size}px * var(--social-font-scale, ${DEFAULT_FONT_SCALE}))`;
}

const render = new Renderer();
render.heading = function ({ text, depth }: Tokens.Heading) {
  return `<h${depth} class="md-h${depth}">${text}</h${depth}>`;
};
render.blockquote = function ({ text }: Tokens.Blockquote) {
  return `<blockquote class="md-blockquote">${text}</blockquote>`;
};
render.list = function ({ items, ordered, start }: Tokens.List) {
  const listType = ordered ? "ol" : "ul";
  const startAttr = ordered && start !== 1 ? ` start="${start}"` : "";
  return `<${listType} class="md-${listType}"${startAttr}>${items
    .map((item) => `<li class="md-listitem">${item.text}</li>`)
    .join("")}</${listType}>`;
};
render.listitem = function ({ text }: Tokens.ListItem) {
  return `<li class="md-listitem">${text}</li>`;
};
render.code = function ({ text, lang }: Tokens.Code) {
  return `<pre class="md-pre"><code class="md-code language-${lang}">${text}</code></pre>`;
};
render.codespan = function ({ text }: Tokens.Codespan) {
  return `<code class="md-codespan">${text}</code>`;
};
render.strong = function ({ text }: Tokens.Strong) {
  return `<strong class="md-strong">${text}</strong>`;
};
render.em = function ({ text }: Tokens.Em) {
  return `<em class="md-em">${text}</em>`;
};
render.table = function ({ header, rows }: Tokens.Table) {
  return `<table class="md-table"><thead class="md-thead">${header
    .map((hd) => `<th class="md-th">${hd.text}</th>`)
    .join("")}</thead><tbody class="md-tbody">${rows
    .map((row) => `<tr class="md-tr">${row.map((cell) => `<td class="md-td">${cell.text}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
};
render.tablerow = function ({ text }: Tokens.TableRow) {
  return `<tr class="md-tr">${text}</tr>`;
};
render.tablecell = function ({ text }: Tokens.TableCell) {
  return `<td class="md-td">${text}</td>`;
};
render.link = function ({ href, title, text }: Tokens.Link) {
  return `<a class="md-link" href="${href}"${title ? ` title="${title}"` : ""}>${text}</a>`;
};
render.image = function ({ href }: Tokens.Image) {
  return `<img class="md-image" src="${href}" />`;
};
render.space = function () {
  return "";
};
render.html = function (token: Tokens.HTML) {
  return token.text;
};
render.hr = function () {
  return '<hr class="md-hr" />';
};
render.br = function () {
  return `<br class="md-br" />`;
};
render.del = function (token: Tokens.Del) {
  return `<del class="md-del">${token.text}</del>`;
};
render.text = function (token: Tokens.Text) {
  return `<span class="md-text">${token.text}</span>`;
};

const CardContainer = styled.article`
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  padding: 28px 28px 32px;
  background: var(--social-background-color, ${defaultSocialNoteBackgroundColor});
  color: #171717;
  font-family: var(--social-font-family, ${defaultSocialNoteFontFamily});

  .social-meta {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 18px;
  }

  .social-avatar {
    height: 52px;
    width: 52px;
    border-radius: 999px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .social-name {
    font-size: ${toScaledFontSize(BASE_PROFILE_NAME_FONT_SIZE)};
    font-weight: 700;
    line-height: 1;
  }

  .social-name-row {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .social-verified-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: #1d9bf0;
    color: #ffffff;
    box-shadow: 0 2px 6px rgba(29, 155, 240, 0.28);
    flex-shrink: 0;
  }

  .social-verified-badge svg {
    width: 11px;
    height: 11px;
  }

  .social-time {
    margin-top: 6px;
    color: #7c7c7c;
    font-size: ${toScaledFontSize(BASE_TIME_FONT_SIZE)};
    line-height: 1;
  }

  .social-title {
    margin: 0 0 18px;
    font-size: ${toScaledFontSize(BASE_SOCIAL_TITLE_FONT_SIZE)};
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.02em;
    color: var(--social-accent-color, ${defaultSocialNoteAccentColor});
  }

  .card-content {
    font-size: var(--social-body-font-size, ${toPx(BASE_BODY_FONT_SIZE)});
    line-height: var(--social-line-height, 1.22);
  }

  .card-content p {
    margin: 0 0 10px;
    line-height: var(--social-line-height, 1.22);
  }

  .md-h1 {
    margin: 20px 0 10px;
    font-size: ${toScaledFontSize(BASE_H1_FONT_SIZE)};
    line-height: 1.1;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--social-accent-color, ${defaultSocialNoteAccentColor});
  }

  .md-h2,
  .md-h3,
  .md-h4,
  .md-h5,
  .md-h6 {
    margin: 16px 0 8px;
    line-height: 1.12;
    font-weight: 700;
    color: var(--social-accent-color, ${defaultSocialNoteAccentColor});
  }

  .md-h2 {
    font-size: ${toScaledFontSize(BASE_H2_FONT_SIZE)};
  }

  .md-h3 {
    font-size: ${toScaledFontSize(BASE_H3_FONT_SIZE)};
  }

  .md-h4 {
    font-size: ${toScaledFontSize(BASE_H4_FONT_SIZE)};
  }

  .md-h5,
  .md-h6 {
    font-size: ${toScaledFontSize(BASE_H5_FONT_SIZE)};
  }

  .md-blockquote {
    margin: 12px 0;
    padding: 7px 0 7px 14px;
    border-left: 3px solid #d4d4d4;
    color: #555;
    line-height: var(--social-line-height, 1.18);
    background: rgba(0, 0, 0, 0.02);
  }

  .md-strong {
    font-weight: 800;
    color: var(--social-accent-color, ${defaultSocialNoteAccentColor});
  }

  .md-em {
    font-style: italic;
    color: var(--social-accent-color, ${defaultSocialNoteAccentColor});
  }

  .md-image {
    display: block;
    max-width: 100%;
    height: auto;
    max-height: var(--social-image-max-height, 223px);
    margin: 12px auto;
    border-radius: 14px;
    object-fit: contain;
  }

  .md-table {
    width: 100%;
    border-collapse: collapse;
    margin: 18px 0;
    font-size: ${toScaledFontSize(BASE_TABLE_FONT_SIZE)};
  }

  .md-th,
  .md-td {
    border: 1px solid #e5e7eb;
    padding: 10px 12px;
    text-align: left;
  }

  .md-pre {
    margin: 18px 0;
    border-radius: 12px;
    padding: 14px 16px;
    background: #f5f5f5;
    overflow-x: auto;
    font-size: ${toScaledFontSize(BASE_PRE_FONT_SIZE)};
  }

  .md-codespan {
    padding: 1px 6px;
    border-radius: 999px;
    background: #f3f4f6;
    font-size: 0.92em;
  }

  .md-ul,
  .md-ol {
    margin: 0 0 14px;
    padding-left: 1.4em;
  }

  .md-ul {
    list-style: disc;
  }

  .md-ol {
    list-style: decimal;
  }

  .md-listitem {
    margin: 4px 0;
    line-height: var(--social-line-height, 1.18);
  }

  .md-ul .md-listitem::marker,
  .md-ol .md-listitem::marker {
    color: var(--social-accent-color, ${defaultSocialNoteAccentColor});
    font-weight: 700;
  }

  .md-link {
    color: #111;
    text-decoration: underline;
    text-underline-offset: 0.16em;
  }

  .md-text {
    line-height: var(--social-line-height, 1.22);
  }

  .md-hr {
    margin: 24px 0;
    border: 0;
    border-top: 1px solid #e5e7eb;
  }
`;

const Card: FC<CardProps> = ({
  page,
  width: settingWidth,
  height: settingHeight,
  pageIndex = 0,
  containerRef,
  contentRef,
}) => {
  const width = settingWidth;
  const height = settingHeight === -1 ? "auto" : settingHeight;
  const { body, title } = splitSocialNoteTitle(page, pageIndex);
  const showLeadMeta = pageIndex === 0;
  const socialProfileName = useSettingsStore((state) => state.socialProfileName);
  const socialProfileTimeLabel = useSettingsStore((state) => state.socialProfileTimeLabel);
  const socialUseAutoTimeLabel = useSettingsStore((state) => state.socialUseAutoTimeLabel);
  const socialProfileAvatarUrl = useSettingsStore((state) => state.socialProfileAvatarUrl);
  const socialFirstPageTopOffset = useSettingsStore(
    (state) => state.socialFirstPageTopOffset,
  );
  const socialAvatarSize = useSettingsStore((state) => state.socialAvatarSize);
  const socialBackgroundColor = useSettingsStore((state) => state.socialBackgroundColor);
  const socialAccentColor = useSettingsStore((state) => state.socialAccentColor);
  const socialFontPreset = useSettingsStore((state) => state.socialFontPreset);
  const socialFontScaleMode = useSettingsStore((state) => state.socialFontScaleMode);
  const socialFontScale = useSettingsStore((state) => state.socialFontScale);
  const socialLineHeight = useSettingsStore((state) => state.socialLineHeight);
  const socialProfile = resolveSocialProfile(
    {
      avatarUrl: socialProfileAvatarUrl,
      name: socialProfileName,
      timeLabel: socialUseAutoTimeLabel
        ? getDefaultSocialProfileTimeLabel()
        : socialProfileTimeLabel,
      firstPageTopOffset: socialFirstPageTopOffset,
      avatarSize: socialAvatarSize,
    },
  );
  const allFontScale = socialFontScaleMode === "all" ? socialFontScale : DEFAULT_FONT_SCALE;
  const imageMaxHeight =
    typeof settingHeight === "number" && settingHeight > 0
      ? toPx(Math.round(settingHeight * SOCIAL_NOTE_IMAGE_MAX_HEIGHT_RATIO))
      : "38vh";
  const cardStyle = {
    width,
    height,
    ["--social-background-color" as string]: socialBackgroundColor,
    ["--social-accent-color" as string]: socialAccentColor,
    ["--social-font-family" as string]: getSocialNoteFontFamily(socialFontPreset),
    ["--social-font-scale" as string]: String(socialFontScale),
    ["--social-all-font-scale" as string]: String(allFontScale),
    ["--social-line-height" as string]: String(socialLineHeight),
    ["--social-image-max-height" as string]: imageMaxHeight,
    ["--social-body-font-size" as string]:
      socialFontScaleMode === "body"
        ? toBodyScaledFontSize(BASE_BODY_FONT_SIZE)
        : toPx(BASE_BODY_FONT_SIZE),
  } as CSSProperties;

  return (
    <CardContainer ref={contentRef as Ref<HTMLElement>} style={cardStyle}>
      {showLeadMeta ? (
        <div style={{ paddingTop: socialProfile.firstPageTopOffset }}>
          <div className="social-meta">
            <img
              alt="avatar"
              className="social-avatar"
              src={socialProfile.avatarUrl}
              style={{ height: socialProfile.avatarSize, width: socialProfile.avatarSize }}
            />
            <div>
              <div className="social-name-row">
                <div className="social-name">{socialProfile.name}</div>
                <span aria-label="已认证" className="social-verified-badge" role="img">
                  <svg fill="none" viewBox="0 0 24 24">
                    <path
                      d="M9.55 16.2 5.8 12.45l1.4-1.4 2.35 2.35 7.25-7.25 1.4 1.4-8.65 8.65Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
              </div>
              <div className="social-time">{socialProfile.timeLabel}</div>
            </div>
          </div>
          {title ? (
            <h1 className="social-title" dangerouslySetInnerHTML={{ __html: title }} />
          ) : null}
        </div>
      ) : null}
      <div
        className="card-content"
        ref={containerRef as Ref<HTMLDivElement>}
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </CardContainer>
  );
};

const ThemeConfig: CardConfig = {
  name: "社交图文",
  component: Card,
  getUsableHeight: (pageHeight) => {
    const state = useSettingsStore.getState();
    return getSocialNoteUsableHeight(
      pageHeight,
      state.socialFirstPageTopOffset,
      state.socialAvatarSize,
    );
  },
  renderer: render,
};

export default ThemeConfig;
