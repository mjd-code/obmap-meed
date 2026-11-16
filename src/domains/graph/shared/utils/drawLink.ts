/**
 * Layout-aware link rendering with XMind Tapered Bezier trunks, Underline topic continuation,
 * Dynamic Cross-Structure port routing, Precision Orthogonal Routing for Timeline/Org-Chart,
 * and Clean Straight links for Networks.
 */

import type {
  BranchLineStyle,
  LayoutMode,
  NodeMetric,
  RenderNode,
  TopicShape,
} from '@/domains/graph/shared/utils/graph.types';
import { traceRoundedRectPath } from '@/domains/graph/shared/utils/drawAttachments';
import { anchorOnCard } from '@/domains/graph/shared/utils/layoutMath';
import {
  cubicPoint,
  cubicTangent,
  type RoutedRelationshipGeometry,
} from '@/domains/graph/shared/utils/relationshipRouter';
import { cardFont } from '@/domains/graph/shared/utils/textLayout';
import { dim, type GraphTheme } from '@/domains/graph/shared/utils/theme';

export interface DrawLinkState {
  mode: LayoutMode;
  sourceMode?: LayoutMode;
  targetMode?: LayoutMode;
  branchLineStyle?: BranchLineStyle;
  taperedTrunk?: boolean;
  sourceTopicShape?: TopicShape;
  targetTopicShape?: TopicShape;
  linkType?: string;
  routedRelationship?: RoutedRelationshipGeometry;
  arrowMode?: 'forward' | 'both' | 'none';
  relationshipLabel?: string;
  theme: GraphTheme;
  color: string;
  width: number;
  opacity: number;
  dash: number[];
  dimmed: boolean;
  showArrow: boolean;
  arrowLength: number;
  arrowRelPos: number;
  curvature: number;
  curveRotation: number;
  particles: number;
  particleWidth: number;
  particleColor: string;
  particleProgress: number;
  zoom: number;
  preserveDetail: boolean;
  metricOf: (node: RenderNode) => NodeMetric;
  isAttachedToDragged?: boolean;
  boxed?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface LinkGeometry {
  trace: (ctx: CanvasRenderingContext2D) => void;
  pointAt: (t: number) => Point;
  tangentAt: (t: number) => number;
  cubicControlPoints?: { p0: Point; c1: Point; c2: Point; p3: Point };
}

// ==========================================
// PURE MATH & UTILITIES
// ==========================================

const isHorizontalMode = (mode: LayoutMode) =>
  mode === 'mindmap' || mode === 'brace-map' || mode === 'fishbone';

function resolveCardPort(
  center: Point,
  towards: Point,
  metric: NodeMetric,
  mode: LayoutMode,
  topicShape: TopicShape | undefined,
  boxed: boolean,
  role: 'source' | 'target',
): Point {
  const halfW = metric.width / 2;
  const halfH = metric.height / 2;
  const dirX = towards.x >= center.x ? 1 : -1;
  const dirY = towards.y >= center.y ? 1 : -1;

  if (boxed && topicShape === 'underline') {
    if (isHorizontalMode(mode)) {
      return { x: center.x + dirX * halfW, y: center.y + halfH };
    }
    // Vertical modes (org-chart / timeline): incoming from above enters top center so line never crosses text
    return { x: center.x, y: center.y + dirY * halfH };
  }

  if (mode === 'org-chart') {
    return { x: center.x, y: center.y + dirY * halfH };
  }

  if (mode === 'brace-map') {
    return { x: center.x + dirX * halfW, y: center.y };
  }

  if (mode === 'mindmap') {
    if (boxed) {
      return { x: center.x + dirX * halfW, y: center.y };
    }
    return anchorOnCard(center, metric, towards);
  }

  return anchorOnCard(center, metric, towards);
}

// ==========================================
// PRECISION TIMELINE & XMIND TREE ROUTING
// ==========================================

function createTimelineGeometry(
  source: RenderNode,
  target: RenderNode,
  metricOf: (node: RenderNode) => NodeMetric,
  boxed = false,
): LinkGeometry {
  const sx = source.x ?? 0;
  const sy = source.y ?? 0;
  const tx = target.x ?? 0;
  const ty = target.y ?? 0;

  const sMetric = metricOf(source);
  const tMetric = metricOf(target);

  const targetX = boxed ? tx - tMetric.width / 2 : tx;
  const targetY = ty;

  const isFromBaseline = Math.abs(sy) < 5;
  if (isFromBaseline) {
    const a: Point = { x: sx + (boxed ? sMetric.width / 2 : sMetric.width), y: sy };
    const b: Point = {
      x: tx,
      y: ty < sy ? ty + (boxed ? tMetric.height / 2 : 6) : ty - (boxed ? tMetric.height / 2 : 6),
    };
    return createElbowGeometry([a, { x: tx, y: a.y }, b], 8);
  }

  const isTrunkLink = Math.abs(tx - sx) <= 50;
  if (isTrunkLink) {
    const a: Point = {
      x: sx,
      y: sy < 0 ? sy - (boxed ? sMetric.height / 2 : 6) : sy + (boxed ? sMetric.height / 2 : 6),
    };
    const b: Point = { x: targetX, y: targetY };
    return createElbowGeometry([a, { x: sx, y: b.y }, b], 6);
  }

  const sourceRightX = boxed ? sx + sMetric.width / 2 : sx + sMetric.width + 4;
  const sourceY = sy;

  const dx = targetX - sourceRightX;
  const dy = targetY - sourceY;

  if (Math.abs(dy) < 3) {
    return createStraightGeometry({ x: sourceRightX, y: sourceY }, { x: targetX, y: targetY });
  }

  const k = 0.42;
  const c1 = { x: sourceRightX + dx * k, y: sourceY };
  const c2 = { x: targetX - dx * k, y: targetY };

  return createCubicGeometry({ x: sourceRightX, y: sourceY }, c1, c2, { x: targetX, y: targetY });
}

// ==========================================
// STANDARD & XMIND BRANCH GEOMETRIES
// ==========================================

function createCubicGeometry(p0: Point, c1: Point, c2: Point, p3: Point): LinkGeometry {
  return {
    trace: (ctx) => {
      ctx.moveTo(p0.x, p0.y);
      ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p3.x, p3.y);
    },
    pointAt: (t) => ({
      x: cubicPoint(p0.x, c1.x, c2.x, p3.x, t),
      y: cubicPoint(p0.y, c1.y, c2.y, p3.y, t),
    }),
    tangentAt: (t) =>
      Math.atan2(
        cubicTangent(p0.y, c1.y, c2.y, p3.y, t),
        cubicTangent(p0.x, c1.x, c2.x, p3.x, t),
      ),
    cubicControlPoints: { p0, c1, c2, p3 },
  };
}

