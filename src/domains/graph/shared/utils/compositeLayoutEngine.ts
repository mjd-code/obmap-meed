/**
 * Two-Pass Composite Layout Engine (XMind Multi-Structure Architecture).
 *
 * Pass 1 (Bottom-Up): Recursively evaluates any overridden subtree first, computes
 * its exact Composite Bounding Box (+ Cross-Structure Adaptive Margin), and injects
 * that full envelope as a proxy leaf metric into the parent solver so sibling branches
 * automatically yield space instead of overlapping.
 *
 * Pass 2 (Top-Down): Places parent structure, orients & translates encapsulated child
 * subtrees (and decorations) cleanly into their reserved proxy envelopes, then runs
 * a final O(N log N) Sweep-and-Prune AABB guard.
 */

import {
  applyFlexManualOffsets,
  inflateMetricsForBoundariesAndSummaries,
  solveBoundariesAndSummaries,
} from '@/domains/graph/shared/utils/boundarySummarySolver';
import {
  resolveAABBCollisions,
  resolveBlockAABBCollisions,
} from '@/domains/graph/shared/utils/collisionResolver';
import { fishboneLayout } from '@/domains/graph/shared/utils/fishbone';
import type {
  BoundaryGroup,
  LayoutContext,
  LayoutDecoration,
  LayoutGeometry,
  ManualNodeOffset,
  MindmapLayoutMode,
  NodeMetric,
  NodeTarget,
  SubtreeLayoutMap,
  SummaryGroup,
} from '@/domains/graph/shared/utils/graph.types';
import { boundsOf, mergeBoundsWithDecorations } from '@/domains/graph/shared/utils/layoutMath';
import { mindmapLayout } from '@/domains/graph/shared/utils/mindmap';
import { timelineLayout } from '@/domains/graph/shared/utils/timeline';
import { braceMapLayout, orgChartLayout } from '@/domains/graph/shared/utils/treeLayouts';

export interface CompositeTreeData {
  ids: string[];
  roots: string[];
  childrenOf: (id: string) => string[];
  context: LayoutContext;
  projection?: {
    byId: Map<string, { time?: number }>;
    parentByChild: { get(id: string): string | null | undefined };
  };
}

const DEFAULT_METRIC: NodeMetric = { width: 140, height: 38 };

export function runSingleMindmapSolver(
  mode: MindmapLayoutMode,
  subtreeIds: string[],
  roots: string[],
  childrenOf: (id: string) => string[],
  context: LayoutContext,
  projection?: CompositeTreeData['projection']
): LayoutGeometry {
  const treeInput = { ids: subtreeIds, roots, childrenOf, context };
  switch (mode) {
    case 'org-chart':
      return orgChartLayout(treeInput);
    case 'brace-map':
      return braceMapLayout(treeInput);
    case 'timeline':
      return timelineLayout({
        ids: subtreeIds,
        roots,
        childrenOf,
        parentOf: (id) => projection?.parentByChild.get(id) ?? null,
        context,
      });
    case 'fishbone':
      return fishboneLayout(treeInput);
    case 'mindmap':
    default:
      return mindmapLayout(treeInput);
  }
}

export function computeCrossStructureMargin(
  parentMode: MindmapLayoutMode,
  childMode: MindmapLayoutMode,
  levelGap: number
): number {
  if (parentMode === childMode) return 12;
  return Math.max(Math.round(levelGap * 0.25), 24);
}

function shouldMirrorHorizontalSubtree(
  parentMode: MindmapLayoutMode,
  childMode: MindmapLayoutMode,
  anchorIsLeft: boolean
): boolean {
  if (anchorIsLeft && (childMode === 'brace-map' || childMode === 'timeline')) {
    return true;
  }
  if (!anchorIsLeft && childMode === 'fishbone' && parentMode !== 'fishbone') {
    return true;
  }
  return false;
}

function flipHorizontalSide(side: -1 | 0 | 1 | undefined): -1 | 0 | 1 | undefined {
  if (side === -1) return 1;
  if (side === 1) return -1;
  return side;
}

