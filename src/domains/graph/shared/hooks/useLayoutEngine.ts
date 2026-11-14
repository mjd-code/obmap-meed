/**
 * Single entry point for deterministic layout: picks a strategy, runs it in a
 * memo over a stable signature and returns geometry only (never React state).
 */

import { useMemo } from 'react';
import {
  MINDMAP_LAYOUT_MODES,
  type BoundaryGroup,
  type GraphProjection,
  type LayoutContext,
  type LayoutGeometry,
  type LayoutMode,
  type ManualNodeOffset,
  type MindmapLayoutMode,
  type MindmapOrientation,
  type NodeMetric,
  type SubtreeLayoutMap,
  type SummaryGroup,
} from '@/domains/graph/shared/utils/graph.types';
import { computeCompositeMindmapLayout } from '@/domains/graph/shared/utils/compositeLayoutEngine';
import { buildLayoutSignature } from '@/domains/graph/shared/utils/cascadingStyleResolver';
import { freeForceLayout } from '@/domains/graph/shared/utils/freeForce';
import { fruchtermanReingoldLayout, gridLayout, kamadaKawaiLayout } from '@/domains/graph/shared/utils/networkLayouts';

export interface LayoutEngineOptions {
  mode: LayoutMode;
  width: number;
  height: number;
  orientation: MindmapOrientation;
  levelGap: number;
  siblingGap: number;
  laneGap: number;
  ribAngle: number;
  rootId?: string;
  visibleIds: string[];
  nodeMetrics: Map<string, NodeMetric>;
  subtreeOverrides?: SubtreeLayoutMap;
  boundaries?: BoundaryGroup[];
  summaries?: SummaryGroup[];
  manualOffsets?: Record<string, ManualNodeOffset>;
}

export function computeLayout(
  projection: GraphProjection,
  options: LayoutEngineOptions
): LayoutGeometry {
  const context: LayoutContext = {
    width: options.width,
    height: options.height,
    rootId: options.rootId,
    orientation: options.orientation,
    levelGap: options.levelGap,
    siblingGap: options.siblingGap,
    laneGap: options.laneGap,
    ribAngle: options.ribAngle,
    nodeMetrics: options.nodeMetrics,
  };

  const visible = new Set(options.visibleIds);
  const childrenOf = (id: string) =>
    (projection.childrenByParent.get(id) ?? []).filter((child) => visible.has(child));
  const roots = options.visibleIds.filter((id) => {
    const parent = projection.parentByChild.get(id) ?? null;
    return !parent || !visible.has(parent);
  });

  const endpoint = (end: unknown) =>
    typeof end === 'string' ? end : (end as { id?: string } | null)?.id ?? '';
  const network = () => ({
    ids: options.visibleIds,
    edges: projection.links
      .map((link) => [endpoint(link.source), endpoint(link.target)] as [string, string])
      .filter(([a, b]) => visible.has(a) && visible.has(b)),
    context,
  });
  const tree = {
    ids: options.visibleIds,
    roots,
    childrenOf,
    context,
    projection: {
      byId: projection.byId,
      parentByChild: projection.parentByChild,
    },
  };

  if ((MINDMAP_LAYOUT_MODES as string[]).includes(options.mode)) {
    return computeCompositeMindmapLayout(
      options.mode as MindmapLayoutMode,
      tree,
      options.subtreeOverrides,
      {
        boundaries: options.boundaries,
        summaries: options.summaries,
        manualOffsets: options.manualOffsets,
      },
    );
  }

  switch (options.mode) {
    case 'fr-standard':
      return fruchtermanReingoldLayout(network(), false);
    case 'fr-radial':
      return fruchtermanReingoldLayout(network(), true);
    case 'kamada-kawai':
      return kamadaKawaiLayout(network());
    case 'grid':
      return gridLayout(network(), (id) => projection.byId.get(id)?.name ?? id);
    case 'free-force':
      return freeForceLayout();
    default:
      return computeCompositeMindmapLayout('mindmap', tree, options.subtreeOverrides, {
        boundaries: options.boundaries,
        summaries: options.summaries,
        manualOffsets: options.manualOffsets,
      });
  }
}

function digestMetrics(ids: string[], nodeMetrics: Map<string, NodeMetric>): string {
  let wSum = 0;
  let hSum = 0;
  for (let i = 0; i < ids.length; i += 1) {
    const m = nodeMetrics.get(ids[i]);
    if (m) {
      wSum += Math.round(m.width) * ((i % 7) + 1);
      hSum += Math.round(m.height) * ((i % 5) + 1);
    }
  }
  return `${nodeMetrics.size}:${wSum}:${hSum}`;
}

export function useLayoutEngine(
  projection: GraphProjection,
  options: LayoutEngineOptions
): LayoutGeometry {
  const metricDigest = digestMetrics(options.visibleIds, options.nodeMetrics);
  const signature = buildLayoutSignature({
    mode: options.mode,
    orientation: options.orientation,
    rootId: options.rootId,
    width: options.width,
    height: options.height,
    levelGap: options.levelGap,
    siblingGap: options.siblingGap,
    laneGap: options.laneGap,
    ribAngle: options.ribAngle,
    visibleIds: options.visibleIds,
    linksCount: projection.links.length,
    metricDigest,
    subtreeOverrides: options.subtreeOverrides,
    boundaries: options.boundaries,
    summaries: options.summaries,
    manualOffsets: options.manualOffsets,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => computeLayout(projection, options), [signature, projection]);
}
