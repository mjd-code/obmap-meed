import { describe, expect, it, vi } from 'vitest';
import {
  contrastRatio,
  hslToRgb,
  isDarkSurface,
  parseColorToRgb,
  parseHsl,
  pickContrastTextColor,
} from '@/global/utils/color-engine';
import {
  buildLayoutSignature,
  buildPaintSignature,
  resolveCascadingNodeStyle,
  resolveCascadingPaintMap,
  SKELETON_PRESETS,
} from '@/domains/graph/shared/utils/cascadingStyleResolver';
import { resolveSmartBranchHsl } from '@/domains/graph/shared/utils/hierarchyColors';
import { buildGraphProjection } from '@/domains/graph/shared/utils/buildGraphProjection';
import { defaultGraphConfig } from '@/domains/graph/shared/stores/useGraphStore';
import { globalGraphInteractionStore } from '@/domains/graph/shared/stores/useGraphInteractionStore';
import { buildTheme } from '@/domains/graph/shared/utils/theme';
import type { Link, Node, SkeletonPresetId } from '@/domains/graph/shared/utils/graph.types';

function makeSampleTree() {
  const nodes: Node[] = [
    { id: 'root', name: 'Central Concept', type: 'folder', parentId: null, depth: 0, tags: [], content: '' },
    {
      id: 'm1',
      name: 'Branch Alpha',
      type: 'file',
      parentId: 'root',
      depth: 1,
      tags: [],
      content: '---\nbranch_color: "#3B82F6"\n---\nMain body',
    },
    { id: 's1', name: 'Subtopic A1', type: 'file', parentId: 'm1', depth: 2, tags: [], content: '' },
    { id: 's2', name: 'Subtopic A2', type: 'file', parentId: 's1', depth: 3, tags: [], content: '' },
    { id: 'm2', name: 'Branch Beta', type: 'file', parentId: 'root', depth: 1, tags: [], content: '' },
    { id: 's3', name: 'Subtopic B1', type: 'file', parentId: 'm2', depth: 2, tags: [], content: '' },
  ];
  const links: Link[] = nodes
    .filter((n) => n.parentId)
    .map((n) => ({ source: n.parentId!, target: n.id, type: 'hierarchy' }));
  return buildGraphProjection(nodes, links);
}

