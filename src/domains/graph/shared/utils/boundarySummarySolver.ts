/**
 * Deterministic Solver for XMind Boundary Hulls, Summary Braces (with first-class
 * Summary Topic subtrees), and Flex-Mode Manual Node Offsets.
 *
 * Operates alongside `compositeLayoutEngine.ts` and `collisionResolver.ts` so every
 * enclosed subtree, external sibling branch, boundary hull, and summary subtree
 * satisfies strict Zero-AABB Overlap and >= boundaryPadding edge clearance.
 */

import { resolveAABBCollisions } from '@/domains/graph/shared/utils/collisionResolver';
import type {
  BoundaryDecoration,
  BoundaryGroup,
  LayoutDecoration,
  LayoutMode,
  ManualNodeOffset,
  NodeMetric,
  NodeTarget,
  SummaryBraceDecoration,
  SummaryGroup,
} from '@/domains/graph/shared/utils/graph.types';

const DEFAULT_METRIC: NodeMetric = { width: 140, height: 38 };
const DEFAULT_BOUNDARY_PADDING = 16;
const BOUNDARY_TITLE_HEADER_HEIGHT = 22;
const BRACE_OFFSET_FROM_NODES = 12;
const BRACE_APEX_DEPTH = 14;
const SUMMARY_NODE_GAP = 14;

/**
 * BFS collector returning all visible node IDs reachable from `seedNodeIds`.
 */
export function collectEnclosedSubtreeIds(
  seedNodeIds: string[],
  childrenOf: (id: string) => string[],
  visible: Set<string>,
  excludeIds?: Set<string>,
): Set<string> {
  const enclosed = new Set<string>();
  const queue: string[] = [];

  for (const id of seedNodeIds) {
    if (visible.has(id) && !excludeIds?.has(id) && !enclosed.has(id)) {
      enclosed.add(id);
      queue.push(id);
    }
  }

  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const child of childrenOf(cur)) {
      if (visible.has(child) && !excludeIds?.has(child) && !enclosed.has(child)) {
        enclosed.add(child);
        queue.push(child);
      }
    }
  }

  return enclosed;
}

/**
 * Resolves the contiguous sibling slice between `rangeNodeIds[0]` and `rangeNodeIds[1]`.
 */
export function resolveRangeSiblingIds(
  parentId: string,
  rangeNodeIds: [string, string],
  childrenOf: (id: string) => string[],
  visible: Set<string>,
  summaryNodeId?: string,
): string[] {
  const siblings = childrenOf(parentId).filter(
    (id) => visible.has(id) && id !== summaryNodeId,
  );
  const [startId, endId] = rangeNodeIds;
  const idxA = siblings.indexOf(startId);
  const idxB = siblings.indexOf(endId);

  if (idxA !== -1 && idxB !== -1) {
    const lo = Math.min(idxA, idxB);
    const hi = Math.max(idxA, idxB);
    return siblings.slice(lo, hi + 1);
  }

  const fallback: string[] = [];
  if (visible.has(startId) && startId !== summaryNodeId) fallback.push(startId);
  if (endId !== startId && visible.has(endId) && endId !== summaryNodeId) fallback.push(endId);
  return fallback;
}

/**
 * Pre-inflates proxy node metrics before base/composite layout so sibling branches
 * naturally yield initial room for boundaries and summary braces.
 */
