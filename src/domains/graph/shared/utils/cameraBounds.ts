import type { Node, Link, RenderNode, RenderLink } from '@/domains/graph/shared/utils/graph.types';
import type { GraphConfigState } from '@/domains/graph/shared/stores/useGraphStore';
import { isDeterministicLayout } from '@/domains/graph/shared/utils/layoutCategory';

export interface GraphCameraBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface DynamicCameraBoundsOptions {
  viewportWidth: number;
  viewportHeight: number;
  minPadding?: number;
  maxPadding?: number;
  paddingRatio?: number;
}

const DEFAULT_NODE_BOUNDS_MARGIN = 10;

export function calculateCameraBounds(
  nodes: RenderNode[],
  options: DynamicCameraBoundsOptions,
): GraphCameraBounds & { dynamicPadding: number } {
  if (nodes.length === 0) {
    return {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      width: 0,
      height: 0,
      centerX: 0,
      centerY: 0,
      dynamicPadding: options.minPadding ?? 48,
    };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const x = typeof node.x === 'number' ? node.x : 0;
    const y = typeof node.y === 'number' ? node.y : 0;
    const margin = DEFAULT_NODE_BOUNDS_MARGIN;

    if (x - margin < minX) minX = x - margin;
    if (x + margin > maxX) maxX = x + margin;
    if (y - margin < minY) minY = y - margin;
    if (y + margin > maxY) maxY = y + margin;
  }

  const rawWidth = Math.max(1, maxX - minX);
  const rawHeight = Math.max(1, maxY - minY);

  const paddingRatio = options.paddingRatio ?? 0.12;
  const minPad = options.minPadding ?? 40;
  const maxPad = options.maxPadding ?? 140;

  const shortestScreenSide = Math.min(options.viewportWidth, options.viewportHeight);
  const dynamicPadding = Math.max(minPad, Math.min(maxPad, shortestScreenSide * paddingRatio));

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: rawWidth,
    height: rawHeight,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    dynamicPadding,
  };
}

export function seedInitialNodePositions(
  nodes: Node[],
  existingCache: Map<string, RenderNode>,
): RenderNode[] {
  const result: RenderNode[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < nodes.length; i++) {
    const raw = nodes[i];
    const cached = existingCache.get(raw.id);

    if (cached && typeof cached.x === 'number' && typeof cached.y === 'number') {
      result.push({
        ...raw,
        x: cached.x,
        y: cached.y,
        vx: cached.vx ?? 0,
        vy: cached.vy ?? 0,
        childCount: cached.childCount ?? 0,
      } as RenderNode);
    } else {
      const radius = 22 * Math.sqrt(i + 1);
      const theta = i * goldenAngle;
      const x = radius * Math.cos(theta);
      const y = radius * Math.sin(theta);

      result.push({
        ...raw,
        x,
        y,
        vx: 0,
        vy: 0,
        childCount: 0,
      } as RenderNode);
    }
  }

  return result;
}

export function resolveAncestorsToUncollapse(
  targetId: string,
  links: Link[],
  collapsedIds: Set<string>,
): string[] {
  const toUncollapse: string[] = [];
  const visited = new Set<string>();
  let currentId: string | null = targetId;

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const parentLink = links.find((l) => {
      const target = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return target === currentId;
    });

    if (!parentLink) break;
    const parentId = typeof parentLink.source === 'object' ? (parentLink.source as any).id : parentLink.source;

    if (parentId && collapsedIds.has(parentId)) {
      toUncollapse.push(parentId);
    }
    currentId = parentId ?? null;
  }

  return toUncollapse;
}

export const dashFor = (style: string | undefined, width: number): number[] => {
  if (style === 'dashed') return [width * 3, width * 2];
  if (style === 'dotted') return [width, width * 1.5];
  return [];
};

export const topologyEnabled = (type: RenderLink['type'], config: GraphConfigState): boolean => {
  if (!config.topology) return true;
  if (type === 'hierarchy') return config.topology.showHierarchy ?? true;
  if (type === 'backlink') return config.topology.showBacklinks ?? true;
  if (type === 'tag') return config.topology.showTags ?? true;
  return true;
};

