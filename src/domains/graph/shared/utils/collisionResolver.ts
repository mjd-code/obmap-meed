/**
 * Sweep-and-Prune AABB Collision Detector & Deterministic Resolver.
 *
 * Guarantees strict Zero-AABB Overlap across balanced/radial mindmaps,
 * tidy trees, timelines, fishbones, and mixed multi-structure compositions.
 */

import type { LayoutMode, NodeMetric, NodeTarget } from '@/domains/graph/shared/utils/graph.types';

export interface AABBOverlap {
  idA: string;
  idB: string;
  overlapX: number;
  overlapY: number;
}

export interface ResolveCollisionsOptions {
  targets: Map<string, NodeTarget>;
  metrics: Map<string, NodeMetric>;
  roots: string[];
  childrenOf?: (id: string) => string[];
  mode?: LayoutMode;
  defaultMetric?: NodeMetric;
  minGap?: number;
  primaryAxis?: 'vertical' | 'horizontal' | 'radial' | 'auto';
  preserveSpineSide?: boolean;
  maxIterations?: number;
}

export interface ResolveBlockCollisionsOptions {
  targets: Map<string, NodeTarget>;
  metrics: Map<string, NodeMetric>;
  blockOf: Map<string, string>;
  blockMembers: Map<string, string[]>;
  pinnedBlocks: Set<string>;
  blockDepth: Map<string, number>;
  mode?: LayoutMode;
  defaultMetric?: NodeMetric;
  minGap?: number;
  primaryAxis?: 'vertical' | 'horizontal' | 'radial' | 'auto';
  preserveSpineSide?: boolean;
  maxIterations?: number;
  onShiftBlock?: (blockId: string, dx: number, dy: number) => void;
  onShiftNode?: (nodeId: string, dx: number, dy: number) => void;
}

const DEFAULT_METRIC: NodeMetric = { width: 140, height: 38 };

function boxOf(
  id: string,
  target: NodeTarget,
  metrics: Map<string, NodeMetric>,
  fallback: NodeMetric
) {
  const m = metrics.get(id) ?? fallback;
  return {
    id,
    x: target.x,
    y: target.y,
    w: Math.max(1, m.width),
    h: Math.max(1, m.height),
    halfW: Math.max(0.5, m.width / 2),
    halfH: Math.max(0.5, m.height / 2),
  };
}

/**
 * O(N log N) Sweep-and-Prune AABB overlap detector for center-anchored nodes.
 */
export function findAABBOverlaps(
  targets: Map<string, NodeTarget>,
  metrics: Map<string, NodeMetric>,
  defaultMetric: NodeMetric = DEFAULT_METRIC,
  padding = 0
): AABBOverlap[] {
  const boxes = Array.from(targets.entries())
    .filter(([, t]) => Number.isFinite(t.x) && Number.isFinite(t.y))
    .map(([id, target]) => {
      const b = boxOf(id, target, metrics, defaultMetric);
      return {
        ...b,
        minX: b.x - b.halfW - padding / 2,
        maxX: b.x + b.halfW + padding / 2,
      };
    })
    .sort((a, b) => a.minX - b.minX || a.y - b.y || a.id.localeCompare(b.id));

  const overlaps: AABBOverlap[] = [];

  for (let i = 0; i < boxes.length; i += 1) {
    const a = boxes[i];
    for (let j = i + 1; j < boxes.length; j += 1) {
      const b = boxes[j];
      // Sweep-and-prune early exit on sorted minX
      if (b.minX >= a.maxX - 1e-6) break;

      const reqX = a.halfW + b.halfW + padding;
      const reqY = a.halfH + b.halfH + padding;
      const overlapX = reqX - Math.abs(a.x - b.x);
      const overlapY = reqY - Math.abs(a.y - b.y);

      if (overlapX > 1e-4 && overlapY > 1e-4) {
        overlaps.push({
          idA: a.id,
          idB: b.id,
          overlapX,
          overlapY,
        });
      }
    }
  }

  return overlaps;
}

function buildDepthMap(
  roots: string[],
  ids: Iterable<string>,
  childrenOf?: (id: string) => string[]
): Map<string, number> {
  const depth = new Map<string, number>();
  const queue: Array<[string, number]> = [];
  for (const r of roots) {
    if (!depth.has(r)) {
      depth.set(r, 0);
      queue.push([r, 0]);
    }
  }
  while (queue.length > 0 && childrenOf) {
    const [cur, d] = queue.shift()!;
    for (const child of childrenOf(cur)) {
      if (!depth.has(child)) {
        depth.set(child, d + 1);
        queue.push([child, d + 1]);
      }
    }
  }
  for (const id of ids) {
    if (!depth.has(id)) depth.set(id, 1);
  }
  return depth;
}

