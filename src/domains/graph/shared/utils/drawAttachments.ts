/**
 * Canvas2D renderers for XMind-grade Topic Shapes (8 geometries) and internal
 * Flexbox attachments: Markers (Priority 1..7, Progress Ring, Checkbox, Flag, Star, Emoji),
 * Stickers, Right-Slot Metadata Badges ([[wikilink]] count / note glyph), and Footer Label Pills.
 */

import type {
  NodeAttachments,
  NodeMarker,
  RenderNode,
  TopicShape,
} from '@/domains/graph/shared/utils/graph.types';
import type { NodeConfig } from '@/domains/graph/shared/stores/useGraphStore';
import { cardFont } from '@/domains/graph/shared/utils/textLayout';
import { dim, type GraphTheme } from '@/domains/graph/shared/utils/theme';

const PRIORITY_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#22c55e',
  5: '#06b6d4',
  6: '#3b82f6',
  7: '#8b5cf6',
};

const STICKER_GLYPHS: Record<string, string> = {
  idea: '💡',
  lightbulb: '💡',
  fire: '🔥',
  pin: '📌',
  target: '🎯',
  warning: '⚠️',
  alert: '🚨',
  rocket: '🚀',
  check: '✅',
  question: '❓',
  book: '📚',
  code: '💻',
  heart: '❤️',
  sparkles: '✨',
};

const CARD_TOPIC_SHAPES = new Set<TopicShape>([
  'rounded-rect',
  'pill',
  'underline',
  'ellipse',
  'diamond',
  'hexagon',
  'cloud',
  'parallelogram',
]);

/** Resolves which TopicShape container draws around a boxed card. */
export function resolveEffectiveTopicShape(
  node: Pick<RenderNode, 'topicShape' | 'styleOverride'>,
  config?: Pick<NodeConfig, 'topicShape'>,
  resolvedCascadeShape?: TopicShape,
): TopicShape {
  const candidate =
    node.styleOverride?.topicShape ??
    resolvedCascadeShape ??
    node.topicShape ??
    config?.topicShape ??
    'rounded-rect';
  return CARD_TOPIC_SHAPES.has(candidate) ? candidate : 'rounded-rect';
}

export function traceRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius);
    return;
  }
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function traceCloudPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const left = x - w / 2;
  const right = x + w / 2;
  const top = y - h / 2;
  const bottom = y + h / 2;
  const bumpH = Math.max(5, Math.min(9, h * 0.16));
  const bumpW = Math.max(6, Math.min(11, w * 0.1));
  const topBumps = Math.max(3, Math.round(w / 28));
  const segW = w / topBumps;

  ctx.beginPath();
  ctx.moveTo(left + bumpW * 0.35, y - h * 0.25);

  // Top edge scallops
  for (let i = 0; i < topBumps; i++) {
    const x0 = left + i * segW;
    const x1 = left + (i + 1) * segW;
    const cx = (x0 + x1) / 2;
    ctx.quadraticCurveTo(cx, top - bumpH, x1, top + 2);
  }

  // Right cap
  ctx.quadraticCurveTo(right + bumpW, y, right - 2, bottom - 2);

  // Bottom edge scallops (right -> left)
  for (let i = topBumps - 1; i >= 0; i--) {
    const x0 = left + i * segW;
    const x1 = left + (i + 1) * segW;
    const cx = (x0 + x1) / 2;
    ctx.quadraticCurveTo(cx, bottom + bumpH, x0, bottom - 2);
  }

  // Left cap
  ctx.quadraticCurveTo(left - bumpW, y, left + bumpW * 0.35, y - h * 0.25);
  ctx.closePath();
}

