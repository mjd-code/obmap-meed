import { describe, expect, it } from 'vitest';
import { timelineLayout } from '@/domains/graph/shared/utils/timeline';
import { boxesOverlap, cardLayout } from '@/domains/graph/shared/utils/textLayout';
import { context } from '@/domains/graph/__tests__/fixtures';

describe('timelineLayout', () => {
  it('returns valid coordinates for every visible node', () => {
    const ids = ['root', 'm1', 'm2', 'd1'];
    const roots = ['root'];
    const childrenMap: Record<string, string[]> = {
      root: ['m1', 'm2'],
      m1: ['d1'],
      m2: [],
      d1: [],
    };

    const geo = timelineLayout({
      ids,
      roots,
      childrenOf: (id) => childrenMap[id] ?? [],
      context: context(),
    });

    expect(geo.targets.size).toBe(ids.length);
    for (const id of ids) {
      const t = geo.targets.get(id)!;
      expect(Number.isFinite(t.x) && Number.isFinite(t.y)).toBe(true);
    }
  });

  it('keeps milestones monotonic along X axis', () => {
    const ids = ['root', 'm1', 'm2', 'm3'];
    const roots = ['root'];
    const childrenMap: Record<string, string[]> = {
      root: ['m1', 'm2', 'm3'],
      m1: [],
      m2: [],
      m3: [],
    };

    const geo = timelineLayout({
      ids,
      roots,
      childrenOf: (id) => childrenMap[id] ?? [],
      context: context(),
    });

    const x1 = geo.targets.get('m1')!.x;
    const x2 = geo.targets.get('m2')!.x;
    const x3 = geo.targets.get('m3')!.x;

    expect(x1).toBeLessThan(x2);
    expect(x2).toBeLessThan(x3);
  });

  it('alternates lanes across the central axis for successive milestones', () => {
    const ids = ['root', 'm1', 'm2', 'm3', 'm4'];
    const roots = ['root'];
    const childrenMap: Record<string, string[]> = {
      root: ['m1', 'm2', 'm3', 'm4'],
      m1: [],
      m2: [],
      m3: [],
      m4: [],
    };

    const geo = timelineLayout({
      ids,
      roots,
      childrenOf: (id) => childrenMap[id] ?? [],
      context: context(),
    });

    const y1 = geo.targets.get('m1')!.y;
    const y2 = geo.targets.get('m2')!.y;

    // Satu berada di atas baseline (< 0) dan satu di bawah baseline (> 0)
    expect(y1 * y2).toBeLessThan(0);
  });

  it('emits no decorations so the timeline has no horizontal axis line', () => {
    const ids = ['root', 'm1', 'm2'];
    const roots = ['root'];
    const childrenMap: Record<string, string[]> = {
      root: ['m1', 'm2'],
      m1: [],
      m2: [],
    };

    const geo = timelineLayout({
      ids,
      roots,
      childrenOf: (id) => childrenMap[id] ?? [],
      context: context(),
    });

    expect(geo.decorations).toHaveLength(0);
  });

  it('handles an empty input cleanly', () => {
    const geo = timelineLayout({
      ids: [],
      roots: [],
      childrenOf: () => [],
      context: context(),
    });
    expect(geo.targets.size).toBe(0);
    expect(geo.decorations.length).toBe(0);
  });

  it('prevents bounding-box collisions when milestones and sub-items have long multi-line titles (TD-006)', () => {
    const ids = ['root', 'm1', 'm2', 'm3', 's1', 's2', 's3'];
    const roots = ['root'];
    const childrenMap: Record<string, string[]> = {
      root: ['m1', 'm2', 'm3'],
      m1: ['s1', 's2'],
      m2: ['s3'],
      m3: [],
      s1: [],
      s2: [],
      s3: [],
    };
    const longMetrics = new Map(
      ids.map((id, idx) => [
        id,
        cardLayout(
          `Comprehensive Chronological Milestone Title ${id} — Strategic Execution Phase ${idx + 1} with Extended Description`,
          { root: id === 'root', depth: idx }
        ),
      ])
    );

    const geo = timelineLayout({
      ids,
      roots,
      childrenOf: (id) => childrenMap[id] ?? [],
      context: context({ nodeMetrics: longMetrics }),
    });

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const idA = ids[i];
        const idB = ids[j];
        const tA = geo.targets.get(idA)!;
        const tB = geo.targets.get(idB)!;
        const mA = longMetrics.get(idA)!;
        const mB = longMetrics.get(idB)!;
        const overlap = boxesOverlap(
          { x: tA.x, y: tA.y, width: mA.width, height: mA.height },
          { x: tB.x, y: tB.y, width: mB.width, height: mB.height }
        );
        expect(overlap).toBe(false);
      }
    }
  });
});