export interface AdaptiveCameraLimits {
  minZoom: number;
  panBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export interface AdaptiveCameraLimitsOptions {
  nodes: Array<{ x?: number; y?: number }>;
  viewportWidth: number;
  viewportHeight: number;
  layoutMode: string;
  orientation?: string;
  geometryBounds?: { minX: number; maxX: number; minY: number; maxY: number } | null;
}

/** Menghitung batas zoom-out & panning adaptif berbasis geometri nyata layout. */
export function calculateAdaptiveCameraLimits({
  nodes,
  viewportWidth,
  viewportHeight,
  layoutMode,
  orientation,
  geometryBounds,
}: AdaptiveCameraLimitsOptions): AdaptiveCameraLimits {
  const fallback: AdaptiveCameraLimits = {
    minZoom: 0.1,
    panBounds: { minX: -2000, maxX: 2000, minY: -2000, maxY: 2000 },
  };

  if (viewportWidth === 0 || viewportHeight === 0) return fallback;

  let rawMinX = geometryBounds?.minX ?? Infinity;
  let rawMaxX = geometryBounds?.maxX ?? -Infinity;
  let rawMinY = geometryBounds?.minY ?? Infinity;
  let rawMaxY = geometryBounds?.maxY ?? -Infinity;

  if (nodes && nodes.length > 0) {
    for (const node of nodes) {
      const nx = node.x ?? 0;
      const ny = node.y ?? 0;
      if (nx < rawMinX) rawMinX = nx;
      if (nx > rawMaxX) rawMaxX = nx;
      if (ny < rawMinY) rawMinY = ny;
      if (ny > rawMaxY) rawMaxY = ny;
    }
  }

  if (!Number.isFinite(rawMinX) || !Number.isFinite(rawMaxX) || rawMinX === Infinity) {
    return fallback;
  }

  const contentWidth = Math.max(80, rawMaxX - rawMinX + 160);
  const contentHeight = Math.max(80, rawMaxY - rawMinY + 160);
  const fitScale = Math.min(viewportWidth / contentWidth, viewportHeight / contentHeight);
  const minZoom = Math.max(0.0005, Math.min(fitScale / 1.7, 1.2));

  let marginX = 0;
  let marginY = 0;

  switch (layoutMode) {
    case 'brace-map':
      marginY = Math.min(viewportHeight * 0.45, Math.max(120, contentHeight * 0.04));
      marginX = Math.max(viewportWidth * 0.5, contentWidth * 0.35);
      break;
    case 'org-chart':
      marginX = Math.min(viewportWidth * 0.45, Math.max(120, contentWidth * 0.04));
      marginY = Math.max(viewportHeight * 0.5, contentHeight * 0.35);
      break;
    case 'timeline':
    case 'fishbone':
      marginX = Math.min(viewportWidth * 0.45, Math.max(160, contentWidth * 0.06));
      marginY = Math.max(viewportHeight * 0.5, contentHeight * 0.35);
      break;
    case 'mindmap':
      if (orientation === 'radial') {
        marginX = Math.max(viewportWidth * 0.4, contentWidth * 0.2);
        marginY = Math.max(viewportHeight * 0.4, contentHeight * 0.2);
      } else {
        marginX = Math.max(viewportWidth * 0.45, contentWidth * 0.25);
        marginY = Math.min(viewportHeight * 0.45, Math.max(140, contentHeight * 0.08));
      }
      break;
    default:
      marginX = Math.max(viewportWidth * 0.4, contentWidth * 0.2);
      marginY = Math.max(viewportHeight * 0.4, contentHeight * 0.2);
      break;
  }

  return {
    minZoom,
    panBounds: {
      minX: rawMinX - marginX,
      maxX: rawMaxX + marginX,
      minY: rawMinY - marginY,
      maxY: rawMaxY + marginY,
    },
  };
}

/** Menginisialisasi koordinat awal node baru/expand dari posisi parent-nya. */
export function seedDeterministicNodePositions(
  nodes: RenderNode[],
  parentByChild: Map<string, string | null>,
  nodeCache: Map<string, RenderNode>,
  targets: Map<string, { x: number; y: number }>,
  layoutMode: string,
): void {
  for (const node of nodes) {
    const target = targets.get(node.id);
    if (!target) continue;

    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) {
      const parentId = parentByChild.get(node.id) ?? null;
      const parentNode = parentId ? nodeCache.get(parentId) : null;

      const seedX = Number.isFinite(parentNode?.x)
        ? parentNode!.x!
        : Number.isFinite(parentNode?.fx)
          ? parentNode!.fx!
          : 0;
      const seedY = Number.isFinite(parentNode?.y)
        ? parentNode!.y!
        : Number.isFinite(parentNode?.fy)
          ? parentNode!.fy!
          : 0;

      node.x = seedX;
      node.y = seedY;
      if (isDeterministicLayout(layoutMode)) {
        node.fx = seedX;
        node.fy = seedY;
      }
    }
  }
}

/** Melacak ancestor yang sedang collapsed untuk sebuah node target. */
export function resolveAncestorsFromMap(
  targetId: string,
  parentByChild: Map<string, string | null>,
  collapsedIds: string[],
): string[] {
  const result: string[] = [];
  const visited = new Set<string>();
  let currId = parentByChild.get(targetId) ?? null;

  while (currId && !visited.has(currId)) {
    visited.add(currId);
    if (collapsedIds.includes(currId)) {
      result.push(currId);
    }
    currId = parentByChild.get(currId) ?? null;
  }

  return result;
}