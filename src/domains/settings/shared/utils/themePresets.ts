/**
 * Universal 6 Theme Presets for DOM, CodeMirror/Prose, and Canvas2D (DOC-PLAN-008 / UI-STEP-01).
 * All colors are bare HSL triplets ("H S% L%") compatible with Tailwind HSL alpha utilities.
 */

import { getBrandConfig } from '@/global/config/brand.config';

export type CanonicalThemePresetId =
  | 'vk-midnight'
  | 'obsidian-oled'
  | 'daylight-paper'
  | 'warm-sepia'
  | 'nord-scholar'
  | 'high-contrast-aaa';

export type ThemePresetId = CanonicalThemePresetId | 'obmap-midnight';

export interface ThemePresetPalette {
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  borderSubtle: string;
  borderStrong: string;
  input: string;
  ring: string;
  destructive: string;
  destructiveForeground: string;
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  success: string;
  successSubtle: string;
  warning: string;
  warningSubtle: string;
  danger: string;
  dangerSubtle: string;
  info: string;
  infoSubtle: string;
  canvasBackground: string;
  surfaceElevated: string;
  surfaceOverlay: string;
  textSecondary: string;
  textMuted: string;
  textSubtle: string;
  nodeGlow: string;
  linkColor: string;
  folderNodeColor: string;
  fileNodeColor: string;
  nodeEvergreen: string;
  nodeLocked: string;
  edgeCitation: string;
  labelBg: string;
}

export interface ThemePresetDefinition {
  id: CanonicalThemePresetId;
  label: string;
  description: string;
  mode: 'dark' | 'light';
  isHighContrast?: boolean;
  colors: ThemePresetPalette;
}

const VK_MIDNIGHT_PRESET: ThemePresetDefinition = {
  id: 'vk-midnight',
  label: `${getBrandConfig().name} Midnight`,
  description: 'Tenang bernuansa indigo gelap dengan aksen violet lembut untuk kerja berjam-jam.',
  mode: 'dark',
  colors: {
    primary: '270 70% 65%',
    primaryForeground: '240 15% 6%',
    accent: '270 80% 70%',
    accentForeground: '240 15% 6%',
    background: '240 15% 5%',
    foreground: '240 10% 95%',
    card: '240 12% 8%',
    cardForeground: '240 10% 95%',
    popover: '240 12% 9%',
    popoverForeground: '240 10% 95%',
    secondary: '240 10% 13%',
    secondaryForeground: '240 10% 95%',
    muted: '240 10% 15%',
    mutedForeground: '240 8% 66%',
    border: '240 10% 19%',
    borderSubtle: '240 10% 14%',
    borderStrong: '240 12% 30%',
    input: '240 10% 19%',
    ring: '270 70% 65%',
    destructive: '0 72% 55%',
    destructiveForeground: '0 0% 98%',
    sidebarBackground: '240 12% 7%',
    sidebarForeground: '240 10% 92%',
    sidebarPrimary: '270 70% 65%',
    sidebarPrimaryForeground: '240 15% 6%',
    sidebarAccent: '240 10% 13%',
    sidebarAccentForeground: '240 10% 92%',
    sidebarBorder: '240 10% 15%',
    sidebarRing: '270 70% 65%',
    success: '152 69% 46%',
    successSubtle: '152 45% 14%',
    warning: '38 92% 58%',
    warningSubtle: '38 55% 15%',
    danger: '0 78% 62%',
    dangerSubtle: '0 55% 16%',
    info: '205 90% 62%',
    infoSubtle: '205 55% 15%',
    canvasBackground: '240 15% 7%',
    surfaceElevated: '240 12% 11%',
    surfaceOverlay: '240 14% 12%',
    textSecondary: '240 10% 82%',
    textMuted: '240 8% 66%',
    textSubtle: '240 6% 52%',
    nodeGlow: '270 80% 70%',
    linkColor: '270 70% 65%',
    folderNodeColor: '48 100% 60%',
    fileNodeColor: '270 70% 65%',
    nodeEvergreen: '152 69% 50%',
    nodeLocked: '38 92% 58%',
    edgeCitation: '205 90% 62%',
    labelBg: '240 12% 10%',
  },
};

