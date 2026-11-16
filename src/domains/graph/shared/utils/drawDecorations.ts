/** Axis, spine, rib, boundary hull, and summary brace decorations drawn per frame. */

import type {
  BoundaryDecoration,
  FishboneRib,
  FishboneSpine,
  LayoutDecoration,
  SummaryBraceDecoration,
  TimelineAxis,
} from '@/domains/graph/shared/utils/graph.types';
import {
  traceCloudPath,
  traceRoundedRectPath,
} from '@/domains/graph/shared/utils/drawAttachments';
import { cardFont } from '@/domains/graph/shared/utils/textLayout';
import { dim, type GraphTheme } from '@/domains/graph/shared/utils/theme';

function drawBoundaryDecoration(
  ctx: CanvasRenderingContext2D,
  boundary: BoundaryDecoration,
  theme: GraphTheme,
  zoom: number,
  preserveDetail: boolean,
): void {
  const strokeColor = boundary.strokeColor ?? theme.selected;
  const fillColor = boundary.fillColor ?? dim(strokeColor, 0.08);
  const lineW = preserveDetail ? 1.5 / Math.max(0.05, zoom) : 1.5;

  ctx.save();
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineW;
  ctx.setLineDash(boundary.shape === 'dashed' ? [6, 4] : []);

  if (boundary.shape === 'cloud') {
    traceCloudPath(
      ctx,
      boundary.x + boundary.width / 2,
      boundary.y + boundary.height / 2,
      boundary.width,
      boundary.height,
    );
  } else {
    traceRoundedRectPath(
      ctx,
      boundary.x,
      boundary.y,
      boundary.width,
      boundary.height,
      boundary.shape === 'dashed' ? 10 : 12,
    );
  }
  ctx.fill();
  ctx.stroke();

  if (boundary.title?.trim()) {
    const title = boundary.title.trim();
    ctx.setLineDash([]);
    ctx.font = cardFont(10, '600');
    const textW = ctx.measureText(title).width;
    const pillW = textW + 14;
    const pillH = 18;
    const pillX = boundary.x + 10;
    const pillY = boundary.y + 4;
    traceRoundedRectPath(ctx, pillX, pillY, pillW, pillH, 9);
    ctx.fillStyle = dim(strokeColor, 0.22);
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = Math.max(0.8, lineW * 0.75);
    ctx.stroke();

    ctx.fillStyle = theme.label;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, pillX + 7, pillY + pillH / 2);
  }
  ctx.restore();
}

function drawSummaryBraceDecoration(
  ctx: CanvasRenderingContext2D,
  brace: SummaryBraceDecoration,
  theme: GraphTheme,
  zoom: number,
  preserveDetail: boolean,
): void {
  const strokeColor = brace.color ?? theme.selected;
  const lineW = preserveDetail ? 1.75 / Math.max(0.05, zoom) : 1.75;
  const horizontalSpan = brace.direction === 'down' || brace.direction === 'up';

  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineW;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([]);

  ctx.beginPath();
  if (brace.braceStyle === 'square') {
    const midX = horizontalSpan ? brace.apexX : (brace.x1 + brace.apexX) / 2;
    const midY = horizontalSpan ? (brace.y1 + brace.apexY) / 2 : brace.apexY;
    if (horizontalSpan) {
      ctx.moveTo(brace.x1, brace.y1);
      ctx.lineTo(brace.x1, midY);
      ctx.lineTo(brace.x2, midY);
      ctx.lineTo(brace.x2, brace.y2);
      ctx.moveTo(brace.apexX, midY);
      ctx.lineTo(brace.apexX, brace.apexY);
    } else {
      ctx.moveTo(brace.x1, brace.y1);
      ctx.lineTo(midX, brace.y1);
      ctx.lineTo(midX, brace.y2);
      ctx.lineTo(brace.x2, brace.y2);
      ctx.moveTo(midX, brace.apexY);
      ctx.lineTo(brace.apexX, brace.apexY);
    }
  } else if (brace.braceStyle === 'round') {
    ctx.moveTo(brace.x1, brace.y1);
    ctx.quadraticCurveTo(
      horizontalSpan ? brace.x1 : brace.apexX,
      horizontalSpan ? brace.apexY : brace.y1,
      brace.apexX,
      brace.apexY,
    );
    ctx.quadraticCurveTo(
      horizontalSpan ? brace.x2 : brace.apexX,
      horizontalSpan ? brace.apexY : brace.y2,
      brace.x2,
      brace.y2,
    );
  } else {
    // Classic XMind S-curve curly brace `{` meeting at (apexX, apexY)
    if (horizontalSpan) {
      const midY = (brace.y1 + brace.apexY) / 2;
      ctx.moveTo(brace.x1, brace.y1);
      ctx.bezierCurveTo(brace.x1, midY, brace.apexX, brace.y1, brace.apexX, brace.apexY);
      ctx.bezierCurveTo(brace.apexX, brace.y2, brace.x2, midY, brace.x2, brace.y2);
    } else {
      const midX = (brace.x1 + brace.apexX) / 2;
      ctx.moveTo(brace.x1, brace.y1);
      ctx.bezierCurveTo(midX, brace.y1, brace.x1, brace.apexY, brace.apexX, brace.apexY);
      ctx.bezierCurveTo(brace.x2, brace.apexY, midX, brace.y2, brace.x2, brace.y2);
    }
  }
  ctx.stroke();

  if (brace.label?.trim()) {
    ctx.font = cardFont(10, '500');
    ctx.fillStyle = strokeColor;
    ctx.textAlign = brace.direction === 'left' ? 'right' : 'left';
    ctx.textBaseline = 'middle';
    const labelX =
      brace.direction === 'left'
        ? brace.apexX - 6
        : brace.direction === 'right'
          ? brace.apexX + 6
          : brace.apexX;
    const labelY = horizontalSpan ? brace.apexY + 10 : brace.apexY;
    ctx.fillText(brace.label.trim(), labelX, labelY);
  }
  ctx.restore();
}

