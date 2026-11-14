/**
 * Subtree Layout Composition.
 * Allows specific branches in a mindmap tree to override their layout engine
 * (e.g. root is 'mindmap', but branch 'Project A' is 'brace-map' or 'org-chart').
 */

import type {
  LayoutContext,
  LayoutGeometry,
  LayoutMode,
  MindmapLayoutMode,
  SubtreeLayoutMap,
} from '@/domains/graph/shared/utils/graph.types';
import {
  computeCompositeMindmapLayout,
  runSingleMindmapSolver,
} from '@/domains/graph/shared/utils/compositeLayoutEngine';
import { MINDMAP_LAYOUT_MODES } from '@/domains/graph/shared/utils/graph.types';

export interface TreeData {
  ids: string[];
  roots: string[];
  childrenOf: (id: string) => string[];
  context: LayoutContext;
  projection?: {
    byId: Map<string, { time?: number }>;
    parentByChild: Map<string, string | null>;
  };
}

/**
 * Mengambil semua node keturunan (descendants) dari suatu root cabang secara rekursif.
 */
export function collectSubtreeIds(
  rootId: string,
  childrenOf: (id: string) => string[],
  visible: Set<string>
): string[] {
  const result: string[] = [rootId];
  const queue: string[] = [...childrenOf(rootId).filter((c) => visible.has(c))];
  const visited = new Set<string>([rootId]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    result.push(current);
    for (const child of childrenOf(current)) {
      if (visible.has(child) && !visited.has(child)) {
        queue.push(child);
      }
    }
  }

  return result;
}

/**
 * Menjalankan layout struktural tertentu untuk subtree yang terisolasi.
 */
export { runSingleMindmapSolver };

/**
 * Resolves the effective layout mode for a node by walking up ancestors for the nearest subtree override.
 */
export function resolveNodeSubtreeMode(
  nodeId: string,
  baseMode: LayoutMode,
  parentByChild: Map<string, string | null>,
  overrides?: SubtreeLayoutMap,
): LayoutMode {
  if (!overrides || Object.keys(overrides).length === 0) return baseMode;
  let current: string | null | undefined = nodeId;
  const visited = new Set<string>();
  while (current && !visited.has(current)) {
    const override = overrides[current];
    if (override) return override;
    visited.add(current);
    current = parentByChild.get(current) ?? null;
  }
  return baseMode;
}

/**
 * Menggabungkan layout dasar dengan subtree yang memiliki layout override
 * menggunakan Two-Pass Bottom-Up Encapsulation Engine.
 */
export function composeSubtreeLayouts(
  baseGeometry: LayoutGeometry,
  tree: TreeData,
  overrides?: SubtreeLayoutMap
): LayoutGeometry {
  if (!overrides || Object.keys(overrides).length === 0) {
    return baseGeometry;
  }

  const rootMode: MindmapLayoutMode = (MINDMAP_LAYOUT_MODES as string[]).includes(baseGeometry.mode)
    ? (baseGeometry.mode as MindmapLayoutMode)
    : 'mindmap';

  return computeCompositeMindmapLayout(rootMode, tree, overrides);
}