export function inflateMetricsForBoundariesAndSummaries(
  baseMetrics: Map<string, NodeMetric>,
  boundaries: BoundaryGroup[] | undefined,
  summaries: SummaryGroup[] | undefined,
): Map<string, NodeMetric> {
  const hasBoundaries = Boolean(boundaries && boundaries.length > 0);
  const hasSummaries = Boolean(summaries && summaries.length > 0);
  if (!hasBoundaries && !hasSummaries) return baseMetrics;

  const inflated = new Map<string, NodeMetric>();
  for (const [id, metric] of baseMetrics.entries()) {
    inflated.set(id, { ...metric });
  }

  if (boundaries) {
    for (const boundary of boundaries) {
      const pad = Math.max(8, boundary.padding || DEFAULT_BOUNDARY_PADDING);
      const headerH = boundary.title?.trim() ? BOUNDARY_TITLE_HEADER_HEIGHT : 0;
      for (const nodeId of boundary.nodeIds) {
        const cur = inflated.get(nodeId) ?? { ...DEFAULT_METRIC };
        inflated.set(nodeId, {
          width: cur.width + pad * 2,
          height: cur.height + pad * 2 + headerH,
        });
      }
    }
  }

  if (summaries) {
    for (const summary of summaries) {
      for (const endId of summary.rangeNodeIds) {
        const cur = inflated.get(endId) ?? { ...DEFAULT_METRIC };
        inflated.set(endId, {
          width: cur.width + BRACE_OFFSET_FROM_NODES + BRACE_APEX_DEPTH,
          height: cur.height + 12,
        });
      }
    }
  }

  return inflated;
}

/**
 * Applies Flex-Mode manual offsets deterministically by translating each dragged topic
 * together with its entire visible subtree (preserving internal branch geometry).
 */
export function applyFlexManualOffsets(
  targets: Map<string, NodeTarget>,
  manualOffsets: Record<string, ManualNodeOffset> | undefined,
  childrenOf: (id: string) => string[],
  visible: Set<string>,
  roots: string[],
): Map<string, NodeTarget> {
  if (!manualOffsets || Object.keys(manualOffsets).length === 0) {
    return targets;
  }

  const shifted = new Map<string, NodeTarget>();
  for (const [id, t] of targets.entries()) {
    shifted.set(id, { ...t });
  }

  const rootSet = new Set(roots);

  for (const [nodeId, offset] of Object.entries(manualOffsets)) {
    if (!visible.has(nodeId)) continue;
    if (!Number.isFinite(offset.dx) || !Number.isFinite(offset.dy)) continue;
    if (offset.dx === 0 && offset.dy === 0) continue;
    // Root offsets shift global map cleanly only if explicitly supplied; usually main/floating move
    if (rootSet.has(nodeId) && Math.abs(offset.dx) < 1e-3 && Math.abs(offset.dy) < 1e-3) continue;

    const subtree = collectEnclosedSubtreeIds([nodeId], childrenOf, visible);
    for (const memberId of subtree) {
      const cur = shifted.get(memberId);
      if (cur) {
        shifted.set(memberId, {
          ...cur,
          x: cur.x + offset.dx,
          y: cur.y + offset.dy,
        });
      }
    }
  }

  return shifted;
}

/**
 * Measures the minimum AABB separation clearance (in px) from an external node box
 * to the outer perimeter of a `BoundaryDecoration`. Negative values indicate overlap/intrusion.
 */
export function measureBoundaryEdgeClearance(
  boundary: Pick<BoundaryDecoration, 'x' | 'y' | 'width' | 'height'>,
  nodeTarget: Pick<NodeTarget, 'x' | 'y'>,
  nodeMetric: NodeMetric,
): number {
  const halfW = nodeMetric.width / 2;
  const halfH = nodeMetric.height / 2;
  const nMinX = nodeTarget.x - halfW;
  const nMaxX = nodeTarget.x + halfW;
  const nMinY = nodeTarget.y - halfH;
  const nMaxY = nodeTarget.y + halfH;

  const bMinX = boundary.x;
  const bMaxX = boundary.x + boundary.width;
  const bMinY = boundary.y;
  const bMaxY = boundary.y + boundary.height;

  const gapX = Math.max(0, bMinX - nMaxX, nMinX - bMaxX);
  const gapY = Math.max(0, bMinY - nMaxY, nMinY - bMaxY);

  if (gapX === 0 && gapY === 0) {
    const penX = Math.min(bMaxX - nMinX, nMaxX - bMinX);
    const penY = Math.min(bMaxY - nMinY, nMaxY - bMinY);
    return -Math.min(penX, penY);
  }

  return Math.max(gapX, gapY);
}

