import { describe, expect, it } from 'vitest';
import { computeLayout, type LayoutEngineOptions } from '@/domains/graph/shared/hooks/useLayoutEngine';
import {
  findAABBOverlaps,
  resolveAABBCollisions,
} from '@/domains/graph/shared/utils/collisionResolver';
import {
  MINDMAP_LAYOUT_MODES,
  type GraphProjection,
  type MindmapLayoutMode,
  type NodeMetric,
  type RenderNode,
  type SubtreeLayoutMap,
} from '@/domains/graph/shared/utils/graph.types';
import { cardLayout } from '@/domains/graph/shared/utils/textLayout';

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface SyntheticGraph {
  projection: GraphProjection;
  metrics: Map<string, NodeMetric>;
}

function buildSyntheticTree(seed: number, nodeCount: number): SyntheticGraph {
  const rng = mulberry32(seed);
  const childrenByParent = new Map<string, string[]>();
  const parentByChild = new Map<string, string | null>();
  const metrics = new Map<string, NodeMetric>();
  const nodes: RenderNode[] = [];

  const words = [
    'Architecture',
    'Knowledge',
    'XMind',
    'Synthesis',
    'Algorithm',
    'Hierarchy',
    'Pipeline',
    'Determinism',
    'Collision',
    'Markdown',
    'Graph',
    'Vault',
    'Strategy',
  ];

  const makeLabel = (idx: number) => {
    const wordCount = 1 + Math.floor(rng() * 8);
    const picked: string[] = [];
    for (let w = 0; w < wordCount; w += 1) {
      picked.push(words[Math.floor(rng() * words.length)]);
    }
    return `N${idx} ${picked.join(' ')}`;
  };

  for (let i = 0; i < nodeCount; i += 1) {
    const id = i === 0 ? 'root' : `n-${i}`;
    const parentIdx = i === 0 ? null : Math.floor(rng() * i);
    const parentId = parentIdx === null ? null : parentIdx === 0 ? 'root' : `n-${parentIdx}`;
    const depth = parentId ? (nodes.find((n) => n.id === parentId)?.depth ?? 0) + 1 : 0;
    const name = makeLabel(i);

    parentByChild.set(id, parentId);
    if (!childrenByParent.has(id)) childrenByParent.set(id, []);
    if (parentId) {
      const list = childrenByParent.get(parentId) ?? [];
      list.push(id);
      childrenByParent.set(parentId, list);
    }

    nodes.push({
      id,
      name,
      type: i === 0 || rng() < 0.25 ? 'folder' : 'file',
      parentId,
      depth,
      tags: [],
      content: '',
      childCount: 0,
      time: 1_700_000_000_000 + i * 86_400_000,
    });
  }

  for (const n of nodes) {
    n.childCount = (childrenByParent.get(n.id) ?? []).length;
    metrics.set(
      n.id,
      cardLayout(n.name, {
        root: n.parentId === null,
        badge: n.childCount > 0,
        depth: n.depth,
      })
    );
  }

  return {
    projection: {
      nodes,
      links: [],
      byId: new Map(nodes.map((n) => [n.id, n])),
      childrenByParent,
      parentByChild,
      roots: ['root'],
    },
    metrics,
  };
}

function defaultEngineOptions(
  graph: SyntheticGraph,
  overrides: Partial<LayoutEngineOptions> = {}
): LayoutEngineOptions {
  return {
    mode: 'mindmap',
    width: 1400,
    height: 900,
    orientation: 'balanced',
    levelGap: 110,
    siblingGap: 36,
    laneGap: 72,
    ribAngle: Math.PI / 4,
    visibleIds: graph.projection.nodes.map((n) => n.id),
    nodeMetrics: graph.metrics,
    ...overrides,
  };
}

