/**
 * Theme Store - Manages unified DOM, Tailwind, Prose, and Canvas2D theme tokens (`--vk-*` + legacy `--ob-*`),
 * 6 universal presets, typography/density/radius/motion appearance settings,
 * physics settings, and sanitized Scoped CSS Snippets (ADR-0011, ADR-0013, UI-STEP-01).
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { LEGACY_OBMAP_KEYS, VK_STORAGE_KEYS } from '@/global/utils/storageKeyMigrator';
import {
  resolveThemePreset,
  type ThemePresetId,
} from '@/domains/settings/shared/utils/themePresets';

export interface ThemeColors {
  primary: string;
  accent: string;
  background: string;
  foreground: string;
  nodeGlow: string;
  linkColor: string;
  canvasBackground: string;
  folderNodeColor: string;
  fileNodeColor: string;
}

export interface PhysicsSettings {
  chargeStrength: number;
  linkDistance: number;
  velocityDecay: number;
  alphaDecay: number;
}

export interface Theme {
  colors: ThemeColors;
  physics: PhysicsSettings;
}

export type AppearanceMode = 'system' | 'light' | 'dark';
export type AppearanceDensity = 'compact' | 'comfortable' | 'spacious';
export type AppearanceRadiusPreset = 'sharp' | 'subtle' | 'rounded' | 'soft';

export interface AppearanceTypographyConfig {
  uiFont: string;
  proseFont: string;
  monoFont: string;
  displayFont: string;
  uiScale: number;
  proseSize: number;
  lineHeight: number;
  letterSpacing: number;
  readableWidth: number;
}

export interface AppearanceLayoutConfig {
  density: AppearanceDensity;
  radiusPreset: AppearanceRadiusPreset;
  showStatusBar: boolean;
  ribbonPosition: 'left' | 'right';
}

export interface AppearanceMotionConfig {
  reducedMotion: boolean;
  glassEffects: boolean;
}

export interface AppearanceConfig {
  presetId: ThemePresetId;
  mode: AppearanceMode;
  typography: AppearanceTypographyConfig;
  layout: AppearanceLayoutConfig;
  motion: AppearanceMotionConfig;
}

export const DEFAULT_APPEARANCE_CONFIG: AppearanceConfig = {
  presetId: 'vk-midnight',
  mode: 'dark',
  typography: {
    uiFont: 'Inter',
    proseFont: 'Inter',
    monoFont: 'JetBrains Mono',
    displayFont: 'Plus Jakarta Sans',
    uiScale: 1,
    proseSize: 16,
    lineHeight: 1.65,
    letterSpacing: 0,
    readableWidth: 68,
  },
  layout: {
    density: 'comfortable',
    radiusPreset: 'rounded',
    showStatusBar: true,
    ribbonPosition: 'left',
  },
  motion: {
    reducedMotion: false,
    glassEffects: true,
  },
};

export const defaultTheme: Theme = {
  colors: {
    primary: '270 70% 65%',
    accent: '270 80% 70%',
    background: '240 15% 5%',
    foreground: '240 10% 95%',
    nodeGlow: '270 80% 70%',
    linkColor: '270 70% 65%',
    canvasBackground: '240 15% 8%',
    folderNodeColor: '48 100% 60%',
    fileNodeColor: '270 70% 65%',
  },
  physics: {
    chargeStrength: -300,
    linkDistance: 100,
    velocityDecay: 0.3,
    alphaDecay: 0.02,
  },
};

export const SCOPED_CSS_STYLE_ID = VK_STORAGE_KEYS.SCOPED_CSS_STYLE_ID;

const UNSAFE_CSS_PATTERN =
  /@import\b|url\s*\(|expression\s*\(|javascript\s*:|<\/?script\b/i;

const RADIUS_VALUES: Record<AppearanceRadiusPreset, { sm: string; md: string; lg: string; panel: string }> = {
  sharp: { sm: '0px', md: '0px', lg: '0px', panel: '0px' },
  subtle: { sm: '0.125rem', md: '0.25rem', lg: '0.375rem', panel: '0.375rem' },
  rounded: { sm: '0.25rem', md: '0.5rem', lg: '0.75rem', panel: '0.75rem' },
  soft: { sm: '0.375rem', md: '0.75rem', lg: '1rem', panel: '1rem' },
};

const DENSITY_VALUES: Record<
  AppearanceDensity,
  { rowSm: string; rowMd: string; tabH: string; statusH: string; panelPad: string; cardPad: string; gap: string }
> = {
  compact: {
    rowSm: '1.5rem',
    rowMd: '1.875rem',
    tabH: '1.875rem',
    statusH: '1.375rem',
    panelPad: '0.5rem',
    cardPad: '0.75rem',
    gap: '0.375rem',
  },
  comfortable: {
    rowSm: '1.75rem',
    rowMd: '2.25rem',
    tabH: '2.25rem',
    statusH: '1.5rem',
    panelPad: '0.75rem',
    cardPad: '1rem',
    gap: '0.5rem',
  },
  spacious: {
    rowSm: '2rem',
    rowMd: '2.625rem',
    tabH: '2.5rem',
    statusH: '1.75rem',
    panelPad: '1rem',
    cardPad: '1.25rem',
    gap: '0.75rem',
  },
};

const FONT_STACK_FALLBACKS = {
  ui: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  prose: 'Georgia, Cambria, "Times New Roman", serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
};

function buildFontStack(preferred: string, kind: 'ui' | 'prose' | 'mono'): string {
  const clean = preferred.trim();
  if (!clean || clean.toLowerCase() === 'system' || clean.toLowerCase() === 'system mono') {
    return FONT_STACK_FALLBACKS[kind];
  }
  return `"${clean.replace(/"/g, '')}", ${FONT_STACK_FALLBACKS[kind]}`;
}

/**
 * Sanitizes user CSS snippets and scopes every rule under `.vk-themed-root`
 * and legacy `.obmap-themed-root` so untrusted community styles cannot leak assets (ADR-0011, ADR-0013).
 */
