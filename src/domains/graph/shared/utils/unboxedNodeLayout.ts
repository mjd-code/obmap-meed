/**
 * Pure shared geometry helpers for unboxed nodes ('Only Node' and 'With Text').
 * Synchronizes dot/icon radius, branch port attachments, 2-line word-safe wrapping,
 * and non-overlapping text / collapse toggle anchors across drawNode, drawLink,
 * and useGraphCanvasController.
 */

import {
  canvasModeOf,
  type CanvasMode,
  type LayoutMode,
  type NodeMetric,
  type RenderNode,
} from '@/domains/graph/shared/utils/graph.types';
import type {
  NodeConfig,
  UnboxedLabelPosition,
} from '@/domains/graph/shared/stores/useGraphStore';
import {
  CARD_FONT_SIZE,
  cardFont,
  measureText,
  wrapText,
} from '@/domains/graph/shared/utils/textLayout';

export type UnboxedResolvedPlacement = 'beside' | 'below';

export interface UnboxedTextMetrics {
  lines: string[];
  textWidth: number;
  textHeight: number;
  lineHeight: number;
  fontSize: number;
}

export interface UnboxedTextPlacement {
  textAlign: 'left' | 'center' | 'right';
  textX: number;
  firstLineCenterY: number;
  toggleX: number;
  toggleY: number;
}

export const UNBOXED_MAX_TEXT_WIDTH = 200;
export const UNBOXED_MAX_LINES = 2;

/** Base dot marker radius scaled by depth interval. */
export function resolveNodeMarkerRadius(
  node: Pick<RenderNode, 'depth'>,
  config?: Pick<NodeConfig, 'relSize' | 'sizeByDepth' | 'depthSizeInterval'>,
): number {
  const relSize = config?.relSize ?? 6;
  const sizeByDepth = config?.sizeByDepth ?? true;
  const depthInterval = config?.depthSizeInterval ?? 0.5;
  const depthScale = sizeByDepth
    ? Math.max(0.45, 1 - node.depth * depthInterval * 0.08)
    : 1;
  return Math.max(3, relSize * depthScale);
}

/** Exact outer visual radius covering both geometric dot shapes and format icons. */
export function resolveNodeDotVisualRadius(
  node: Pick<RenderNode, 'depth'>,
  config?: Pick<
    NodeConfig,
    'relSize' | 'sizeByDepth' | 'depthSizeInterval' | 'autoShapeByFormat' | 'formatMarkerStyle'
  >,
): number {
  const markerRadius = resolveNodeMarkerRadius(node, config);
  const useFormatIcons =
    Boolean(config?.autoShapeByFormat) && config?.formatMarkerStyle === 'icons';
  return useFormatIcons ? Math.max(6, markerRadius * 1.1) : markerRadius;
}

/** Resolves effective unboxed text placement ('beside' or 'below') from NodeConfig & layout. */
export function resolveUnboxedLabelPosition(
  labelPosition: UnboxedLabelPosition | undefined,
  layoutMode: LayoutMode = 'mindmap',
  canvasMode?: CanvasMode,
): UnboxedResolvedPlacement {
  if (labelPosition === 'below' || labelPosition === 'beside') {
    return labelPosition;
  }
  const effectiveCanvas = canvasMode ?? canvasModeOf(layoutMode);
  return effectiveCanvas === 'graph' ? 'below' : 'beside';
}

/** Measures word-safe 2-line unboxed text without card padding or mid-word character splits. */
export function measureUnboxedText(
  label: string,
  options: { fontSize?: number; fontWeight?: string; isRoot?: boolean; maxTextWidth?: number } = {},
): UnboxedTextMetrics {
  const fontSize = options.fontSize ?? (options.isRoot ? CARD_FONT_SIZE + 2 : CARD_FONT_SIZE);
  const lineHeight = fontSize + 4;
  const font = cardFont(fontSize, options.fontWeight ?? (options.isRoot ? '600' : '500'));
  const maxW = options.maxTextWidth ?? UNBOXED_MAX_TEXT_WIDTH;
  const lines = wrapText(label || 'Untitled', font, maxW, UNBOXED_MAX_LINES, false);
  const textWidth = Math.min(
    maxW,
    Math.max(...lines.map((line) => measureText(line, font)), 0),
  );
  return {
    lines,
    textWidth,
    textHeight: lines.length * lineHeight,
    lineHeight,
    fontSize,
  };
}

