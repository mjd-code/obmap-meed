/** Layout-aware link rendering: XMind silk bezier branches, timeline arches, fishbone ribs. */

import type { LayoutMode, NodeMetric, RenderNode } from '../model/graphTypes';
import { dim, type GraphTheme } from './theme';

export interface DrawLinkState {
  mode: LayoutMode;
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
}

const cubicPoint = (p0: number, p1: number, p2: number, p3: number, t: number) => {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
};

const cubicTangent = (p0: number, p1: number, p2: number, p3: number, t: number) => {
  const u = 1 - t;
  return 3 * u * u * (p1 - p0) + 6 * u * t * (p2 - p1) + 3 * t * t * (p3 - p2);
};

export function drawLink(
  ctx: CanvasRenderingContext2D,
  source: RenderNode,
  target: RenderNode,
  state: DrawLinkState
) {
  const sx = source.x ?? 0;
  const sy = source.y ?? 0;
  const tx = target.x ?? 0;
  const ty = target.y ?? 0;
  if (![sx, sy, tx, ty].every(Number.isFinite)) return;

  const sMetric = state.metricOf(source);
  const tMetric = state.metricOf(target);
  const sHalfW = sMetric.width / 2;
  const tHalfW = tMetric.width / 2;
  const sHalfH = sMetric.height / 2;
  const tHalfH = tMetric.height / 2;

  // Tentukan orientasi relasi (apakah target di sebelah kanan atau kiri induk)
  const isTargetRight = tx >= sx;

  // Titik jangkar lateral bersih ala XMind (keluar dari pinggir samping kartu, bukan dari atas/bawah)
  let start = {
    x: isTargetRight ? sx + sHalfW : sx - sHalfW,
    y: sy,
  };
  let end = {
    x: isTargetRight ? tx - tHalfW : tx + tHalfW,
    y: ty,
  };

  // Khusus layout vertikal seperti org-chart: jangkar atas-bawah
  if (state.mode === 'org-chart') {
    const isTargetBelow = ty >= sy;
    start = { x: sx, y: isTargetBelow ? sy + sHalfH : sy - sHalfH };
    end = { x: tx, y: isTargetBelow ? ty - tHalfH : ty + tHalfH };
  }

  ctx.save();
  ctx.setLineDash(state.dash);
  const configuredWidth = Math.max(0.4, state.width - source.depth * 0.15);
  ctx.lineWidth = state.preserveDetail
    ? configuredWidth / Math.max(0.05, state.zoom)
    : configuredWidth;

  const linkOpacity = state.isAttachedToDragged
    ? 0.35
    : state.dimmed
    ? 0.08
    : state.opacity;

  ctx.strokeStyle = dim(state.color, linkOpacity);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);

  let c1 = start;
  let c2 = end;
  let isCurved = false;

  if (state.mode === 'mindmap' || state.mode === 'brace-map') {
    // ---- XMIND SIGNATURE S-CURVE ENGINE ----
    // Kurva Bézier halus dengan titik kontrol horizontal di tengah span
    isCurved = true;
    const dx = end.x - start.x;
    const midX = start.x + dx * 0.52;

    c1 = { x: midX, y: start.y };
    c2 = { x: midX, y: end.y };
    ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);
  } else if (state.mode === 'org-chart') {
    // Orthogonal vertikal rapi dengan radius sudut membulat
    const midY = (start.y + end.y) / 2;
    const radius = Math.min(12, Math.abs(start.x - end.x) / 2, Math.abs(start.y - end.y) / 2);
    ctx.lineTo(start.x, midY - (end.y >= start.y ? radius : -radius));
    ctx.arcTo(start.x, midY, end.x, midY, radius);
    ctx.arcTo(end.x, midY, end.x, end.y, radius);
    ctx.lineTo(end.x, end.y);
  } else if (state.mode === 'timeline') {
    isCurved = true;
    const side = Math.sign(end.y || start.y || 1);
    const bend = Math.max(16, Math.min(80, Math.abs(end.y - start.y) * 0.45));
    const midY = start.y + side * bend;
    c1 = { x: start.x, y: midY };
    c2 = { x: end.x, y: midY };
    ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);
  } else {
    // Graph view modes (free-force, fr-standard, fr-radial, kamada-kawai, grid)
    if (state.curvature > 0) {
      isCurved = true;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const dist = Math.hypot(dx, dy);
      const nx = -dy / (dist || 1);
      const ny = dx / (dist || 1);
      const offset = dist * state.curvature * 0.25;
      c1 = { x: (start.x + end.x) / 2 + nx * offset, y: (start.y + end.y) / 2 + ny * offset };
      c2 = c1;
      ctx.quadraticCurveTo(c1.x, c1.y, end.x, end.y);
    } else {
      ctx.lineTo(end.x, end.y);
    }
  }

  ctx.stroke();

  // Titik interpolasi partikel / panah
  const pointAt = (t: number) =>
    isCurved
      ? { x: cubicPoint(start.x, c1.x, c2.x, end.x, t), y: cubicPoint(start.y, c1.y, c2.y, end.y, t) }
      : { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };

  const tangentAt = (t: number) =>
    isCurved
      ? Math.atan2(cubicTangent(start.y, c1.y, c2.y, end.y, t), cubicTangent(start.x, c1.x, c2.x, end.x, t))
      : Math.atan2(end.y - start.y, end.x - start.x);

  // Render Arrow
  if (state.showArrow && state.arrowLength > 0 && !state.dimmed) {
    const len = state.preserveDetail
      ? state.arrowLength / Math.max(0.05, state.zoom)
      : state.arrowLength;
    const arrowT = Math.max(0.05, Math.min(1, state.arrowRelPos));
    const tip = pointAt(arrowT);
    const tangent = tangentAt(arrowT);
    ctx.setLineDash([]);
    ctx.fillStyle = dim(state.color, state.opacity);
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(
      tip.x - len * Math.cos(tangent - Math.PI / 7),
      tip.y - len * Math.sin(tangent - Math.PI / 7)
    );
    ctx.lineTo(
      tip.x - len * Math.cos(tangent + Math.PI / 7),
      tip.y - len * Math.sin(tangent + Math.PI / 7)
    );
    ctx.closePath();
    ctx.fill();
  }

  // Render Particles
  if (state.particles > 0 && !state.dimmed) {
    ctx.setLineDash([]);
    ctx.fillStyle = dim(state.particleColor, state.opacity);
    for (let index = 0; index < state.particles; index += 1) {
      const t = (state.particleProgress + index / state.particles) % 1;
      const point = pointAt(t);
      ctx.beginPath();
      const particleRadius = state.preserveDetail
        ? state.particleWidth / Math.max(0.05, state.zoom) / 2
        : state.particleWidth / 2;
      ctx.arc(point.x, point.y, Math.max(0.75, particleRadius), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}