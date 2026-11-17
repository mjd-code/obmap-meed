/** Card node renderer with XMind TopicShapes, internal Flexbox attachments, LoD, and collapse toggle hit region. */

import type { CanvasMode, LayoutMode, RenderNode } from '@/domains/graph/shared/utils/graph.types';
import type { NodeConfig } from '@/domains/graph/shared/stores/useGraphStore';
import {
  cardFont,
  cardLayout,
  CARD_FONT_SIZE,
  resolveFooterLabels,
} from '@/domains/graph/shared/utils/textLayout';
import {
  measureUnboxedText,
  resolveNodeDotVisualRadius,
  resolveNodeMarkerRadius,
  resolveUnboxedAnchors,
  resolveUnboxedLabelPosition,
} from '@/domains/graph/shared/utils/unboxedNodeLayout';
import { accentFor, dim, type GraphTheme } from '@/domains/graph/shared/utils/theme';
import type { ResolvedNodePaint } from '@/domains/graph/shared/utils/cascadingStyleResolver';
import {
  drawFooterTagPills,
  drawLeftSlotAttachments,
  drawRightSlotBadges,
  drawTopicShapeBox,
  resolveEffectiveTopicShape,
  traceRoundedRectPath,
} from '@/domains/graph/shared/utils/drawAttachments';

export type FormatItemType = 'folder' | 'pdf' | 'image' | 'audio' | 'video' | 'file';

export function resolveNodeFormat(node: RenderNode): FormatItemType {
  if (node.type === 'folder') return 'folder';
  if (node.type === 'pdf' || (node.type === 'media' && node.mediaType === 'pdf')) return 'pdf';
  if (node.type === 'media') {
    if (node.mediaType === 'image') return 'image';
    if (node.mediaType === 'audio') return 'audio';
    if (node.mediaType === 'video') return 'video';
  }
  return 'file';
}

export function formatColorForNode(format: FormatItemType, fallbackAccent: string): string {
  switch (format) {
    case 'folder': return '#eab308'; // yellow-500
    case 'pdf': return '#f43f5e';    // rose-500
    case 'image': return '#10b981';  // emerald-500
    case 'audio': return '#a855f7';  // purple-500
    case 'video': return '#ef4444';  // red-500
    case 'file': return fallbackAccent;
  }
}

// Lazy-cache objek Path2D Lucide (viewBox 24x24) agar aman saat diimpor di lingkungan non-browser
let cachedIconPaths: {
  folder: Path2D;
  fileText: Path2D;
  image: Path2D;
  music: Path2D;
  video: Path2D;
} | null = null;

function getIconPaths() {
  if (!cachedIconPaths) {
    cachedIconPaths = {
      folder: new Path2D(
        'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z',
      ),
      fileText: new Path2D(
        'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7ZM14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8',
      ),
      image: new Path2D(
        'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21',
      ),
      music: new Path2D(
        'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
      ),
      video: new Path2D(
        'M4 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2ZM16 13l5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5',
      ),
    };
  }
  return cachedIconPaths;
}

function drawFormatIcon(
  ctx: CanvasRenderingContext2D,
  format: FormatItemType,
  x: number,
  y: number,
  radius: number,
  color: string,
  _boxed: boolean,
  isSelected: boolean,
) {
  const iconPaths = getIconPaths();
  const path =
    format === 'folder'
      ? iconPaths.folder
      : format === 'image'
        ? iconPaths.image
        : format === 'audio'
          ? iconPaths.music
          : format === 'video'
            ? iconPaths.video
            : iconPaths.fileText;

  const iconSize = Math.max(12, radius * 2.2);
  const scale = iconSize / 24;

  ctx.save();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.translate(x - iconSize / 2, y - iconSize / 2);
  ctx.scale(scale, scale);
  ctx.strokeStyle = isSelected ? '#ffffff' : color;
  ctx.lineWidth = isSelected ? 2.2 : 1.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(path);
  ctx.restore();
}

