import { describe, expect, it, vi } from 'vitest';
import {
  collectEnclosedSubtreeIds,
  measureBoundaryEdgeClearance,
} from '@/domains/graph/shared/utils/boundarySummarySolver';
import { findAABBOverlaps } from '@/domains/graph/shared/utils/collisionResolver';
import { computeCompositeMindmapLayout } from '@/domains/graph/shared/utils/compositeLayoutEngine';
import { buildGraphProjection } from '@/domains/graph/shared/utils/buildGraphProjection';
import { resolveCascadingPaintMap } from '@/domains/graph/shared/utils/cascadingStyleResolver';
import { drawDecorations } from '@/domains/graph/shared/utils/drawDecorations';
import { drawLink } from '@/domains/graph/shared/utils/drawLink';
import {
  findCurveObstacleHits,
  routeObstacleAvoidingRelationship,
} from '@/domains/graph/shared/utils/relationshipRouter';
import { defaultGraphConfig } from '@/domains/graph/shared/stores/useGraphStore';
import { globalGraphInteractionStore } from '@/domains/graph/shared/stores/useGraphInteractionStore';
import { buildTheme } from '@/domains/graph/shared/utils/theme';
import type {
  BoundaryDecoration,
  BoundaryGroup,
  LayoutContext,
  Link,
  Node,
  NodeMetric,
  RelationshipEdge,
  RenderNode,
  SummaryBraceDecoration,
  SummaryGroup,
  TimelineAxis,
} from '@/domains/graph/shared/utils/graph.types';

function createSampleMap(includeSummary = false) {
  const nodes: Node[] = [
    { id: 'root', name: 'Central Topic', type: 'folder', parentId: null, depth: 0, tags: [], content: '' },
    { id: 'm1', name: 'Sibling Above', type: 'file', parentId: 'root', depth: 1, tags: [], content: '' },
    { id: 'm1-a', name: 'Above Child', type: 'file', parentId: 'm1', depth: 2, tags: [], content: '' },
    { id: 'm2', name: 'Group Item 1', type: 'file', parentId: 'root', depth: 1, tags: [], content: '' },
    { id: 'm2-a', name: 'Bounded Leaf A', type: 'file', parentId: 'm2', depth: 2, tags: [], content: '' },
    { id: 'm2-b', name: 'Bounded Leaf B', type: 'file', parentId: 'm2', depth: 2, tags: [], content: '' },
    { id: 'm3', name: 'Group Item 2', type: 'file', parentId: 'root', depth: 1, tags: [], content: '' },
    { id: 'm4', name: 'Sibling Below', type: 'file', parentId: 'root', depth: 1, tags: [], content: '' },
  ];

  if (includeSummary) {
    nodes.push(
      { id: 'sum1', name: 'Q1 Summary', type: 'file', parentId: 'root', depth: 1, tags: [], content: '' },
      { id: 'sum1-a', name: 'Action Followup', type: 'file', parentId: 'sum1', depth: 2, tags: [], content: '' },
    );
  }

  const links: Link[] = nodes
    .filter((n) => n.parentId)
    .map((n) => ({ source: n.parentId!, target: n.id, type: 'hierarchy' }));

  const projection = buildGraphProjection(nodes, links);
  const metrics = new Map<string, NodeMetric>();
  for (const n of projection.nodes) {
    metrics.set(n.id, { width: 130, height: 38 });
  }

  const context: LayoutContext = {
    width: 1200,
    height: 800,
    orientation: 'balanced',
    levelGap: 110,
    siblingGap: 40,
    laneGap: 40,
    ribAngle: Math.PI / 4,
    nodeMetrics: metrics,
  };

  return { projection, metrics, context };
}

function createMockCanvasCtx() {
  const calls: string[] = [];
  let dashSet = false;
  let fillCount = 0;
  let strokeCount = 0;

  const ctx = {
    canvas: { width: 1200, height: 800 },
    font: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    globalAlpha: 1,
    textAlign: 'left',
    textBaseline: 'alphabetic',
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    bezierCurveTo: vi.fn(() => calls.push('bezier')),
    quadraticCurveTo: vi.fn(() => calls.push('quad')),
    arc: vi.fn(),
    arcTo: vi.fn(),
    roundRect: vi.fn(() => calls.push('roundRect')),
    fill: vi.fn(() => {
      fillCount += 1;
    }),
    stroke: vi.fn(() => {
      strokeCount += 1;
    }),
    fillText: vi.fn((text: string) => calls.push(`text:${text}`)),
    setLineDash: vi.fn((arr: number[]) => {
      if (arr.length > 0) dashSet = true;
    }),
    measureText: vi.fn((text: string) => ({ width: text.length * 6.5 })),
  } as unknown as CanvasRenderingContext2D;

  return {
    ctx,
    get calls() {
      return calls;
    },
    get dashSet() {
      return dashSet;
    },
    get fillCount() {
      return fillCount;
    },
    get strokeCount() {
      return strokeCount;
    },
  };
}

