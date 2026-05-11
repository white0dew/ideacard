export const selectableThemeNames = ["社交图文", "留白文志", "终端纪要"] as const;

export type SelectableThemeName = (typeof selectableThemeNames)[number];

export const defaultThemeName: SelectableThemeName = "社交图文";

const selectableThemeNameSet = new Set<string>(selectableThemeNames);

export function resolveThemeName(
  themeName: string | null | undefined,
): SelectableThemeName {
  return themeName && selectableThemeNameSet.has(themeName)
    ? (themeName as SelectableThemeName)
    : defaultThemeName;
}