function computeParentDepths(
  roots: string[],
  childrenOf: (id: string) => string[]
): Map<string, number> {
  const depths = new Map<string, number>();
  const queue: Array<[string, number]> = [];
  for (const r of roots) {
    if (!depths.has(r)) {
      depths.set(r, 0);
      queue.push([r, 0]);
    }
  }
  while (queue.length > 0) {
    const [cur, d] = queue.shift()!;
    for (const child of childrenOf(cur)) {
      if (!depths.has(child)) {
        depths.set(child, d + 1);
        queue.push([child, d + 1]);
      }
    }
  }
  return depths;
}

function syncMovedParentRib(
  dec: LayoutDecoration,
  targets: Map<string, NodeTarget>
): LayoutDecoration {
  if (dec.kind !== 'fishbone-rib' || !dec.targetId) return dec;
  const dst = targets.get(dec.targetId);
  if (!dst) return dec;
  const src = !dec.major && dec.sourceId ? targets.get(dec.sourceId) : undefined;
  return {
    ...dec,
    x1: src ? src.x : dec.x1,
    y1: src ? src.y : dec.y1,
    x2: dst.x,
    y2: dst.y,
  };
}

function transformDecoration(
  dec: LayoutDecoration,
  mirrorXOrigin: number | null,
  deltaX: number,
  deltaY: number
): LayoutDecoration {
  const tx = (x: number) => (mirrorXOrigin !== null ? 2 * mirrorXOrigin - x : x) + deltaX;
  const ty = (y: number) => y + deltaY;

  if (dec.kind === 'fishbone-spine') {
    return {
      ...dec,
      x1: tx(dec.x1),
      y1: ty(dec.y1),
      x2: tx(dec.x2),
      y2: ty(dec.y2),
    };
  }
  if (dec.kind === 'fishbone-rib') {
    return {
      ...dec,
      x1: tx(dec.x1),
      y1: ty(dec.y1),
      x2: tx(dec.x2),
      y2: ty(dec.y2),
    };
  }
  if (dec.kind === 'boundary') {
    const newX = tx(dec.x);
    return {
      ...dec,
      x: mirrorXOrigin !== null ? newX - dec.width : newX,
      y: ty(dec.y),
    };
  }
  if (dec.kind === 'summary-brace') {
    return {
      ...dec,
      x1: tx(dec.x1),
      y1: ty(dec.y1),
      x2: tx(dec.x2),
      y2: ty(dec.y2),
      apexX: tx(dec.apexX),
      apexY: ty(dec.apexY),
    };
  }
  return {
    ...dec,
    x1: tx(dec.x1),
    y1: dec.y1 !== undefined ? ty(dec.y1) : undefined,
    x2: tx(dec.x2),
    y2: dec.y2 !== undefined ? ty(dec.y2) : undefined,
    y: ty(dec.y),
    ticks: dec.ticks.map((tick) => ({
      ...tick,
      x: tx(tick.x),
      y: tick.y !== undefined ? ty(tick.y) : undefined,
    })),
  };
}

function collectAllowedSubtree(
  rootId: string,
  childrenOf: (id: string) => string[],
  visible: Set<string>
): string[] {
  const result: string[] = [rootId];
  const visited = new Set<string>([rootId]);
  const queue = [...childrenOf(rootId).filter((c) => visible.has(c))];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    result.push(cur);
    for (const child of childrenOf(cur)) {
      if (visible.has(child) && !visited.has(child)) {
        queue.push(child);
      }
    }
  }
  return result;
}

