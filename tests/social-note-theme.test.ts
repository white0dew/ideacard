import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { splitSocialNoteTitle } from "../lib/social-note-title";

test("social-note theme only shows the lead meta block on the first page", async () => {
  const cardText = await readFile(
    new URL("../components/cards/SocialNoteCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(cardText, /pageIndex\s*===\s*0/);
  assert.match(cardText, /showLeadMeta/);
});

test("card props expose pageIndex for paginated themes", async () => {
  const typesText = await readFile(new URL("../lib/card-types.ts", import.meta.url), "utf8");
  assert.match(typesText, /pageIndex\?:\s*number/);
});

test("social-note theme reads profile content from shared social profile config", async () => {
  const cardText = await readFile(
    new URL("../components/cards/SocialNoteCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(cardText, /useSettingsStore/);
  assert.match(cardText, /resolveSocialProfile/);
});

test("social-note theme reads background and accent colors from settings", async () => {
  const cardText = await readFile(
    new URL("../components/cards/SocialNoteCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(cardText, /socialBackgroundColor/);
  assert.match(cardText, /socialAccentColor/);
});

test("social-note theme renders a verified badge beside the profile name", async () => {
  const cardText = await readFile(
    new URL("../components/cards/SocialNoteCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(cardText, /social-verified-badge/);
  assert.match(cardText, /已认证/);
});

test("settings sidebar supports avatar upload flow", async () => {
  const sidebarText = await readFile(
    new URL("../components/workbench/settings-sidebar.tsx", import.meta.url),
    "utf8",
  );

  assert.match(sidebarText, /FileReader/);
  assert.match(sidebarText, /readAsDataURL/);
  assert.match(sidebarText, /type="file"/);
  assert.match(sidebarText, /setSocialProfileAvatarUrl\(dataUrl\)/);
});

test("settings sidebar exposes social-note color palette controls", async () => {
  const sidebarText = await readFile(
    new URL("../components/workbench/settings-sidebar.tsx", import.meta.url),
    "utf8",
  );

  assert.match(sidebarText, /背景颜色/);
  assert.match(sidebarText, /重点字体颜色/);
  assert.match(sidebarText, /setSocialBackgroundColor/);
  assert.match(sidebarText, /setSocialAccentColor/);
});

test("settings store persists social-note color selections", async () => {
  const storeText = await readFile(
    new URL("../stores/settings-store.ts", import.meta.url),
    "utf8",
  );

  assert.match(storeText, /socialBackgroundColor/);
  assert.match(storeText, /socialAccentColor/);
  assert.match(storeText, /setSocialBackgroundColor/);
  assert.match(storeText, /setSocialAccentColor/);
});

test("settings sidebar exposes social-note font preset control", async () => {
  const sidebarText = await readFile(
    new URL("../components/workbench/settings-sidebar.tsx", import.meta.url),
    "utf8",
  );

  assert.match(sidebarText, /字体风格/);
  assert.match(sidebarText, /socialNoteFontOptions/);
  assert.match(sidebarText, /setSocialFontPreset/);
});

test("settings sidebar exposes an auto-date toggle for social-note time label", async () => {
  const sidebarText = await readFile(
    new URL("../components/workbench/settings-sidebar.tsx", import.meta.url),
    "utf8",
  );

  assert.match(sidebarText, /自动获取当前日期/);
  assert.match(sidebarText, /type="checkbox"/);
  assert.match(sidebarText, /socialUseAutoTimeLabel/);
  assert.match(sidebarText, /disabled=\{socialUseAutoTimeLabel\}/);
});

test("settings store persists social-note auto-date preference", async () => {
  const storeText = await readFile(
    new URL("../stores/settings-store.ts", import.meta.url),
    "utf8",
  );

  assert.match(storeText, /socialUseAutoTimeLabel/);
  assert.match(storeText, /setSocialUseAutoTimeLabel/);
});

test("social-note card resolves current date from shared helper when auto-date is enabled", async () => {
  const cardText = await readFile(
    new URL("../components/cards/SocialNoteCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(cardText, /socialUseAutoTimeLabel/);
  assert.match(cardText, /getDefaultSocialProfileTimeLabel/);
});

test("settings store persists social-note font preset selection", async () => {
  const storeText = await readFile(
    new URL("../stores/settings-store.ts", import.meta.url),
    "utf8",
  );

  assert.match(storeText, /socialFontPreset/);
  assert.match(storeText, /setSocialFontPreset/);
});

test("settings store persists social-note font scale settings", async () => {
  const storeText = await readFile(
    new URL("../stores/settings-store.ts", import.meta.url),
    "utf8",
  );

  assert.match(storeText, /socialFontScaleMode/);
  assert.match(storeText, /socialFontScale/);
  assert.match(storeText, /setSocialFontScaleMode/);
  assert.match(storeText, /setSocialFontScale/);
});

test("settings store persists social-note line height settings", async () => {
  const storeText = await readFile(
    new URL("../stores/settings-store.ts", import.meta.url),
    "utf8",
  );

  assert.match(storeText, /socialLineHeight/);
  assert.match(storeText, /setSocialLineHeight/);
  assert.match(storeText, /resolveSocialLineHeight/);
});

test("settings sidebar exposes social-note font scale controls", async () => {
  const sidebarText = await readFile(
    new URL("../components/workbench/settings-sidebar.tsx", import.meta.url),
    "utf8",
  );

  assert.match(sidebarText, /字号缩放/);
  assert.match(sidebarText, /social-font-scale-mode/);
  assert.match(sidebarText, /social-font-scale/);
  assert.match(sidebarText, /仅正文/);
  assert.match(sidebarText, /整体/);
});

test("settings sidebar exposes social-note line height and folds advanced controls", async () => {
  const sidebarText = await readFile(
    new URL("../components/workbench/settings-sidebar.tsx", import.meta.url),
    "utf8",
  );

  assert.match(sidebarText, /行距/);
  assert.match(sidebarText, /social-line-height/);
  assert.match(sidebarText, /setSocialLineHeight/);
  assert.match(sidebarText, /<details/);
  assert.match(sidebarText, /更多社交图文设置/);
});

test("social-note theme reads the font preset and uses a larger body font size", async () => {
  const cardText = await readFile(
    new URL("../components/cards/SocialNoteCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(cardText, /socialFontPreset/);
  assert.match(cardText, /--social-font-family/);
  assert.match(cardText, /BASE_BODY_FONT_SIZE\s*=\s*17/);
  assert.match(cardText, /--social-body-font-size/);
});

test("social-note theme reads font scale settings and outputs scale variables", async () => {
  const cardText = await readFile(
    new URL("../components/cards/SocialNoteCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(cardText, /socialFontScaleMode/);
  assert.match(cardText, /socialFontScale/);
  assert.match(cardText, /--social-font-scale/);
  assert.match(cardText, /--social-body-font-size/);
  assert.match(cardText, /calc\(/);
});

test("social-note theme reads line height setting and outputs a line-height variable", async () => {
  const cardText = await readFile(
    new URL("../components/cards/SocialNoteCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(cardText, /socialLineHeight/);
  assert.match(cardText, /--social-line-height/);
  assert.match(cardText, /line-height:\s*var\(--social-line-height/);
});

test("social-note theme caps markdown image height with the shared ratio variable", async () => {
  const cardText = await readFile(
    new URL("../components/cards/SocialNoteCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(cardText, /const\s+SOCIAL_NOTE_IMAGE_MAX_HEIGHT_RATIO\s*=\s*0\.38/);
  assert.match(cardText, /settingHeight\s*\*\s*SOCIAL_NOTE_IMAGE_MAX_HEIGHT_RATIO/);
  assert.match(cardText, /--social-image-max-height/);
});

test("social-note theme renders markdown images with contain fit and css max-height variable", async () => {
  const cardText = await readFile(
    new URL("../components/cards/SocialNoteCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(cardText, /\.md-image\s*\{/);
  assert.match(cardText, /max-height:\s*var\(--social-image-max-height,\s*223px\)/);
  assert.match(cardText, /object-fit:\s*contain/);
});

test("social-note only extracts h1 as lead title on the first page", () => {
  const page = '<p>前文</p><h1 class="md-h1">124大大</h1><p>后文</p>';

  assert.deepEqual(splitSocialNoteTitle(page, 1), {
    body: page,
    title: null,
  });
  assert.deepEqual(splitSocialNoteTitle(page, 0), {
    body: "<p>前文</p><p>后文</p>",
    title: "124大大",
  });
});