function createStraightGeometry(start: Point, end: Point): LinkGeometry {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return {
    trace: (ctx) => {
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
    },
    pointAt: (t) => ({ x: start.x + dx * t, y: start.y + dy * t }),
    tangentAt: () => Math.atan2(dy, dx),
  };
}

function createMindmapBezierGeometry(
  start: Point,
  end: Point,
  curvature: number,
  curveRotation: number,
): LinkGeometry {
  const dx = end.x - start.x;
  const k = 0.28 + curvature * 0.55;
  const bend = Math.sin(curveRotation) * Math.abs(dx) * curvature * 0.35;
  const c1 = { x: start.x + k * dx, y: start.y + bend };
  const c2 = { x: end.x - k * dx, y: end.y + bend };
  return createCubicGeometry(start, c1, c2, end);
}

function createBraceBracketGeometry(start: Point, end: Point): LinkGeometry {
  const midX = (start.x + end.x) / 2;
  const c1 = { x: midX, y: start.y };
  const c2 = { x: midX, y: end.y };
  return createCubicGeometry(start, c1, c2, end);
}

function createCrossStructureGeometry(
  start: Point,
  end: Point,
  sourceMode: LayoutMode,
  targetMode: LayoutMode,
): LinkGeometry {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const sHorizontal = isHorizontalMode(sourceMode);
  const tHorizontal = isHorizontalMode(targetMode);

  const c1: Point = sHorizontal
    ? { x: start.x + dx * 0.45, y: start.y }
    : { x: start.x, y: start.y + dy * 0.45 };
  const c2: Point = tHorizontal
    ? { x: end.x - dx * 0.45, y: end.y }
    : { x: end.x, y: end.y - dy * 0.45 };

  return createCubicGeometry(start, c1, c2, end);
}