export function sanitizeScopedCssSnippet(rawCss: string): {
  sanitizedCss: string;
  rejectedRules: string[];
} {
  const rejectedRules: string[] = [];
  if (!rawCss || typeof rawCss !== 'string') {
    return { sanitizedCss: '', rejectedRules };
  }

  const strippedComments = rawCss.replace(/\/\*[\s\S]*?\*\//g, '');
  const ruleBlocks = strippedComments.match(/[^{}]+\{[^{}]*\}/g) ?? [];
  const safeBlocks: string[] = [];
  const canonicalClass = `.${VK_STORAGE_KEYS.CSS_THEMED_ROOT_CLASS}`;
  const legacyClass = `.${LEGACY_OBMAP_KEYS.CSS_THEMED_ROOT_CLASS}`;

  for (const block of ruleBlocks) {
    if (UNSAFE_CSS_PATTERN.test(block)) {
      rejectedRules.push(block.trim());
      continue;
    }

    const braceIndex = block.indexOf('{');
    const selectorRaw = block.slice(0, braceIndex).trim();
    const body = block.slice(braceIndex);

    if (!selectorRaw || selectorRaw.startsWith('@')) {
      rejectedRules.push(block.trim());
      continue;
    }

    const scopedSelectors = selectorRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .flatMap((sel) => {
        if (sel.startsWith(canonicalClass) || sel.startsWith(legacyClass)) {
          return [sel];
        }
        return [`${canonicalClass} ${sel}`, `${legacyClass} ${sel}`];
      })
      .join(', ');

    if (scopedSelectors) {
      safeBlocks.push(`${scopedSelectors} ${body}`);
    }
  }

  return {
    sanitizedCss: safeBlocks.join('\n'),
    rejectedRules,
  };
}

function toHslCss(value: string): string {
  const trimmed = value.trim();
  if (
    trimmed.startsWith('#') ||
    trimmed.startsWith('rgb(') ||
    trimmed.startsWith('rgba(') ||
    trimmed.startsWith('hsl(')
  ) {
    return trimmed;
  }
  return `hsl(${trimmed})`;
}

function resolveEffectiveMode(mode: AppearanceMode, presetMode: 'dark' | 'light'): 'dark' | 'light' {
  if (mode === 'light' || mode === 'dark') return mode;
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return presetMode;
}

// Apply theme & universal appearance tokens across Tailwind, Prose/Editor, and Canvas2D (`--vk-*` + `--ob-*` mirror)
export const applyThemeToDOM = (
  theme: Theme,
  appearance: AppearanceConfig = DEFAULT_APPEARANCE_CONFIG,
) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.add(
    VK_STORAGE_KEYS.CSS_THEMED_ROOT_CLASS,
    LEGACY_OBMAP_KEYS.CSS_THEMED_ROOT_CLASS,
  );

  const preset = resolveThemePreset(appearance.presetId);
  const p = preset.colors;
  const effectiveMode = resolveEffectiveMode(appearance.mode, preset.mode);
  root.classList.toggle('dark', effectiveMode === 'dark');
  root.classList.toggle('light', effectiveMode === 'light');
  root.setAttribute('data-theme', preset.id);
  root.setAttribute('data-density', appearance.layout.density);

  const osReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reducedMotion = appearance.motion.reducedMotion || osReducedMotion;
  root.setAttribute('data-motion', reducedMotion ? 'reduced' : 'normal');

  // 1. Shadcn / Tailwind core HSL tokens (overlaid by explicit ThemeColors mutations)
  const tailwindVars: Array<[string, string]> = [
    ['--primary', theme.colors.primary],
    ['--primary-foreground', p.primaryForeground],
    ['--accent', theme.colors.accent],
    ['--accent-foreground', p.accentForeground],
    ['--background', theme.colors.background],
    ['--foreground', theme.colors.foreground],
    ['--card', p.card],
    ['--card-foreground', p.cardForeground],
    ['--popover', p.popover],
    ['--popover-foreground', p.popoverForeground],
    ['--secondary', p.secondary],
    ['--secondary-foreground', p.secondaryForeground],
    ['--muted', p.muted],
    ['--muted-foreground', p.mutedForeground],
    ['--border', p.border],
    ['--input', p.input],
    ['--ring', theme.colors.primary],
    ['--destructive', p.destructive],
    ['--destructive-foreground', p.destructiveForeground],
    ['--sidebar-background', p.sidebarBackground],
    ['--sidebar-foreground', p.sidebarForeground],
    ['--sidebar-primary', theme.colors.primary],
    ['--sidebar-primary-foreground', p.sidebarPrimaryForeground],
    ['--sidebar-accent', p.sidebarAccent],
    ['--sidebar-accent-foreground', p.sidebarAccentForeground],
    ['--sidebar-border', p.sidebarBorder],
    ['--sidebar-ring', theme.colors.primary],
    ['--node-glow', theme.colors.nodeGlow],
    ['--graph-bg', theme.colors.canvasBackground],
    ['--canvas-bg', theme.colors.canvasBackground],
    ['--folder-node', theme.colors.folderNodeColor],
    ['--file-node', theme.colors.fileNodeColor],
  ];
  for (const [key, value] of tailwindVars) {
    root.style.setProperty(key, value);
  }

  // 2. Radius, density, typography & motion tokens
  const radius = RADIUS_VALUES[appearance.layout.radiusPreset];
  const density = DENSITY_VALUES[appearance.layout.density];
  const uiScale = Math.min(1.25, Math.max(0.85, appearance.typography.uiScale));
  const proseSize = Math.min(24, Math.max(12, appearance.typography.proseSize));
  const glassBlur = preset.isHighContrast || !appearance.motion.glassEffects ? '0px' : '12px';

  root.style.setProperty('--radius', radius.md);

  const universalTokens: Array<[string, string]> = [
    // Surface & Elevation
    ['--vk-bg-canvas', toHslCss(theme.colors.canvasBackground)],
    ['--vk-bg-base', toHslCss(theme.colors.background)],
    ['--vk-bg-surface', toHslCss(p.card)],
    ['--vk-surface', toHslCss(theme.colors.background)],
    ['--vk-bg-elevated', toHslCss(p.surfaceElevated)],
    ['--vk-bg-muted', toHslCss(p.muted)],
    ['--vk-bg-sidebar', toHslCss(p.sidebarBackground)],
    ['--vk-bg-overlay', toHslCss(p.surfaceOverlay)],
    ['--vk-glass-blur', glassBlur],
    // Text & Foreground
    ['--vk-text-primary', toHslCss(theme.colors.foreground)],
    ['--vk-text-secondary', toHslCss(p.textSecondary)],
    ['--vk-text-muted', toHslCss(p.textMuted)],
    ['--vk-text-subtle', toHslCss(p.textSubtle)],
    ['--vk-text-on-primary', toHslCss(p.primaryForeground)],
    // Border & Focus
    ['--vk-border-subtle', toHslCss(p.borderSubtle)],
    ['--vk-border-default', toHslCss(p.border)],
    ['--vk-border-strong', toHslCss(p.borderStrong)],
    ['--vk-ring-focus', toHslCss(theme.colors.primary)],
    ['--vk-border-width', preset.isHighContrast ? '2px' : '1px'],
    // Brand & Semantic States
    ['--vk-primary', toHslCss(theme.colors.primary)],
    ['--vk-accent', toHslCss(theme.colors.accent)],
    ['--vk-success', toHslCss(p.success)],
    ['--vk-success-subtle', toHslCss(p.successSubtle)],
    ['--vk-warning', toHslCss(p.warning)],
    ['--vk-warning-subtle', toHslCss(p.warningSubtle)],
    ['--vk-danger', toHslCss(p.danger)],
    ['--vk-danger-subtle', toHslCss(p.dangerSubtle)],
    ['--vk-info', toHslCss(p.info)],
    ['--vk-info-subtle', toHslCss(p.infoSubtle)],
    // Typography & Scale
    ['--vk-font-ui', buildFontStack(appearance.typography.uiFont, 'ui')],
    ['--vk-font-sans', buildFontStack(appearance.typography.uiFont, 'ui')],
    ['--vk-font-prose', buildFontStack(appearance.typography.proseFont, 'prose')],
    ['--vk-font-mono', buildFontStack(appearance.typography.monoFont, 'mono')],
    ['--vk-font-display', buildFontStack(appearance.typography.displayFont, 'ui')],
    ['--vk-ui-scale', String(uiScale)],
    ['--vk-prose-size', `${proseSize}px`],
    ['--vk-prose-line-height', String(appearance.typography.lineHeight)],
    ['--vk-prose-letter-spacing', `${appearance.typography.letterSpacing}em`],
    ['--vk-prose-max-width', `${appearance.typography.readableWidth}ch`],
    // Density & Rhythm
    ['--vk-density', appearance.layout.density],
    ['--vk-row-h-sm', density.rowSm],
    ['--vk-row-h-md', density.rowMd],
    ['--vk-tab-h', density.tabH],
    ['--vk-statusbar-h', density.statusH],
    ['--vk-panel-pad', density.panelPad],
    ['--vk-card-pad', density.cardPad],
    ['--vk-gap-unit', density.gap],
    // Shape & Geometry
    ['--vk-radius-sm', radius.sm],
    ['--vk-radius-md', radius.md],
    ['--vk-radius-lg', radius.lg],
    ['--vk-radius-panel', radius.panel],
    // Motion & Graph Canvas2D
    ['--vk-motion-scale', reducedMotion ? '0' : '1'],
    ['--vk-graph-node-file', toHslCss(theme.colors.fileNodeColor)],
    ['--vk-node-file', toHslCss(theme.colors.fileNodeColor)],
    ['--vk-graph-node-folder', toHslCss(theme.colors.folderNodeColor)],
    ['--vk-node-folder', toHslCss(theme.colors.folderNodeColor)],
    ['--vk-graph-node-evergreen', toHslCss(p.nodeEvergreen)],
    ['--vk-graph-node-locked', toHslCss(p.nodeLocked)],
    ['--vk-graph-edge-default', toHslCss(theme.colors.linkColor)],
    ['--vk-edge-default', toHslCss(theme.colors.linkColor)],
    ['--vk-graph-edge-citation', toHslCss(p.edgeCitation)],
    ['--vk-graph-glow', toHslCss(theme.colors.nodeGlow)],
    ['--vk-graph-label-bg', toHslCss(p.labelBg)],
  ];

  for (const [tokenName, tokenValue] of universalTokens) {
    root.style.setProperty(tokenName, tokenValue);
  }

  // Legacy `--ob-*` mirror aliases for backward compatibility with older themes/tests (ADR-0013)
  const legacyObMirrors: Array<[string, string]> = [
    ['--ob-bg-canvas', toHslCss(theme.colors.canvasBackground)],
    ['--ob-surface', toHslCss(theme.colors.background)],
    ['--ob-accent', toHslCss(theme.colors.accent)],
    ['--ob-edge-default', toHslCss(theme.colors.linkColor)],
    ['--ob-node-file', toHslCss(theme.colors.fileNodeColor)],
    ['--ob-node-folder', toHslCss(theme.colors.folderNodeColor)],
    ['--ob-text-primary', toHslCss(theme.colors.foreground)],
  ];
  for (const [legacyVar, cssValue] of legacyObMirrors) {
    root.style.setProperty(legacyVar, cssValue);
  }
};

