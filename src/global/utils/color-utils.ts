/**
 * Color Utilities - CSS variable resolution, color engine bridge, and WCAG contrast helpers (UI-STEP-01).
 */
export * from "@/global/utils/color-engine";
import {
  contrastRatio,
  isDarkSurface,
  parseColorToRgb,
  parseHsl,
  rgbToHsl,
} from "@/global/utils/color-engine";

export interface ContrastEvaluation {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
}

/**
 * Computes WCAG 2.1 contrast ratio between any two CSS colors
 * (supports bare HSL `"240 10% 95%"`, `hsl(...)`, `#hex`, and `rgb(...)`).
 */
export function computeContrastRatio(foreground: string, background: string): number {
  return Number(contrastRatio(foreground, background).toFixed(2));
}

/** Evaluates WCAG AA (`>= 4.5:1`) and AAA (`>= 7.0:1`) contrast compliance. */
export function evaluateContrastCompliance(
  foreground: string,
  background: string,
): ContrastEvaluation {
  const ratio = computeContrastRatio(foreground, background);
  return {
    ratio,
    passesAA: ratio >= 4.5,
    passesAAA: ratio >= 7.0,
  };
}

/**
 * Adjusts foreground HSL lightness toward high contrast (`98%` on dark surfaces,
 * `8%` on light surfaces) until `computeContrastRatio >= minRatio`, returning bare HSL `"h s% l%"`.
 */
export function autoAdjustContrastHsl(
  fgColor: string,
  bgColor: string,
  minRatio = 4.5,
): string {
  const darkBg = isDarkSurface(bgColor);
  const parsedHsl =
    parseHsl(fgColor) ??
    (() => {
      const rgb = parseColorToRgb(fgColor);
      return rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : { h: 240, s: 10, l: darkBg ? 95 : 12 };
    })();

  const h = Math.round(parsedHsl.h);
  const s = Math.round(parsedHsl.s);
  let l = Math.round(parsedHsl.l);

  if (computeContrastRatio(`${h} ${s}% ${l}%`, bgColor) >= minRatio) {
    return `${h} ${s}% ${l}%`;
  }

  const step = darkBg ? 4 : -4;
  for (let i = 0; i < 25; i += 1) {
    l = Math.max(4, Math.min(98, l + step));
    const candidate = `${h} ${s}% ${l}%`;
    if (computeContrastRatio(candidate, bgColor) >= minRatio) {
      return candidate;
    }
    if (l === 4 || l === 98) break;
  }

  return darkBg ? `${h} ${Math.min(s, 20)}% 98%` : `${h} ${Math.min(s, 20)}% 8%`;
}