const OBSIDIAN_OLED_PRESET: ThemePresetDefinition = {
  id: 'obsidian-oled',
  label: 'Obsidian OLED',
  description: 'Hitam murni kontras tinggi untuk layar OLED dengan simpul graf berpendar.',
  mode: 'dark',
  colors: {
    ...VK_MIDNIGHT_PRESET.colors,
    background: '0 0% 2%',
    foreground: '0 0% 96%',
    card: '0 0% 5%',
    cardForeground: '0 0% 96%',
    popover: '0 0% 6%',
    popoverForeground: '0 0% 96%',
    secondary: '0 0% 10%',
    secondaryForeground: '0 0% 96%',
    muted: '0 0% 11%',
    mutedForeground: '0 0% 68%',
    border: '0 0% 16%',
    borderSubtle: '0 0% 11%',
    borderStrong: '0 0% 28%',
    input: '0 0% 16%',
    sidebarBackground: '0 0% 4%',
    sidebarForeground: '0 0% 93%',
    sidebarAccent: '0 0% 10%',
    sidebarAccentForeground: '0 0% 93%',
    sidebarBorder: '0 0% 13%',
    canvasBackground: '0 0% 3%',
    surfaceElevated: '0 0% 8%',
    surfaceOverlay: '0 0% 9%',
    textSecondary: '0 0% 84%',
    textMuted: '0 0% 68%',
    textSubtle: '0 0% 54%',
    labelBg: '0 0% 7%',
  },
};

const DAYLIGHT_PAPER_PRESET: ThemePresetDefinition = {
  id: 'daylight-paper',
  label: 'Daylight Paper',
  description: 'Kertas akademik terang dan bersih dengan teks slate gelap berketajaman tinggi.',
  mode: 'light',
  colors: {
    primary: '258 75% 52%',
    primaryForeground: '0 0% 100%',
    accent: '258 82% 58%',
    accentForeground: '0 0% 100%',
    background: '220 20% 98%',
    foreground: '222 47% 11%',
    card: '0 0% 100%',
    cardForeground: '222 47% 11%',
    popover: '0 0% 100%',
    popoverForeground: '222 47% 11%',
    secondary: '220 16% 92%',
    secondaryForeground: '222 47% 14%',
    muted: '220 14% 93%',
    mutedForeground: '220 14% 38%',
    border: '220 16% 84%',
    borderSubtle: '220 16% 90%',
    borderStrong: '220 18% 68%',
    input: '220 16% 84%',
    ring: '258 75% 52%',
    destructive: '0 72% 46%',
    destructiveForeground: '0 0% 100%',
    sidebarBackground: '220 20% 96%',
    sidebarForeground: '222 47% 14%',
    sidebarPrimary: '258 75% 52%',
    sidebarPrimaryForeground: '0 0% 100%',
    sidebarAccent: '220 16% 90%',
    sidebarAccentForeground: '222 47% 14%',
    sidebarBorder: '220 16% 86%',
    sidebarRing: '258 75% 52%',
    success: '152 68% 34%',
    successSubtle: '152 60% 92%',
    warning: '36 88% 38%',
    warningSubtle: '38 92% 92%',
    danger: '0 72% 46%',
    dangerSubtle: '0 85% 94%',
    info: '212 85% 44%',
    infoSubtle: '212 85% 94%',
    canvasBackground: '220 20% 97%',
    surfaceElevated: '0 0% 100%',
    surfaceOverlay: '0 0% 100%',
    textSecondary: '222 28% 24%',
    textMuted: '220 14% 38%',
    textSubtle: '220 10% 48%',
    nodeGlow: '258 82% 58%',
    linkColor: '258 70% 52%',
    folderNodeColor: '38 92% 44%',
    fileNodeColor: '258 75% 52%',
    nodeEvergreen: '152 68% 36%',
    nodeLocked: '36 88% 40%',
    edgeCitation: '212 85% 44%',
    labelBg: '0 0% 100%',
  },
};