describe('XMIND-STEP-04 — Boundaries, Summary Braces, Obstacle-Avoiding Relationships & Flex Mode', () => {
  it('enforces BoundaryGroup zero-collision and >= boundaryPadding edge clearance for external nodes', () => {
    const { projection, metrics, context } = createSampleMap(false);
    const ids = projection.nodes.map((n) => n.id);
    const visible = new Set(ids);
    const childrenOf = (id: string) => projection.childrenByParent.get(id) ?? [];

    const boundaries: BoundaryGroup[] = [
      {
        id: 'bnd-1',
        title: 'Core Cluster',
        nodeIds: ['m2'],
        shape: 'cloud',
        padding: 20,
        strokeColor: '#38bdf8',
      },
    ];

    const geo = computeCompositeMindmapLayout(
      'mindmap',
      { ids, roots: projection.roots, childrenOf, context, projection },
      undefined,
      { boundaries },
    );

    const overlaps = findAABBOverlaps(geo.targets, metrics, undefined, 4);
    expect(overlaps).toEqual([]);

    const bndDec = geo.decorations.find((d): d is BoundaryDecoration => d.kind === 'boundary');
    expect(bndDec).toBeDefined();
    expect(bndDec!.shape).toBe('cloud');
    expect(bndDec!.padding).toBe(20);
    expect(bndDec!.headerHeight).toBeGreaterThan(0);

    const enclosed = collectEnclosedSubtreeIds(['m2'], childrenOf, visible);
    expect(enclosed.has('m2')).toBe(true);
    expect(enclosed.has('m2-a')).toBe(true);
    expect(enclosed.has('m2-b')).toBe(true);

    // Every node outside the BoundaryGroup must stay >= boundary.padding away from the hull edge
    for (const [id, target] of geo.targets.entries()) {
      if (enclosed.has(id)) continue;
      const metric = metrics.get(id)!;
      const clearance = measureBoundaryEdgeClearance(bndDec!, target, metric);
      expect(clearance).toBeGreaterThanOrEqual(boundaries[0].padding);
    }

    // Geometry bounds must fully encompass the boundary decoration
    expect(geo.bounds.minX).toBeLessThanOrEqual(bndDec!.x);
    expect(geo.bounds.minY).toBeLessThanOrEqual(bndDec!.y);
    expect(geo.bounds.maxX).toBeGreaterThanOrEqual(bndDec!.x + bndDec!.width);
    expect(geo.bounds.maxY).toBeGreaterThanOrEqual(bndDec!.y + bndDec!.height);
  });

  it('positions SummaryGroup brace and first-class SummaryTopic subtree with 0 overlaps & summary role styling', () => {
    const { projection, metrics, context } = createSampleMap(true);
    const ids = projection.nodes.map((n) => n.id);
    const childrenOf = (id: string) => projection.childrenByParent.get(id) ?? [];

    const summaries: SummaryGroup[] = [
      {
        id: 'sum-grp-1',
        parentId: 'root',
        rangeNodeIds: ['m2', 'm3'],
        summaryNodeId: 'sum1',
        braceStyle: 'curly',
        label: 'Key Outcome',
        color: '#A855F7',
      },
    ];

    const geo = computeCompositeMindmapLayout(
      'mindmap',
      { ids, roots: projection.roots, childrenOf, context, projection },
      undefined,
      { summaries },
    );

    const overlaps = findAABBOverlaps(geo.targets, metrics, undefined, 4);
    expect(overlaps).toEqual([]);

    const braceDec = geo.decorations.find(
      (d): d is SummaryBraceDecoration => d.kind === 'summary-brace',
    );
    expect(braceDec).toBeDefined();
    expect(braceDec!.braceStyle).toBe('curly');
    expect(braceDec!.summaryNodeId).toBe('sum1');

    const sumTarget = geo.targets.get('sum1')!;
    const childTarget = geo.targets.get('sum1-a')!;
    expect(sumTarget).toBeDefined();
    expect(childTarget).toBeDefined();

    // Summary node sits on the outside of the brace apex and its child extends further outward
    if (braceDec!.direction === 'right') {
      expect(sumTarget.x).toBeGreaterThan(braceDec!.apexX);
      expect(childTarget.x).toBeGreaterThanOrEqual(sumTarget.x);
    } else if (braceDec!.direction === 'left') {
      expect(sumTarget.x).toBeLessThan(braceDec!.apexX);
      expect(childTarget.x).toBeLessThanOrEqual(sumTarget.x);
    }

    // Verify Level 2 summary role styling from cascadingStyleResolver
    const paintMap = resolveCascadingPaintMap(projection.nodes, {
      theme: buildTheme(defaultGraphConfig),
      config: defaultGraphConfig,
      parentByChild: projection.parentByChild,
      branchColorOverrides: {},
      nodeStyleOverrides: {},
      nodeBranchColorById: new Map(),
      summaries,
    });
    expect(paintMap.get('sum1')?.role).toBe('summary');
    expect(paintMap.get('sum1')?.hasExplicitCascade).toBe(true);
  });

  it('routes cross-branch [[wikilinks]] and RelationshipEdges around intermediate obstacles cleanly', () => {
    const obstacles = [
      { id: 'src', x: 200, y: -120, width: 130, height: 38 },
      { id: 'blocker', x: 200, y: 0, width: 150, height: 48 },
      { id: 'dst', x: 200, y: 120, width: 130, height: 38 },
    ];

    const routed = routeObstacleAvoidingRelationship({
      source: obstacles[0],
      target: obstacles[2],
      obstacles,
      clearance: 24,
    });

    const hits = findCurveObstacleHits(
      routed.p0,
      routed.c1,
      routed.c2,
      routed.p3,
      obstacles,
      new Set(['src', 'dst']),
      24,
    );
    expect(hits).toEqual([]);
    expect(routed.avoidedObstacleIds).toContain('blocker');

    // Manual curvatureOffset overrides automatic arc cleanly
    const custom = routeObstacleAvoidingRelationship({
      source: obstacles[0],
      target: obstacles[2],
      obstacles,
      clearance: 24,
      curvatureOffset: { x: 220, y: 0 },
    });
    expect(custom.midPoint.x).toBeGreaterThan(300);
  });

  it('applies Flex Mode manual offsets cleanly and restores exact Strict coordinates on tidyUpLayout()', () => {
    const { projection, metrics, context } = createSampleMap(false);
    const ids = projection.nodes.map((n) => n.id);
    const childrenOf = (id: string) => projection.childrenByParent.get(id) ?? [];

    const strictGeo = computeCompositeMindmapLayout('mindmap', {
      ids,
      roots: projection.roots,
      childrenOf,
      context,
      projection,
    });

    const delta = { dx: 90, dy: -65 };
    const flexGeo = computeCompositeMindmapLayout(
      'mindmap',
      { ids, roots: projection.roots, childrenOf, context, projection },
      undefined,
      { manualOffsets: { m1: delta } },
    );

    const strictM1 = strictGeo.targets.get('m1')!;
    const flexM1 = flexGeo.targets.get('m1')!;
    const strictChild = strictGeo.targets.get('m1-a')!;
    const flexChild = flexGeo.targets.get('m1-a')!;

    // Both parent & descendant move together, keeping zero overlap
    expect(flexM1.x - strictM1.x).toBeCloseTo(delta.dx, 5);
    expect(flexM1.y - strictM1.y).toBeCloseTo(delta.dy, 5);
    expect(flexChild.x - strictChild.x).toBeCloseTo(delta.dx, 5);
    expect(flexChild.y - strictChild.y).toBeCloseTo(delta.dy, 5);
    expect(findAABBOverlaps(flexGeo.targets, metrics, undefined, 4)).toEqual([]);

    // Exercise store state actions & Tidy Up reset
    globalGraphInteractionStore.getState().clearSubtreeOverrides();
    globalGraphInteractionStore.getState().setLayoutArrangement('custom');
    globalGraphInteractionStore.getState().setManualNodeOffset('m1', delta);
    const edge: RelationshipEdge = {
      id: 'rel-1',
      sourceId: 'm1',
      targetId: 'm3',
      origin: 'manual',
      label: 'depends on',
      arrowMode: 'both',
      dashStyle: 'dashed',
    };
    globalGraphInteractionStore.getState().upsertRelationship(edge);
    globalGraphInteractionStore.getState().setShowMindmapRelationships(true);
    expect(globalGraphInteractionStore.getState().manualNodeOffsets['m1']).toEqual(delta);
    expect(globalGraphInteractionStore.getState().relationships).toHaveLength(1);

    globalGraphInteractionStore.getState().tidyUpLayout();
    expect(globalGraphInteractionStore.getState().manualNodeOffsets).toEqual({});
    expect(globalGraphInteractionStore.getState().layoutArrangement).toBe('auto');

    // Re-running Strict layout with empty offsets produces exact 0.000px delta
    const restoredGeo = computeCompositeMindmapLayout(
      'mindmap',
      { ids, roots: projection.roots, childrenOf, context, projection },
      undefined,
      { manualOffsets: globalGraphInteractionStore.getState().manualNodeOffsets },
    );
    expect(restoredGeo.targets.get('m1')!.x - strictM1.x).toBe(0);
    expect(restoredGeo.targets.get('m1')!.y - strictM1.y).toBe(0);

    globalGraphInteractionStore.getState().clearSubtreeOverrides();
  });

  it('renders Boundary hulls, Summary braces, Timeline axes, and Routed Relationships on Canvas2D', () => {
    const theme = buildTheme(defaultGraphConfig);
    const mock = createMockCanvasCtx();

    const boundaryRounded: BoundaryDecoration = {
      kind: 'boundary',
      id: 'b-r',
      title: 'Sprint Scope',
      nodeIds: ['a'],
      shape: 'dashed',
      x: 10,
      y: 20,
      width: 180,
      height: 90,
      padding: 16,
      headerHeight: 22,
    };
    const brace: SummaryBraceDecoration = {
      kind: 'summary-brace',
      id: 's-1',
      parentId: 'root',
      summaryNodeId: 'sum1',
      braceStyle: 'curly',
      direction: 'right',
      x1: 200,
      y1: 20,
      x2: 200,
      y2: 140,
      apexX: 214,
      apexY: 80,
      label: 'Total',
    };
    const timeline: TimelineAxis = {
      kind: 'timeline-axis',
      x1: 0,
      x2: 300,
      y: 100,
      ticks: [{ x: 100, label: 'Jan' }, { x: 200, label: 'Feb' }],
    };

    drawDecorations(mock.ctx, [boundaryRounded, brace, timeline], theme, 1);

    expect(mock.dashSet).toBe(true);
    expect(mock.calls).toContain('text:Sprint Scope');
    expect(mock.calls).toContain('text:Total');
    expect(mock.calls).toContain('text:Jan');
    expect(mock.strokeCount).toBeGreaterThanOrEqual(3);

    const routed = routeObstacleAvoidingRelationship({
      source: { id: 'a', x: 50, y: 50, width: 100, height: 32 },
      target: { id: 'b', x: 250, y: 200, width: 100, height: 32 },
      obstacles: [{ id: 'c', x: 150, y: 125, width: 110, height: 36 }],
      clearance: 24,
    });

    const nodeA: RenderNode = {
      id: 'a',
      name: 'Source',
      type: 'file',
      parentId: null,
      depth: 1,
      tags: [],
      content: '',
      childCount: 0,
      x: 50,
      y: 50,
    };
    const nodeB: RenderNode = {
      ...nodeA,
      id: 'b',
      name: 'Target',
      x: 250,
      y: 200,
    };

    drawLink(mock.ctx, nodeA, nodeB, {
      mode: 'mindmap',
      linkType: 'relationship',
      routedRelationship: routed,
      arrowMode: 'both',
      relationshipLabel: 'relates to',
      theme,
      color: '#38bdf8',
      width: 2,
      opacity: 0.85,
      dash: [6, 4],
      dimmed: false,
      showArrow: true,
      arrowLength: 8,
      arrowRelPos: 1,
      curvature: 0.25,
      curveRotation: 0,
      particles: 0,
      particleWidth: 3,
      particleColor: '#38bdf8',
      particleProgress: 0,
      zoom: 1,
      preserveDetail: false,
      metricOf: () => ({ width: 100, height: 32 }),
    });

    expect(mock.calls).toContain('text:relates to');
    // Both arrowheads + label pill fill increment fillCount
    expect(mock.fillCount).toBeGreaterThanOrEqual(3);
  });
});
