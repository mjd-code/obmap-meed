/** Deterministic balanced / radial mindmap layout. */

import { subtreeWeights } from '../model/buildGraphProjection';
import type { LayoutContext, LayoutGeometry, NodeTarget } from '../model/graphTypes';
import { boundsOf } from './layoutMath';

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
    context.nodeMetrics.get(id) ?? { width: 120, height: 36 };

  if (context.orientation === 'radial') {
    layoutRadial(visibleRoots, children, weights, context, targets);
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
  const { levelGap, siblingGap } = context;
  const safeSiblingGap = Math.max(siblingGap, 28);
  const safeLevelGap = Math.max(levelGap, 80);

  /** Kalkulasi vertical span anti-overlap dengan gap antar child */
  const spanCache = new Map<string, number>();
  const spanOf = (id: string): number => {
    const cached = spanCache.get(id);
    if (cached !== undefined) return cached;

    const own = metric(id).height + safeSiblingGap;
    const kids = children(id);
    if (!kids.length) {
      spanCache.set(id, own);
      return own;
    }

    const kidsTotal = kids.reduce((sum, kid) => sum + spanOf(kid), 0);
    const span = Math.max(own, kidsTotal);
    spanCache.set(id, span);
    return span;
  };

  const placeBranch = (
    id: string,
    side: -1 | 1,
    parentX: number,
    parentHalfWidth: number,
    top: number
  ) => {
    const span = spanOf(id);
    const centerY = top + span / 2;
    const currentHalfWidth = metric(id).width / 2;

    // Perhitungan X Presisi: parentX + sisi * (lebar_induk/2 + safeLevelGap + lebar_anak/2)
    const x = parentX + side * (parentHalfWidth + safeLevelGap + currentHalfWidth);
    targets.set(id, { x, y: centerY, side });

    let cursor = top;
    const kids = children(id);
    for (const kid of kids) {
      placeBranch(kid, side, x, currentHalfWidth, cursor);
      cursor += spanOf(kid);
    }

    if (kids.length) {
      // Pusatkan kembali induk secara vertikal di tengah-tengah anak-anaknya
      const firstY = targets.get(kids[0])!.y;
      const lastY = targets.get(kids[kids.length - 1])!.y;
      targets.set(id, { x, y: (firstY + lastY) / 2, side });
    }
  };

  let rootOffsetY = 0;
  for (const root of roots) {
    targets.set(root, { x: 0, y: rootOffsetY, side: 0 });
    const rootHalfWidth = metric(root).width / 2;
    const kids = children(root);

    // Keseimbangan sisi kiri dan kanan (XMind Greedy Balance)
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

    for (const [side, group] of [
      [1, right],
      [-1, left],
    ] as const) {
      const total = group.reduce((sum, id) => sum + spanOf(id), 0);
      let cursor = rootOffsetY - total / 2;
      for (const id of group) {
        placeBranch(id, side, 0, rootHalfWidth, cursor);
        cursor += spanOf(id);
      }
    }

    const rootSpan = Math.max(
      spanOf(root),
      ...group_spans(right, spanOf),
      ...group_spans(left, spanOf)
    );
    rootOffsetY += rootSpan + safeSiblingGap * 3;
  }
}


const group_spans = (ids: string[], spanOf: (id: string) => number) =>
  ids.length ? [ids.reduce((sum, id) => sum + spanOf(id), 0)] : [0];

function layoutRadial(
  roots: string[],
  children: (id: string) => string[],
  weights: Map<string, number>,
  context: LayoutContext,
  targets: Map<string, NodeTarget>
) {
  const radius = Math.max(60, context.levelGap);
  roots.forEach((root, rootIndex) => {
    const cx = rootIndex * radius * 8;
    targets.set(root, { x: cx, y: 0, angle: 0 });

    const place = (id: string, from: number, to: number, depth: number) => {
      const angle = (from + to) / 2;
      const r = depth * radius;
      targets.set(id, { x: cx + r * Math.cos(angle), y: r * Math.sin(angle), angle });
      const kids = children(id);
      if (!kids.length) return;
      const total = kids.reduce((sum, kid) => sum + (weights.get(kid) ?? 1), 0) || 1;
      let cursor = from;
      for (const kid of kids) {
        const slice = ((to - from) * (weights.get(kid) ?? 1)) / total;
        place(kid, cursor, cursor + slice, depth + 1);
        cursor += slice;
      }
    };

    const kids = children(root);
    const total = kids.reduce((sum, kid) => sum + (weights.get(kid) ?? 1), 0) || 1;
    let cursor = -Math.PI;
    for (const kid of kids) {
      const slice = (2 * Math.PI * (weights.get(kid) ?? 1)) / total;
      place(kid, cursor, cursor + slice, 1);
      cursor += slice;
    }
  });
}