function unionAABB(
  ids: Iterable<string>,
  targets: Map<string, NodeTarget>,
  metrics: Map<string, NodeMetric>,
) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let count = 0;

  for (const id of ids) {
    const t = targets.get(id);
    if (!t) continue;
    const m = metrics.get(id) ?? DEFAULT_METRIC;
    minX = Math.min(minX, t.x - m.width / 2);
    minY = Math.min(minY, t.y - m.height / 2);
    maxX = Math.max(maxX, t.x + m.width / 2);
    maxY = Math.max(maxY, t.y + m.height / 2);
    count += 1;
  }

  return count > 0 ? { minX, minY, maxX, maxY } : null;
}

function buildAncestorSet(
  enclosed: Set<string>,
  parentOf: (id: string) => string | null | undefined,
): Set<string> {
  const ancestors = new Set<string>();
  for (const id of enclosed) {
    let cur = parentOf(id) ?? null;
    const guard = new Set<string>();
    while (cur && !guard.has(cur)) {
      guard.add(cur);
      if (!enclosed.has(cur)) ancestors.add(cur);
      cur = parentOf(cur) ?? null;
    }
  }
  return ancestors;
}

function buildBoundaryDecoration(
  group: BoundaryGroup,
  targets: Map<string, NodeTarget>,
  metrics: Map<string, NodeMetric>,
  childrenOf: (id: string) => string[],
  visible: Set<string>,
): { decoration: BoundaryDecoration; enclosed: Set<string> } | null {
  const enclosed = collectEnclosedSubtreeIds(group.nodeIds, childrenOf, visible);
  if (enclosed.size === 0) return null;

  const box = unionAABB(enclosed, targets, metrics);
  if (!box) return null;

  const pad = Math.max(8, group.padding || DEFAULT_BOUNDARY_PADDING);
  const headerHeight = group.title?.trim() ? BOUNDARY_TITLE_HEADER_HEIGHT : 0;

  return {
    enclosed,
    decoration: {
      kind: 'boundary',
      id: group.id,
      title: group.title,
      nodeIds: Array.from(enclosed),
      shape: group.shape,
      x: box.minX - pad,
      y: box.minY - pad - headerHeight,
      width: box.maxX - box.minX + pad * 2,
      height: box.maxY - box.minY + pad * 2 + headerHeight,
      padding: pad,
      headerHeight,
      fillColor: group.fillColor,
      strokeColor: group.strokeColor,
    },
  };
}

function resolveSummaryDirection(
  spannedBox: { minX: number; minY: number; maxX: number; maxY: number },
  parentTarget: NodeTarget | undefined,
  mode: LayoutMode,
): SummaryBraceDecoration['direction'] {
  if (mode === 'org-chart') return 'down';
  if (!parentTarget) return 'right';
  const centerX = (spannedBox.minX + spannedBox.maxX) / 2;
  return centerX < parentTarget.x ? 'left' : 'right';
}

function buildSummaryDecoration(
  group: SummaryGroup,
  spannedBox: { minX: number; minY: number; maxX: number; maxY: number },
  direction: SummaryBraceDecoration['direction'],
): SummaryBraceDecoration {
  if (direction === 'left') {
    const xLine = spannedBox.minX - BRACE_OFFSET_FROM_NODES;
    const y1 = spannedBox.minY + 4;
    const y2 = spannedBox.maxY - 4;
    return {
      kind: 'summary-brace',
      id: group.id,
      parentId: group.parentId,
      summaryNodeId: group.summaryNodeId,
      braceStyle: group.braceStyle,
      direction,
      x1: xLine,
      y1,
      x2: xLine,
      y2,
      apexX: xLine - BRACE_APEX_DEPTH,
      apexY: (y1 + y2) / 2,
      color: group.color,
      label: group.label,
    };
  }

  if (direction === 'down') {
    const yLine = spannedBox.maxY + BRACE_OFFSET_FROM_NODES;
    const x1 = spannedBox.minX + 4;
    const x2 = spannedBox.maxX - 4;
    return {
      kind: 'summary-brace',
      id: group.id,
      parentId: group.parentId,
      summaryNodeId: group.summaryNodeId,
      braceStyle: group.braceStyle,
      direction,
      x1,
      y1: yLine,
      x2,
      y2: yLine,
      apexX: (x1 + x2) / 2,
      apexY: yLine + BRACE_APEX_DEPTH,
      color: group.color,
      label: group.label,
    };
  }

  const xLine = spannedBox.maxX + BRACE_OFFSET_FROM_NODES;
  const y1 = spannedBox.minY + 4;
  const y2 = spannedBox.maxY - 4;
  return {
    kind: 'summary-brace',
    id: group.id,
    parentId: group.parentId,
    summaryNodeId: group.summaryNodeId,
    braceStyle: group.braceStyle,
    direction: 'right',
    x1: xLine,
    y1,
    x2: xLine,
    y2,
    apexX: xLine + BRACE_APEX_DEPTH,
    apexY: (y1 + y2) / 2,
    color: group.color,
    label: group.label,
  };
}