export interface DrawNodeState {
  theme: GraphTheme;
  zoom: number;
  selected: boolean;
  hovered: boolean;
  dimmed: boolean;
  collapsed: boolean;
  isRoot: boolean;
  showLabels: boolean;
  labelThreshold: number;
  preserveDetail: boolean;
  config: NodeConfig;
  /** 0..1 pulse phase for animated glow; static halo when omitted. */
  glowPhase?: number;
  isDragged?: boolean;
  isDropTarget?: boolean;
  dropTargetValid?: boolean;
  /** Optional 4-level resolved cascade paint from cascadingStyleResolver. */
  resolvedPaint?: ResolvedNodePaint;
  /** Active layout & canvas mode for unboxed ('With Text') label orientation. */
  layoutMode?: LayoutMode;
  canvasMode?: CanvasMode;
}

/**
 * Menghasilkan bentuk geometris node secara dinamis berdasarkan format berkas.
 * Menjamin pemisahan: Bentuk mewakili Format, Warna mewakili Hierarki/Tags.
 */
export function resolveNodeShape(
  node: RenderNode,
  config: NodeConfig,
): NodeConfig['shape'] {
  if (!config.autoShapeByFormat) {
    return config.shape;
  }

  if (node.type === 'folder') {
    return 'hexagon';
  }

  if (node.type === 'media') {
    if (node.mediaType === 'image') return 'square';
    if (node.mediaType === 'audio') return 'triangle';
    if (node.mediaType === 'pdf') return 'diamond';
    if (node.mediaType === 'video') return 'hexagon';
    return 'square';
  }

  return 'circle';
}