function createElbowGeometry(points: Point[], cornerRadius = 6): LinkGeometry {
  const lastIndex = points.length - 1;
  const a = points[lastIndex - 1];
  const b = points[lastIndex];
  return {
    trace: (ctx) => {
      ctx.moveTo(points[0].x, points[0].y);
      if (cornerRadius <= 0) {
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        return;
      }
      for (let i = 1; i < lastIndex; i++) {
        ctx.arcTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, cornerRadius);
      }
      ctx.lineTo(points[lastIndex].x, points[lastIndex].y);
    },
    pointAt: (t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }),
    tangentAt: () => Math.atan2(b.y - a.y, b.x - a.x),
  };
}

/**
 * Draws an organic tapered Bezier trunk ribbon thick at `p0` and tapering smoothly to `p3`.
 */
export function drawTaperedBezierTrunk(
  ctx: CanvasRenderingContext2D,
  p0: Point,
  c1: Point,
  c2: Point,
  p3: Point,
  startWidth: number,
  endWidth: number,
  color: string,
  steps = 18,
): void {
  const leftSide: Point[] = [];
  const rightSide: Point[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = cubicPoint(p0.x, c1.x, c2.x, p3.x, t);
    const y = cubicPoint(p0.y, c1.y, c2.y, p3.y, t);
    const tx = cubicTangent(p0.x, c1.x, c2.x, p3.x, t);
    const ty = cubicTangent(p0.y, c1.y, c2.y, p3.y, t);
    const len = Math.hypot(tx, ty) || 1;
    const nx = -ty / len;
    const ny = tx / len;

    // Smooth ease-out taper from root/parent to child
    const taper = (1 - t) * (1 - t * 0.25);
    const halfW = (endWidth + (startWidth - endWidth) * taper) / 2;

    leftSide.push({ x: x + nx * halfW, y: y + ny * halfW });
    rightSide.push({ x: x - nx * halfW, y: y - ny * halfW });
  }

  ctx.beginPath();
  ctx.moveTo(leftSide[0].x, leftSide[0].y);
  for (let i = 1; i < leftSide.length; i++) {
    ctx.lineTo(leftSide[i].x, leftSide[i].y);
  }
  for (let i = rightSide.length - 1; i >= 0; i--) {
    ctx.lineTo(rightSide[i].x, rightSide[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// ==========================================
// MAIN LINK RENDERER
// ==========================================

export function drawLink(
  ctx: CanvasRenderingContext2D,
  source: RenderNode,
  target: RenderNode,
  state: DrawLinkState,
): void {
  const sx = source.x ?? 0;
  const sy = source.y ?? 0;
  const tx = target.x ?? 0;
  const ty = target.y ?? 0;
  if (![sx, sy, tx, ty].every(Number.isFinite)) return;

  ctx.save();
  ctx.setLineDash(state.dash);
  ctx.lineCap = 'round';

  const configuredWidth = Math.max(0.4, state.width - source.depth * 0.15);
  const scaleAdjustedWidth = state.preserveDetail
    ? configuredWidth / Math.max(0.05, state.zoom)
    : configuredWidth;
  ctx.lineWidth = scaleAdjustedWidth;

  const linkOpacity = state.isAttachedToDragged ? 0.35 : state.dimmed ? 0.08 : state.opacity;
  const resolvedStroke = dim(state.color, linkOpacity);
  ctx.strokeStyle = resolvedStroke;

  const boxed = state.boxed ?? true;
  const sourceMode = state.sourceMode ?? state.mode;
  const targetMode = state.targetMode ?? state.mode;
  const effectiveMode = state.targetMode ?? state.mode;
  const sMetric = state.metricOf(source);
  const tMetric = state.metricOf(target);

  let geometry: LinkGeometry;

  if (state.routedRelationship) {
    const r = state.routedRelationship;
    geometry = createCubicGeometry(r.p0, r.c1, r.c2, r.p3);
  } else if (sourceMode !== targetMode) {
    // Dynamic Cross-Structure Boundary Anchor Routing
    const start = resolveCardPort(
      { x: sx, y: sy },
      { x: tx, y: ty },
      sMetric,
      sourceMode,
      state.sourceTopicShape ?? source.topicShape,
      boxed,
      'source',
    );
    const end = resolveCardPort(
      { x: tx, y: ty },
      { x: sx, y: sy },
      tMetric,
      targetMode,
      state.targetTopicShape ?? target.topicShape,
      boxed,
      'target',
    );
    geometry = createCrossStructureGeometry(start, end, sourceMode, targetMode);
  } else if (effectiveMode === 'timeline') {
    geometry = createTimelineGeometry(source, target, state.metricOf, boxed);
  } else if (effectiveMode === 'org-chart') {
    const top = sy <= ty;
    const a = { x: sx, y: sy + (top ? 1 : -1) * (sMetric.height / 2) };
    const b = { x: tx, y: ty - (top ? 1 : -1) * (tMetric.height / 2) };
    const midY = (a.y + b.y) / 2;
    const radius = state.branchLineStyle === 'orthogonal' ? 0 : 6;
    geometry = createElbowGeometry([a, { x: a.x, y: midY }, { x: b.x, y: midY }, b], radius);
  } else if (effectiveMode === 'brace-map') {
    const start = resolveCardPort(
      { x: sx, y: sy },
      { x: tx, y: ty },
      sMetric,
      'brace-map',
      state.sourceTopicShape ?? source.topicShape,
      boxed,
      'source',
    );
    const end = resolveCardPort(
      { x: tx, y: ty },
      { x: sx, y: sy },
      tMetric,
      'brace-map',
      state.targetTopicShape ?? target.topicShape,
      boxed,
      'target',
    );
    if (state.branchLineStyle === 'brace-bracket') {
      geometry = createBraceBracketGeometry(start, end);
    } else {
      const midX = (start.x + end.x) / 2;
      geometry = createElbowGeometry(
        [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end],
        state.branchLineStyle === 'orthogonal' ? 0 : 6,
      );
    }
  } else if (effectiveMode === 'mindmap') {
    const start = resolveCardPort(
      { x: sx, y: sy },
      { x: tx, y: ty },
      sMetric,
      'mindmap',
      state.sourceTopicShape ?? source.topicShape,
      boxed,
      'source',
    );
    const end = resolveCardPort(
      { x: tx, y: ty },
      { x: sx, y: sy },
      tMetric,
      'mindmap',
      state.targetTopicShape ?? target.topicShape,
      boxed,
      'target',
    );

    if (state.branchLineStyle === 'straight') {
      geometry = createStraightGeometry(start, end);
    } else if (state.branchLineStyle === 'rounded-elbow' || state.branchLineStyle === 'orthogonal') {
      const midX = (start.x + end.x) / 2;
      geometry = createElbowGeometry(
        [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end],
        state.branchLineStyle === 'orthogonal' ? 0 : 7,
      );
    } else if (state.branchLineStyle === 'brace-bracket') {
      geometry = createBraceBracketGeometry(start, end);
    } else {
      geometry = createMindmapBezierGeometry(start, end, state.curvature, state.curveRotation);
    }
  } else {
    const start = anchorOnCard({ x: sx, y: sy }, sMetric, { x: tx, y: ty });
    const end = anchorOnCard({ x: tx, y: ty }, tMetric, { x: sx, y: sy });
    geometry = createStraightGeometry(start, end);
  }

  const useTaperedTrunk =
    state.dash.length === 0 &&
    Boolean(geometry.cubicControlPoints) &&
    (state.branchLineStyle === 'tapered-bezier' ||
      (state.taperedTrunk !== false &&
        effectiveMode === 'mindmap' &&
        (state.linkType ?? 'hierarchy') === 'hierarchy' &&
        source.depth <= 1));

  if (useTaperedTrunk && geometry.cubicControlPoints) {
    const { p0, c1, c2, p3 } = geometry.cubicControlPoints;
    const startW = Math.max(scaleAdjustedWidth * 2.2, source.depth === 0 ? 8 : 5);
    const endW = Math.max(1.2, scaleAdjustedWidth * 0.9);
    drawTaperedBezierTrunk(ctx, p0, c1, c2, p3, startW, endW, resolvedStroke);
  } else {
    ctx.beginPath();
    geometry.trace(ctx);
    ctx.stroke();
  }

  // Relasi Panah
  const effectiveArrowLen =
    state.arrowLength > 0 ? state.arrowLength : state.routedRelationship ? 7 : 0;
  if (
    (state.showArrow || state.arrowMode === 'forward' || state.arrowMode === 'both') &&
    state.arrowMode !== 'none' &&
    effectiveArrowLen > 0 &&
    !state.dimmed
  ) {
    const len = state.preserveDetail
      ? effectiveArrowLen / Math.max(0.05, state.zoom)
      : effectiveArrowLen;
    const arrowT = Math.max(0.05, Math.min(1, state.arrowRelPos));
    const tip = geometry.pointAt(arrowT);
    const tangent = geometry.tangentAt(arrowT);

    ctx.setLineDash([]);
    ctx.fillStyle = dim(state.color, state.opacity);
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(tip.x - len * Math.cos(tangent - Math.PI / 7), tip.y - len * Math.sin(tangent - Math.PI / 7));
    ctx.lineTo(tip.x - len * Math.cos(tangent + Math.PI / 7), tip.y - len * Math.sin(tangent + Math.PI / 7));
    ctx.closePath();
    ctx.fill();

    if (state.arrowMode === 'both') {
      const revTip = geometry.pointAt(0);
      const revTangent = geometry.tangentAt(0) + Math.PI;
      ctx.beginPath();
      ctx.moveTo(revTip.x, revTip.y);
      ctx.lineTo(
        revTip.x - len * Math.cos(revTangent - Math.PI / 7),
        revTip.y - len * Math.sin(revTangent - Math.PI / 7),
      );
      ctx.lineTo(
        revTip.x - len * Math.cos(revTangent + Math.PI / 7),
        revTip.y - len * Math.sin(revTangent + Math.PI / 7),
      );
      ctx.closePath();
      ctx.fill();
    }
  }

  // Label relasi tengah kurva
  if (state.relationshipLabel?.trim() && !state.dimmed) {
    const label = state.relationshipLabel.trim();
    const mid = geometry.pointAt(0.5);
    ctx.save();
    ctx.setLineDash([]);
    ctx.font = cardFont(10, '500');
    const textW = ctx.measureText(label).width;
    const padX = 6;
    const pillW = textW + padX * 2;
    const pillH = 16;
    traceRoundedRectPath(ctx, mid.x - pillW / 2, mid.y - pillH / 2, pillW, pillH, 8);
    ctx.fillStyle = state.theme.labelBackground || 'rgba(15, 23, 42, 0.85)';
    ctx.fill();
    ctx.strokeStyle = dim(state.color, Math.min(1, state.opacity * 0.9));
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = state.theme.label;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, mid.x, mid.y);
    ctx.restore();
  }

  // Flow Particles
  if (state.particles > 0 && !state.dimmed) {
    ctx.setLineDash([]);
    const baseRadius = state.preserveDetail ? state.particleWidth / Math.max(0.05, state.zoom) / 2 : state.particleWidth / 2;
    const particleRadius = Math.max(0.85, baseRadius);

    for (let index = 0; index < state.particles; index += 1) {
      const t = (state.particleProgress + index / state.particles) % 1;
      const point = geometry.pointAt(t);

      for (let s = 1; s <= 3; s++) {
        const trailT = (t - s * 0.02 + 1) % 1;
        const trailPoint = geometry.pointAt(trailT);
        ctx.fillStyle = dim(state.particleColor, (1 - s / 4) * 0.35 * state.opacity);
        ctx.beginPath();
        ctx.arc(trailPoint.x, trailPoint.y, Math.max(0.5, particleRadius * (1 - s * 0.2)), 0, Math.PI * 2);
        ctx.fill();
      }

      const glowOuter = particleRadius * 2.8;
      const grad = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, glowOuter);
      grad.addColorStop(0, dim(state.particleColor, 0.95 * state.opacity));
      grad.addColorStop(0.4, dim(state.particleColor, 0.4 * state.opacity));
      grad.addColorStop(1, dim(state.particleColor, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(point.x, point.y, glowOuter, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(point.x, point.y, particleRadius * 0.65, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
