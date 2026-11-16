/**
 * Headless controller for SettingsAppearanceSection (AGENTS.md Rule 7 & Rule 8).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { configService } from '@/domains/settings/shared/api/ConfigService';
import {
  useThemeStore,
  type AppearanceDensity,
  type AppearanceMode,
  type AppearanceRadiusPreset,
} from '@/domains/settings/shared/stores/useThemeStore';
import {
  THEME_PRESET_LIST,
  resolveThemePreset,
  type ThemePresetId,
} from '@/domains/settings/shared/utils/themePresets';
import {
  autoAdjustContrastHsl,
  evaluateContrastCompliance,
} from '@/global/utils/color-utils';
import { useBrandConfig } from '@/global/config/brand.config';

export const UI_FONT_OPTIONS = ['Inter', 'Plus Jakarta Sans', 'System'] as const;
export const PROSE_FONT_OPTIONS = ['Inter', 'Newsreader', 'Source Serif 4', 'System'] as const;
export const MONO_FONT_OPTIONS = ['JetBrains Mono', 'Fira Code', 'System Mono'] as const;

export const MODE_OPTIONS: Array<{ value: AppearanceMode; label: string }> = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
];

export const DENSITY_OPTIONS: Array<{ value: AppearanceDensity; label: string }> = [
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'spacious', label: 'Spacious' },
];

export const RADIUS_OPTIONS: Array<{ value: AppearanceRadiusPreset; label: string }> = [
  { value: 'sharp', label: 'Sharp' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'soft', label: 'Soft' },
];

export function useSettingsAppearanceController() {
  const brand = useBrandConfig();
  const theme = useThemeStore((s) => s.theme);
  const appearance = useThemeStore((s) => s.appearance);
  const customCssSnippet = useThemeStore((s) => s.customCssSnippet);
  const setPreset = useThemeStore((s) => s.setPreset);
  const setMode = useThemeStore((s) => s.setMode);
  const updateColor = useThemeStore((s) => s.updateColor);
  const updateTypography = useThemeStore((s) => s.updateTypography);
  const updateLayout = useThemeStore((s) => s.updateLayout);
  const updateMotion = useThemeStore((s) => s.updateMotion);
  const setCustomCssSnippet = useThemeStore((s) => s.setCustomCssSnippet);
  const resetTheme = useThemeStore((s) => s.resetTheme);

  const [cssDraft, setCssDraft] = useState(customCssSnippet);
  const [rejectedRules, setRejectedRules] = useState<string[]>([]);
  const prevSnippetRef = useRef(customCssSnippet);

  useEffect(() => {
    if (prevSnippetRef.current !== customCssSnippet) {
      prevSnippetRef.current = customCssSnippet;
      setCssDraft(customCssSnippet);
    }
  }, [customCssSnippet]);

  const policyMeta = useMemo(() => configService.resolveSection('appearance'), []);
  const presets = useMemo(
    () =>
      THEME_PRESET_LIST.map((preset) =>
        preset.id === 'vk-midnight'
          ? { ...preset, label: `${brand.name} Midnight` }
          : preset,
      ),
    [brand.name],
  );
  const activePreset = useMemo(
    () => resolveThemePreset(appearance.presetId),
    [appearance.presetId],
  );

  const contrastReport = useMemo(
    () => evaluateContrastCompliance(theme.colors.foreground, theme.colors.background),
    [theme.colors.foreground, theme.colors.background],
  );

  const handleAutoAdjustContrast = useCallback(() => {
    const adjusted = autoAdjustContrastHsl(
      theme.colors.foreground,
      theme.colors.background,
      4.5,
    );
    updateColor('foreground', adjusted);
  }, [theme.colors.background, theme.colors.foreground, updateColor]);

  const handleApplyCss = useCallback(() => {
    const result = setCustomCssSnippet(cssDraft);
    setRejectedRules(result.rejectedRules);
  }, [cssDraft, setCustomCssSnippet]);

  const handleSelectPreset = useCallback(
    (presetId: ThemePresetId) => {
      setPreset(presetId);
    },
    [setPreset],
  );

  const handleReset = useCallback(() => {
    resetTheme();
    setCssDraft('');
    setRejectedRules([]);
  }, [resetTheme]);

  return {
    theme,
    appearance,
    presets,
    activePreset,
    contrastReport,
    isLockedByAdmin: policyMeta.isLockedByAdmin,
    sourceLayer: policyMeta.sourceLayer,
    cssDraft,
    setCssDraft,
    rejectedRules,
    setMode,
    updateTypography,
    updateLayout,
    updateMotion,
    handleSelectPreset,
    handleAutoAdjustContrast,
    handleApplyCss,
    handleReset,
  };
}