/** Soft radial halo around a node marker, drawn beneath the node itself. */
function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  intensity: number,
  phase: number,
  boost: number,
) {
  const pulse = 0.65 + 0.35 * Math.sin(phase * Math.PI * 2);
  const strength = Math.max(0, Math.min(1, intensity)) * pulse * boost;
  if (strength <= 0.01) return;
  const outer = radius * (2.2 + intensity * 2.2);
  const gradient = ctx.createRadialGradient(x, y, radius * 0.4, x, y, outer);
  gradient.addColorStop(0, dim(color, 0.55 * strength));
  gradient.addColorStop(0.55, dim(color, 0.22 * strength));
  gradient.addColorStop(1, dim(color, 0));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, outer, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function labelForNode(node: RenderNode, config: NodeConfig): string {
  if (config.labelField === 'id') return node.id;
  return node.name || 'Untitled';
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: NodeConfig['shape'],
  x: number,
  y: number,
  radius: number,
) {
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(x, y, radius, 0, Math.PI * 2);
  } else if (shape === 'square') {
    ctx.rect(x - radius, y - radius, radius * 2, radius * 2);
  } else {
    const sides = shape === 'triangle' ? 3 : shape === 'diamond' ? 4 : 6;
    const offset = shape === 'diamond' ? -Math.PI / 4 : -Math.PI / 2;
    for (let index = 0; index < sides; index += 1) {
      const angle = offset + (index * Math.PI * 2) / sides;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
}

export function drawNode(
  ctx: CanvasRenderingContext2D,
  node: RenderNode,
  state: DrawNodeState,
) {
  const { theme, zoom } = state;
  if (!state.config.visible) {
    node.toggle = null;
    return;
  }
  const paint = state.resolvedPaint;
  const accent = state.selected
    ? theme.selected
    : paint?.accentColor ?? accentFor(node, theme, state.selected);
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const alpha = state.dimmed ? 0.18 : theme.nodeOpacity;
  const resolvedShape = resolveNodeShape(node, state.config);

  const detailScale = state.preserveDetail ? 1 / Math.max(0.05, zoom) : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(detailScale, detailScale);
  ctx.translate(-x, -y);

  if (state.isDragged) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;
  }

  const label = labelForNode(node, state.config);
  const fontSize = state.config.labelSize + (paint ? paint.fontSizeDelta : state.isRoot ? 2 : 0);
  const boxed = Boolean(state.showLabels && state.config.labelBox);
  const topicShape = boxed
    ? resolveEffectiveTopicShape(node, state.config, paint?.topicShape)
    : undefined;
  const showMarkers = state.config.showMarkers !== false;
  const showTagPills = state.config.showTagPills !== false;
  const layout = cardLayout(label, {
    root: state.isRoot,
    badge: node.childCount > 0,
    fontSize,
    attachments: node.attachments,
    tags: node.tags,
    topicShape,
    wikilinkCount: node.wikilinkCount,
    hasNoteBody: Boolean(node.content && node.content.trim().length > 0),
    showMarkers,
    showTagPills,
  });

  const markerRadius = resolveNodeMarkerRadius(node, state.config);
  const visualDotRadius = resolveNodeDotVisualRadius(node, state.config);
  const weight =
    state.config.labelFontStyle.includes('bold')
      ? '700'
      : paint?.fontWeight ?? (state.isRoot ? '600' : '500');
  const unboxedMetrics = !boxed
    ? measureUnboxedText(label, { fontSize, fontWeight: weight, isRoot: state.isRoot })
    : null;

  const w = boxed ? layout.width : visualDotRadius * 2;
  const h = boxed ? layout.height : visualDotRadius * 2;
  const innerLeft = x - w / 2 + (boxed ? layout.shapePaddingX / 2 : 0);
  const innerRight = x + w / 2 - (boxed ? layout.shapePaddingX / 2 : 0);
  const mainRowCenterY = boxed
    ? y - layout.footerLabelsHeight / 2
    : y;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Ambient elevation shadow on hover/selection (only for boxed cards)
  if (boxed && (state.selected || state.hovered)) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 22;
  }

  const useCascadePaint =
    Boolean(paint) &&
    (Boolean(paint?.hasExplicitCascade) ||
      theme.autoColorBy === 'branch' ||
      Boolean(theme.hierarchy?.skeletonPreset) ||
      Boolean(node.branchColor) ||
      Boolean(node.styleOverride) ||
      (boxed && topicShape === 'underline'));

  if (boxed && topicShape) {
    const fillStyle = useCascadePaint && paint
      ? dim(paint.fillColor, state.selected ? 0.96 : Math.max(0.84, state.config.opacity))
      : state.config.labelBackground
        ? dim(theme.labelBackground, state.selected ? 0.95 : Math.max(0.72, state.config.opacity))
        : dim(accent, state.selected ? 0.35 : state.hovered ? 0.25 : 0.16);
    const strokeStyle = state.selected
      ? accent
      : state.hovered
        ? dim(paint?.borderColor ?? accent, 0.92)
        : paint?.borderColor ?? dim(accent, 0.5);
    drawTopicShapeBox(ctx, topicShape, x, y, w, h, {
      fillStyle,
      strokeStyle,
      lineWidth: state.selected ? 2 : 1,
      selected: state.selected,
      hovered: state.hovered,
      dashedBorder: paint?.dashedBorder,
    });
  }

  // Format marker / geometric dot on left edge of Row 1
  const markerX = boxed ? innerLeft + 9 : x;
  if (state.config.glow && !state.dimmed) {
    drawGlow(
      ctx,
      markerX,
      mainRowCenterY,
      markerRadius,
      accent,
      state.config.glowIntensity,
      state.glowPhase ?? 0,
      state.selected || state.hovered ? 1.35 : 1,
    );
  }

  const useFormatIcons =
    Boolean(state.config.autoShapeByFormat) &&
    state.config.formatMarkerStyle === 'icons';
  const nodeFormat = resolveNodeFormat(node);
  const iconColor = formatColorForNode(nodeFormat, accent);

  if (useFormatIcons) {
    drawFormatIcon(
      ctx,
      nodeFormat,
      markerX,
      mainRowCenterY,
      markerRadius,
      iconColor,
      boxed,
      state.selected,
    );
  } else {
    ctx.fillStyle = accent;
    drawShape(ctx, resolvedShape, markerX, mainRowCenterY, markerRadius);
    ctx.fill();
    if (!boxed && state.selected) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = accent;
      ctx.stroke();
    }
  }
  ctx.shadowBlur = 0;

  // Indikator target folder reparenting
  if (state.isDropTarget && state.dropTargetValid) {
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(w, h) / 2 + 10, 0, Math.PI * 2);
    ctx.stroke();

    const badgeText = 'masuk ke folder';
    ctx.font = cardFont(9, '600');
    const badgeW = ctx.measureText(badgeText).width + 12;
    const badgeY = y - h / 2 - 14;

    ctx.fillStyle = accent;
    traceRoundedRectPath(ctx, x - badgeW / 2, badgeY - 8, badgeW, 16, 4);
    ctx.fill();

    ctx.fillStyle = theme.card;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, x, badgeY);
    ctx.restore();
  }

  // Pre-compute unboxed text & collapse badge anchors so text never overlaps dots, branches, or toggle badges
  const unboxedPlacement =
    !boxed && state.showLabels
      ? resolveUnboxedLabelPosition(
          state.config.labelPosition,
          state.layoutMode ?? 'mindmap',
          state.canvasMode,
        )
      : 'beside';
  let collapsedPillW = 22;
  if (node.childCount > 0 && state.collapsed) {
    ctx.font = cardFont(9, '700');
    collapsedPillW = Math.max(22, ctx.measureText(`+${node.childCount}`).width + 10);
  }
  const unboxedAnchors =
    !boxed && unboxedMetrics && state.showLabels
      ? resolveUnboxedAnchors({
          x,
          y,
          dotRadius: visualDotRadius,
          textMetrics: unboxedMetrics,
          placement: unboxedPlacement,
          layoutMode: state.layoutMode ?? 'mindmap',
          node,
          collapsed: state.collapsed,
          pillHalfW: collapsedPillW / 2,
        })
      : null;

  // Collapse toggle badge (— when open, +N pill when collapsed)
  if (node.childCount > 0) {
    ctx.save();
    ctx.globalAlpha = state.dimmed ? 0.25 : 1;

    if (state.collapsed) {
      const pillText = `+${node.childCount}`;
      ctx.font = cardFont(9, '700');
      const pillW = collapsedPillW;
      const pillH = 15;
      const tx = boxed
        ? x + w / 2 + pillW / 2 + 3
        : unboxedAnchors
          ? unboxedAnchors.toggleX
          : x + visualDotRadius + pillW / 2 + 3;
      const ty = boxed ? y : unboxedAnchors ? unboxedAnchors.toggleY : y;

      ctx.fillStyle = theme.card;
      traceRoundedRectPath(ctx, tx - pillW / 2, ty - pillH / 2, pillW, pillH, pillH / 2);
      ctx.fill();

      ctx.lineWidth = 1.2;
      ctx.strokeStyle = accent;
      ctx.stroke();

      ctx.fillStyle = accent;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pillText, tx, ty);

      node.toggle = {
        x: x + (tx - x) * detailScale,
        y: y + (ty - y) * detailScale,
        r: Math.max(pillW / 2, 10) * detailScale,
      };
    } else {
      const r = 6;
      const tx = boxed
        ? x + w / 2 + r + 2
        : unboxedAnchors
          ? unboxedAnchors.toggleX
          : x + visualDotRadius + r + 2;
      const ty = boxed ? y : unboxedAnchors ? unboxedAnchors.toggleY : y;

      ctx.beginPath();
      ctx.arc(tx, ty, r, 0, Math.PI * 2);
      ctx.fillStyle = theme.card;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = dim(accent, 0.7);
      ctx.stroke();

      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tx - 3, ty);
      ctx.lineTo(tx + 3, ty);
      ctx.stroke();

      node.toggle = {
        x: x + (tx - x) * detailScale,
        y: y + (ty - y) * detailScale,
        r: (r + 4) * detailScale,
      };
    }

    ctx.restore();
  } else {
    node.toggle = null;
  }

  // Internal Flexbox Row 1 Left Slot: Markers & Stickers (inside boxed cards)
  const leftSlotStartX = boxed ? innerLeft + Math.max(18, markerRadius * 2 + 7) : 0;
  let titleX = leftSlotStartX;
  if (boxed && showMarkers && node.attachments) {
    titleX = drawLeftSlotAttachments(
      ctx,
      leftSlotStartX,
      mainRowCenterY,
      node.attachments,
      accent,
      theme,
    );
  } else if (boxed) {
    titleX = leftSlotStartX;
  }

  // Title text
  if (state.showLabels) {
    const italic = state.config.labelFontStyle.includes('italic') ? 'italic ' : '';
    ctx.font = `${italic}${cardFont(fontSize, weight)}`;
    ctx.fillStyle = useCascadePaint && paint ? paint.textColor : theme.label;
    ctx.textBaseline = 'middle';

    if (boxed) {
      ctx.textAlign = 'left';
      const lineHeight = layout.lineHeight;
      const startY = mainRowCenterY - ((layout.lines.length - 1) * lineHeight) / 2;
      layout.lines.forEach((line, index) => {
        ctx.fillText(line, titleX, startY + index * lineHeight);
      });
    } else if (unboxedMetrics && unboxedAnchors) {
      ctx.textAlign = unboxedAnchors.textAlign;
      unboxedMetrics.lines.forEach((line, index) => {
        ctx.fillText(
          line,
          unboxedAnchors.textX,
          unboxedAnchors.firstLineCenterY + index * unboxedMetrics.lineHeight,
        );
      });
    }
  }

  // Row 1 Right Slot & Child Count Badge
  if (boxed && (state.preserveDetail || zoom >= state.labelThreshold)) {
    if (node.childCount > 0) {
      ctx.font = cardFont(9, '600');
      ctx.fillStyle = dim(accent, 0.9);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        String(node.childCount),
        innerRight - 10,
        y - h / 2 + layout.shapePaddingY / 2 + 8,
      );
    }

    const wikilinkCount = layout.wikilinkCount;
    const hasNoteBody = layout.hasNoteBody;
    if (wikilinkCount > 0 || hasNoteBody) {
      const rightEdge = node.childCount > 0 ? innerRight - 22 : innerRight - 8;
      drawRightSlotBadges(
        ctx,
        rightEdge,
        mainRowCenterY,
        wikilinkCount,
        hasNoteBody,
        accent,
        theme,
      );
    }
  }

  // Internal Flexbox Row 2: Footer Tag/Label Pills
  if (
    boxed &&
    showTagPills &&
    layout.resolvedLabels.length > 0 &&
    (state.preserveDetail || zoom >= state.labelThreshold * 0.85)
  ) {
    const footerRowCenterY = y + (h - layout.shapePaddingY) / 2 - 11;
    drawFooterTagPills(
      ctx,
      leftSlotStartX,
      footerRowCenterY,
      resolveFooterLabels(node.attachments, node.tags, 4),
      layout.pillWidths,
      accent,
      theme,
    );
  }

  ctx.restore();
  ctx.restore();
}