/** Computes exact non-overlapping label & collapse-toggle coordinates relative to dot center (x, y). */
export function resolveUnboxedAnchors(params: {
  x: number;
  y: number;
  dotRadius: number;
  textMetrics: UnboxedTextMetrics;
  placement: UnboxedResolvedPlacement;
  layoutMode: LayoutMode;
  node: Pick<RenderNode, 'parentId' | 'childCount' | 'layoutSide' | 'layoutLane'>;
  collapsed: boolean;
  pillHalfW: number;
}): UnboxedTextPlacement {
  const {
    x,
    y,
    dotRadius,
    textMetrics,
    placement,
    layoutMode,
    node,
    collapsed,
    pillHalfW,
  } = params;
  const { lines, textHeight, lineHeight } = textMetrics;
  const gap = 7;
  const badgeHalf = collapsed ? pillHalfW : 6;
  const rightDotShoulderX = x + dotRadius + badgeHalf + 2;

  if (placement === 'below') {
    const firstLineCenterY = y + dotRadius + 6 + lineHeight / 2;
    return {
      textAlign: 'center',
      textX: x,
      firstLineCenterY,
      toggleX: rightDotShoulderX,
      toggleY: y,
    };
  }

  // 'beside' placement adapts cleanly to tree direction so branches never slice through text.
  const isRoot = node.parentId === null;
  const hasChildren = node.childCount > 0;
  const centerVerticalFirstY = y - ((lines.length - 1) * lineHeight) / 2;

  if (layoutMode === 'org-chart') {
    return {
      textAlign: 'left',
      textX: x + dotRadius + gap,
      firstLineCenterY: centerVerticalFirstY,
      toggleX: x - dotRadius - badgeHalf - 2,
      toggleY: y,
    };
  }

  if (layoutMode === 'timeline' && (isRoot || Math.abs(node.layoutLane ?? 0) <= 1)) {
    return {
      textAlign: 'left',
      textX: x + dotRadius + gap,
      firstLineCenterY: centerVerticalFirstY,
      toggleX: x + dotRadius + badgeHalf + 2,
      toggleY: y + dotRadius + 4,
    };
  }

  if (isRoot && hasChildren) {
    if (layoutMode === 'brace-map' || layoutMode === 'fishbone') {
      return {
        textAlign: 'right',
        textX: x - dotRadius - gap,
        firstLineCenterY: centerVerticalFirstY,
        toggleX: x + dotRadius + badgeHalf + 1,
        toggleY: y + dotRadius + 4,
      };
    }
    // Balanced or radial root: branches leave both left and right, so place root title cleanly above dot.
    return {
      textAlign: 'center',
      textX: x,
      firstLineCenterY: y - dotRadius - 8 - textHeight + lineHeight / 2,
      toggleX: x,
      toggleY: y + dotRadius + 7,
    };
  }

  // Balanced / radial / brace-map branches: outer side is opposite incoming parent branch.
  const outerDir: -1 | 1 = node.layoutSide === -1 ? -1 : 1;

  if (hasChildren) {
    // Intermediate hub has incoming link on one side and outgoing links on the outer side:
    // anchor on outer side just above the branch centerline so links never cut across letters,
    // and snap collapse toggle to the bottom-right shoulder of the dot.
    return {
      textAlign: outerDir === -1 ? 'right' : 'left',
      textX: x + outerDir * (dotRadius + 5),
      firstLineCenterY: y - dotRadius - 4 - textHeight + lineHeight / 2,
      toggleX: x + dotRadius + badgeHalf + 1,
      toggleY: y + dotRadius + 4,
    };
  }

  // Leaf node: outer side is completely clear of links, so align beside dot vertically centered.
  return {
    textAlign: outerDir === -1 ? 'right' : 'left',
    textX: x + outerDir * (dotRadius + gap),
    firstLineCenterY: centerVerticalFirstY,
    toggleX: rightDotShoulderX,
    toggleY: y,
  };
}

/** Computes layout-solver AABB dimensions for 'With Text' nodes so siblings never collide. */
export function computeUnboxedSolverMetric(
  node: Pick<RenderNode, 'depth' | 'parentId' | 'childCount'>,
  config: Pick<
    NodeConfig,
    'relSize' | 'sizeByDepth' | 'depthSizeInterval' | 'autoShapeByFormat' | 'formatMarkerStyle' | 'labelSize'
  >,
  label: string,
  placement: UnboxedResolvedPlacement,
): NodeMetric {
  const dotRadius = resolveNodeDotVisualRadius(node, config);
  const diameter = dotRadius * 2;
  const isRoot = node.parentId === null;
  const fontSize = (config.labelSize ?? CARD_FONT_SIZE) + (isRoot ? 2 : 0);
  const unboxed = measureUnboxedText(label, { fontSize, isRoot });

  if (placement === 'below') {
    return {
      width: Math.max(diameter + 16, Math.ceil(unboxed.textWidth + 16)),
      height: Math.max(diameter + 12, Math.ceil(dotRadius * 2 + 12 + unboxed.textHeight * 1.5)),
    };
  }

  const width = Math.max(diameter + 18, Math.ceil(unboxed.textWidth + dotRadius * 2 + 24));
  const needsVerticalLift = node.childCount > 0;
  const height = needsVerticalLift
    ? Math.max(diameter + 16, Math.ceil((dotRadius + 4 + unboxed.textHeight) * 2))
    : Math.max(diameter + 12, Math.ceil(unboxed.textHeight + 12));

  return { width, height };
}