function solveCompositeRegion(
  regionRoots: string[],
  regionIds: string[],
  activeMode: MindmapLayoutMode,
  tree: CompositeTreeData,
  overrides: SubtreeLayoutMap,
  visible: Set<string>
): LayoutGeometry {
  const regionSet = new Set(regionIds);
  const regionRootSet = new Set(regionRoots);
  const childrenInRegion = (id: string) =>
    tree.childrenOf(id).filter((c) => regionSet.has(c) && visible.has(c));

  // Identifikasi batas cabang terdekat di dalam region yang di-override ke struktur lain
  const boundarySubtrees = new Map<string, LayoutGeometry>();
  const boundaryModes = new Map<string, MindmapLayoutMode>();
  const prunedIds: string[] = [];
  const bfsSeen = new Set<string>();
  const queue: string[] = [...regionRoots.filter((r) => regionSet.has(r))];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (bfsSeen.has(id)) continue;
    bfsSeen.add(id);
    prunedIds.push(id);

    const isOverrideBoundary = !regionRootSet.has(id) && overrides[id] !== undefined;
    if (isOverrideBoundary) {
      const subMode = overrides[id];
      const subIds = collectAllowedSubtree(id, tree.childrenOf, regionSet);
      // Jalankan Pass 1 Bottom-Up secara rekursif jika ada nested override di dalam subtree ini
      const subGeo =
        subIds.length > 1
          ? solveCompositeRegion([id], subIds, subMode, tree, overrides, visible)
          : runSingleMindmapSolver(subMode, subIds, [id], childrenInRegion, tree.context, tree.projection);
      boundarySubtrees.set(id, subGeo);
      boundaryModes.set(id, subMode);
      // Hentikan ekspansi BFS: node ini menjadi proxy leaf bagi parent solver
      continue;
    }

    for (const child of childrenInRegion(id)) {
      if (!bfsSeen.has(child)) {
        queue.push(child);
      }
    }
  }

  // Sertakan node yatim (disconnected within region) agar tidak ada node yang hilang
  const hiddenInsideBoundary = new Set<string>();
  for (const [bId, subGeo] of boundarySubtrees.entries()) {
    for (const subId of subGeo.targets.keys()) {
      if (subId !== bId) hiddenInsideBoundary.add(subId);
    }
  }
  for (const id of regionIds) {
    if (!bfsSeen.has(id) && !hiddenInsideBoundary.has(id)) {
      bfsSeen.add(id);
      prunedIds.push(id);
    }
  }

  // Bangun proxy nodeMetrics: tiap boundarySubtree diukur sebagai kotak komposit utuhnya (termasuk dekorasi spine/rib/brace)
  const proxyMetrics = new Map<string, NodeMetric>(tree.context.nodeMetrics);
  for (const [bId, subGeo] of boundarySubtrees.entries()) {
    const subBounds = mergeBoundsWithDecorations(
      boundsOf(subGeo.targets, tree.context.nodeMetrics),
      subGeo.decorations
    );
    const crossPad = computeCrossStructureMargin(
      activeMode,
      boundaryModes.get(bId) ?? activeMode,
      tree.context.levelGap
    );
    const compositeW = Math.max(
      tree.context.nodeMetrics.get(bId)?.width ?? DEFAULT_METRIC.width,
      Math.ceil(subBounds.maxX - subBounds.minX + crossPad * 2)
    );
    const compositeH = Math.max(
      tree.context.nodeMetrics.get(bId)?.height ?? DEFAULT_METRIC.height,
      Math.ceil(subBounds.maxY - subBounds.minY + crossPad * 2)
    );
    proxyMetrics.set(bId, { width: compositeW, height: compositeH });
  }

  const prunedChildrenOf = (id: string) =>
    boundarySubtrees.has(id) ? [] : childrenInRegion(id).filter((c) => !hiddenInsideBoundary.has(c));

  const parentContext: LayoutContext = {
    ...tree.context,
    nodeMetrics: proxyMetrics,
  };

  // Pass 2 Top-Down: Parent solver menempatkan struktur induk sambil menghormati lebar/tinggi penuh proxy
  const parentGeo = runSingleMindmapSolver(
    activeMode,
    prunedIds,
    regionRoots,
    prunedChildrenOf,
    parentContext,
    tree.projection
  );

  // Resolusi awal pada prunedNodes menggunakan proxyMetrics agar antar-proxy maupun antar-saudara pasti bebas tabrakan
  const stabilizedParentTargets = resolveAABBCollisions({
    targets: parentGeo.targets,
    metrics: proxyMetrics,
    roots: regionRoots,
    childrenOf: prunedChildrenOf,
    mode: activeMode,
    minGap: Math.max(10, Math.round(tree.context.siblingGap * 0.35)),
    preserveSpineSide: activeMode === 'fishbone' || activeMode === 'timeline',
    maxIterations: 48,
  });

  const prunedParentMap = buildFallbackParentMap(prunedIds, prunedChildrenOf);
  const parentDepthMap = computeParentDepths(regionRoots, prunedChildrenOf);
  const finalTargets = new Map<string, NodeTarget>(stabilizedParentTargets);
  const finalDecorations: LayoutDecoration[] = parentGeo.decorations.map((d) =>
    syncMovedParentRib(d, stabilizedParentTargets)
  );
  const parentDecorationCount = finalDecorations.length;

  const blockOf = new Map<string, string>();
  const blockMembers = new Map<string, string[]>();
  const blockDepth = new Map<string, number>();
  const decorationsByBlock = new Map<string, number[]>();

  for (const id of stabilizedParentTargets.keys()) {
    if (!boundarySubtrees.has(id)) {
      blockOf.set(id, id);
      blockMembers.set(id, [id]);
      blockDepth.set(id, parentDepthMap.get(id) ?? 1);
    }
  }

  // Ekspansi setiap Composite Subtree ke dalam amplop kotak proxy-nya secara kaku (Rigid Block)
  for (const [bId, subGeo] of boundarySubtrees.entries()) {
    const anchorTarget = stabilizedParentTargets.get(bId);
    if (!anchorTarget) continue;

    const subMode = boundaryModes.get(bId) ?? activeMode;
    const subRootTarget = subGeo.targets.get(bId);
    const parentId = prunedParentMap.get(bId);
    const parentTarget = parentId ? stabilizedParentTargets.get(parentId) : undefined;
    const anchorSide = anchorTarget.side ?? 0;

    // Arah horizontal aktual relatif parent (tidak tertukar flag vertical lane pada Timeline)
    const anchorIsLeft =
      activeMode === 'mindmap' &&
      (anchorSide === -1 || (parentTarget ? anchorTarget.x < parentTarget.x - 1 : false));

    const mirrorX =
      subRootTarget && shouldMirrorHorizontalSubtree(activeMode, subMode, anchorIsLeft)
        ? subRootTarget.x
        : null;

    const orientedTargets = new Map<string, NodeTarget>();
    for (const [subId, t] of subGeo.targets.entries()) {
      const mirroredSide =
        mirrorX !== null && subMode !== 'timeline' ? flipHorizontalSide(t.side) : t.side;
      const resolvedSide =
        mirroredSide !== undefined
          ? mirroredSide
          : activeMode === 'mindmap' && anchorSide !== 0
            ? anchorSide
            : undefined;
      orientedTargets.set(subId, {
        ...t,
        x: mirrorX !== null ? 2 * mirrorX - t.x : t.x,
        ...(resolvedSide !== undefined ? { side: resolvedSide } : {}),
      });
    }

    const orientedDecorations = subGeo.decorations.map((dec) =>
      transformDecoration(dec, mirrorX, 0, 0)
    );
    const subBounds = mergeBoundsWithDecorations(
      boundsOf(orientedTargets, tree.context.nodeMetrics),
      orientedDecorations
    );
    const subCenterX = (subBounds.minX + subBounds.maxX) / 2;
    const subCenterY = (subBounds.minY + subBounds.maxY) / 2;
    const shiftX = anchorTarget.x - subCenterX;
    const shiftY = anchorTarget.y - subCenterY;

    const members: string[] = [];
    for (const [subId, t] of orientedTargets.entries()) {
      finalTargets.set(subId, {
        ...t,
        x: t.x + shiftX,
        y: t.y + shiftY,
      });
      blockOf.set(subId, bId);
      members.push(subId);
    }
    blockMembers.set(bId, members);
    blockDepth.set(bId, parentDepthMap.get(bId) ?? 1);

    const decIndices: number[] = [];
    for (const dec of orientedDecorations) {
      decIndices.push(finalDecorations.length);
      finalDecorations.push(transformDecoration(dec, null, shiftX, shiftY));
    }
    decorationsByBlock.set(bId, decIndices);
  }

  // Isolasi blok kaku: jika masih ada persinggungan, seluruh blok + dekorasinya bergeser bersama
  const verifiedTargets = resolveBlockAABBCollisions({
    targets: finalTargets,
    metrics: tree.context.nodeMetrics,
    blockOf,
    blockMembers,
    pinnedBlocks: new Set(regionRoots),
    blockDepth,
    mode: activeMode,
    minGap: 8,
    preserveSpineSide: activeMode === 'fishbone' || activeMode === 'timeline',
    maxIterations: 40,
    onShiftBlock: (moverBlock, dx, dy) => {
      const decIndices = decorationsByBlock.get(moverBlock);
      if (!decIndices) return;
      for (const idx of decIndices) {
        finalDecorations[idx] = transformDecoration(finalDecorations[idx], null, dx, dy);
      }
    },
    onShiftNode: (moverId, dx, dy) => {
      for (let i = 0; i < finalDecorations.length; i += 1) {
        const dec = finalDecorations[i];
        if (dec.kind !== 'fishbone-rib') continue;
        const matchSrc = !dec.major && dec.sourceId === moverId;
        const matchDst = dec.targetId === moverId;
        if (!matchSrc && !matchDst) continue;
        finalDecorations[i] = {
          ...dec,
          x1: matchSrc ? dec.x1 + dx : dec.x1,
          y1: matchSrc ? dec.y1 + dy : dec.y1,
          x2: matchDst ? dec.x2 + dx : dec.x2,
          y2: matchDst ? dec.y2 + dy : dec.y2,
        };
      }
    },
  });

  for (let i = 0; i < parentDecorationCount; i += 1) {
    finalDecorations[i] = syncMovedParentRib(finalDecorations[i], verifiedTargets);
  }

  return {
    mode: activeMode,
    targets: verifiedTargets,
    bounds: mergeBoundsWithDecorations(
      boundsOf(verifiedTargets, tree.context.nodeMetrics),
      finalDecorations
    ),
    decorations: finalDecorations,
  };
}

