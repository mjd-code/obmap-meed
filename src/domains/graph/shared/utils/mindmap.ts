/**
 * Deterministic balanced / radial mindmap layout.
 * Inspired by XMind layout engine: strict non-overlapping branches,
 * card-metric aware vertical distribution, and balanced left/right branching.
 */

import { subtreeWeights } from '@/domains/graph/shared/utils/buildGraphProjection';
import type { LayoutContext, LayoutGeometry, NodeTarget } from '@/domains/graph/shared/utils/graph.types';
import { boundsOf } from '@/domains/graph/shared/utils/layoutMath';

export interface MindmapInput {
  ids: string[];
  roots: string[];
  childrenOf: (id: string) => string[];
  context: LayoutContext;
}

export function mindmapLayout({ ids, roots, childrenOf, context }: MindmapInput): LayoutGeometry {
  const targets = new Map<string, NodeTarget>();
  if (ids.length === 0) {
    return { mode: 'mindmap', targets, bounds: boundsOf(targets), decorations: [] };
  }

  const visible = new Set(ids);
  const children = (id: string) => childrenOf(id).filter((child) => visible.has(child));
  const visibleRoots = roots.filter((id) => visible.has(id));
  const weights = subtreeWeights(visibleRoots, children);

  const metric = (id: string) =>
    context.nodeMetrics.get(id) ?? { width: 140, height: 38 };

  if (context.orientation === 'radial') {
    layoutRadial(visibleRoots, children, weights, context, targets, metric);
  } else {
    layoutBalanced(visibleRoots, children, weights, context, targets, metric);
  }

  return {
    mode: 'mindmap',
    targets,
    bounds: boundsOf(targets, context.nodeMetrics),
    decorations: [],
  };
}

function layoutBalanced(
  roots: string[],
  children: (id: string) => string[],
  weights: Map<string, number>,
  context: LayoutContext,
  targets: Map<string, NodeTarget>,
  metric: (id: string) => { width: number; height: number }
) {
  // Sibling gap & level gap aman untuk mencegah overlap teks atau link
  const siblingGap = Math.max(context.siblingGap, 28);
  const levelGap = Math.max(context.levelGap, 56);

  /**
   * Vertical span of a subtree, honoring real card heights and intra-sibling gaps.
   */
  const spanCache = new Map<string, number>();
  const guard = new Set<string>();

  const spanOf = (id: string): number => {
    const cached = spanCache.get(id);
    if (cached !== undefined) return cached;
    if (guard.has(id)) return metric(id).height + siblingGap;
    guard.add(id);

    const own = metric(id).height + siblingGap;
    const kids = children(id);
    if (kids.length === 0) {
      spanCache.set(id, own);
      return own;
    }

    const totalKidsSpan = kids.reduce((sum, kid) => sum + spanOf(kid), 0);
    const span = Math.max(own, totalKidsSpan);
    spanCache.set(id, span);
    return span;
  };

  /**
   * Places a recursive branch either to the left (-1) or to the right (+1)
   */
  const placeBranch = (
    id: string,
    side: -1 | 1,
    parentX: number,
    parentWidth: number,
    top: number
  ) => {
    const span = spanOf(id);
    const ownMetric = metric(id);
    const centerY = top + span / 2;

    // Jarak horizontal dihitung dari tepi card parent ke tepi card child + levelGap
    const x = parentX + side * (parentWidth / 2 + levelGap + ownMetric.width / 2);
    targets.set(id, { x, y: centerY, side });

    const kids = children(id);
    const totalKidsSpan = kids.reduce((sum, kid) => sum + spanOf(kid), 0);
    // Pusatkan gugusan anak di dalam amplop vertikal span agar induk tidak pernah meluber keluar
    let cursor = top + Math.max(0, (span - totalKidsSpan) / 2);
    for (const kid of kids) {
      placeBranch(kid, side, x, ownMetric.width, cursor);
      cursor += spanOf(kid);
    }

    if (kids.length > 0) {
      // Re-center parent vertikal, dijaga tetap di dalam batas aman amplop [top, top + span]
      const first = targets.get(kids[0])!;
      const last = targets.get(kids[kids.length - 1])!;
      const minSafeY = top + (ownMetric.height + siblingGap) / 2;
      const maxSafeY = top + span - (ownMetric.height + siblingGap) / 2;
      const midY = (first.y + last.y) / 2;
      const clampedY = Math.min(maxSafeY, Math.max(minSafeY, midY));
      targets.set(id, { x, y: clampedY, side });
    }
  };

  let prevRootBottom = 0;
  roots.forEach((root, rootIndex) => {
    const rootMetric = metric(root);
    const kids = children(root);

    // Keseimbangan greedy kiri/kanan berdasarkan bobot subtree
    let leftWeight = 0;
    let rightWeight = 0;
    const left: string[] = [];
    const right: string[] = [];

    for (const kid of kids) {
      const weight = weights.get(kid) ?? 1;
      if (rightWeight <= leftWeight) {
        right.push(kid);
        rightWeight += weight;
      } else {
        left.push(kid);
        leftWeight += weight;
      }
    }

    const rightTotal = right.reduce((sum, id) => sum + spanOf(id), 0);
    const leftTotal = left.reduce((sum, id) => sum + spanOf(id), 0);
    const rootSpan = Math.max(spanOf(root), rightTotal, leftTotal);
    const rootCenterY = rootIndex === 0 ? 0 : prevRootBottom + rootSpan / 2 + siblingGap * 2;
    targets.set(root, { x: 0, y: rootCenterY, side: 0 });

    // Tempatkan cabang kanan (side = 1) dan cabang kiri (side = -1)
    for (const [side, group] of [
      [1, right],
      [-1, left],
    ] as const) {
      const totalSpan = group.reduce((sum, id) => sum + spanOf(id), 0);
      let cursor = rootCenterY - totalSpan / 2;

      for (const id of group) {
        placeBranch(id, side, 0, rootMetric.width, cursor);
        cursor += spanOf(id);
      }
    }

    prevRootBottom = rootCenterY + rootSpan / 2;
  });
}

