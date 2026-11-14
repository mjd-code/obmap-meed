/**
 * Theme Store - Manages unified DOM & Canvas2D theme tokens (`--ob-*`),
 * physics settings, and sanitized Scoped CSS Snippets (ADR-0011, STEP-01.5).
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

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

export const SCOPED_CSS_STYLE_ID = 'obmap-custom-css-snippet';

const UNSAFE_CSS_PATTERN =
  /@import\b|url\s*\(|expression\s*\(|javascript\s*:|<\/?script\b/i;

/**
 * Sanitizes user CSS snippets and scopes every rule under `.obmap-themed-root`
 * so untrusted community styles cannot leak assets or mutate global shells (ADR-0011).
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
      .map((sel) =>
        sel.startsWith('.obmap-themed-root') ? sel : `.obmap-themed-root ${sel}`
      )
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

// Apply theme to both legacy variables and unified `--ob-*` DOM/Canvas2D semantic tokens
export const applyThemeToDOM = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.add('obmap-themed-root');
  root.style.setProperty('--primary', theme.colors.primary);
  root.style.setProperty('--accent', theme.colors.accent);
  root.style.setProperty('--background', theme.colors.background);
  root.style.setProperty('--foreground', theme.colors.foreground);
  root.style.setProperty('--node-glow', theme.colors.nodeGlow);
  root.style.setProperty('--ring', theme.colors.primary);
  root.style.setProperty('--sidebar-primary', theme.colors.primary);
  root.style.setProperty('--sidebar-ring', theme.colors.primary);
  root.style.setProperty('--canvas-bg', theme.colors.canvasBackground);
  root.style.setProperty('--folder-node', theme.colors.folderNodeColor);
  root.style.setProperty('--file-node', theme.colors.fileNodeColor);

  // Unified Semantic Tokens (DOM <-> Canvas2D bridge)
  root.style.setProperty('--ob-bg-canvas', toHslCss(theme.colors.canvasBackground));
  root.style.setProperty('--ob-surface', toHslCss(theme.colors.background));
  root.style.setProperty('--ob-accent', toHslCss(theme.colors.accent));
  root.style.setProperty('--ob-edge-default', toHslCss(theme.colors.linkColor));
  root.style.setProperty('--ob-node-file', toHslCss(theme.colors.fileNodeColor));
  root.style.setProperty('--ob-node-folder', toHslCss(theme.colors.folderNodeColor));
  root.style.setProperty('--ob-text-primary', toHslCss(theme.colors.foreground));
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
  customCssSnippet: string;
  updateColor: (key: keyof ThemeColors, value: string) => void;
  updatePhysics: (key: keyof PhysicsSettings, value: number) => void;
  setCustomCssSnippet: (rawCss: string) => { rejectedRules: string[] };
  resetTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set) => ({
        theme: defaultTheme,
        customCssSnippet: '',

        updateColor: (key, value) =>
          set(
            (state) => {
              const newTheme = {
                ...state.theme,
                colors: { ...state.theme.colors, [key]: value },
              };
              applyThemeToDOM(newTheme);
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

        setCustomCssSnippet: (rawCss) => {
          const { sanitizedCss, rejectedRules } = sanitizeScopedCssSnippet(rawCss);
          applyScopedCssToDOM(sanitizedCss);
          set({ customCssSnippet: sanitizedCss }, false, 'setCustomCssSnippet');
          return { rejectedRules };
        },

        resetTheme: () =>
          set(
            () => {
              applyThemeToDOM(defaultTheme);
              applyScopedCssToDOM('');
              return { theme: defaultTheme, customCssSnippet: '' };
            },
            false,
            'resetTheme'
          ),
      }),
      {
        name: 'app-theme',
        onRehydrateStorage: () => (state) => {
          if (state?.theme) {
            applyThemeToDOM(state.theme);
          }
          if (state?.customCssSnippet) {
            applyScopedCssToDOM(state.customCssSnippet);
          }
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

// Initialize theme on module load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('app-theme');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.state?.theme) {
        applyThemeToDOM(parsed.state.theme);
      }
      if (parsed.state?.customCssSnippet) {
        applyScopedCssToDOM(parsed.state.customCssSnippet);
      }
    } catch {
      applyThemeToDOM(defaultTheme);
    }
  } else {
    applyThemeToDOM(defaultTheme);
  }
}