export function applyScopedCssToDOM(rawCss: string): string[] {
  const { sanitizedCss, rejectedRules } = sanitizeScopedCssSnippet(rawCss);
  if (typeof document === 'undefined') return rejectedRules;

  let styleEl = document.getElementById(SCOPED_CSS_STYLE_ID) as HTMLStyleElement | null;
  if (!sanitizedCss) {
    styleEl?.remove();
    return rejectedRules;
  }

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = SCOPED_CSS_STYLE_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = sanitizedCss;
  return rejectedRules;
}

interface ThemeState {
  theme: Theme;
  appearance: AppearanceConfig;
  customCssSnippet: string;
  updateColor: (key: keyof ThemeColors, value: string) => void;
  updatePhysics: (key: keyof PhysicsSettings, value: number) => void;
  setPreset: (presetId: ThemePresetId) => void;
  setMode: (mode: AppearanceMode) => void;
  updateTypography: (patch: Partial<AppearanceTypographyConfig>) => void;
  updateLayout: (patch: Partial<AppearanceLayoutConfig>) => void;
  updateMotion: (patch: Partial<AppearanceMotionConfig>) => void;
  hydrateAppearanceOnBoot: () => void;
  setCustomCssSnippet: (rawCss: string) => { rejectedRules: string[] };
  resetTheme: () => void;
}