function layoutRadial(
  roots: string[],
  children: (id: string) => string[],
  _weights: Map<string, number>,
  context: LayoutContext,
  targets: Map<string, NodeTarget>,
  metric: (id: string) => { width: number; height: number }
) {
  const baseRadius = Math.max(80, context.levelGap);
  const siblingGap = Math.max(context.siblingGap, 24);

  const diagOf = (id: string): number => {
    const m = metric(id);
    return Math.hypot(m.width, m.height);
  };

  let nextRootX = 0;
  for (const root of roots) {
    // 1. Hitung bobot angular berbasis metrik kartu secara bottom-up
    const arcCache = new Map<string, number>();
    const visitedWeight = new Set<string>();
    const arcWeight = (id: string): number => {
      const cached = arcCache.get(id);
      if (cached !== undefined) return cached;
      if (visitedWeight.has(id)) return diagOf(id) + siblingGap;
      visitedWeight.add(id);

      const ownArc = diagOf(id) + siblingGap;
      const kids = children(id);
      if (kids.length === 0) {
        arcCache.set(id, ownArc);
        return ownArc;
      }
      const kidsArc = kids.reduce((sum, k) => sum + arcWeight(k), 0);
      const val = Math.max(ownArc, kidsArc);
      arcCache.set(id, val);
      return val;
    };

    // 2. Tetapkan sudut tiap node per kedalaman
    const depthAngles = new Map<number, Array<{ id: string; angle: number }>>();
    const assigned = new Set<string>();
    const assignAngles = (id: string, from: number, to: number, depth: number) => {
      if (assigned.has(id)) return;
      assigned.add(id);
      const angle = (from + to) / 2;
      const bucket = depthAngles.get(depth) ?? [];
      bucket.push({ id, angle });
      depthAngles.set(depth, bucket);

      const kids = children(id);
      if (!kids.length) return;
      const total = kids.reduce((sum, kid) => sum + arcWeight(kid), 0) || 1;
      let cursor = from;
      for (const kid of kids) {
        const slice = ((to - from) * arcWeight(kid)) / total;
        assignAngles(kid, cursor, cursor + slice, depth + 1);
        cursor += slice;
      }
    };

    assigned.add(root);
    depthAngles.set(0, [{ id: root, angle: 0 }]);
    const rootKids = children(root);
    const rootTotal = rootKids.reduce((sum, kid) => sum + arcWeight(kid), 0) || 1;
    let rootCursor = -Math.PI;
    for (const kid of rootKids) {
      const slice = (2 * Math.PI * arcWeight(kid)) / rootTotal;
      assignAngles(kid, rootCursor, rootCursor + slice, 1);
      rootCursor += slice;
    }

    // 3. Hitung radius seragam tiap cincin kedalaman yang bebas tumpang-tindih keliling & radial
    const maxDepth = Math.max(0, ...depthAngles.keys());
    const ringRadii: number[] = [0];
    let prevMaxDiag = diagOf(root);

    for (let d = 1; d <= maxDepth; d += 1) {
      const ringNodes = (depthAngles.get(d) ?? []).sort((a, b) => a.angle - b.angle);
      const ringMaxDiag = ringNodes.reduce((mx, item) => Math.max(mx, diagOf(item.id)), 40);
      const radialFromPrev = ringRadii[d - 1] + (prevMaxDiag + ringMaxDiag) / 2 + baseRadius * 0.45;
      let r = Math.max(d * baseRadius, radialFromPrev);

      if (ringNodes.length > 1) {
        const sumArc = ringNodes.reduce((sum, item) => sum + diagOf(item.id) + siblingGap, 0);
        r = Math.max(r, sumArc / (2 * Math.PI));

        // Pastikan jarak tali busur setiap pasangan bertetangga memenuhi jumlah setengah diagonal + gap
        for (let i = 0; i < ringNodes.length; i += 1) {
          const cur = ringNodes[i];
          const nxt = ringNodes[(i + 1) % ringNodes.length];
          let delta = nxt.angle - cur.angle;
          if (i === ringNodes.length - 1) delta += 2 * Math.PI;
          const reqChord = (diagOf(cur.id) + diagOf(nxt.id)) / 2 + siblingGap;
          const sinHalf = Math.sin(Math.min(Math.PI * 0.99, Math.max(0.01, delta / 2)));
          if (sinHalf > 1e-4) {
            r = Math.max(r, reqChord / (2 * sinHalf));
          }
        }
      }

      ringRadii[d] = r;
      prevMaxDiag = ringMaxDiag;
    }

    const treeOuterRadius = (ringRadii[maxDepth] ?? 0) + prevMaxDiag / 2;
    const cx = nextRootX === 0 ? 0 : nextRootX + treeOuterRadius + baseRadius;

    targets.set(root, { x: cx, y: 0, angle: 0, side: 0 });
    for (let d = 1; d <= maxDepth; d += 1) {
      const r = ringRadii[d];
      for (const { id, angle } of depthAngles.get(d) ?? []) {
        const side = Math.cos(angle) >= 0 ? 1 : -1;
        targets.set(id, {
          x: cx + r * Math.cos(angle),
          y: r * Math.sin(angle),
          angle,
          side,
        });
      }
    }

    nextRootX = cx + treeOuterRadius;
  }
}