export interface CompositeLayoutExtras {
  boundaries?: BoundaryGroup[];
  summaries?: SummaryGroup[];
  manualOffsets?: Record<string, ManualNodeOffset>;
}

function buildFallbackParentMap(
  ids: string[],
  childrenOf: (id: string) => string[],
): Map<string, string | null> {
  const parentMap = new Map<string, string | null>();
  for (const id of ids) parentMap.set(id, null);
  for (const id of ids) {
    for (const child of childrenOf(id)) {
      parentMap.set(child, id);
    }
  }
  return parentMap;
}

/**
 * Entrypoint Two-Pass Composite Layout untuk seluruh pohon deterministik ObMap.
 */
export function computeCompositeMindmapLayout(
  rootMode: MindmapLayoutMode,
  tree: CompositeTreeData,
  overrides?: SubtreeLayoutMap,
  extras?: CompositeLayoutExtras,
): LayoutGeometry {
  if (tree.ids.length === 0) {
    return {
      mode: rootMode,
      targets: new Map(),
      bounds: boundsOf(new Map()),
      decorations: [],
    };
  }

  const visible = new Set(tree.ids);
  const visibleRoots = tree.roots.filter((r) => visible.has(r));
  const childrenInVisible = (id: string) => tree.childrenOf(id).filter((c) => visible.has(c));
  const effectiveOverrides: SubtreeLayoutMap = {};

  if (overrides) {
    for (const [nodeId, ovMode] of Object.entries(overrides)) {
      if (visible.has(nodeId)) {
        effectiveOverrides[nodeId] = ovMode;
      }
    }
  }

  const inflatedMetrics = inflateMetricsForBoundariesAndSummaries(
    tree.context.nodeMetrics,
    extras?.boundaries,
    extras?.summaries,
  );
  const workingTree: CompositeTreeData =
    inflatedMetrics === tree.context.nodeMetrics
      ? tree
      : { ...tree, context: { ...tree.context, nodeMetrics: inflatedMetrics } };

  // Jika root utama sendiri yang di-override, langsung pakai mode tersebut sebagai akar region
  const primaryRoot = visibleRoots[0];
  const effectiveRootMode =
    visibleRoots.length === 1 && primaryRoot && effectiveOverrides[primaryRoot]
      ? effectiveOverrides[primaryRoot]
      : rootMode;

  let baseGeo: LayoutGeometry;

  if (Object.keys(effectiveOverrides).length === 0) {
    const rawGeo = runSingleMindmapSolver(
      effectiveRootMode,
      workingTree.ids,
      visibleRoots,
      childrenInVisible,
      workingTree.context,
      workingTree.projection
    );
    const primaryAxis =
      effectiveRootMode === 'mindmap' && workingTree.context.orientation === 'radial'
        ? 'radial'
        : effectiveRootMode === 'org-chart'
          ? 'horizontal'
          : effectiveRootMode === 'mindmap' || effectiveRootMode === 'brace-map'
            ? 'vertical'
            : 'auto';
    const resolvedTargets =
      effectiveRootMode === 'fishbone'
        ? rawGeo.targets
        : resolveAABBCollisions({
            targets: rawGeo.targets,
            metrics: workingTree.context.nodeMetrics,
            roots: visibleRoots,
            childrenOf: childrenInVisible,
            mode: effectiveRootMode,
            minGap: 8,
            primaryAxis,
            preserveSpineSide: effectiveRootMode === 'timeline',
          });
    baseGeo = {
      ...rawGeo,
      targets: resolvedTargets,
      bounds: mergeBoundsWithDecorations(
        boundsOf(resolvedTargets, tree.context.nodeMetrics),
        rawGeo.decorations
      ),
    };
  } else {
    baseGeo = solveCompositeRegion(
      visibleRoots,
      workingTree.ids,
      effectiveRootMode,
      workingTree,
      effectiveOverrides,
      visible
    );
  }

  const flexTargets = applyFlexManualOffsets(
    baseGeo.targets,
    extras?.manualOffsets,
    childrenInVisible,
    visible,
    visibleRoots,
  );

  const fallbackParents = tree.projection
    ? null
    : buildFallbackParentMap(tree.ids, childrenInVisible);
  const parentOf = (id: string) =>
    tree.projection?.parentByChild.get(id) ?? fallbackParents?.get(id) ?? null;

  const hasDecorations =
    Boolean(extras?.boundaries?.length) || Boolean(extras?.summaries?.length);

  if (!hasDecorations && flexTargets === baseGeo.targets) {
    return baseGeo;
  }

  const solvedExtras = hasDecorations
    ? solveBoundariesAndSummaries({
        targets: flexTargets,
        metrics: tree.context.nodeMetrics,
        roots: visibleRoots,
        childrenOf: childrenInVisible,
        parentOf,
        visible,
        mode: effectiveRootMode,
        boundaries: extras?.boundaries,
        summaries: extras?.summaries,
      })
    : {
        targets:
          flexTargets !== baseGeo.targets
            ? resolveAABBCollisions({
                targets: flexTargets,
                metrics: tree.context.nodeMetrics,
                roots: visibleRoots,
                childrenOf: childrenInVisible,
                mode: effectiveRootMode,
                minGap: 8,
                preserveSpineSide:
                  effectiveRootMode === 'fishbone' || effectiveRootMode === 'timeline',
              })
            : flexTargets,
        decorations: [],
      };

  const allDecorations = [...baseGeo.decorations, ...solvedExtras.decorations];
  const nodeBounds = boundsOf(solvedExtras.targets, tree.context.nodeMetrics);

  return {
    mode: baseGeo.mode,
    targets: solvedExtras.targets,
    decorations: allDecorations,
    bounds: mergeBoundsWithDecorations(nodeBounds, allDecorations),
  };
}