const WARM_SEPIA_PRESET: ThemePresetDefinition = {
  id: 'warm-sepia',
  label: 'Warm Sepia',
  description: 'Nuansa perkamen krem hangat yang ramah mata untuk membaca dan menyusun riset.',
  mode: 'light',
  colors: {
    ...DAYLIGHT_PAPER_PRESET.colors,
    primary: '24 72% 42%',
    primaryForeground: '40 40% 98%',
    accent: '28 78% 46%',
    accentForeground: '40 40% 98%',
    background: '38 35% 94%',
    foreground: '28 32% 14%',
    card: '38 40% 97%',
    cardForeground: '28 32% 14%',
    popover: '38 40% 97%',
    popoverForeground: '28 32% 14%',
    secondary: '36 26% 88%',
    secondaryForeground: '28 32% 16%',
    muted: '36 24% 89%',
    mutedForeground: '28 18% 36%',
    border: '35 22% 80%',
    borderSubtle: '35 22% 86%',
    borderStrong: '32 24% 64%',
    input: '35 22% 80%',
    ring: '24 72% 42%',
    sidebarBackground: '38 32% 91%',
    sidebarForeground: '28 32% 16%',
    sidebarPrimary: '24 72% 42%',
    sidebarAccent: '36 26% 85%',
    sidebarAccentForeground: '28 32% 16%',
    sidebarBorder: '35 22% 82%',
    canvasBackground: '38 34% 93%',
    surfaceElevated: '38 42% 98%',
    surfaceOverlay: '38 42% 98%',
    textSecondary: '28 24% 25%',
    textMuted: '28 18% 36%',
    textSubtle: '28 14% 46%',
    nodeGlow: '28 78% 46%',
    linkColor: '24 72% 42%',
    folderNodeColor: '36 86% 42%',
    fileNodeColor: '24 72% 42%',
    labelBg: '38 40% 97%',
  },
};

const NORD_SCHOLAR_PRESET: ThemePresetDefinition = {
  id: 'nord-scholar',
  label: 'Nord Scholar',
  description: 'Palet slate Nordik dingin bernuansa editorial dan fokus kode.',
  mode: 'dark',
  colors: {
    ...VK_MIDNIGHT_PRESET.colors,
    primary: '193 65% 62%',
    primaryForeground: '220 20% 10%',
    accent: '210 70% 68%',
    accentForeground: '220 20% 10%',
    background: '220 18% 12%',
    foreground: '218 27% 93%',
    card: '220 17% 15%',
    cardForeground: '218 27% 93%',
    popover: '220 17% 16%',
    popoverForeground: '218 27% 93%',
    secondary: '220 16% 20%',
    secondaryForeground: '218 27% 93%',
    muted: '220 16% 21%',
    mutedForeground: '219 16% 72%',
    border: '220 16% 25%',
    borderSubtle: '220 16% 20%',
    borderStrong: '220 18% 36%',
    input: '220 16% 25%',
    ring: '193 65% 62%',
    sidebarBackground: '220 18% 14%',
    sidebarForeground: '218 27% 91%',
    sidebarPrimary: '193 65% 62%',
    sidebarAccent: '220 16% 20%',
    sidebarAccentForeground: '218 27% 91%',
    sidebarBorder: '220 16% 22%',
    sidebarRing: '193 65% 62%',
    canvasBackground: '220 18% 11%',
    surfaceElevated: '220 17% 18%',
    surfaceOverlay: '220 17% 19%',
    textSecondary: '218 22% 84%',
    textMuted: '219 16% 72%',
    textSubtle: '219 12% 58%',
    nodeGlow: '193 65% 62%',
    linkColor: '193 65% 62%',
    folderNodeColor: '40 85% 62%',
    fileNodeColor: '210 70% 68%',
    labelBg: '220 17% 15%',
  },
};

