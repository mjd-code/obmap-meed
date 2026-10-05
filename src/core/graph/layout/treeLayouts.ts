/**
 * Tidy tree layouts for Mindmap mode: Org Chart (top-down) and
 * Brace Map / Logic Chart (left-to-right). Card-size aware and deterministic.
 */

import type { LayoutContext, LayoutGeometry, LayoutMode, NodeTarget } from '../model/graphTypes';
import { boundsOf } from './layoutMath';

export interface TreeInput {
  ids: string[];
  roots: string[];
  childrenOf: (id: string) => string[];
  context: LayoutContext;
}

type Direction = 'down' | 'right';

function tidyTree({ ids, roots, childrenOf, context }: TreeInput, direction: Direction, mode: LayoutMode): LayoutGeometry {
  const targets = new Map<string, NodeTarget>();
  const visible = new Set(ids);
  const children = (id: string) => childrenOf(id).filter((c) => visible.has(c));
  const metric = (id: string) => context.nodeMetrics.get(id) ?? { width: 120, height: 36 };
  // Breadth = axis along which siblings stack; depth = axis of hierarchy.
  const breadthOf = (id: string) => (direction === 'down' ? metric(id).width : metric(id).height);
  const depthOf = (id: string) => (direction === 'down' ? metric(id).height : metric(id).width);

  const spanCache = new Map<string, number>();
  const guard = new Set<string>();
  const span = (id: string): number => {
    const cached = spanCache.get(id);
    if (cached !== undefined) return cached;
    if (guard.has(id)) return breadthOf(id) + context.siblingGap;
    guard.add(id);
    const own = breadthOf(id) + context.siblingGap;
    const kids = children(id).reduce((sum, kid) => sum + span(kid), 0);
    const value = Math.max(own, kids);
    spanCache.set(id, value);
    return value;
  };

  // Max card depth per level so levels line up cleanly.
  const levelDepth: number[] = [];
  const measure = (id: string, level: number, seen: Set<string>) => {
    if (seen.has(id)) return;
    seen.add(id);
    levelDepth[level] = Math.max(levelDepth[level] ?? 0, depthOf(id));
    for (const kid of children(id)) measure(kid, level + 1, seen);
  };
  const seen = new Set<string>();
  roots.filter((r) => visible.has(r)).forEach((r) => measure(r, 0, seen));
  const levelOffset: number[] = [0];
  for (let l = 1; l < levelDepth.length; l += 1) {
    levelOffset[l] = levelOffset[l - 1] + levelDepth[l - 1] / 2 + levelDepth[l] / 2 + context.levelGap;
  }

  const placed = new Set<string>();
  const place = (id: string, level: number, start: number) => {
    if (placed.has(id)) return;
    placed.add(id);
    const s = span(id);
    const breadth = start + s / 2;
    const depth = levelOffset[level] ?? 0;
    targets.set(id, direction === 'down' ? { x: breadth, y: depth } : { x: depth, y: breadth, side: 1 });
    let cursor = start + (s - children(id).reduce((sum, kid) => sum + span(kid), 0)) / 2;
    for (const kid of children(id)) {
      place(kid, level + 1, cursor);
      cursor += span(kid);
    }
  };

  let cursor = 0;
  for (const root of roots.filter((r) => visible.has(r))) {
    place(root, 0, cursor);
    cursor += span(root) + context.siblingGap * 2;
  }
  // Centre the forest on the origin along the breadth axis.
  const shift = cursor / 2;
  for (const [id, t] of targets) {
    targets.set(id, direction === 'down' ? { ...t, x: t.x - shift } : { ...t, y: t.y - shift });
  }
  return { mode, targets, bounds: boundsOf(targets, context.nodeMetrics), decorations: [] };
}

export const orgChartLayout = (input: TreeInput) => tidyTree(input, 'down', 'org-chart');
export const braceMapLayout = (input: TreeInput) => tidyTree(input, 'right', 'brace-map');
