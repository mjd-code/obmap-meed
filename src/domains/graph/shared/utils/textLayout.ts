/** Cached text measurement, word wrapping, rich Flexbox card sizing, and AABB overlap checks. */

import type {
  NodeAttachments,
  RenderNode,
  RichNodeMetric,
  TopicShape,
} from '@/domains/graph/shared/utils/graph.types';
import type { NodeConfig } from '@/domains/graph/shared/stores/useGraphStore';

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

function truncateTokenToWidth(token: string, font: string, maxWidth: number): string {
  let end = token.length;
  while (end > 1 && measureText(`${token.slice(0, end)}…`, font) > maxWidth) {
    end -= 1;
  }
  return end < token.length ? `${token.slice(0, Math.max(1, end))}…` : token;
}

/** Wraps by word; optionally truncates oversized single tokens with ellipsis instead of mid-word splitting. */
export function wrapText(
  text: string,
  font: string,
  maxWidth: number,
  maxLines = 2,
  breakOversizedWord = true,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines: string[] = [];
  let current = '';
  let truncatedEarly = false;

  const pushLine = (line: string) => {
    if (lines.length < maxLines) lines.push(line);
  };

  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    const candidate = current ? `${current} ${word}` : word;
    if (measureText(candidate, font) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) {
      pushLine(current);
      current = '';
      if (lines.length >= maxLines) {
        truncatedEarly = true;
        break;
      }
    }
    if (measureText(word, font) <= maxWidth) {
      current = word;
      continue;
    }
    if (!breakOversizedWord) {
      pushLine(truncateTokenToWidth(word, font, maxWidth));
      truncatedEarly = i < words.length - 1;
      current = '';
      if (lines.length >= maxLines) break;
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
  if (current && lines.length < maxLines) pushLine(current);
  else if (current) truncatedEarly = true;

  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (
      truncatedEarly ||
      measureText(last, font) > maxWidth - 8 ||
      words.join(' ') !== lines.join(' ')
    ) {
      if (!last.endsWith('…')) {
        let trimmed = last;
        while (trimmed.length > 1 && measureText(`${trimmed}…`, font) > maxWidth) {
          trimmed = trimmed.slice(0, -1);
        }
        if (truncatedEarly || words.join(' ') !== lines.join(' ')) {
          lines[maxLines - 1] = `${trimmed}…`;
        }
      }
    }
  }
  return lines.length ? lines : [''];
}

export const CARD_FONT_SIZE = 12;
export const cardFont = (size = CARD_FONT_SIZE, weight = '500') =>
  `${weight} ${size}px 'IBM Plex Sans', system-ui, sans-serif`;

export type CardLayout = RichNodeMetric;

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

/** Extra clearance required so custom XMind topic contours never clip wrapped text or attachments. */
export function topicShapePadding(shape?: TopicShape): { x: number; y: number } {
  switch (shape) {
    case 'pill':
      return { x: 10, y: 2 };
    case 'cloud':
      return { x: 18, y: 12 };
    case 'diamond':
      return { x: 26, y: 14 };
    case 'hexagon':
      return { x: 18, y: 6 };
    case 'parallelogram':
      return { x: 16, y: 2 };
    case 'ellipse':
      return { x: 16, y: 8 };
    case 'underline':
    case 'rounded-rect':
    default:
      return { x: 0, y: 0 };
  }
}

export function resolveFooterLabels(
  attachments?: NodeAttachments,
  tags?: string[],
  maxPills = 4,
): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();
  const add = (raw: string) => {
    const clean = raw.trim().replace(/^#/, '');
    if (!clean) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(clean.length > 16 ? `${clean.slice(0, 15)}…` : clean);
  };
  for (const label of attachments?.labels ?? []) {
    add(label);
    if (merged.length >= maxPills) return merged;
  }
  for (const tag of tags ?? []) {
    add(tag);
    if (merged.length >= maxPills) return merged;
  }
  return merged;
}

export interface CardLayoutOptions {
  root?: boolean;
  badge?: boolean;
  fontSize?: number;
  maxTextWidth?: number;
  maxLines?: number;
  depth?: number;
  attachments?: NodeAttachments;
  tags?: string[];
  topicShape?: TopicShape;
  wikilinkCount?: number;
  hasNoteBody?: boolean;
  showMarkers?: boolean;
  showTagPills?: boolean;
}