describe('XMIND-STEP-03 — 4-Level Cascading Style Inheritance, Smart HSL & Dual Update Pipeline', () => {
  it('computes accurate RGB conversions, WCAG contrast ratios, and safe AA fallback text colors', () => {
    const rgb = hslToRgb(217, 91, 60);
    expect(rgb.b).toBeGreaterThan(rgb.r);
    expect(parseColorToRgb('rgb(15, 23, 42)')).toEqual({ r: 15, g: 23, b: 42 });
    expect(contrastRatio('#FFFFFF', '#000000')).toBeGreaterThan(20);
    expect(isDarkSurface('#0B1120')).toBe(true);
    expect(isDarkSurface('#F8FAFC')).toBe(false);

    // Low-contrast custom candidates must be overridden to guarantee >= 4.5:1 AA contrast
    const darkBgText = pickContrastTextColor('#0F172A', '#334155', '#1E293B', 4.5);
    expect(contrastRatio(darkBgText, '#0F172A')).toBeGreaterThanOrEqual(4.5);

    const lightBgText = pickContrastTextColor('#FEF08A', '#CBD5E1', '#64748B', 4.5);
    expect(contrastRatio(lightBgText, '#FEF08A')).toBeGreaterThanOrEqual(4.5);
  });

  it('resolves Level 1 Skeleton -> Level 2 Role -> Level 3 Smart Branch HSL -> Level 4 Local Override cleanly', () => {
    const proj = makeSampleTree();
    const theme = { ...buildTheme(defaultGraphConfig), canvasBackground: '#0B1120' };
    const nodeBranchColorById = new Map(proj.nodes.map((n) => [n.id, n.branchColor]));

    const ctx = {
      theme,
      config: defaultGraphConfig,
      parentByChild: proj.parentByChild,
      branchColorOverrides: {},
      nodeStyleOverrides: {
        s1: {
          fillColor: '#FEF3C7',
          borderColor: '#D97706',
          topicShape: 'diamond' as const,
          fontWeight: 'bold' as const,
        },
      },
      nodeBranchColorById,
      skeletonPreset: 'daylight-paper' as SkeletonPresetId,
      roleByNodeId: new Map([['s3', 'floating' as const]]),
    };

    const rootPaint = resolveCascadingNodeStyle(proj.byId.get('root')!, ctx);
    expect(rootPaint.role).toBe('central');
    expect(rootPaint.fontWeight).toBe('700');
    expect(rootPaint.fontSizeDelta).toBe(3);
    expect(rootPaint.lineWidth).toBe(3);

    const m1Paint = resolveCascadingNodeStyle(proj.byId.get('m1')!, ctx);
    expect(m1Paint.role).toBe('main');
    expect(m1Paint.fontWeight).toBe('600');
    // m1 has YAML branch_color #3B82F6 (blue hue ~217 deg)
    const m1LineHsl = parseHsl(m1Paint.lineColor)!;
    expect(m1LineHsl.h).toBeGreaterThanOrEqual(210);
    expect(m1LineHsl.h).toBeLessThanOrEqual(225);

    // s2 (depth 3 under m1) inherits blue hue from m1 while stepping saturation/lightness
    const s2Paint = resolveCascadingNodeStyle(proj.byId.get('s2')!, ctx);
    expect(s2Paint.role).toBe('subtopic');
    expect(s2Paint.lineWidth).toBeLessThan(m1Paint.lineWidth);
    const s2LineHsl = parseHsl(s2Paint.lineColor)!;
    expect(Math.abs(s2LineHsl.h - m1LineHsl.h)).toBeLessThanOrEqual(2);
    expect(s2LineHsl.l).not.toBe(m1LineHsl.l);

    // s1 Level 4 Local Override wins over Level 1-3 while enforcing WCAG AA dark ink on warm yellow fill
    const s1Paint = resolveCascadingNodeStyle(proj.byId.get('s1')!, ctx);
    expect(s1Paint.fillColor).toBe('#FEF3C7');
    expect(s1Paint.borderColor).toBe('#D97706');
    expect(s1Paint.topicShape).toBe('diamond');
    expect(s1Paint.fontWeight).toBe('700');
    expect(s1Paint.contrastRatio).toBeGreaterThanOrEqual(4.5);

    // floating role adds dashed border
    const s3Paint = resolveCascadingNodeStyle(proj.byId.get('s3')!, ctx);
    expect(s3Paint.role).toBe('floating');
    expect(s3Paint.dashedBorder).toBe(true);
  });

  it('guarantees WCAG AA (>= 4.5:1) contrast across all 7 Skeleton Presets in both Dark and Light modes', () => {
    const proj = makeSampleTree();
    const nodeBranchColorById = new Map(proj.nodes.map((n) => [n.id, n.branchColor]));
    const presetIds = Object.keys(SKELETON_PRESETS) as SkeletonPresetId[];

    for (const presetId of presetIds) {
      const preset = SKELETON_PRESETS[presetId];
      const theme = {
        ...buildTheme(defaultGraphConfig),
        canvasBackground: preset.canvasBg,
        labelBackground: preset.surfaceBg,
      };
      const config = {
        ...defaultGraphConfig,
        nodes: { ...defaultGraphConfig.nodes, topicShape: undefined },
      };

      const paintMap = resolveCascadingPaintMap(proj.nodes, {
        theme,
        config,
        parentByChild: proj.parentByChild,
        branchColorOverrides: {},
        nodeStyleOverrides: {},
        nodeBranchColorById,
        skeletonPreset: presetId,
      });

      for (const node of proj.nodes) {
        const paint = paintMap.get(node.id)!;
        expect(
          paint.contrastRatio,
          `Preset "${presetId}" node "${node.id}" (depth ${node.depth}, shape ${paint.topicShape}) failed AA`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }

    // Also test Smart Branch HSL directly for depth 0..5 dark vs light polarity separation
    const darkD3 = resolveSmartBranchHsl('#EC4899', 3, true);
    const lightD3 = resolveSmartBranchHsl('#EC4899', 3, false);
    expect(isDarkSurface(darkD3.fill)).toBe(true);
    expect(isDarkSurface(lightD3.fill)).toBe(false);
  });

  it('supports promoteColorToBranch and clean reset in useGraphInteractionStore', () => {
    const store = globalGraphInteractionStore;
    store.getState().clearSubtreeOverrides();

    store.getState().setNodeStyleOverride('m1', { fillColor: '#10B981', topicShape: 'pill' });
    expect(store.getState().nodeStyleOverrides.m1.fillColor).toBe('#10B981');

    // Promoting branch color moves color to branchColorOverrides and strips color fields from local override while keeping shape
    store.getState().promoteColorToBranch('m1', '#10B981');
    expect(store.getState().branchColorOverrides.m1).toBe('#10B981');
    expect(store.getState().nodeStyleOverrides.m1?.fillColor).toBeUndefined();
    expect(store.getState().nodeStyleOverrides.m1?.topicShape).toBe('pill');

    store.getState().clearSubtreeOverrides();
    expect(store.getState().branchColorOverrides).toEqual({});
    expect(store.getState().nodeStyleOverrides).toEqual({});
  });

  it('keeps Dual Update Pipeline strictly separated: visual changes mutate paintSignature with zero layoutSignature change', () => {
    const baseLayout = {
      mode: 'mindmap' as const,
      orientation: 'balanced' as const,
      width: 1280,
      height: 720,
      levelGap: 110,
      siblingGap: 46,
      laneGap: 46,
      ribAngle: Math.PI / 4,
      visibleIds: ['root', 'm1', 's1', 's2', 'm2', 's3'],
      linksCount: 5,
      metricDigest: '6:1420:540',
      subtreeOverrides: {},
    };

    const sigLayoutA = buildLayoutSignature(baseLayout);
    const sigPaintA = buildPaintSignature({
      skeletonPreset: 'obmap-midnight',
      canvasBackground: '#0B1120',
      labelBackground: '#0F172A',
      autoColorBy: 'branch',
      hierarchy: defaultGraphConfig.hierarchy,
      branchLineStyle: 'tapered-bezier',
      taperedTrunk: true,
      branchColorOverrides: {},
      nodeStyleOverrides: {},
    });

    // Mutate visual-only state (skeleton preset, canvas bg, branch color, node fill color, line style)
    const sigLayoutAfterVisual = buildLayoutSignature(baseLayout);
    const sigPaintAfterVisual = buildPaintSignature({
      skeletonPreset: 'daylight-paper',
      canvasBackground: '#F8FAFC',
      labelBackground: '#FFFFFF',
      autoColorBy: 'branch',
      hierarchy: { ...defaultGraphConfig.hierarchy, enabled: true, preset: 'neon' },
      branchLineStyle: 'cubic-bezier',
      taperedTrunk: false,
      branchColorOverrides: { m1: '#EC4899' },
      nodeStyleOverrides: { s1: { fillColor: '#10B981', textColor: '#0F172A' } },
    });

    expect(sigLayoutAfterVisual).toBe(sigLayoutA);
    expect(sigPaintAfterVisual).not.toBe(sigPaintA);

    // Geometry mutation (metricDigest / siblingGap) alters layoutSignature as expected
    const sigLayoutAfterGeometry = buildLayoutSignature({
      ...baseLayout,
      metricDigest: '6:1580:610',
    });
    expect(sigLayoutAfterGeometry).not.toBe(sigLayoutA);
  });

  it('paints resolved Level 1-4 colors & dashed border into Canvas2D drawNode and scales cleanly to 500 nodes', async () => {
    if (typeof globalThis.Path2D === 'undefined') {
      class MockPath2D {
        constructor(_d?: string) {}
      }
      (globalThis as unknown as { Path2D: typeof MockPath2D }).Path2D = MockPath2D;
    }
    const { drawNode } = await import('@/domains/graph/shared/utils/drawNode');

    const proj = makeSampleTree();
    const branchConfig = {
      ...defaultGraphConfig,
      nodes: { ...defaultGraphConfig.nodes, autoColorBy: 'branch' as const },
    };
    const theme = { ...buildTheme(branchConfig), canvasBackground: '#0B1120' };
    const nodeBranchColorById = new Map(proj.nodes.map((n) => [n.id, n.branchColor]));
    const targetNode = { ...proj.byId.get('s3')!, x: 100, y: 100 };

    const paint = resolveCascadingNodeStyle(targetNode, {
      theme,
      config: branchConfig,
      parentByChild: proj.parentByChild,
      branchColorOverrides: {},
      nodeStyleOverrides: {
        s3: { fillColor: '#1E293B', borderColor: '#38BDF8', textColor: '#F8FAFC' },
      },
      nodeBranchColorById,
      roleByNodeId: new Map([['s3', 'floating']]),
    });

    const fillStyles: string[] = [];
    let dashWasSet = false;
    const mockCtx = {
      font: '',
      _fill: '',
      set fillStyle(v: string) {
        this._fill = v;
        fillStyles.push(v);
      },
      get fillStyle() {
        return this._fill;
      },
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      shadowColor: 'transparent',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      textAlign: 'left',
      textBaseline: 'alphabetic',
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn((arr: number[]) => {
        if (arr.length > 0) dashWasSet = true;
      }),
      measureText: vi.fn((t: string) => ({ width: t.length * 6 })),
    } as unknown as CanvasRenderingContext2D;

    drawNode(mockCtx, targetNode, {
      theme,
      zoom: 1,
      selected: false,
      hovered: false,
      dimmed: false,
      collapsed: false,
      isRoot: false,
      showLabels: true,
      labelThreshold: 0.4,
      preserveDetail: false,
      config: { ...defaultGraphConfig.nodes, autoColorBy: 'branch' },
      resolvedPaint: paint,
    });

    expect(dashWasSet).toBe(true);
    expect(fillStyles).toContain('#F8FAFC');

    // Performance sanity check on 500 nodes
    const largeNodes: Node[] = [{ id: 'n0', name: 'Root', type: 'folder', parentId: null, depth: 0, tags: [], content: '' }];
    const largeLinks: Link[] = [];
    for (let i = 1; i < 500; i++) {
      const parentId = `n${Math.floor((i - 1) / 4)}`;
      largeNodes.push({ id: `n${i}`, name: `Topic ${i}`, type: 'file', parentId, depth: 1, tags: [], content: '' });
      largeLinks.push({ source: parentId, target: `n${i}`, type: 'hierarchy' });
    }
    const largeProj = buildGraphProjection(largeNodes, largeLinks);
    const largeBranchMap = new Map(largeProj.nodes.map((n) => [n.id, n.branchColor]));

    const t0 = performance.now();
    const map = resolveCascadingPaintMap(largeProj.nodes, {
      theme,
      config: defaultGraphConfig,
      parentByChild: largeProj.parentByChild,
      branchColorOverrides: {},
      nodeStyleOverrides: {},
      nodeBranchColorById: largeBranchMap,
    });
    const elapsed = performance.now() - t0;
    expect(map.size).toBe(500);
    expect(elapsed).toBeLessThan(100);
  });
});
