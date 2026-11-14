/** Cached text measurement, word wrapping and card sizing. */

import type { NodeMetric } from '@/domains/graph/shared/utils/graph.types';

let measureCtx: CanvasRenderingContext2D | null = null;
const widthCache = new Map<string, number>();

function ctx(): CanvasRenderingContext2D | null {
  if (measureCtx) return measureCtx;
  if (typeof document === 'undefined') return null;
  if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) return null;
  try {
    measureCtx = document.createElement('canvas').getContext('2d');
  } catch {
    measureCtx = null;
  }
  return measureCtx;
}

export function measureText(text: string, font: string): number {
  const key = `${font}|${text}`;
  const cached = widthCache.get(key);
  if (cached !== undefined) return cached;
  const context = ctx();
  if (!context) {
    const approx = text.length * 6;
    widthCache.set(key, approx);
    return approx;
  }
  context.font = font;
  const width = context.measureText(text).width;
  if (widthCache.size > 5000) widthCache.clear();
  widthCache.set(key, width);
  return width;
}

/** Wraps by word, then splits oversized single tokens by character. */
export function wrapText(text: string, font: string, maxWidth: number, maxLines = 2): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines: string[] = [];
  let current = '';

  const pushLine = (line: string) => {
    if (lines.length < maxLines) lines.push(line);
  };

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measureText(candidate, font) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) pushLine(current);
    if (measureText(word, font) <= maxWidth) {
      current = word;
      continue;
    }
    // Oversized token: split by character.
    let chunk = '';
    for (const char of word) {
      if (measureText(chunk + char, font) > maxWidth) {
        pushLine(chunk);
        chunk = char;
      } else {
        chunk += char;
      }
    }
    current = chunk;
    if (lines.length >= maxLines) break;
  }
  if (current) pushLine(current);

  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (measureText(last, font) > maxWidth - 8 || words.join(' ') !== lines.join(' ')) {
      let truncated = last;
      while (truncated.length > 1 && measureText(`${truncated}…`, font) > maxWidth) {
        truncated = truncated.slice(0, -1);
      }
      if (words.join(' ') !== lines.join(' ')) lines[maxLines - 1] = `${truncated}…`;
    }
  }
  return lines.length ? lines : [''];
}

export const CARD_FONT_SIZE = 12;
export const cardFont = (size = CARD_FONT_SIZE, weight = '500') =>
  `${weight} ${size}px 'IBM Plex Sans', system-ui, sans-serif`;

export interface CardLayout extends NodeMetric {
  lines: string[];
  textWidth?: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Checks whether two center-anchored node bounding boxes overlap (with optional padding). */
export function boxesOverlap(a: BoundingBox, b: BoundingBox, padding = 0): boolean {
  const halfW = (a.width + b.width) / 2 + padding;
  const halfH = (a.height + b.height) / 2 + padding;
  return Math.abs(a.x - b.x) < halfW && Math.abs(a.y - b.y) < halfH;
}

/** Stable, zoom-independent card geometry derived from the label. */
export function cardLayout(
  label: string,
  options: {
    root?: boolean;
    badge?: boolean;
    fontSize?: number;
    maxTextWidth?: number;
    maxLines?: number;
    depth?: number;
  } = {}
): CardLayout {
  const fontSize = options.fontSize ?? (options.root ? CARD_FONT_SIZE + 2 : CARD_FONT_SIZE);
  const font = cardFont(fontSize, options.root ? '600' : '500');
  const maxTextWidth = options.maxTextWidth ?? (options.root ? 200 : 160);
  const maxLines = options.maxLines ?? (options.root ? 3 : 4);
  const lines = wrapText(label || 'Untitled', font, maxTextWidth, maxLines);
  const textWidth = Math.min(
    maxTextWidth,
    Math.max(...lines.map((line) => measureText(line, font)))
  );
  const paddingX = 12;
  const iconWidth = 16;
  const badgeWidth = options.badge ? 20 : 0;
  const depthMargin = options.depth ? Math.min(options.depth * 2, 12) : 0;
  const width = Math.max(
    72,
    Math.ceil(textWidth + paddingX * 2 + iconWidth + badgeWidth + depthMargin)
  );
  const height = Math.ceil(lines.length * (fontSize + 4) + 14);
  return { width, height, lines, textWidth };
}