function drawTimelineAxisDecoration(
  ctx: CanvasRenderingContext2D,
  axis: TimelineAxis,
  theme: GraphTheme,
  zoom: number,
  preserveDetail: boolean,
): void {
  const y1 = axis.y1 ?? axis.y;
  const y2 = axis.y2 ?? axis.y;
  const lineW = preserveDetail ? 1.5 / Math.max(0.05, zoom) : 1.5;

  ctx.save();
  ctx.strokeStyle = dim(theme.decoration || theme.link, 0.7);
  ctx.lineWidth = lineW;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(axis.x1, y1);
  ctx.lineTo(axis.x2, y2);
  ctx.stroke();

  ctx.font = cardFont(10, '500');
  ctx.fillStyle = dim(theme.label, 0.85);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (const tick of axis.ticks) {
    const ty = tick.y ?? axis.y;
    ctx.beginPath();
    ctx.moveTo(tick.x, ty - 4);
    ctx.lineTo(tick.x, ty + 4);
    ctx.stroke();
    if (tick.label) {
      ctx.fillText(tick.label, tick.x, ty + 7);
    }
  }
  ctx.restore();
}

export function drawDecorations(
  ctx: CanvasRenderingContext2D,
  decorations: LayoutDecoration[],
  theme: GraphTheme,
  zoom: number,
  fishboneStyle?: { color: string; opacity: number; width: number; dash: number[] },
  /** Hierarchy-level paint for spine/rib geometry; null keeps the type style. */
  hierarchyPaint?: (
    decoration: FishboneSpine | FishboneRib
  ) => { color: string; opacity?: number } | null,
  preserveDetail = false
) {
  if (!decorations.length) return;
  ctx.save();
  for (const decoration of decorations) {
    if (decoration.kind === 'boundary') {
      drawBoundaryDecoration(ctx, decoration, theme, zoom, preserveDetail);
    } else if (decoration.kind === 'summary-brace') {
      drawSummaryBraceDecoration(ctx, decoration, theme, zoom, preserveDetail);
    } else if (decoration.kind === 'timeline-axis') {
      drawTimelineAxisDecoration(ctx, decoration, theme, zoom, preserveDetail);
    } else if (decoration.kind === 'fishbone-spine') {
      const paint = hierarchyPaint?.(decoration) ?? null;
      ctx.strokeStyle = dim(
        paint?.color ?? fishboneStyle?.color ?? theme.decoration,
        paint?.opacity ?? fishboneStyle?.opacity ?? 0.8
      );
      const spineWidth = Math.max(2, (fishboneStyle?.width ?? 2) * 1.4);
      ctx.lineWidth = preserveDetail ? spineWidth / Math.max(0.05, zoom) : spineWidth;
      ctx.setLineDash(fishboneStyle?.dash ?? []);
      ctx.beginPath();
      ctx.moveTo(decoration.x1, decoration.y1);
      ctx.lineTo(decoration.x2, decoration.y2);
      ctx.stroke();
    } else if (decoration.kind === 'fishbone-rib') {
      const paint = hierarchyPaint?.(decoration) ?? null;
      const opacity = paint?.opacity ?? fishboneStyle?.opacity ?? 0.8;
      const width = fishboneStyle?.width ?? 2;
      ctx.strokeStyle = dim(
        paint?.color ?? fishboneStyle?.color ?? theme.decoration,
        decoration.major ? opacity : opacity * 0.65
      );
      const ribWidth = decoration.major ? width : Math.max(0.75, width * 0.65);
      ctx.lineWidth = preserveDetail ? ribWidth / Math.max(0.05, zoom) : ribWidth;
      ctx.setLineDash(fishboneStyle?.dash ?? []);
      ctx.beginPath();
      ctx.moveTo(decoration.x1, decoration.y1);
      ctx.lineTo(decoration.x2, decoration.y2);
      ctx.stroke();
    }
  }
  ctx.restore();
}
