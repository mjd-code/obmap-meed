import type { Node, Link } from '@/global/types';
import type { RenderNode, RenderLink } from '@/domains/graph/shared/utils/graph.types';
import type { GraphConfigState } from '@/domains/graph/shared/stores/useGraphStore';

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
    const val = typeof node.val === 'number' ? node.val : 8;

    if (x - val < minX) minX = x - val;
    if (x + val > maxX) maxX = x + val;
    if (y - val < minY) minY = y - val;
    if (y + val > maxY) maxY = y + val;
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
        val: cached.val ?? 10,
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
        val: 10,
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
  if (!config.topology?.linkVisibility) return true;
  return config.topology.linkVisibility[type] !== false;
};