function resolveAxisPreference(
  primaryAxis: 'vertical' | 'horizontal' | 'radial' | 'auto',
  mode?: LayoutMode
): 'vertical' | 'horizontal' | 'radial' | 'auto' {
  if (primaryAxis !== 'auto') return primaryAxis;
  if (mode === 'org-chart') return 'horizontal';
  if (mode === 'mindmap' || mode === 'brace-map') return 'vertical';
  return 'auto';
}

function computeSeparationShift(
  stationary: NodeTarget,
  mover: NodeTarget,
  overlapX: number,
  overlapY: number,
  axis: 'vertical' | 'horizontal' | 'radial' | 'auto',
  preserveSpineSide: boolean
): { dx: number; dy: number } {
  const dx = mover.x - stationary.x;
  const dy = mover.y - stationary.y;
  const pushX = (dx >= 0 ? 1 : -1) * (overlapX + 0.5);
  const defaultDirY = dy >= 0 ? 1 : -1;
  const spineSign = preserveSpineSide && Math.abs(mover.y) > 1e-3 ? Math.sign(mover.y) : defaultDirY;
  const pushY =
    preserveSpineSide && Math.abs(mover.y) > 1e-3
      ? spineSign * (overlapY + 0.5)
      : defaultDirY * (overlapY + 0.5);

  if (axis === 'radial') {
    const angle = Math.atan2(mover.y, mover.x);
    const step = Math.min(overlapX, overlapY) + 1;
    const rx = Math.abs(Math.cos(angle)) > 0.01 ? Math.cos(angle) : 1;
    const ry = Math.sin(angle);
    return { dx: rx * step, dy: ry * step };
  }
  if (axis === 'vertical') {
    if (preserveSpineSide && mover.y * (mover.y + pushY) < 0) {
      return { dx: mover.side === -1 ? -(overlapX + 0.5) : overlapX + 0.5, dy: 0 };
    }
    if (overlapY <= overlapX * 2.2) {
      return { dx: 0, dy: pushY };
    }
    return { dx: mover.side === -1 ? -(overlapX + 0.5) : pushX, dy: 0 };
  }
  if (axis === 'horizontal') {
    if (overlapX <= overlapY * 2.2) {
      return { dx: pushX, dy: 0 };
    }
    return { dx: 0, dy: pushY };
  }
  if (overlapX < overlapY) {
    return { dx: mover.side === -1 && Math.abs(dx) < 1 ? -(overlapX + 0.5) : pushX, dy: 0 };
  }
  const candidateY = mover.y + pushY;
  if (preserveSpineSide && Math.abs(mover.y) > 1e-3 && Math.sign(candidateY) !== Math.sign(mover.y)) {
    return { dx: overlapX + 0.5, dy: 0 };
  }
  return { dx: 0, dy: pushY };
}

/**
 * Deterministic iterative Sweep-and-Prune resolver that pushes colliding boxes apart
 * along the layout's stacking axis while keeping root anchors pinned.
 */
export function resolveAABBCollisions({
  targets,
  metrics,
  roots,
  childrenOf,
  mode,
  defaultMetric = DEFAULT_METRIC,
  minGap = 10,
  primaryAxis = 'auto',
  preserveSpineSide = false,
  maxIterations = 24,
}: ResolveCollisionsOptions): Map<string, NodeTarget> {
  if (targets.size <= 1) return targets;

  const resolved = new Map<string, NodeTarget>();
  for (const [id, t] of targets.entries()) {
    resolved.set(id, { ...t });
  }

  const pinnedSet = new Set(roots);
  const depthMap = buildDepthMap(roots, resolved.keys(), childrenOf);
  const axis = resolveAxisPreference(primaryAxis, mode);

  for (let iter = 0; iter < maxIterations; iter += 1) {
    const overlaps = findAABBOverlaps(resolved, metrics, defaultMetric, minGap);
    if (overlaps.length === 0) break;

    let movedAny = false;

    for (const { idA, idB } of overlaps) {
      const tA = resolved.get(idA);
      const tB = resolved.get(idB);
      if (!tA || !tB) continue;

      const bA = boxOf(idA, tA, metrics, defaultMetric);
      const bB = boxOf(idB, tB, metrics, defaultMetric);
      const liveOverlapX = bA.halfW + bB.halfW + minGap - Math.abs(bA.x - bB.x);
      const liveOverlapY = bA.halfH + bB.halfH + minGap - Math.abs(bA.y - bB.y);
      if (liveOverlapX <= 1e-4 || liveOverlapY <= 1e-4) continue;

      const pinA = pinnedSet.has(idA);
      const pinB = pinnedSet.has(idB);
      const depthA = depthMap.get(idA) ?? 1;
      const depthB = depthMap.get(idB) ?? 1;

      let moverId = idB;
      let stationary = tA;
      let mover = tB;
      if (pinB && !pinA) {
        moverId = idA;
        stationary = tB;
        mover = tA;
      } else if (!pinA && !pinB && depthA > depthB) {
        moverId = idA;
        stationary = tB;
        mover = tA;
      }

      const { dx, dy } = computeSeparationShift(
        stationary,
        mover,
        liveOverlapX,
        liveOverlapY,
        axis,
        preserveSpineSide
      );

      resolved.set(moverId, { ...mover, x: mover.x + dx, y: mover.y + dy });
      movedAny = true;
    }

    if (!movedAny) break;
  }

  return resolved;
}

