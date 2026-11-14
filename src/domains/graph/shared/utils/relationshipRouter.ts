/**
 * Obstacle-Avoiding Cubic Bezier Router for Mindmap cross-branch `[[wikilinks]]`
 * and manual `RelationshipEdge` connectors.
 *
 * Samples intermediate card AABBs along candidate Bezier arcs and automatically
 * expands perpendicular corridor control points `(c1, c2)` until the curve avoids
 * all non-endpoint obstacles by at least `clearance` pixels.
 */

import type { LayoutPoint } from '@/domains/graph/shared/utils/graph.types';
import { anchorOnCard } from '@/domains/graph/shared/utils/layoutMath';

export interface ObstacleBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoutedRelationshipGeometry {
  p0: LayoutPoint;
  c1: LayoutPoint;
  c2: LayoutPoint;
  p3: LayoutPoint;
  midPoint: LayoutPoint;
  avoidedObstacleIds: string[];
  pointAt: (t: number) => LayoutPoint;
  tangentAt: (t: number) => number;
}

export interface RouteRelationshipParams {
  source: ObstacleBox;
  target: ObstacleBox;
  obstacles: ObstacleBox[];
  clearance?: number;
  curvatureOffset?: LayoutPoint;
}

export function cubicPoint(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

export function cubicTangent(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t;
  return 3 * u * u * (p1 - p0) + 6 * u * t * (p2 - p1) + 3 * t * t * (p3 - p2);
}

/**
 * Checks whether a cubic Bezier curve enters any obstacle box expanded by `clearance`.
 */
export function findCurveObstacleHits(
  p0: LayoutPoint,
  c1: LayoutPoint,
  c2: LayoutPoint,
  p3: LayoutPoint,
  obstacles: ObstacleBox[],
  excludeIds: Set<string>,
  clearance = 24,
  samples = 24,
): ObstacleBox[] {
  const hits = new Map<string, ObstacleBox>();
  if (obstacles.length === 0) return [];

  for (let i = 1; i < samples; i += 1) {
    const t = 0.08 + ((0.92 - 0.08) * i) / samples;
    const x = cubicPoint(p0.x, c1.x, c2.x, p3.x, t);
    const y = cubicPoint(p0.y, c1.y, c2.y, p3.y, t);

    for (const box of obstacles) {
      if (excludeIds.has(box.id) || hits.has(box.id)) continue;
      const halfW = box.width / 2 + clearance;
      const halfH = box.height / 2 + clearance;
      if (
        x >= box.x - halfW &&
        x <= box.x + halfW &&
        y >= box.y - halfH &&
        y <= box.y + halfH
      ) {
        hits.set(box.id, box);
      }
    }
  }

  return Array.from(hits.values());
}

function buildGeometry(
  p0: LayoutPoint,
  c1: LayoutPoint,
  c2: LayoutPoint,
  p3: LayoutPoint,
  avoidedObstacleIds: string[],
): RoutedRelationshipGeometry {
  const pointAt = (t: number): LayoutPoint => ({
    x: cubicPoint(p0.x, c1.x, c2.x, p3.x, t),
    y: cubicPoint(p0.y, c1.y, c2.y, p3.y, t),
  });
  const tangentAt = (t: number): number =>
    Math.atan2(
      cubicTangent(p0.y, c1.y, c2.y, p3.y, t),
      cubicTangent(p0.x, c1.x, c2.x, p3.x, t),
    );
  return {
    p0,
    c1,
    c2,
    p3,
    midPoint: pointAt(0.5),
    avoidedObstacleIds,
    pointAt,
    tangentAt,
  };
}

/**
 * Computes a deterministic obstacle-avoiding cubic Bezier route between `source` and `target`.
 */
export function routeObstacleAvoidingRelationship({
  source,
  target,
  obstacles,
  clearance = 24,
  curvatureOffset,
}: RouteRelationshipParams): RoutedRelationshipGeometry {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const dist = Math.hypot(dx, dy) || 1;
  // Normal perpendicular to segment source -> target
  const nx = -dy / dist;
  const ny = dx / dist;

  const naturalDeflection = Math.min(60, dist * 0.18);
  const manualShift = curvatureOffset ?? null;
  const excludeIds = new Set([source.id, target.id]);

  // Helper to evaluate a specific arc deflection along normal (or manual curvature offset)
  const makeControlPoints = (deflect: number, customOffset?: LayoutPoint | null) => {
    const offX = customOffset ? customOffset.x : nx * deflect;
    const offY = customOffset ? customOffset.y : ny * deflect;
    const handleAnchor: LayoutPoint = {
      x: (source.x + target.x) / 2 + offX,
      y: (source.y + target.y) / 2 + offY,
    };
    const p0 = anchorOnCard(source, { width: source.width, height: source.height }, handleAnchor);
    const p3 = anchorOnCard(target, { width: target.width, height: target.height }, handleAnchor);
    const c1 = {
      x: p0.x + (p3.x - p0.x) * 0.25 + offX,
      y: p0.y + (p3.y - p0.y) * 0.25 + offY,
    };
    const c2 = {
      x: p0.x + (p3.x - p0.x) * 0.75 + offX,
      y: p0.y + (p3.y - p0.y) * 0.75 + offY,
    };
    return { p0, c1, c2, p3 };
  };

  const initial = manualShift
    ? makeControlPoints(0, manualShift)
    : makeControlPoints(naturalDeflection, null);
  const initialHits = findCurveObstacleHits(
    initial.p0,
    initial.c1,
    initial.c2,
    initial.p3,
    obstacles,
    excludeIds,
    clearance,
  );

  // Respect explicit user curvatureOffset or return when gentle natural arch is already clear
  if (manualShift || initialHits.length === 0) {
    const chord = makeControlPoints(0, { x: 0, y: 0 });
    const chordHits = manualShift
      ? []
      : findCurveObstacleHits(
          chord.p0,
          chord.c1,
          chord.c2,
          chord.p3,
          obstacles,
          excludeIds,
          clearance,
        );
    const avoided = chordHits
      .filter(
        (box) =>
          !findCurveObstacleHits(
            initial.p0,
            initial.c1,
            initial.c2,
            initial.p3,
            [box],
            excludeIds,
            clearance,
          ).length,
      )
      .map((box) => box.id);
    return buildGeometry(initial.p0, initial.c1, initial.c2, initial.p3, avoided);
  }

  // Also check straight chord hits so `avoidedObstacleIds` records any straight-line blockers bypassed
  const maxObsSpan = initialHits.reduce(
    (acc, box) => Math.max(acc, Math.max(box.width, box.height)),
    40,
  );
  const baseRadius = Math.max(naturalDeflection + 32, maxObsSpan + clearance * 1.5);

  const multipliers = [1, -1, 1.8, -1.8, 2.6, -2.6, 3.6, -3.6, 5.0, -5.0, 6.8, -6.8];
  let bestCandidate = { ...initial, hits: initialHits };

  for (const m of multipliers) {
    const candidate = makeControlPoints(m * baseRadius, null);
    const hits = findCurveObstacleHits(
      candidate.p0,
      candidate.c1,
      candidate.c2,
      candidate.p3,
      obstacles,
      excludeIds,
      clearance,
    );
    if (hits.length === 0) {
      return buildGeometry(
        candidate.p0,
        candidate.c1,
        candidate.c2,
        candidate.p3,
        initialHits.map((h) => h.id),
      );
    }
    if (hits.length < bestCandidate.hits.length) {
      bestCandidate = { ...candidate, hits };
    }
  }

  return buildGeometry(
    bestCandidate.p0,
    bestCandidate.c1,
    bestCandidate.c2,
    bestCandidate.p3,
    initialHits
      .filter((h) => !bestCandidate.hits.some((rem) => rem.id === h.id))
      .map((h) => h.id),
  );
}
