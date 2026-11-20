import type { PrototypeAppearanceState } from "../settingsTypes";
import type { AppThemeId, EditorFontFamilyId } from "../vcsAndConfigTypes";

interface ScopedThemeTokens {
  background: string;
  foreground: string;
  card: string;
  surface: string;
  border: string;
  primary: string;
  vkBgBase: string;
  vkBgSurface: string;
  vkTextPrimary: string;
}

const THEME_TOKEN_MAP: Record<AppThemeId, ScopedThemeTokens> = {
  obsidian_dark: {
    background: "240 15% 5%",
    foreground: "240 10% 95%",
    card: "240 14% 8%",
    surface: "240 12% 11%",
    border: "240 10% 18%",
    primary: "265 78% 66%",
    vkBgBase: "hsl(240 15% 5%)",
    vkBgSurface: "hsl(240 12% 11%)",
    vkTextPrimary: "hsl(240 10% 95%)",
  },
  calm_daylight: {
    background: "215 28% 97%",
    foreground: "222 47% 11%",
    card: "0 0% 100%",
    surface: "214 24% 94%",
    border: "214 20% 84%",
    primary: "258 75% 52%",
    vkBgBase: "hsl(215 28% 97%)",
    vkBgSurface: "hsl(214 24% 94%)",
    vkTextPrimary: "hsl(222 47% 11%)",
  },
  high_contrast_scholar: {
    background: "0 0% 2%",
    foreground: "0 0% 100%",
    card: "0 0% 6%",
    surface: "0 0% 10%",
    border: "205 60% 55%",
    primary: "205 100% 68%",
    vkBgBase: "hsl(0 0% 2%)",
    vkBgSurface: "hsl(0 0% 10%)",
    vkTextPrimary: "hsl(0 0% 100%)",
  },
};

const FONT_FAMILY_CSS: Record<EditorFontFamilyId, string> = {
  inter_mono: '"Inter", ui-sans-serif, system-ui, sans-serif',
  jetbrains_mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
  merriweather_serif: '"Merriweather", Georgia, Cambria, serif',
  system_sans: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
};

export function applyPrototypeAppearanceTokens(
  rootEl: HTMLElement | null,
  appearance: PrototypeAppearanceState
): void {
  if (!rootEl) return;
  const palette = THEME_TOKEN_MAP[appearance.theme] ?? THEME_TOKEN_MAP.obsidian_dark;

  rootEl.style.setProperty("--background", palette.background);
  rootEl.style.setProperty("--foreground", palette.foreground);
  rootEl.style.setProperty("--card", palette.card);
  rootEl.style.setProperty("--surface", palette.surface);
  rootEl.style.setProperty("--border", palette.border);
  rootEl.style.setProperty("--primary", palette.primary);
  rootEl.style.setProperty("--vk-bg-base", palette.vkBgBase);
  rootEl.style.setProperty("--vk-bg-surface", palette.vkBgSurface);
  rootEl.style.setProperty("--vk-text-primary", palette.vkTextPrimary);

  rootEl.style.setProperty("--vk-prose-font", FONT_FAMILY_CSS[appearance.editorFontFamily]);
  rootEl.style.setProperty("--vk-prose-size", `${appearance.editorFontSizePx}px`);
  rootEl.style.setProperty("--vk-prose-line-height", String(appearance.editorLineHeight));
  rootEl.style.setProperty("--vk-prose-max-width", `${appearance.editorMaxLineWidthCh}ch`);
  rootEl.style.setProperty("--vk-motion-scale", appearance.reducedMotion ? "0" : "1");

  rootEl.setAttribute("data-prototype-theme", appearance.theme);
  rootEl.setAttribute("data-density", appearance.exploreCardDensity);
  rootEl.setAttribute("data-profile-header", appearance.profileHeaderDisplay);
  rootEl.setAttribute("data-reduced-motion", String(appearance.reducedMotion));
  rootEl.setAttribute("data-high-contrast", String(appearance.highContrast));
  rootEl.setAttribute("data-screen-reader-hints", String(appearance.screenReaderHints));
}