/** Pointer area covers the rich card plus its collapse toggle. */
export function paintNodePointerArea(
  ctx: CanvasRenderingContext2D,
  node: RenderNode,
  color: string,
  isRoot: boolean,
  config?: NodeConfig,
  zoom = 1,
  preserveDetail = false,
) {
  if (config && !config.visible) return;
  const label = config ? labelForNode(node, config) : node.name;
  const boxed = config ? Boolean(config.showLabels && config.labelBox) : true;
  const topicShape = boxed ? resolveEffectiveTopicShape(node, config) : undefined;
  const layout = cardLayout(label, {
    root: isRoot,
    badge: node.childCount > 0,
    fontSize: (config?.labelSize ?? CARD_FONT_SIZE) + (isRoot ? 2 : 0),
    attachments: node.attachments,
    tags: node.tags,
    topicShape,
    wikilinkCount: node.wikilinkCount,
    hasNoteBody: Boolean(node.content && node.content.trim().length > 0),
    showMarkers: config?.showMarkers ?? true,
    showTagPills: config?.showTagPills ?? true,
  });
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const extra = node.childCount > 0 ? 32 : 0;
  const visualDotRadius = resolveNodeDotVisualRadius(node, config);
  const detailScale = preserveDetail ? 1 / Math.max(0.05, zoom) : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(detailScale, detailScale);
  ctx.translate(-x, -y);
  ctx.fillStyle = color;

  if (boxed) {
    ctx.fillRect(x - layout.width / 2, y - layout.height / 2, layout.width + extra, layout.height);
  } else {
    // Hit area covers ONLY the dot/icon circle (plus collapse badge), keeping text click-through to canvas
    ctx.beginPath();
    ctx.arc(x, y, visualDotRadius + 3, 0, Math.PI * 2);
    ctx.fill();
    if (node.childCount > 0 && node.toggle) {
      const localTx = x + (node.toggle.x - x) / detailScale;
      const localTy = y + (node.toggle.y - y) / detailScale;
      const localTr = Math.max(8, node.toggle.r / detailScale);
      ctx.beginPath();
      ctx.arc(localTx, localTy, localTr, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