const HIGH_CONTRAST_AAA_PRESET: ThemePresetDefinition = {
  id: 'high-contrast-aaa',
  label: 'High Contrast AAA',
  description: 'Aksesibilitas rasio kontras >= 7:1 tanpa blur transparan dengan border tegas.',
  mode: 'dark',
  isHighContrast: true,
  colors: {
    primary: '205 100% 68%',
    primaryForeground: '0 0% 2%',
    accent: '52 100% 62%',
    accentForeground: '0 0% 2%',
    background: '0 0% 2%',
    foreground: '0 0% 100%',
    card: '0 0% 6%',
    cardForeground: '0 0% 100%',
    popover: '0 0% 6%',
    popoverForeground: '0 0% 100%',
    secondary: '0 0% 12%',
    secondaryForeground: '0 0% 100%',
    muted: '0 0% 14%',
    mutedForeground: '0 0% 82%',
    border: '0 0% 48%',
    borderSubtle: '0 0% 34%',
    borderStrong: '0 0% 85%',
    input: '0 0% 48%',
    ring: '52 100% 62%',
    destructive: '0 92% 66%',
    destructiveForeground: '0 0% 2%',
    sidebarBackground: '0 0% 4%',
    sidebarForeground: '0 0% 100%',
    sidebarPrimary: '205 100% 68%',
    sidebarPrimaryForeground: '0 0% 2%',
    sidebarAccent: '0 0% 14%',
    sidebarAccentForeground: '0 0% 100%',
    sidebarBorder: '0 0% 44%',
    sidebarRing: '52 100% 62%',
    success: '142 85% 58%',
    successSubtle: '142 50% 14%',
    warning: '48 100% 58%',
    warningSubtle: '48 60% 14%',
    danger: '0 92% 66%',
    dangerSubtle: '0 60% 16%',
    info: '205 100% 68%',
    infoSubtle: '205 60% 16%',
    canvasBackground: '0 0% 0%',
    surfaceElevated: '0 0% 9%',
    surfaceOverlay: '0 0% 10%',
    textSecondary: '0 0% 92%',
    textMuted: '0 0% 84%',
    textSubtle: '0 0% 74%',
    nodeGlow: '52 100% 62%',
    linkColor: '205 100% 68%',
    folderNodeColor: '52 100% 62%',
    fileNodeColor: '205 100% 68%',
    nodeEvergreen: '142 85% 58%',
    nodeLocked: '48 100% 58%',
    edgeCitation: '205 100% 68%',
    labelBg: '0 0% 4%',
  },
};

export const THEME_PRESET_LIST: ThemePresetDefinition[] = [
  VK_MIDNIGHT_PRESET,
  OBSIDIAN_OLED_PRESET,
  DAYLIGHT_PAPER_PRESET,
  WARM_SEPIA_PRESET,
  NORD_SCHOLAR_PRESET,
  HIGH_CONTRAST_AAA_PRESET,
];

export const THEME_PRESETS: Record<ThemePresetId, ThemePresetDefinition> = {
  'vk-midnight': VK_MIDNIGHT_PRESET,
  'obmap-midnight': VK_MIDNIGHT_PRESET,
  'obsidian-oled': OBSIDIAN_OLED_PRESET,
  'daylight-paper': DAYLIGHT_PAPER_PRESET,
  'warm-sepia': WARM_SEPIA_PRESET,
  'nord-scholar': NORD_SCHOLAR_PRESET,
  'high-contrast-aaa': HIGH_CONTRAST_AAA_PRESET,
};

/** Resolves any canonical or legacy preset ID with dynamic brand label on midnight default. */
export function resolveThemePreset(id?: string): ThemePresetDefinition {
  const preset =
    id && id in THEME_PRESETS
      ? THEME_PRESETS[id as ThemePresetId]
      : VK_MIDNIGHT_PRESET;

  if (preset.id === 'vk-midnight') {
    return {
      ...preset,
      label: `${getBrandConfig().name} Midnight`,
    };
  }
  return preset;
}