function positionSummarySubtree(
  summaryNodeId: string,
  brace: SummaryBraceDecoration,
  targets: Map<string, NodeTarget>,
  metrics: Map<string, NodeMetric>,
  childrenOf: (id: string) => string[],
  visible: Set<string>,
): void {
  const currentRoot = targets.get(summaryNodeId);
  if (!currentRoot || !visible.has(summaryNodeId)) return;

  const summaryMetric = metrics.get(summaryNodeId) ?? DEFAULT_METRIC;
  const desiredX =
    brace.direction === 'right'
      ? brace.apexX + SUMMARY_NODE_GAP + summaryMetric.width / 2
      : brace.direction === 'left'
        ? brace.apexX - SUMMARY_NODE_GAP - summaryMetric.width / 2
        : brace.apexX;
  const desiredY =
    brace.direction === 'down'
      ? brace.apexY + SUMMARY_NODE_GAP + summaryMetric.height / 2
      : brace.apexY;

  const summarySubtree = collectEnclosedSubtreeIds([summaryNodeId], childrenOf, visible);

  // Mirror subtree horizontally if initial mindmap side was opposite the brace opening direction
  let avgChildDeltaX = 0;
  let childCount = 0;
  for (const id of summarySubtree) {
    if (id === summaryNodeId) continue;
    const t = targets.get(id);
    if (t) {
      avgChildDeltaX += t.x - currentRoot.x;
      childCount += 1;
    }
  }
  const needsHorizontalFlip =
    childCount > 0 &&
    ((brace.direction === 'right' && avgChildDeltaX < 0) ||
      (brace.direction === 'left' && avgChildDeltaX > 0));

  const shiftX = desiredX - currentRoot.x;
  const shiftY = desiredY - currentRoot.y;

  for (const id of summarySubtree) {
    const t = targets.get(id);
    if (!t) continue;
    const localX = needsHorizontalFlip ? 2 * currentRoot.x - t.x : t.x;
    targets.set(id, {
      ...t,
      x: localX + shiftX,
      y: t.y + shiftY,
      side: brace.direction === 'right' ? 1 : brace.direction === 'left' ? -1 : t.side,
    });
  }
}

export interface SolveBoundariesAndSummariesInput {
  targets: Map<string, NodeTarget>;
  metrics: Map<string, NodeMetric>;
  roots: string[];
  childrenOf: (id: string) => string[];
  parentOf: (id: string) => string | null | undefined;
  visible: Set<string>;
  mode: LayoutMode;
  boundaries?: BoundaryGroup[];
  summaries?: SummaryGroup[];
}

export interface SolveBoundariesAndSummariesResult {
  targets: Map<string, NodeTarget>;
  decorations: LayoutDecoration[];
}

/**
 * Resolves Summary Braces (+ Summary Topic subtrees) and Boundary Hulls,
 * guaranteeing Zero-AABB Node Overlaps and >= boundary.padding edge clearance
 * for every external node.
 */