/** Stable, zoom-independent card geometry derived from the label plus rich XMind attachments. */
export function cardLayout(
  label: string,
  options: CardLayoutOptions = {},
): CardLayout {
  const fontSize = options.fontSize ?? (options.root ? CARD_FONT_SIZE + 2 : CARD_FONT_SIZE);
  const lineHeight = fontSize + 4;
  const font = cardFont(fontSize, options.root ? '600' : '500');
  const maxTextWidth = options.maxTextWidth ?? (options.root ? 200 : 160);
  const maxLines = options.maxLines ?? (options.root ? 3 : 4);
  const lines = wrapText(label || 'Untitled', font, maxTextWidth, maxLines);
  const textWidth = Math.min(
    maxTextWidth,
    Math.max(...lines.map((line) => measureText(line, font))),
  );

  const showMarkers = options.showMarkers !== false;
  const markers = showMarkers ? (options.attachments?.markers ?? []).slice(0, 4) : [];
  const hasSticker = showMarkers && Boolean(options.attachments?.sticker?.trim());
  const leftSlotWidth =
    markers.length * 17 + (hasSticker ? 18 : 0) + (markers.length > 0 || hasSticker ? 4 : 0);

  const wikilinkCount = options.wikilinkCount ?? 0;
  const hasNoteBody = Boolean(options.hasNoteBody);
  const wikilinkBadgeWidth = wikilinkCount > 0 ? 26 : 0;
  const noteBodyBadgeWidth = wikilinkCount === 0 && hasNoteBody ? 14 : 0;
  const rightSlotWidth = wikilinkBadgeWidth + noteBodyBadgeWidth;

  const showTagPills = options.showTagPills !== false;
  const resolvedLabels = showTagPills
    ? resolveFooterLabels(options.attachments, options.tags, 4)
    : [];
  const pillFont = cardFont(9, '600');
  const pillWidths = resolvedLabels.map((item) =>
    Math.ceil(measureText(`#${item}`, pillFont) + 10),
  );
  const footerTotalWidth =
    pillWidths.length > 0
      ? pillWidths.reduce((sum, w) => sum + w, 0) + (pillWidths.length - 1) * 4
      : 0;
  const footerLabelsHeight = pillWidths.length > 0 ? 18 : 0;

  const textBlockWidth = Math.max(textWidth, footerTotalWidth);
  const shapePad = topicShapePadding(options.topicShape);

  const paddingX = 12;
  const iconWidth = 16;
  const badgeWidth = options.badge ? 20 : 0;
  const depthMargin = options.depth ? Math.min(options.depth * 2, 12) : 0;

  const width = Math.max(
    72,
    Math.ceil(
      textBlockWidth +
        paddingX * 2 +
        iconWidth +
        leftSlotWidth +
        badgeWidth +
        rightSlotWidth +
        depthMargin +
        shapePad.x,
    ),
  );
  const height = Math.ceil(
    lines.length * lineHeight + 14 + footerLabelsHeight + shapePad.y,
  );

  return {
    width,
    height,
    lines,
    textWidth,
    fontSize,
    lineHeight,
    leftSlotWidth,
    rightSlotWidth,
    footerLabelsHeight,
    shapePaddingX: shapePad.x,
    shapePaddingY: shapePad.y,
    textBlockWidth,
    pillWidths,
    resolvedLabels,
    markersCount: markers.length,
    hasSticker,
    wikilinkCount,
    hasNoteBody,
  };
}

/** Measures complete rich node metrics from a RenderNode + Graph NodeConfig snapshot. */
export function measureRichNodeMetrics(
  node: Pick<
    RenderNode,
    | 'id'
    | 'name'
    | 'depth'
    | 'parentId'
    | 'childCount'
    | 'tags'
    | 'content'
    | 'attachments'
    | 'topicShape'
    | 'styleOverride'
    | 'wikilinkCount'
  >,
  config?: Partial<
    Pick<NodeConfig, 'labelField' | 'labelSize' | 'topicShape' | 'showMarkers' | 'showTagPills'>
  >,
): RichNodeMetric {
  const isRoot = node.parentId === null;
  const label = config?.labelField === 'id' ? node.id : node.name;
  const baseFontSize = config?.labelSize ?? CARD_FONT_SIZE;
  return cardLayout(label, {
    root: isRoot,
    badge: node.childCount > 0,
    fontSize: baseFontSize + (isRoot ? 2 : 0),
    attachments: node.attachments,
    tags: node.tags,
    topicShape: node.styleOverride?.topicShape ?? node.topicShape ?? config?.topicShape,
    wikilinkCount: node.wikilinkCount,
    hasNoteBody: Boolean(node.content && node.content.trim().length > 0),
    showMarkers: config?.showMarkers ?? true,
    showTagPills: config?.showTagPills ?? true,
  });
}