/**
 * Rigid Subtree Block Sweep-and-Prune resolver: never splits nodes within the same
 * composite subtree block apart, and shifts every member node + decoration together.
 */
export function resolveBlockAABBCollisions({
  targets,
  metrics,
  blockOf,
  blockMembers,
  pinnedBlocks,
  blockDepth,
  mode,
  defaultMetric = DEFAULT_METRIC,
  minGap = 8,
  primaryAxis = 'auto',
  preserveSpineSide = false,
  maxIterations = 40,
  onShiftBlock,
  onShiftNode,
}: ResolveBlockCollisionsOptions): Map<string, NodeTarget> {
  if (targets.size <= 1) return targets;

  const resolved = new Map<string, NodeTarget>();
  for (const [id, t] of targets.entries()) {
    resolved.set(id, { ...t });
  }

  const axis = resolveAxisPreference(primaryAxis, mode);

  for (let iter = 0; iter < maxIterations; iter += 1) {
    const overlaps = findAABBOverlaps(resolved, metrics, defaultMetric, minGap);
    if (overlaps.length === 0) break;

    let movedAny = false;

    for (const { idA, idB } of overlaps) {
      const tA = resolved.get(idA);
      const tB = resolved.get(idB);
      if (!tA || !tB) continue;

      const bA = boxOf(idA, tA, metrics, defaultMetric);
      const bB = boxOf(idB, tB, metrics, defaultMetric);
      const liveOverlapX = bA.halfW + bB.halfW + minGap - Math.abs(bA.x - bB.x);
      const liveOverlapY = bA.halfH + bB.halfH + minGap - Math.abs(bA.y - bB.y);
      if (liveOverlapX <= 1e-4 || liveOverlapY <= 1e-4) continue;

      const blockA = blockOf.get(idA) ?? idA;
      const blockB = blockOf.get(idB) ?? idB;

      if (blockA === blockB) {
        // Pengaman jaring internal apabila ada overlap yang bertahan di dalam blok tunggal
        const depthA = blockDepth.get(idA) ?? 1;
        const depthB = blockDepth.get(idB) ?? 1;
        let moverId = idB;
        let stationary = tA;
        let mover = tB;
        if (blockA === idA || (blockA !== idB && depthA > depthB)) {
          moverId = idB;
          stationary = tA;
          mover = tB;
        } else if (blockA === idB) {
          moverId = idA;
          stationary = tB;
          mover = tA;
        }
        const { dx, dy } = computeSeparationShift(
          stationary,
          mover,
          liveOverlapX,
          liveOverlapY,
          axis,
          preserveSpineSide
        );
        resolved.set(moverId, { ...mover, x: mover.x + dx, y: mover.y + dy });
        onShiftNode?.(moverId, dx, dy);
        movedAny = true;
        continue;
      }

      const pinA = pinnedBlocks.has(blockA);
      const pinB = pinnedBlocks.has(blockB);
      const depthA = blockDepth.get(blockA) ?? 1;
      const depthB = blockDepth.get(blockB) ?? 1;

      let moverBlock = blockB;
      let stationary = tA;
      let mover = tB;
      if (pinB && !pinA) {
        moverBlock = blockA;
        stationary = tB;
        mover = tA;
      } else if (!pinA && !pinB && depthA > depthB) {
        moverBlock = blockA;
        stationary = tB;
        mover = tA;
      }

      const { dx, dy } = computeSeparationShift(
        stationary,
        mover,
        liveOverlapX,
        liveOverlapY,
        axis,
        preserveSpineSide
      );

      const members = blockMembers.get(moverBlock) ?? [moverBlock];
      for (const mId of members) {
        const mTarget = resolved.get(mId);
        if (mTarget) {
          resolved.set(mId, { ...mTarget, x: mTarget.x + dx, y: mTarget.y + dy });
        }
      }
      onShiftBlock?.(moverBlock, dx, dy);
      movedAny = true;
    }

    if (!movedAny) break;
  }

  return resolved;
}
