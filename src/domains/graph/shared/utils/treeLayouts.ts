/**
 * Tidy tree layouts for Mindmap mode: Org Chart (top-down) and
 * Brace Map / Logic Chart (left-to-right). Card-size aware and deterministic.
 */

import type { LayoutContext, LayoutGeometry, LayoutMode, NodeTarget } from '@/domains/graph/shared/utils/graph.types';
import { boundsOf } from '@/domains/graph/shared/utils/layoutMath';

export interface TreeInput {
  ids: string[];
  roots: string[];
  childrenOf: (id: string) => string[];
  context: LayoutContext;
}

type Direction = 'down' | 'right';

const COMPACT_LEAF_THRESHOLD = 8;
const COMPACT_MAX_COLS = 6;
const COMPACT_COL_GAP = 22;
const COMPACT_ROW_GAP = 28;
const COMPACT_MAX_LEAF_HEIGHT = 120;

interface CompactGridPlan {
  rows: string[][];
  leftColWidths: number[];
  rightColWidths: number[];
  halfExtent: number;
  rowHeights: number[];
}

function tidyTree({ ids, roots, childrenOf, context }: TreeInput, direction: Direction, mode: LayoutMode): LayoutGeometry {
  const targets = new Map<string, NodeTarget>();
  const visible = new Set(ids);
  const children = (id: string) => childrenOf(id).filter((c) => visible.has(c));
  const metric = (id: string) => context.nodeMetrics.get(id) ?? { width: 140, height: 38 };

  // Breadth = sumbu tumpukan sibling; depth = sumbu hirarki bertingkat
  const breadthOf = (id: string) => (direction === 'down' ? metric(id).width : metric(id).height);
  const depthOf = (id: string) => (direction === 'down' ? metric(id).height : metric(id).width);

  // Sibling gap yang cukup aman agar tidak ada teks/badge berdempetan
  const safeGap = Math.max(context.siblingGap, 28);
  const safeLevelGap = Math.max(context.levelGap, 64);

  const compactPlanCache = new Map<string, CompactGridPlan>();
  const isCompactLeafGrid = (id: string): boolean => {
    if (direction !== 'down') return false;
    const kids = children(id);
    if (kids.length <= COMPACT_LEAF_THRESHOLD) return false;
    return kids.every((k) => children(k).length === 0 && metric(k).height <= COMPACT_MAX_LEAF_HEIGHT);
  };

  const getCompactPlan = (id: string): CompactGridPlan => {
    const cached = compactPlanCache.get(id);
    if (cached) return cached;

    const kids = children(id);
    const rows: string[][] = [];
    for (let i = 0; i < kids.length; i += COMPACT_MAX_COLS) {
      rows.push(kids.slice(i, i + COMPACT_MAX_COLS));
    }

    const halfCols = COMPACT_MAX_COLS / 2;
    const leftColWidths = [0, 0, 0];
    const rightColWidths = [0, 0, 0];
    const rowHeights: number[] = [];

    // Baris penuh memakai 3 kolom kiri + gutter tengah + 3 kolom kanan agar spine center bebas tabrakan
    const fullRowCount = Math.max(0, rows.length - 1);
    for (let r = 0; r < rows.length; r += 1) {
      const row = rows[r];
      let maxH = 0;
      for (let c = 0; c < row.length; c += 1) {
        const m = metric(row[c]);
        maxH = Math.max(maxH, m.height);
        if (r < fullRowCount) {
          if (c < halfCols) {
            leftColWidths[c] = Math.max(leftColWidths[c], m.width);
          } else {
            rightColWidths[c - halfCols] = Math.max(rightColWidths[c - halfCols], m.width);
          }
        }
      }
      rowHeights.push(maxH);
    }

    const sumSide = (widths: number[]) =>
      widths.reduce((acc, w) => (w > 0 ? acc + w : acc), 0) +
      Math.max(0, widths.filter((w) => w > 0).length - 1) * COMPACT_COL_GAP +
      COMPACT_COL_GAP / 2;

    const lastRow = rows[rows.length - 1] ?? [];
    const lastRowWidth =
      lastRow.reduce((sum, kid) => sum + metric(kid).width, 0) +
      Math.max(0, lastRow.length - 1) * COMPACT_COL_GAP;

    const halfExtent = Math.max(
      sumSide(leftColWidths),
      sumSide(rightColWidths),
      lastRowWidth / 2,
    );

    const plan: CompactGridPlan = {
      rows,
      leftColWidths,
      rightColWidths,
      halfExtent,
      rowHeights,
    };
    compactPlanCache.set(id, plan);
    return plan;
  };

  const spanCache = new Map<string, number>();
  const guard = new Set<string>();

  // 1. Kalkulasi Span Anti-Overlapping: lokal per subtree (tidak meluber ke sepupu lintas cabang)
  const span = (id: string): number => {
    const cached = spanCache.get(id);
    if (cached !== undefined) return cached;
    if (guard.has(id)) return breadthOf(id) + safeGap;
    guard.add(id);

    const own = breadthOf(id) + safeGap;
    const kids = children(id);
    if (kids.length === 0) {
      spanCache.set(id, own);
      return own;
    }

    if (isCompactLeafGrid(id)) {
      const plan = getCompactPlan(id);
      const value = Math.max(own, plan.halfExtent * 2 + safeGap);
      spanCache.set(id, value);
      return value;
    }

    const kidsSpanTotal = kids.reduce((sum, kid) => sum + span(kid), 0) + (kids.length - 1) * 8;
    const value = Math.max(own, kidsSpanTotal);
    spanCache.set(id, value);
    return value;
  };

  // 2. Penempatan Koordinat Node Lokal per Parent (bebas ledakan levelDepth global)
  const placed = new Set<string>();
  const placeCompactLeafRows = (parentId: string, centerX: number, parentBottomY: number) => {
    const plan = getCompactPlan(parentId);
    let rowTop = parentBottomY + safeLevelGap;

    for (let r = 0; r < plan.rows.length; r += 1) {
      const row = plan.rows[r];
      const rowH = plan.rowHeights[r];
      const rowCenterY = rowTop + rowH / 2;
      const isLastRow = r === plan.rows.length - 1;

      if (!isLastRow) {
        // 3 kolom kiri bergerak ke kiri dari gutter tengah; 3 kolom kanan bergerak ke kanan dari gutter tengah
        let leftEdge = centerX - COMPACT_COL_GAP / 2;
        for (let c = 2; c >= 0; c -= 1) {
          const kid = row[c];
          if (!kid) continue;
          const colW = plan.leftColWidths[c];
          targets.set(kid, { x: leftEdge - colW / 2, y: rowCenterY });
          placed.add(kid);
          leftEdge -= colW + COMPACT_COL_GAP;
        }
        let rightEdge = centerX + COMPACT_COL_GAP / 2;
        for (let c = 3; c < row.length; c += 1) {
          const kid = row[c];
          const colW = plan.rightColWidths[c - 3];
          targets.set(kid, { x: rightEdge + colW / 2, y: rowCenterY });
          placed.add(kid);
          rightEdge += colW + COMPACT_COL_GAP;
        }
      } else {
        const totalRowW =
          row.reduce((sum, k) => sum + metric(k).width, 0) +
          Math.max(0, row.length - 1) * COMPACT_COL_GAP;
        let colCursor = centerX - totalRowW / 2;
        for (const kid of row) {
          const m = metric(kid);
          targets.set(kid, { x: colCursor + m.width / 2, y: rowCenterY });
          placed.add(kid);
          colCursor += m.width + COMPACT_COL_GAP;
        }
      }

      rowTop += rowH + COMPACT_ROW_GAP;
    }
  };

  const place = (id: string, depthCenter: number, start: number) => {
    if (placed.has(id)) return;
    placed.add(id);

    const s = span(id);
    const breadth = start + s / 2;
    targets.set(id, direction === 'down' ? { x: breadth, y: depthCenter } : { x: depthCenter, y: breadth, side: 1 });

    const kids = children(id);
    if (kids.length === 0) return;

    if (isCompactLeafGrid(id)) {
      placeCompactLeafRows(id, breadth, depthCenter + depthOf(id) / 2);
      return;
    }

    const totalKidsSpan = kids.reduce((sum, kid) => sum + span(kid), 0) + (kids.length - 1) * 8;
    let cursor = start + (s - totalKidsSpan) / 2;

    for (const kid of kids) {
      const kidDepthCenter = depthCenter + depthOf(id) / 2 + safeLevelGap + depthOf(kid) / 2;
      place(kid, kidDepthCenter, cursor);
      cursor += span(kid) + 8;
    }
  };

  let cursor = 0;
  for (const root of roots.filter((r) => visible.has(r))) {
    place(root, 0, cursor);
    cursor += span(root) + safeGap * 2;
  }

  // Pusatkan seluruh struktur pohon ke titik origin (0, 0)
  const shift = cursor / 2;
  for (const [id, t] of targets) {
    targets.set(id, direction === 'down' ? { ...t, x: t.x - shift } : { ...t, y: t.y - shift });
  }

  return { mode, targets, bounds: boundsOf(targets, context.nodeMetrics), decorations: [] };
}

export const orgChartLayout = (input: TreeInput) => tidyTree(input, 'down', 'org-chart');
export const braceMapLayout = (input: TreeInput) => tidyTree(input, 'right', 'brace-map');