export function solveBoundariesAndSummaries({
  targets,
  metrics,
  roots,
  childrenOf,
  parentOf,
  visible,
  mode,
  boundaries = [],
  summaries = [],
}: SolveBoundariesAndSummariesInput): SolveBoundariesAndSummariesResult {
  if (boundaries.length === 0 && summaries.length === 0) {
    return { targets, decorations: [] };
  }

  let working = new Map<string, NodeTarget>();
  for (const [id, t] of targets.entries()) {
    working.set(id, { ...t });
  }

  const rootSet = new Set(roots);

  // Pass A: Place each Summary Topic Node & its descendants at the outer brace apex
  for (const summary of summaries) {
    const summarySubtree = collectEnclosedSubtreeIds(
      [summary.summaryNodeId],
      childrenOf,
      visible,
    );
    const siblings = resolveRangeSiblingIds(
      summary.parentId,
      summary.rangeNodeIds,
      childrenOf,
      visible,
      summary.summaryNodeId,
    );
    const spannedIds = collectEnclosedSubtreeIds(
      siblings,
      childrenOf,
      visible,
      summarySubtree,
    );
    const spannedBox = unionAABB(spannedIds, working, metrics);
    if (!spannedBox) continue;

    const dir = resolveSummaryDirection(
      spannedBox,
      working.get(summary.parentId),
      mode,
    );
    const brace = buildSummaryDecoration(summary, spannedBox, dir);
    positionSummarySubtree(summary.summaryNodeId, brace, working, metrics, childrenOf, visible);
  }

  // Pass B: Iterative external-node push-away from Boundary Hulls + AABB safety pass
  const maxExternalPasses = Math.max(2, boundaries.length * 4);
  for (let pass = 0; pass < maxExternalPasses; pass += 1) {
    let pushedAny = false;

    for (const boundary of boundaries) {
      const built = buildBoundaryDecoration(boundary, working, metrics, childrenOf, visible);
      if (!built) continue;
      const { decoration, enclosed } = built;
      const ancestors = buildAncestorSet(enclosed, parentOf);
      const hullCenterX = decoration.x + decoration.width / 2;
      const hullCenterY = decoration.y + decoration.height / 2;

      for (const [nodeId, nodeTarget] of Array.from(working.entries())) {
        if (enclosed.has(nodeId)) continue;
        const m = metrics.get(nodeId) ?? DEFAULT_METRIC;
        const clearance = measureBoundaryEdgeClearance(decoration, nodeTarget, m);
        if (clearance >= decoration.padding - 0.5) continue;

        const needed = decoration.padding - clearance + 4;

        // If the too-close node is an ancestor/root (like Central Topic), shift enclosed subtree outward instead
        if (ancestors.has(nodeId) || rootSet.has(nodeId)) {
          const dxFromRoot = hullCenterX - nodeTarget.x;
          const dyFromRoot = hullCenterY - nodeTarget.y;
          const shiftX =
            mode === 'org-chart'
              ? 0
              : (Math.abs(dxFromRoot) > 1e-3 ? Math.sign(dxFromRoot) : 1) * needed;
          const shiftY = mode === 'org-chart' ? needed : 0;
          for (const encId of enclosed) {
            const et = working.get(encId);
            if (et) working.set(encId, { ...et, x: et.x + shiftX, y: et.y + shiftY });
          }
          pushedAny = true;
          break;
        }

        // Shift external node along its minimal escape vector outside the boundary hull
        let moveUnitId = nodeId;
        let curParent = parentOf(moveUnitId) ?? null;
        while (
          curParent &&
          !rootSet.has(curParent) &&
          !ancestors.has(curParent) &&
          !enclosed.has(curParent)
        ) {
          const branchIds = collectEnclosedSubtreeIds([curParent], childrenOf, visible);
          let touchesEnclosed = false;
          for (const bId of branchIds) {
            if (enclosed.has(bId)) {
              touchesEnclosed = true;
              break;
            }
          }
          if (touchesEnclosed) break;
          moveUnitId = curParent;
          curParent = parentOf(moveUnitId) ?? null;
        }

        const pushSubtree = collectEnclosedSubtreeIds([moveUnitId], childrenOf, visible);
        const dx = nodeTarget.x - hullCenterX;
        const dy = nodeTarget.y - hullCenterY;
        const preferHorizontal = mode === 'org-chart' || Math.abs(dy) < 1;
        const shiftX = preferHorizontal ? (dx >= 0 ? needed : -needed) : 0;
        const shiftY = preferHorizontal ? 0 : dy >= 0 ? needed : -needed;

        for (const extId of pushSubtree) {
          if (enclosed.has(extId) || rootSet.has(extId)) continue;
          const et = working.get(extId);
          if (et) {
            working.set(extId, { ...et, x: et.x + shiftX, y: et.y + shiftY });
          }
        }
        pushedAny = true;
      }
    }

    working = resolveAABBCollisions({
      targets: working,
      metrics,
      roots,
      childrenOf,
      mode,
      minGap: 10,
      preserveSpineSide: mode === 'fishbone' || mode === 'timeline',
    });

    if (!pushedAny) break;
  }

  // Final directional cascade clearance pass guaranteeing both >= padding and 0 AABB overlaps
  for (const boundary of boundaries) {
    const built = buildBoundaryDecoration(boundary, working, metrics, childrenOf, visible);
    if (!built) continue;
    const { decoration, enclosed } = built;
    const ancestors = buildAncestorSet(enclosed, parentOf);
    const hullCenterX = decoration.x + decoration.width / 2;
    const hullCenterY = decoration.y + decoration.height / 2;

    for (const nodeId of Array.from(working.keys())) {
      const nodeTarget = working.get(nodeId);
      if (!nodeTarget || enclosed.has(nodeId) || ancestors.has(nodeId) || rootSet.has(nodeId)) {
        continue;
      }
      const m = metrics.get(nodeId) ?? DEFAULT_METRIC;
      const clearance = measureBoundaryEdgeClearance(decoration, nodeTarget, m);
      if (clearance >= decoration.padding) continue;

      const needed = decoration.padding - clearance + 2;
      const dy = nodeTarget.y - hullCenterY;
      const dx = nodeTarget.x - hullCenterX;
      const horizontal = mode === 'org-chart';
      const shiftX = horizontal ? (dx >= 0 ? needed : -needed) : 0;
      const shiftY = horizontal ? 0 : dy >= 0 ? needed : -needed;

      const cascaded = new Set<string>([nodeId]);
      const queue: string[] = [nodeId];
      while (queue.length > 0) {
        const curId = queue.shift()!;
        const curT = working.get(curId);
        if (!curT) continue;
        const curM = metrics.get(curId) ?? DEFAULT_METRIC;
        const nextT = { ...curT, x: curT.x + shiftX, y: curT.y + shiftY };
        working.set(curId, nextT);

        for (const [otherId, otherT] of working.entries()) {
          if (cascaded.has(otherId) || enclosed.has(otherId) || rootSet.has(otherId)) continue;
          const otherM = metrics.get(otherId) ?? DEFAULT_METRIC;
          const ox = (curM.width + otherM.width) / 2 + 8 - Math.abs(nextT.x - otherT.x);
          const oy = (curM.height + otherM.height) / 2 + 8 - Math.abs(nextT.y - otherT.y);
          if (ox > 0 && oy > 0) {
            cascaded.add(otherId);
            queue.push(otherId);
          }
        }
      }
    }
  }

  // Pass C: Emit final Boundary & SummaryBrace decorations locked to stabilized coordinates
  const decorations: LayoutDecoration[] = [];

  for (const summary of summaries) {
    const summarySubtree = collectEnclosedSubtreeIds(
      [summary.summaryNodeId],
      childrenOf,
      visible,
    );
    const siblings = resolveRangeSiblingIds(
      summary.parentId,
      summary.rangeNodeIds,
      childrenOf,
      visible,
      summary.summaryNodeId,
    );
    const spannedIds = collectEnclosedSubtreeIds(
      siblings,
      childrenOf,
      visible,
      summarySubtree,
    );
    const spannedBox = unionAABB(spannedIds, working, metrics);
    if (!spannedBox) continue;

    const dir = resolveSummaryDirection(
      spannedBox,
      working.get(summary.parentId),
      mode,
    );
    const brace = buildSummaryDecoration(summary, spannedBox, dir);
    decorations.push(brace);
  }

  for (const boundary of boundaries) {
    const built = buildBoundaryDecoration(boundary, working, metrics, childrenOf, visible);
    if (built) decorations.push(built.decoration);
  }

  return { targets: working, decorations };
}