function traceTopicShapePath(
  ctx: CanvasRenderingContext2D,
  shape: TopicShape,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const left = x - w / 2;
  const right = x + w / 2;
  const top = y - h / 2;
  const bottom = y + h / 2;

  switch (shape) {
    case 'pill':
      traceRoundedRectPath(ctx, left, top, w, h, h / 2);
      return;
    case 'ellipse':
      ctx.beginPath();
      if (typeof ctx.ellipse === 'function') {
        ctx.ellipse(x, y, Math.max(1, w / 2), Math.max(1, h / 2), 0, 0, Math.PI * 2);
      } else {
        traceRoundedRectPath(ctx, left, top, w, h, h / 2);
      }
      return;
    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(right, y);
      ctx.lineTo(x, bottom);
      ctx.lineTo(left, y);
      ctx.closePath();
      return;
    case 'hexagon': {
      const cap = Math.min(14, w * 0.16);
      ctx.beginPath();
      ctx.moveTo(left + cap, top);
      ctx.lineTo(right - cap, top);
      ctx.lineTo(right, y);
      ctx.lineTo(right - cap, bottom);
      ctx.lineTo(left + cap, bottom);
      ctx.lineTo(left, y);
      ctx.closePath();
      return;
    }
    case 'parallelogram': {
      const skew = Math.min(12, Math.max(6, h * 0.28));
      ctx.beginPath();
      ctx.moveTo(left + skew, top);
      ctx.lineTo(right, top);
      ctx.lineTo(right - skew, bottom);
      ctx.lineTo(left, bottom);
      ctx.closePath();
      return;
    }
    case 'cloud':
      traceCloudPath(ctx, x, y, w, h);
      return;
    case 'rounded-rect':
    default:
      traceRoundedRectPath(ctx, left, top, w, h, 8);
  }
}

export interface TopicShapePaintOptions {
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  selected?: boolean;
  hovered?: boolean;
  dashedBorder?: boolean;
}

/** Draws one of the 8 XMind TopicShape containers centered at (x, y). */
export function drawTopicShapeBox(
  ctx: CanvasRenderingContext2D,
  shape: TopicShape,
  x: number,
  y: number,
  w: number,
  h: number,
  options: TopicShapePaintOptions,
): void {
  if (shape === 'underline') {
    if (options.selected || options.hovered) {
      traceRoundedRectPath(ctx, x - w / 2, y - h / 2, w, h, 6);
      ctx.fillStyle = options.fillStyle;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y + h / 2);
    ctx.lineTo(x + w / 2, y + h / 2);
    ctx.lineWidth = options.selected ? Math.max(2.2, options.lineWidth) : Math.max(1.4, options.lineWidth);
    ctx.strokeStyle = options.strokeStyle;
    if (options.dashedBorder) ctx.setLineDash([4, 3]);
    ctx.stroke();
    if (options.dashedBorder) ctx.setLineDash([]);
    return;
  }

  traceTopicShapePath(ctx, shape, x, y, w, h);
  ctx.fillStyle = options.fillStyle;
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  ctx.lineWidth = options.lineWidth;
  ctx.strokeStyle = options.strokeStyle;
  if (options.dashedBorder) ctx.setLineDash([4, 3]);
  ctx.stroke();
  if (options.dashedBorder) ctx.setLineDash([]);
}

function drawStarPolygon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  points = 5,
): void {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawSingleMarker(
  ctx: CanvasRenderingContext2D,
  marker: NodeMarker,
  cx: number,
  cy: number,
  theme: GraphTheme,
): void {
  ctx.save();
  switch (marker.kind) {
    case 'priority': {
      const color = PRIORITY_COLORS[marker.level] ?? '#64748b';
      ctx.beginPath();
      ctx.arc(cx, cy, 6.2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.font = cardFont(8.5, '700');
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(marker.level), cx, cy + 0.5);
      break;
    }
    case 'checkbox': {
      const size = 11;
      const done = marker.state === 'done';
      traceRoundedRectPath(ctx, cx - size / 2, cy - size / 2, size, size, 3);
      if (done) {
        ctx.fillStyle = '#10b981';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - 3.2, cy + 0.2);
        ctx.lineTo(cx - 0.8, cy + 2.6);
        ctx.lineTo(cx + 3.4, cy - 2.4);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      } else {
        ctx.fillStyle = dim(theme.card, 0.7);
        ctx.fill();
        ctx.strokeStyle = dim(theme.label, 0.55);
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      break;
    }
    case 'progress': {
      const pct = Math.max(0, Math.min(100, marker.percent));
      const r = 6;
      if (pct >= 100) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - 3, cy + 0.2);
        ctx.lineTo(cx - 0.6, cy + 2.5);
        ctx.lineTo(cx + 3.2, cy - 2.3);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.3;
        ctx.stroke();
        if (pct > 0) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, r - 1.2, -Math.PI / 2, -Math.PI / 2 + (pct / 100) * Math.PI * 2);
          ctx.closePath();
          ctx.fillStyle = '#10b981';
          ctx.fill();
        }
      }
      break;
    }
    case 'flag': {
      ctx.strokeStyle = theme.label;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - 3.5, cy - 5.5);
      ctx.lineTo(cx - 3.5, cy + 5.5);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - 3, cy - 5.2);
      ctx.lineTo(cx + 4.8, cy - 2.3);
      ctx.lineTo(cx - 3, cy + 0.5);
      ctx.closePath();
      ctx.fillStyle = marker.color || '#ef4444';
      ctx.fill();
      break;
    }
    case 'star': {
      drawStarPolygon(ctx, cx, cy, 6.2, 2.8, 5);
      ctx.fillStyle = marker.color || '#eab308';
      ctx.fill();
      break;
    }
    case 'emoji': {
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = theme.label;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(marker.value, cx, cy + 0.5);
      break;
    }
  }
  ctx.restore();
}

