import { describe, expect, it } from 'vitest';
import { computeLayout, type LayoutEngineOptions } from '@/domains/graph/shared/hooks/useLayoutEngine';
import {
  findAABBOverlaps,
  resolveAABBCollisions,
} from '@/domains/graph/shared/utils/collisionResolver';
import {
  MINDMAP_LAYOUT_MODES,
  type FishboneRib,
  type FishboneSpine,
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

  it('prevents multi-layer collisions, wraps 19-leaf org-chart cleanly, and clears timeline trunk gutter', () => {
    const specs: Array<[string, string | null, string]> = [
      ['root', null, 'Project Timeline Root'],
      ['m1', 'root', 'Phase 1 Launch'],
      ['m2', 'root', 'Phase 2 Analysis'],
      ['m3', 'root', 'Phase 3 Rollout'],
      ['orgRoot', 'm1', 'Engineering Module'],
      ['orgBranch', 'orgRoot', 'Leaf Spec Files'],
      ...Array.from({ length: 19 }, (_, idx): [string, string, string] => [
        `leaf-${idx}`,
        'orgBranch',
        `Spec File ${idx + 1}`,
      ]),
      ['orgMid', 'orgRoot', 'Sub Architecture'],
      ['orgMid-a', 'orgMid', 'API Contract'],
      ['orgMid-b', 'orgMid', 'Schema Check'],
      ['fishRoot', 'm2', 'Root Cause'],
      ['cat-0', 'fishRoot', 'People'],
      ['cat-1', 'fishRoot', 'Process'],
      ['cat-2', 'fishRoot', 'Tooling'],
      ['cat-3', 'fishRoot', 'Infra'],
      ['sub-0', 'cat-0', 'Training Gap'],
      ['sub-1', 'cat-1', 'Manual QA'],
      ['sub-2', 'cat-2', 'Stale Metrics'],
      ['sub-3', 'cat-3', 'Trunk Overlap'],
      ['braceRoot', 'm3', 'Target Scope'],
      ['brace-a', 'braceRoot', 'Web Client'],
      ['mindRoot', 'braceRoot', 'Core Services'],
      ['mind-1', 'mindRoot', 'Auth Service'],
      ['mind-2', 'mindRoot', 'Sync Engine'],
      ['mind-3', 'mindRoot', 'Graph Worker'],
      ['mind-4', 'mindRoot', 'Search Index'],
    ];

    const childrenByParent = new Map<string, string[]>();
    const parentByChild = new Map<string, string | null>();
    const metrics = new Map<string, NodeMetric>();
    const nodes: RenderNode[] = specs.map(([id]) => {
      childrenByParent.set(id, []);
      return {
        id,
        name: id,
        type: id.startsWith('leaf-') || id.startsWith('sub-') || id.startsWith('mind-') ? 'file' : 'folder',
        parentId: null,
        depth: 0,
        tags: [],
        content: '',
        childCount: 0,
      };
    });
    const byId = new Map(nodes.map((n) => [n.id, n]));
    for (const [id, parentId, name] of specs) {
      const node = byId.get(id)!;
      node.name = name;
      node.parentId = parentId;
      parentByChild.set(id, parentId);
      if (parentId) {
        childrenByParent.get(parentId)!.push(id);
        node.depth = byId.get(parentId)!.depth + 1;
      }
    }
    for (const n of nodes) {
      n.childCount = childrenByParent.get(n.id)!.length;
      metrics.set(
        n.id,
        cardLayout(n.name, { root: n.parentId === null, badge: n.childCount > 0, depth: n.depth })
      );
    }

    const graph: SyntheticGraph = {
      projection: { nodes, links: [], byId, childrenByParent, parentByChild, roots: ['root'] },
      metrics,
    };

    const geo = computeLayout(
      graph.projection,
      defaultEngineOptions(graph, {
        mode: 'timeline',
        subtreeOverrides: {
          orgRoot: 'org-chart',
          fishRoot: 'fishbone',
          braceRoot: 'brace-map',
          mindRoot: 'mindmap',
        },
      })
    );

    expect(geo.targets.size).toBe(specs.length);
    expect(findAABBOverlaps(geo.targets, metrics)).toEqual([]);

    // 19 leaves in org-chart wrap into compact matrix rows (<= 6 columns -> width < 1200px)
    let minLeafX = Infinity;
    let maxLeafX = -Infinity;
    const distinctRows = new Set<number>();
    for (let i = 0; i < 19; i += 1) {
      const id = `leaf-${i}`;
      const t = geo.targets.get(id)!;
      const m = metrics.get(id)!;
      minLeafX = Math.min(minLeafX, t.x - m.width / 2);
      maxLeafX = Math.max(maxLeafX, t.x + m.width / 2);
      distinctRows.add(Math.round(t.y));
    }
    expect(maxLeafX - minLeafX).toBeLessThan(1200);
    expect(distinctRows.size).toBeGreaterThanOrEqual(4);

    // Every L2 org-chart node sits strictly right of milestone m1's vertical trunk gutter
    const m1X = geo.targets.get('m1')!.x;
    const orgSubtreeIds = [
      'orgRoot',
      'orgBranch',
      'orgMid',
      'orgMid-a',
      'orgMid-b',
      ...Array.from({ length: 19 }, (_, idx) => `leaf-${idx}`),
    ];
    for (const id of orgSubtreeIds) {
      const t = geo.targets.get(id)!;
      const m = metrics.get(id)!;
      expect(t.x - m.width / 2).toBeGreaterThan(m1X);
    }
  });

  it('keeps fishbone ribs attached tightly and applies Smart Flow orientation across left/right subtrees', () => {
    const specs: Array<[string, string | null, string]> = [
      ['root', null, 'Central Hub'],
      ['right-fish', 'root', 'Fishbone Analysis'],
      ['rc-0', 'right-fish', 'Factor A'],
      ['rc-1', 'right-fish', 'Factor B'],
      ['rc-2', 'right-fish', 'Factor C'],
      ['rl-0', 'rc-0', 'Detail A1'],
      ['rl-1', 'rc-1', 'Detail B1'],
      ['left-brace', 'root', 'Left Brace Structure'],
      ['lb-0', 'left-brace', 'Brace Child 1'],
      ['lb-1', 'left-brace', 'Brace Child 2'],
      ['right-sib', 'root', 'Adjacent Mindmap Topic'],
      ['rs-0', 'right-sib', 'Sibling Note A'],
      ['rs-1', 'right-sib', 'Sibling Note B'],
    ];

    const childrenByParent = new Map<string, string[]>();
    const parentByChild = new Map<string, string | null>();
    const metrics = new Map<string, NodeMetric>();
    const nodes: RenderNode[] = specs.map(([id, parentId, name]) => {
      childrenByParent.set(id, []);
      parentByChild.set(id, parentId);
      return {
        id,
        name,
        type: 'folder',
        parentId,
        depth: parentId ? (parentId === 'root' ? 1 : 2) : 0,
        tags: [],
        content: '',
        childCount: 0,
      };
    });
    const byId = new Map(nodes.map((n) => [n.id, n]));
    for (const [id, parentId] of specs) {
      if (parentId) childrenByParent.get(parentId)!.push(id);
    }
    for (const n of nodes) {
      n.childCount = childrenByParent.get(n.id)!.length;
      metrics.set(n.id, cardLayout(n.name, { root: n.parentId === null, badge: n.childCount > 0, depth: n.depth }));
    }

    const graph: SyntheticGraph = {
      projection: { nodes, links: [], byId, childrenByParent, parentByChild, roots: ['root'] },
      metrics,
    };

    const geo = computeLayout(
      graph.projection,
      defaultEngineOptions(graph, {
        mode: 'mindmap',
        subtreeOverrides: {
          'right-fish': 'fishbone',
          'left-brace': 'brace-map',
        },
      })
    );

    expect(findAABBOverlaps(geo.targets, metrics)).toEqual([]);

    const ribs = geo.decorations.filter((d): d is FishboneRib => d.kind === 'fishbone-rib');
    expect(ribs.length).toBeGreaterThan(0);
    for (const rib of ribs) {
      if (!rib.targetId) continue;
      const dst = geo.targets.get(rib.targetId)!;
      expect(Math.hypot(rib.x2 - dst.x, rib.y2 - dst.y)).toBeLessThan(1e-3);
    }

    // Smart Flow: right-side fishbone places Effect Head to the LEFT of spine tail (spine extends rightward)
    const spines = geo.decorations.filter((d): d is FishboneSpine => d.kind === 'fishbone-spine');
    expect(spines.length).toBe(1);
    const effectPos = geo.targets.get('right-fish')!;
    const spine = spines[0];
    expect(Math.min(spine.x1, spine.x2)).toBeGreaterThanOrEqual(effectPos.x - 10);

    // Smart Flow: left-side brace-map grows leftward away from mindmap center
    const braceAnchor = geo.targets.get('left-brace')!;
    const braceChild = geo.targets.get('lb-0')!;
    expect(braceChild.x).toBeLessThan(braceAnchor.x);
  });
});