function cloneDefaultAppearance(): AppearanceConfig {
  return {
    ...DEFAULT_APPEARANCE_CONFIG,
    typography: { ...DEFAULT_APPEARANCE_CONFIG.typography },
    layout: { ...DEFAULT_APPEARANCE_CONFIG.layout },
    motion: { ...DEFAULT_APPEARANCE_CONFIG.motion },
  };
}

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set, get) => ({
        theme: defaultTheme,
        appearance: cloneDefaultAppearance(),
        customCssSnippet: '',

        updateColor: (key, value) =>
          set(
            (state) => {
              const newTheme = {
                ...state.theme,
                colors: { ...state.theme.colors, [key]: value },
              };
              applyThemeToDOM(newTheme, state.appearance);
              return { theme: newTheme };
            },
            false,
            'updateColor'
          ),

        updatePhysics: (key, value) =>
          set(
            (state) => ({
              theme: {
                ...state.theme,
                physics: { ...state.theme.physics, [key]: value },
              },
            }),
            false,
            'updatePhysics'
          ),

        setPreset: (presetId) =>
          set(
            (state) => {
              const preset = resolveThemePreset(presetId);
              const nextAppearance: AppearanceConfig = {
                ...state.appearance,
                presetId: preset.id,
                mode: preset.mode,
              };
              const nextTheme: Theme = {
                ...state.theme,
                colors: {
                  primary: preset.colors.primary,
                  accent: preset.colors.accent,
                  background: preset.colors.background,
                  foreground: preset.colors.foreground,
                  nodeGlow: preset.colors.nodeGlow,
                  linkColor: preset.colors.linkColor,
                  canvasBackground: preset.colors.canvasBackground,
                  folderNodeColor: preset.colors.folderNodeColor,
                  fileNodeColor: preset.colors.fileNodeColor,
                },
              };
              applyThemeToDOM(nextTheme, nextAppearance);
              return { theme: nextTheme, appearance: nextAppearance };
            },
            false,
            'setPreset'
          ),

        setMode: (mode) =>
          set(
            (state) => {
              const nextAppearance: AppearanceConfig = { ...state.appearance, mode };
              applyThemeToDOM(state.theme, nextAppearance);
              return { appearance: nextAppearance };
            },
            false,
            'setMode'
          ),

        updateTypography: (patch) =>
          set(
            (state) => {
              const nextAppearance: AppearanceConfig = {
                ...state.appearance,
                typography: { ...state.appearance.typography, ...patch },
              };
              applyThemeToDOM(state.theme, nextAppearance);
              return { appearance: nextAppearance };
            },
            false,
            'updateTypography'
          ),

        updateLayout: (patch) =>
          set(
            (state) => {
              const nextAppearance: AppearanceConfig = {
                ...state.appearance,
                layout: { ...state.appearance.layout, ...patch },
              };
              applyThemeToDOM(state.theme, nextAppearance);
              return { appearance: nextAppearance };
            },
            false,
            'updateLayout'
          ),

        updateMotion: (patch) =>
          set(
            (state) => {
              const nextAppearance: AppearanceConfig = {
                ...state.appearance,
                motion: { ...state.appearance.motion, ...patch },
              };
              applyThemeToDOM(state.theme, nextAppearance);
              return { appearance: nextAppearance };
            },
            false,
            'updateMotion'
          ),

        hydrateAppearanceOnBoot: () => {
          const state = get();
          applyThemeToDOM(state.theme, state.appearance);
          if (state.customCssSnippet) {
            applyScopedCssToDOM(state.customCssSnippet);
          }
        },

        setCustomCssSnippet: (rawCss) => {
          const { sanitizedCss, rejectedRules } = sanitizeScopedCssSnippet(rawCss);
          applyScopedCssToDOM(sanitizedCss);
          set({ customCssSnippet: sanitizedCss }, false, 'setCustomCssSnippet');
          return { rejectedRules };
        },

        resetTheme: () =>
          set(
            () => {
              const nextAppearance = cloneDefaultAppearance();
              applyThemeToDOM(defaultTheme, nextAppearance);
              applyScopedCssToDOM('');
              return { theme: defaultTheme, appearance: nextAppearance, customCssSnippet: '' };
            },
            false,
            'resetTheme'
          ),
      }),
      {
        name: 'app-theme',
        onRehydrateStorage: () => (state) => {
          if (state?.theme) {
            applyThemeToDOM(state.theme, state.appearance ?? cloneDefaultAppearance());
          }
          if (state?.customCssSnippet) {
            applyScopedCssToDOM(state.customCssSnippet);
          }
        },
        merge: (persisted, current) => {
          const p = persisted as Partial<ThemeState> | undefined;
          const defaults = cloneDefaultAppearance();
          return {
            ...current,
            ...(p ?? {}),
            theme: p?.theme ?? current.theme,
            appearance: {
              ...defaults,
              ...(p?.appearance ?? {}),
              typography: { ...defaults.typography, ...(p?.appearance?.typography ?? {}) },
              layout: { ...defaults.layout, ...(p?.appearance?.layout ?? {}) },
              motion: { ...defaults.motion, ...(p?.appearance?.motion ?? {}) },
            },
          };
        },
        migrate: (persistedState: any) => {
          if (persistedState && persistedState.primary && !persistedState.theme) {
            return {
              theme: {
                colors: {
                  primary: persistedState.primary || defaultTheme.colors.primary,
                  accent: persistedState.accent || defaultTheme.colors.accent,
                  background: persistedState.background || defaultTheme.colors.background,
                  foreground: persistedState.foreground || defaultTheme.colors.foreground,
                  nodeGlow: persistedState.nodeGlow || defaultTheme.colors.nodeGlow,
                  linkColor: persistedState.linkColor || defaultTheme.colors.linkColor,
                  canvasBackground: defaultTheme.colors.canvasBackground,
                  folderNodeColor: defaultTheme.colors.folderNodeColor,
                  fileNodeColor: defaultTheme.colors.fileNodeColor,
                },
                physics: defaultTheme.physics,
              },
              appearance: cloneDefaultAppearance(),
              customCssSnippet: '',
            };
          }
          return persistedState as ThemeState;
        },
        version: 1,
      }
    ),
    { name: 'ThemeStore' }
  )
);

// Initialize theme & universal tokens synchronously on module load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('app-theme');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.state?.theme) {
        applyThemeToDOM(parsed.state.theme, parsed.state.appearance ?? cloneDefaultAppearance());
      } else {
        applyThemeToDOM(defaultTheme, cloneDefaultAppearance());
      }
      if (parsed.state?.customCssSnippet) {
        applyScopedCssToDOM(parsed.state.customCssSnippet);
      }
    } catch {
      applyThemeToDOM(defaultTheme, cloneDefaultAppearance());
    }
  } else {
    applyThemeToDOM(defaultTheme, cloneDefaultAppearance());
  }
}
