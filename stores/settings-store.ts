"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { clampCardHeight, clampCardWidth } from "@/lib/card-dimensions";
import {
  calculatePresetHeight,
  defaultCanvasSize,
  defaultPresetId,
  type DesignPresetId,
  inferPreset,
} from "@/lib/design-presets";
import {
  defaultSocialNoteAccentColor,
  defaultSocialNoteBackgroundColor,
  resolveSocialNoteAccentColor,
  resolveSocialNoteBackgroundColor,
} from "@/lib/social-note-colors";
import {
  defaultSocialNoteFontPreset,
  type SocialNoteFontPreset,
  resolveSocialNoteFontPreset,
} from "@/lib/social-note-fonts";
import {
  getDefaultSocialProfileTimeLabel,
  inferSocialUseAutoTimeLabel,
  resolveSocialProfile,
} from "@/lib/social-profile";
import { defaultThemeName, resolveThemeName } from "@/lib/theme-selection";

export const viewModes = ["长卡片", "短卡片"] as const;
export type ViewMode = (typeof viewModes)[number];
export type SocialFontScaleMode = "body" | "all";

interface SettingsState {
  cardWidth: number;
  cardHeight: number;
  selectedPreset: DesignPresetId;
  viewMode: ViewMode;
  hideOverflow: boolean;
  selectedTheme: string;
  socialProfileName: string;
  socialProfileTimeLabel: string;
  socialUseAutoTimeLabel: boolean;
  socialProfileAvatarUrl: string;
  socialFirstPageTopOffset: number;
  socialAvatarSize: number;
  socialBackgroundColor: string;
  socialAccentColor: string;
  socialFontPreset: SocialNoteFontPreset;
  socialFontScaleMode: SocialFontScaleMode;
  socialFontScale: number;
  setCardWidth: (width: number) => void;
  setCardHeight: (height: number) => void;
  setSelectedPreset: (preset: DesignPresetId) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setHideOverflow: (hideOverflow: boolean) => void;
  setSelectedTheme: (theme: string) => void;
  setSocialProfileName: (name: string) => void;
  setSocialProfileTimeLabel: (timeLabel: string) => void;
  setSocialUseAutoTimeLabel: (useAutoTimeLabel: boolean) => void;
  setSocialProfileAvatarUrl: (avatarUrl: string) => void;
  setSocialFirstPageTopOffset: (offset: number) => void;
  setSocialAvatarSize: (size: number) => void;
  setSocialBackgroundColor: (color: string) => void;
  setSocialAccentColor: (color: string) => void;
  setSocialFontPreset: (preset: SocialNoteFontPreset) => void;
  setSocialFontScaleMode: (mode: SocialFontScaleMode) => void;
  setSocialFontScale: (scale: number) => void;
}

const defaultWidth = defaultCanvasSize.width;
const defaultHeight = defaultCanvasSize.height;
const defaultSocialState = resolveSocialProfile();
const minSocialFirstPageTopOffset = 0;
const maxSocialFirstPageTopOffset = 120;
const minSocialAvatarSize = 32;
const maxSocialAvatarSize = 96;
const minSocialFontScale = 0.85;
const maxSocialFontScale = 1.3;
const defaultSocialFontScale = 1;

function clampSocialFirstPageTopOffset(offset: number) {
  return Math.min(
    maxSocialFirstPageTopOffset,
    Math.max(minSocialFirstPageTopOffset, offset),
  );
}

function clampSocialAvatarSize(size: number) {
  return Math.min(maxSocialAvatarSize, Math.max(minSocialAvatarSize, size));
}

function clampSocialFontScale(scale: number) {
  return Math.min(maxSocialFontScale, Math.max(minSocialFontScale, scale));
}

function resolveSocialFontScaleMode(
  mode: SocialFontScaleMode | string | null | undefined,
): SocialFontScaleMode {
  return mode === "all" ? "all" : "body";
}

function resolveSocialFontScale(scale: unknown) {
  return typeof scale === "number" && Number.isFinite(scale)
    ? clampSocialFontScale(scale)
    : defaultSocialFontScale;
}

