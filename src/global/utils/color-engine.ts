/**
 * Unified Color Engine
 * Mengelola parsing, resolusi CSS variable, manipulasi opacity,
 * dan konversi antar format warna (HEX, HSL, RGB).
 */

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Menyelesaikan CSS variable (misal: var(--primary)) menjadi nilai warna computed.
 * Aman dipanggil di lingkungan SSR maupun browser.
 */
export function resolveColor(color: string): string {
  if (!color || typeof color !== 'string') return '';
  if (!color.includes('var(')) return color;

  const varMatch = color.match(/var\(--([^)]+)\)/);
  if (!varMatch) return color;

  const varName = varMatch[1];

  if (typeof document === 'undefined' || !document.documentElement) {
    return color;
  }

  const computedValue = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${varName}`)
    .trim();

  if (!computedValue) return color;

  return color.replace(`var(--${varName})`, computedValue);
}

/**
 * Parsing string HEX (#fff atau #ffffff) menjadi nilai RGB (0-255).
 */
export function parseHex(color: string): Rgb | null {
  const match = color.trim().match(/^#?([\da-f]{3}|[\da-f]{6})$/i);
  if (!match) return null;

  const hex = match[1].length === 3
    ? match[1].split('').map((c) => c + c).join('')
    : match[1];

  const int = parseInt(hex, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

/**
 * Mengonversi nilai RGB (0-255) ke HSL (H: 0-360, S: 0-100, L: 0-100).
 */
export function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const lNorm = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = lNorm > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rNorm) h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
    else if (max === gNorm) h = ((bNorm - rNorm) / d + 2) / 6;
    else h = ((rNorm - gNorm) / d + 4) / 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(lNorm * 100),
  };
}

/**
 * Parsing string warna HSL atau HEX menjadi objek Hsl { h, s, l }.
 */
export function parseHsl(color: string): Hsl | null {
  if (!color || typeof color !== 'string') return null;

  const trimmed = color.trim();

  // Pola standard HSL/HSLA: hsl(210, 50%, 60%) atau hsl(210 50% 60%)
  const hslMatch = trimmed.match(
    /hsla?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)%?\s*[, ]\s*([\d.]+)%?/i
  );
  if (hslMatch) {
    return {
      h: Number(hslMatch[1]),
      s: Number(hslMatch[2]),
      l: Number(hslMatch[3]),
    };
  }

  // Pola bare HSL: "210 50% 60%"
  const bareMatch = trimmed.match(/^([\d.]+)\s+([\d.]+)%?\s+([\d.]+)%?$/);
  if (bareMatch) {
    return {
      h: Number(bareMatch[1]),
      s: Number(bareMatch[2]),
      l: Number(bareMatch[3]),
    };
  }

  // Fallback: jika berupa HEX, konversikan via RGB
  const rgb = parseHex(trimmed);
  if (rgb) {
    return rgbToHsl(rgb.r, rgb.g, rgb.b);
  }

  return null;
}

/**
 * Format objek Hsl menjadi representasi string CSS hsl(h, s%, l%).
 */
export function formatHsl({ h, s, l }: Hsl): string {
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

/**
 * Menyisipkan transparansi (opacity 0..1) ke format warna apapun (HEX, HSL, RGB).
 */
export function colorWithOpacity(color: string, opacity: number): string {
  if (!color) return '';
  const resolved = resolveColor(color).trim();
  const alpha = clamp(opacity, 0, 1);

  // HSL / HSLA
  const hsl = resolved.match(/^hsla?\((.*)\)$/i);
  if (hsl) {
    const [h, s, l] = hsl[1].split(/[\s,/]+/).filter(Boolean);
    if (h !== undefined && s !== undefined && l !== undefined) {
      return `hsl(${h} ${s} ${l} / ${alpha})`;
    }
  }

  // Bare HSL: "210 50% 60%"
  const bareHsl = resolved.match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (bareHsl) {
    return `hsl(${bareHsl[1]} ${bareHsl[2]}% ${bareHsl[3]}% / ${alpha})`;
  }

  // HEX: #abc atau #aabbcc
  const rgbFromHex = parseHex(resolved);
  if (rgbFromHex) {
    return `rgba(${rgbFromHex.r}, ${rgbFromHex.g}, ${rgbFromHex.b}, ${alpha})`;
  }

  // RGB / RGBA
  const rgb = resolved.match(/^rgba?\((.*)\)$/i);
  if (rgb) {
    const [r, g, b] = rgb[1].split(/[\s,/]+/).filter(Boolean);
    if (r !== undefined && g !== undefined && b !== undefined) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }

  return resolved;
}

/** Mengonversi HSL (H: 0-360, S: 0-100, L: 0-100) ke RGB (0-255). */
export function hslToRgb(h: number, s: number, l: number): Rgb {
  const hNorm = (((h % 360) + 360) % 360) / 360;
  const sNorm = clamp(s, 0, 100) / 100;
  const lNorm = clamp(l, 0, 100) / 100;

  if (sNorm === 0) {
    const gray = Math.round(lNorm * 255);
    return { r: gray, g: gray, b: gray };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let wrapped = t;
    if (wrapped < 0) wrapped += 1;
    if (wrapped > 1) wrapped -= 1;
    if (wrapped < 1 / 6) return p + (q - p) * 6 * wrapped;
    if (wrapped < 1 / 2) return q;
    if (wrapped < 2 / 3) return p + (q - p) * (2 / 3 - wrapped) * 6;
    return p;
  };

  const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
  const p = 2 * lNorm - q;

  return {
    r: Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hNorm) * 255),
    b: Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255),
  };
}

/** Parsing string warna apapun (HEX, RGB/RGBA, HSL/HSLA, bare HSL, var()) menjadi Rgb. */
export function parseColorToRgb(color: string): Rgb | null {
  if (!color || typeof color !== 'string') return null;
  const resolved = resolveColor(color).trim();

  const hexRgb = parseHex(resolved);
  if (hexRgb) return hexRgb;

  const rgbMatch = resolved.match(
    /^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)/i,
  );
  if (rgbMatch) {
    return {
      r: clamp(Math.round(Number(rgbMatch[1])), 0, 255),
      g: clamp(Math.round(Number(rgbMatch[2])), 0, 255),
      b: clamp(Math.round(Number(rgbMatch[3])), 0, 255),
    };
  }

  const hsl = parseHsl(resolved);
  if (hsl) return hslToRgb(hsl.h, hsl.s, hsl.l);

  return null;
}

/** Menghitung relative luminance WCAG 2.1 dalam rentang [0, 1]. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const linearize = (channel: number) => {
    const c = clamp(channel, 0, 255) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** Rasio kontras WCAG 2.1 antara dua warna CSS (1..21). Mengembalikan 4.5 bila gagal parse. */
export function contrastRatio(foreground: string, background: string): number {
  const fgRgb = parseColorToRgb(foreground);
  const bgRgb = parseColorToRgb(background);
  if (!fgRgb || !bgRgb) return 4.5;
  const l1 = relativeLuminance(fgRgb);
  const l2 = relativeLuminance(bgRgb);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Menentukan apakah suatu permukaan berlatar gelap (threshold luminansi relatif 0.28). */
export function isDarkSurface(background: string): boolean {
  const rgb = parseColorToRgb(background);
  if (!rgb) return true;
  return relativeLuminance(rgb) < 0.28;
}

/** Memilih warna teks dengan kontras minimal WCAG AA (`>= minRatio`, bawaan 4.5:1) terhadap latar. */
export function pickContrastTextColor(
  bgColor: string,
  lightText = '#F8FAFC',
  darkText = '#0F172A',
  minRatio = 4.5,
): string {
  const lightRatio = contrastRatio(lightText, bgColor);
  const darkRatio = contrastRatio(darkText, bgColor);

  if (lightRatio >= minRatio && darkRatio >= minRatio) {
    return lightRatio >= darkRatio ? lightText : darkText;
  }
  if (lightRatio >= minRatio) return lightText;
  if (darkRatio >= minRatio) return darkText;

  // Fallback ekstrem agar tetap mencapai kontras tertinggi jika kandidat kustom kurang kontras
  const pureWhiteRatio = contrastRatio('#FFFFFF', bgColor);
  const pureBlackRatio = contrastRatio('#020617', bgColor);
  if (pureWhiteRatio >= minRatio || pureWhiteRatio >= pureBlackRatio) {
    return pureWhiteRatio >= pureBlackRatio ? '#FFFFFF' : '#020617';
  }
  return '#020617';
}