describe('Two-Pass Composite Layout Engine & Zero-Collision Solver (XMIND-STEP-01)', () => {
  it.each<[MindmapLayoutMode, 'balanced' | 'radial']>([
    ['mindmap', 'balanced'],
    ['mindmap', 'radial'],
    ['org-chart', 'balanced'],
    ['brace-map', 'balanced'],
    ['fishbone', 'balanced'],
    ['timeline', 'balanced'],
  ])('guarantees Zero-AABB Overlap in %s (%s) with multi-line cards', (mode, orientation) => {
    const graph = buildSyntheticTree(20261114, 45);
    const geo = computeLayout(
      graph.projection,
      defaultEngineOptions(graph, { mode, orientation })
    );

    expect(geo.targets.size).toBe(45);
    const overlaps = findAABBOverlaps(geo.targets, graph.metrics);
    expect(overlaps).toEqual([]);
  });

  it('prevents sibling collisions when branches use mixed XMind structures + nested overrides', () => {
    const graph = buildSyntheticTree(777, 48);
    const branchRoots = graph.projection.childrenByParent.get('root') ?? [];
    expect(branchRoots.length).toBeGreaterThanOrEqual(2);

    const subtreeOverrides: SubtreeLayoutMap = {};
    const modes: MindmapLayoutMode[] = ['org-chart', 'fishbone', 'timeline', 'brace-map'];
    branchRoots.forEach((bId, idx) => {
      subtreeOverrides[bId] = modes[idx % modes.length];
    });

    // Tambahkan nested override pada kedalaman >= 2
    for (const bId of branchRoots) {
      const grandKids = graph.projection.childrenByParent.get(bId) ?? [];
      if (grandKids.length > 0) {
        subtreeOverrides[grandKids[0]] = 'brace-map';
        break;
      }
    }

    const geo = computeLayout(
      graph.projection,
      defaultEngineOptions(graph, { mode: 'mindmap', subtreeOverrides })
    );

    expect(geo.targets.size).toBe(48);
    const overlaps = findAABBOverlaps(geo.targets, graph.metrics);
    expect(overlaps).toEqual([]);

    // Semua koordinat dan dekorasi harus bernilai finite
    for (const [, target] of geo.targets) {
      expect(Number.isFinite(target.x) && Number.isFinite(target.y)).toBe(true);
    }
    expect(geo.decorations.some((d) => d.kind === 'fishbone-spine')).toBe(
      Object.values(subtreeOverrides).includes('fishbone')
    );
  });

  it('passes property-based Zero-AABB Overlap verification across 100 synthetic mixed-structure trees', () => {
    for (let i = 0; i < 100; i += 1) {
      const seed = 1000 + i * 37;
      const rng = mulberry32(seed);
      const count = 16 + Math.floor(rng() * 64);
      const graph = buildSyntheticTree(seed, count);

      const rootMode = MINDMAP_LAYOUT_MODES[i % MINDMAP_LAYOUT_MODES.length];
      const orientation = i % 5 === 0 ? 'radial' : 'balanced';
      const subtreeOverrides: SubtreeLayoutMap = {};

      for (const n of graph.projection.nodes) {
        if (n.id !== 'root' && n.childCount > 0 && rng() < 0.25) {
          subtreeOverrides[n.id] = MINDMAP_LAYOUT_MODES[Math.floor(rng() * MINDMAP_LAYOUT_MODES.length)];
        }
      }

      const geo = computeLayout(
        graph.projection,
        defaultEngineOptions(graph, {
          mode: rootMode,
          orientation,
          subtreeOverrides,
        })
      );

      expect(geo.targets.size).toBe(count);
      const overlaps = findAABBOverlaps(geo.targets, graph.metrics);
      if (overlaps.length > 0) {
        throw new Error(
          `Collision detected in synthetic tree #${i} (mode=${rootMode}, orientation=${orientation}): ${JSON.stringify(overlaps[0])}`
        );
      }
    }
  });

  it('is 100% deterministic for identical multi-structure input and preserves root at origin', () => {
    const graph = buildSyntheticTree(4242, 60);
    const opts = defaultEngineOptions(graph, {
      mode: 'mindmap',
      subtreeOverrides: {
        'n-1': 'org-chart',
        'n-2': 'fishbone',
      },
    });

    const pass1 = computeLayout(graph.projection, opts);
    const pass2 = computeLayout(graph.projection, opts);

    expect(pass1.targets.get('root')).toEqual({ x: 0, y: 0, side: 0 });
    for (const node of graph.projection.nodes) {
      expect(pass1.targets.get(node.id)).toEqual(pass2.targets.get(node.id));
    }
  });

  it('resolves manually overlapping node boxes cleanly via Sweep-and-Prune', () => {
    const metrics = new Map<string, NodeMetric>([
      ['root', { width: 140, height: 40 }],
      ['a', { width: 160, height: 50 }],
      ['b', { width: 160, height: 50 }],
      ['c', { width: 160, height: 50 }],
    ]);
    const targets = new Map([
      ['root', { x: 0, y: 0, side: 0 as const }],
      ['a', { x: 200, y: 0, side: 1 as const }],
      ['b', { x: 205, y: 10, side: 1 as const }],
      ['c', { x: 202, y: 15, side: 1 as const }],
    ]);

    const resolved = resolveAABBCollisions({
      targets,
      metrics,
      roots: ['root'],
      minGap: 12,
      primaryAxis: 'vertical',
    });

    expect(resolved.get('root')).toEqual({ x: 0, y: 0, side: 0 });
    expect(findAABBOverlaps(resolved, metrics, undefined, 10)).toEqual([]);
  });

  it('computes 2,000-node balanced mindmap layout deterministically within interactive budget', () => {
    const graph = buildSyntheticTree(9999, 2000);
    const start = performance.now();
    const geo = computeLayout(graph.projection, defaultEngineOptions(graph, { mode: 'mindmap' }));
    const elapsedMs = performance.now() - start;

    expect(geo.targets.size).toBe(2000);
    expect(findAABBOverlaps(geo.targets, graph.metrics)).toEqual([]);
    expect(elapsedMs).toBeLessThan(1000);
  });
});