function createDefaultSettingsState() {
  return {
    cardWidth: defaultWidth,
    cardHeight: clampCardHeight(defaultHeight),
    selectedPreset: defaultPresetId,
    viewMode: "短卡片" as ViewMode,
    hideOverflow: false,
    selectedTheme: defaultThemeName,
    socialProfileName: defaultSocialState.name,
    socialProfileTimeLabel: defaultSocialState.timeLabel,
    socialUseAutoTimeLabel: true,
    socialProfileAvatarUrl: defaultSocialState.avatarUrl,
    socialFirstPageTopOffset: defaultSocialState.firstPageTopOffset,
    socialAvatarSize: defaultSocialState.avatarSize,
    socialBackgroundColor: defaultSocialNoteBackgroundColor,
    socialAccentColor: defaultSocialNoteAccentColor,
    socialFontPreset: defaultSocialNoteFontPreset,
    socialFontScaleMode: "body" as SocialFontScaleMode,
    socialFontScale: defaultSocialFontScale,
  };
}

let isRecoveringSettingsStorage = false;
let recoverSettingsStorage:
  | ((error: unknown) => void)
  | undefined;

const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get, api) => {
      recoverSettingsStorage = (error) => {
        if (!error || isRecoveringSettingsStorage) {
          return;
        }

        isRecoveringSettingsStorage = true;
        set(createDefaultSettingsState());
        api.persist?.clearStorage();

        const rehydrationResult = api.persist?.rehydrate();
        void Promise.resolve(rehydrationResult).finally(() => {
          isRecoveringSettingsStorage = false;
        });
      };

      return {
        ...createDefaultSettingsState(),
        setCardWidth: (cardWidth) => {
          const nextWidth = clampCardWidth(cardWidth);
          const { selectedPreset } = get();

          if (selectedPreset !== "custom") {
            const nextHeight = clampCardHeight(
              calculatePresetHeight(nextWidth, selectedPreset),
            );
            set({
              cardWidth: nextWidth,
              cardHeight: nextHeight,
            });
            return;
          }

          set({ cardWidth: nextWidth });
        },
        setCardHeight: (cardHeight) => {
          const nextHeight = clampCardHeight(cardHeight);
          const nextWidth = clampCardWidth(get().cardWidth);

          set({
            cardWidth: nextWidth,
            cardHeight: nextHeight,
            selectedPreset: inferPreset(nextWidth, nextHeight),
          });
        },
        setSelectedPreset: (selectedPreset) => {
          const nextWidth = clampCardWidth(get().cardWidth);

          if (selectedPreset === "custom") {
            set({ cardWidth: nextWidth, selectedPreset });
            return;
          }

          set({
            cardWidth: nextWidth,
            selectedPreset,
            cardHeight: clampCardHeight(
              calculatePresetHeight(nextWidth, selectedPreset),
            ),
          });
        },
        setViewMode: (viewMode) => set({ viewMode }),
        setHideOverflow: (hideOverflow) => set({ hideOverflow }),
        setSelectedTheme: (selectedTheme) =>
          set({ selectedTheme: resolveThemeName(selectedTheme) }),
        setSocialProfileName: (socialProfileName) => set({ socialProfileName }),
        setSocialProfileTimeLabel: (socialProfileTimeLabel) =>
          set({ socialProfileTimeLabel }),
        setSocialUseAutoTimeLabel: (socialUseAutoTimeLabel) =>
          set({ socialUseAutoTimeLabel }),
        setSocialProfileAvatarUrl: (socialProfileAvatarUrl) =>
          set({ socialProfileAvatarUrl }),
        setSocialFirstPageTopOffset: (socialFirstPageTopOffset) =>
          set({
            socialFirstPageTopOffset: clampSocialFirstPageTopOffset(
              socialFirstPageTopOffset,
            ),
          }),
        setSocialAvatarSize: (socialAvatarSize) =>
          set({ socialAvatarSize: clampSocialAvatarSize(socialAvatarSize) }),
        setSocialBackgroundColor: (socialBackgroundColor) =>
          set({
            socialBackgroundColor: resolveSocialNoteBackgroundColor(
              socialBackgroundColor,
            ),
          }),
        setSocialAccentColor: (socialAccentColor) =>
          set({
            socialAccentColor: resolveSocialNoteAccentColor(socialAccentColor),
          }),
        setSocialFontPreset: (socialFontPreset) =>
          set({
            socialFontPreset: resolveSocialNoteFontPreset(socialFontPreset),
          }),
        setSocialFontScaleMode: (socialFontScaleMode) =>
          set({
            socialFontScaleMode: resolveSocialFontScaleMode(socialFontScaleMode),
          }),
        setSocialFontScale: (socialFontScale) =>
          set({
            socialFontScale: resolveSocialFontScale(socialFontScale),
          }),
      };
    },
    {
      name: "settings-storage",
      version: 12,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (_state, error) => {
        if (!error) {
          isRecoveringSettingsStorage = false;
          return;
        }

        recoverSettingsStorage?.(error);
      },
      migrate: (persistedState) => {
        const state = persistedState as SettingsState | undefined;

        if (!state) {
          return createDefaultSettingsState();
        }

        const width = clampCardWidth(state.cardWidth ?? defaultWidth);
        const rawHeight = clampCardHeight(state.cardHeight ?? defaultHeight);
        const inferredPreset = inferPreset(width, rawHeight);
        const nextPreset = state.selectedPreset ?? inferredPreset;

        const shouldUpgradeLegacyShortCard =
          nextPreset === "custom" && width === 440 && rawHeight === 586;
        const resolvedWidth = shouldUpgradeLegacyShortCard ? defaultWidth : width;
        const resolvedPreset = shouldUpgradeLegacyShortCard ? defaultPresetId : nextPreset;
        const resolvedHeight =
          resolvedPreset === "custom"
            ? (shouldUpgradeLegacyShortCard ? clampCardHeight(defaultHeight) : rawHeight)
            : clampCardHeight(calculatePresetHeight(resolvedWidth, resolvedPreset));
        const socialUseAutoTimeLabel =
          state.socialUseAutoTimeLabel ?? inferSocialUseAutoTimeLabel(state.socialProfileTimeLabel);
        const socialProfile = resolveSocialProfile({
          avatarUrl: state.socialProfileAvatarUrl,
          name: state.socialProfileName,
          timeLabel: socialUseAutoTimeLabel
            ? getDefaultSocialProfileTimeLabel()
            : state.socialProfileTimeLabel,
          firstPageTopOffset: clampSocialFirstPageTopOffset(
            state.socialFirstPageTopOffset ?? defaultSocialState.firstPageTopOffset,
          ),
          avatarSize: clampSocialAvatarSize(
            state.socialAvatarSize ?? defaultSocialState.avatarSize,
          ),
        });

        return {
          ...state,
          cardWidth: resolvedWidth,
          cardHeight: resolvedHeight,
          selectedPreset: resolvedPreset,
          viewMode: state.viewMode ?? "短卡片",
          selectedTheme: resolveThemeName(state.selectedTheme),
          socialProfileName: socialProfile.name,
          socialProfileTimeLabel: state.socialProfileTimeLabel ?? socialProfile.timeLabel,
          socialUseAutoTimeLabel,
          socialProfileAvatarUrl: socialProfile.avatarUrl,
          socialFirstPageTopOffset: socialProfile.firstPageTopOffset,
          socialAvatarSize: socialProfile.avatarSize,
          socialBackgroundColor: resolveSocialNoteBackgroundColor(
            state.socialBackgroundColor,
          ),
          socialAccentColor: resolveSocialNoteAccentColor(state.socialAccentColor),
          socialFontPreset: resolveSocialNoteFontPreset(state.socialFontPreset),
          socialFontScaleMode: resolveSocialFontScaleMode(state.socialFontScaleMode),
          socialFontScale: resolveSocialFontScale(state.socialFontScale),
        };
      },
    },
  ),
);

export default useSettingsStore;