/** Renders Left-Slot XMind markers and sticker inside Row 1, returning the X offset past them. */
export function drawLeftSlotAttachments(
  ctx: CanvasRenderingContext2D,
  startX: number,
  centerY: number,
  attachments: NodeAttachments | undefined,
  accentColor: string,
  theme: GraphTheme,
): number {
  if (!attachments) return startX;
  let cursorX = startX;
  const markers = (attachments.markers ?? []).slice(0, 4);

  for (const marker of markers) {
    drawSingleMarker(ctx, marker, cursorX + 6.5, centerY, theme);
    cursorX += 17;
  }

  const rawSticker = attachments.sticker?.trim();
  if (rawSticker) {
    const glyph = STICKER_GLYPHS[rawSticker.toLowerCase()] ?? rawSticker.slice(0, 2);
    ctx.save();
    traceRoundedRectPath(ctx, cursorX, centerY - 7.5, 15, 15, 4);
    ctx.fillStyle = dim(accentColor, 0.22);
    ctx.fill();
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillStyle = theme.label;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyph, cursorX + 7.5, centerY + 0.5);
    ctx.restore();
    cursorX += 18;
  }

  return cursorX > startX ? cursorX + 4 : startX;
}

/** Renders Right-Slot wikilink counter badge (`[[n]]`) or compact note-body glyph. */
export function drawRightSlotBadges(
  ctx: CanvasRenderingContext2D,
  rightInnerX: number,
  centerY: number,
  wikilinkCount: number,
  hasNoteBody: boolean,
  accentColor: string,
  theme: GraphTheme,
): void {
  if (wikilinkCount <= 0 && !hasNoteBody) return;
  ctx.save();

  if (wikilinkCount > 0) {
    const badgeText = `[[${wikilinkCount}]]`;
    ctx.font = cardFont(8, '600');
    const bw = Math.max(20, Math.ceil(ctx.measureText(badgeText).width + 6));
    const bx = rightInnerX - bw;
    traceRoundedRectPath(ctx, bx, centerY - 6.5, bw, 13, 4);
    ctx.fillStyle = dim(accentColor, 0.18);
    ctx.fill();
    ctx.fillStyle = dim(theme.label, 0.85);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, bx + bw / 2, centerY + 0.5);
  } else if (hasNoteBody) {
    const bx = rightInnerX - 10;
    const by = centerY - 4.5;
    traceRoundedRectPath(ctx, bx, by, 9, 9, 1.8);
    ctx.strokeStyle = dim(theme.label, 0.55);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx + 2, by + 3);
    ctx.lineTo(bx + 7, by + 3);
    ctx.moveTo(bx + 2, by + 5.8);
    ctx.lineTo(bx + 6, by + 5.8);
    ctx.stroke();
  }

  ctx.restore();
}

/** Renders Row 2 footer tag/label pills inside a rich card. */
export function drawFooterTagPills(
  ctx: CanvasRenderingContext2D,
  startX: number,
  rowCenterY: number,
  labels: string[],
  pillWidths: number[],
  accentColor: string,
  theme: GraphTheme,
): void {
  if (!labels.length) return;
  ctx.save();
  ctx.font = cardFont(9, '600');
  let cursorX = startX;

  labels.forEach((label, index) => {
    const pw = pillWidths[index] ?? 32;
    const ph = 13;
    traceRoundedRectPath(ctx, cursorX, rowCenterY - ph / 2, pw, ph, ph / 2);
    ctx.fillStyle = dim(accentColor, 0.16);
    ctx.fill();
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = dim(accentColor, 0.42);
    ctx.stroke();

    ctx.fillStyle = dim(theme.label, 0.92);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`#${label}`, cursorX + pw / 2, rowCenterY + 0.5);

    cursorX += pw + 4;
  });

  ctx.restore();
}
