"use client";

import { useEffect, useId, useState } from "react";
import { configNames } from "@/lib/card-registry";
import {
  MAX_CARD_WIDTH,
  MIN_CARD_HEIGHT,
  MIN_CARD_WIDTH,
  clampCardHeight,
  clampCardWidth,
} from "@/lib/card-dimensions";
import { designPresets, type DesignPresetId } from "@/lib/design-presets";
import { resolveThemeName } from "@/lib/theme-selection";
import ColorPalettePicker from "@/components/workbench/color-palette-picker";
import {
  socialNoteAccentColors,
  socialNoteBackgroundColors,
} from "@/lib/social-note-colors";
import {
  socialNoteFontOptions,
  type SocialNoteFontPreset,
} from "@/lib/social-note-fonts";
import {
  defaultSocialProfile,
  getDefaultSocialProfileTimeLabel,
} from "@/lib/social-profile";
import useSettingsStore, {
  type SocialFontScaleMode,
  viewModes,
} from "@/stores/settings-store";

const presetOptions = Object.entries(designPresets) as [DesignPresetId, (typeof designPresets)[DesignPresetId]][];
const supportedAvatarTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];
const maxAvatarSizeInBytes = 2 * 1024 * 1024;

export default function SettingsSidebar() {
  const {
    cardWidth,
    cardHeight,
    selectedPreset,
    viewMode,
    selectedTheme,
    socialProfileName,
    socialProfileTimeLabel,
    socialUseAutoTimeLabel,
    socialProfileAvatarUrl,
    socialFirstPageTopOffset,
    socialAvatarSize,
    socialBackgroundColor,
    socialAccentColor,
    socialFontPreset,
    socialFontScaleMode,
    socialFontScale,
    socialLineHeight,
    setCardWidth,
    setCardHeight,
    setSelectedPreset,
    setViewMode,
    setSelectedTheme,
    setSocialProfileName,
    setSocialProfileTimeLabel,
    setSocialUseAutoTimeLabel,
    setSocialProfileAvatarUrl,
    setSocialFirstPageTopOffset,
    setSocialAvatarSize,
    setSocialBackgroundColor,
    setSocialAccentColor,
    setSocialFontPreset,
    setSocialFontScaleMode,
    setSocialFontScale,
    setSocialLineHeight,
  } = useSettingsStore();
  const presetMeta = designPresets[selectedPreset];
  const avatarUploadId = useId();
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [widthInput, setWidthInput] = useState(() => String(cardWidth));
  const [heightInput, setHeightInput] = useState(() => String(cardHeight));
  const resolvedSelectedTheme = resolveThemeName(selectedTheme);
  const displayedSocialTimeLabel = socialUseAutoTimeLabel
    ? getDefaultSocialProfileTimeLabel()
    : socialProfileTimeLabel;
  const socialFontScaleLabel = `${socialFontScale.toFixed(2)}x`;
  const socialLineHeightLabel = socialLineHeight.toFixed(2);

  useEffect(() => {
    setWidthInput(String(cardWidth));
  }, [cardWidth]);

  useEffect(() => {
    setHeightInput(String(cardHeight));
  }, [cardHeight]);

  const commitWidthInput = () => {
    const value = Number.parseInt(widthInput, 10);
    if (Number.isNaN(value)) {
      setWidthInput(String(cardWidth));
      return;
    }

    const nextWidth = clampCardWidth(value);
    setCardWidth(nextWidth);
    setWidthInput(String(nextWidth));
  };

  const commitHeightInput = () => {
    const value = Number.parseInt(heightInput, 10);
    if (Number.isNaN(value)) {
      setHeightInput(String(cardHeight));
      return;
    }

    const nextHeight = clampCardHeight(value);
    setCardHeight(nextHeight);
    setHeightInput(String(nextHeight));
  };

  const handleDimensionKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!supportedAvatarTypes.includes(file.type)) {
      setAvatarError("仅支持 PNG、JPEG、WEBP、GIF、SVG 格式。请改用图片地址或重新选择文件。");
      return;
    }

    if (file.size > maxAvatarSizeInBytes) {
      setAvatarError("图片需小于 2MB。请压缩后重新上传，或改用公网 URL。");
      return;
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
            return;
          }

          reject(new Error("读取头像失败"));
        };
        reader.onerror = () => reject(new Error("读取头像失败"));
        reader.readAsDataURL(file);
      });

      setSocialProfileAvatarUrl(dataUrl);
      setAvatarError(null);
    } catch {
      setAvatarError("读取头像失败，请重试，或改用公网 URL。");
    }
  };

  return (
    <aside className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] xl:sticky xl:top-5 xl:max-h-[calc(100vh-112px)] xl:overflow-auto">
      <div className="flex flex-col gap-6">
        <div className="border-b border-slate-200 pb-4">
          <p className="text-sm font-semibold text-slate-900">画布设置</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            统一管理尺寸、视图和主题，右侧改动会立即同步到预览。
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            视图模式
          </p>
          <div className="flex rounded-lg bg-slate-100 p-1">
            {viewModes.map((mode) => (
              <button
                key={mode}
                className={`flex-1 rounded-md py-1.5 text-sm transition-colors ${viewMode === mode ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                onClick={() => setViewMode(mode)}
                type="button"
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-slate-700">尺寸</h4>
            <p className="mt-1 text-xs text-slate-500">
              预设尺寸会在你修改宽度时自动同步高度。为避免实时预览失控，宽度范围 {MIN_CARD_WIDTH}-{MAX_CARD_WIDTH}px，高度最低 {MIN_CARD_HEIGHT}px。
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-700" htmlFor="design-preset">
              选择设计尺寸
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700"
              id="design-preset"
              onChange={(event) => setSelectedPreset(event.target.value as DesignPresetId)}
              value={selectedPreset}
            >
              {presetOptions.map(([presetId, preset]) => (
                <option key={presetId} value={presetId}>
                  {preset.label}
                </option>
              ))}
            </select>
            {selectedPreset !== "custom" ? (
              <p className="mt-2 text-xs text-slate-500">
                推荐导出尺寸 {presetMeta.recommendedWidth} × {presetMeta.recommendedHeight}
              </p>
            ) : null}
          </div>

          <div className="flex gap-4">
            <label className="flex-1 text-sm text-slate-500">
              <span className="mb-2 block">宽度</span>
              <div className="flex items-center gap-2">
                <input
                  aria-label="卡片宽度"
                  className="w-20 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-slate-700"
                  max={MAX_CARD_WIDTH}
                  min={MIN_CARD_WIDTH}
                  onBlur={commitWidthInput}
                  onChange={(event) => setWidthInput(event.target.value)}
                  onKeyDown={handleDimensionKeyDown}
                  type="number"
                  value={widthInput}
                />
                <span>px</span>
              </div>
            </label>
            <label className="flex-1 text-sm text-slate-500">
              <span className="mb-2 block">高度</span>
              <div className="flex items-center gap-2">
                <input
                  aria-label="卡片高度"
                  className="w-20 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-slate-700"
                  min={MIN_CARD_HEIGHT}
                  onBlur={commitHeightInput}
                  onChange={(event) => setHeightInput(event.target.value)}
                  onKeyDown={handleDimensionKeyDown}
                  type="number"
                  value={heightInput}
                />
                <span>px</span>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-700" htmlFor="theme-select">
            选择主题
          </label>
          <select
            className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700"
            id="theme-select"
            onChange={(event) => setSelectedTheme(event.target.value)}
            value={resolvedSelectedTheme}
          >
            {configNames.map((themeName) => (
              <option key={themeName} value={themeName}>
                {themeName}
              </option>
            ))}
          </select>
        </div>

        {resolvedSelectedTheme === "社交图文" ? (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div>
              <p className="text-sm font-medium text-slate-700">社交资料</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                仅作用于第 1 张卡片。头像支持公网地址、`public/` 路径，或上传图片后保存到本地缓存。
              </p>
            </div>

            <label className="block text-sm text-slate-600">
              <span className="mb-2 block">用户名</span>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                onChange={(event) => setSocialProfileName(event.target.value)}
                placeholder="例如：青玉白露"
                type="text"
                value={socialProfileName}
              />
            </label>

            <label className="block text-sm text-slate-600">
              <span className="mb-2 block">时间</span>
              <label className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                <input
                  checked={socialUseAutoTimeLabel}
                  onChange={(event) => setSocialUseAutoTimeLabel(event.target.checked)}
                  type="checkbox"
                />
                自动获取当前日期
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
                disabled={socialUseAutoTimeLabel}
                onChange={(event) => setSocialProfileTimeLabel(event.target.value)}
                placeholder="默认自动填入当天日期"
                type="text"
                value={displayedSocialTimeLabel}
              />
            </label>

            <label className="block text-sm text-slate-600">
              <span className="mb-2 block">头像地址</span>
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                onChange={(event) => {
                  setSocialProfileAvatarUrl(event.target.value);
                  setAvatarError(null);
                }}
                placeholder="https://example.com/avatar.png 或 /social-avatar.svg"
                type="text"
                value={socialProfileAvatarUrl}
              />
            </label>

            <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-white/70 p-3">
              <div className="flex flex-wrap items-center gap-3">
                <label
                  className="inline-flex cursor-pointer items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                  htmlFor={avatarUploadId}
                >
                  上传本地头像
                </label>
                <input
                  accept={supportedAvatarTypes.join(",")}
                  className="sr-only"
                  id={avatarUploadId}
                  onChange={handleAvatarUpload}
                  type="file"
                />
                <button
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  onClick={() => {
                    setSocialProfileAvatarUrl(defaultSocialProfile.avatarUrl);
                    setAvatarError(null);
                  }}
                  type="button"
                >
                  恢复默认头像
                </button>
              </div>
              <p className="text-xs leading-5 text-slate-500">
                支持 PNG、JPEG、WEBP、GIF、SVG，文件需小于 2MB。上传后会保存在浏览器本地缓存。
              </p>
              {avatarError ? <p className="text-xs text-rose-500">{avatarError}</p> : null}
            </div>

            <ColorPalettePicker
              label="背景颜色"
              onChange={setSocialBackgroundColor}
              options={socialNoteBackgroundColors}
              value={socialBackgroundColor}
            />

            <div>
              <label className="mb-2 block text-sm text-slate-600" htmlFor="social-font-preset">
                字体风格
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700"
                id="social-font-preset"
                onChange={(event) =>
                  setSocialFontPreset(event.target.value as SocialNoteFontPreset)
                }
                value={socialFontPreset}
              >
                {socialNoteFontOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200 bg-white/80 p-3">
              <div className="flex items-center justify-between gap-3">
                <label className="block text-sm text-slate-600" htmlFor="social-line-height">
                  行距
                </label>
                <span className="text-xs font-medium text-slate-500">
                  {socialLineHeightLabel}
                </span>
              </div>
              <input
                className="w-full accent-slate-900"
                id="social-line-height"
                max={1.6}
                min={1.05}
                onChange={(event) => setSocialLineHeight(Number(event.target.value))}
                step={0.01}
                type="range"
                value={socialLineHeight}
              />
            </div>

            <details className="group rounded-xl border border-slate-200 bg-white/80 p-3">
              <summary className="cursor-pointer list-none text-sm font-medium text-slate-700">
                更多社交图文设置
                <span className="float-right text-xs text-slate-400 group-open:hidden">
                  展开
                </span>
                <span className="float-right hidden text-xs text-slate-400 group-open:inline">
                  收起
                </span>
              </summary>

              <div className="mt-4 space-y-4">
                <div className="flex gap-4">
                  <label className="flex-1 text-sm text-slate-600">
                    <span className="mb-2 block">首图顶部空白</span>
                    <div className="flex items-center gap-2">
                      <input
                        aria-label="首图顶部空白"
                        className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700"
                        onChange={(event) => {
                          const value = Number.parseInt(event.target.value, 10);
                          if (!Number.isNaN(value)) {
                            setSocialFirstPageTopOffset(value);
                          }
                        }}
                        type="number"
                        value={socialFirstPageTopOffset}
                      />
                      <span>px</span>
                    </div>
                  </label>
                  <label className="flex-1 text-sm text-slate-600">
                    <span className="mb-2 block">头像尺寸</span>
                    <div className="flex items-center gap-2">
                      <input
                        aria-label="头像尺寸"
                        className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700"
                        onChange={(event) => {
                          const value = Number.parseInt(event.target.value, 10);
                          if (!Number.isNaN(value)) {
                            setSocialAvatarSize(value);
                          }
                        }}
                        type="number"
                        value={socialAvatarSize}
                      />
                      <span>px</span>
                    </div>
                  </label>
                </div>

                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <label
                      className="block text-sm text-slate-600"
                      htmlFor="social-font-scale-mode"
                    >
                      字号缩放
                    </label>
                    <span className="text-xs font-medium text-slate-500">{socialFontScaleLabel}</span>
                  </div>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700"
                    id="social-font-scale-mode"
                    onChange={(event) =>
                      setSocialFontScaleMode(event.target.value as SocialFontScaleMode)
                    }
                    value={socialFontScaleMode}
                  >
                    <option value="body">仅正文</option>
                    <option value="all">整体</option>
                  </select>
                  <input
                    className="w-full accent-slate-900"
                    id="social-font-scale"
                    max={1.3}
                    min={0.85}
                    onChange={(event) => setSocialFontScale(Number(event.target.value))}
                    step={0.05}
                    type="range"
                    value={socialFontScale}
                  />
                  <p className="text-xs leading-5 text-slate-500">
                    仅正文只调整正文基准字号；整体会连同标题、小字信息和列表一起缩放。
                  </p>
                </div>

                <ColorPalettePicker
                  label="重点字体颜色"
                  onChange={setSocialAccentColor}
                  options={socialNoteAccentColors}
                  value={socialAccentColor}
                />
              </div>
            </details>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
