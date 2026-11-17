import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  buildGraphProjection,
  countWikilinks,
  extractRichMetadata,
} from '@/domains/graph/shared/utils/buildGraphProjection';
import {
  cardLayout,
  measureRichNodeMetrics,
  topicShapePadding,
  wrapText,
} from '@/domains/graph/shared/utils/textLayout';
import {
  measureUnboxedText,
  resolveUnboxedLabelPosition,
} from '@/domains/graph/shared/utils/unboxedNodeLayout';
import {
  drawFooterTagPills,
  drawLeftSlotAttachments,
  drawTopicShapeBox,
  resolveEffectiveTopicShape,
} from '@/domains/graph/shared/utils/drawAttachments';
import { drawLink, drawTaperedBezierTrunk } from '@/domains/graph/shared/utils/drawLink';
import { drawNode, paintNodePointerArea } from '@/domains/graph/shared/utils/drawNode';
import {
  defaultGraphConfig,
  defaultNodeConfig,
} from '@/domains/graph/shared/stores/useGraphStore';
import { buildTheme } from '@/domains/graph/shared/utils/theme';
import { computeLayout } from '@/domains/graph/shared/hooks/useLayoutEngine';
import { findAABBOverlaps } from '@/domains/graph/shared/utils/collisionResolver';
import type {
  Link,
  Node,
  NodeMetric,
  RenderNode,
  TopicShape,
} from '@/domains/graph/shared/utils/graph.types';

beforeAll(() => {
  if (typeof globalThis.Path2D === 'undefined') {
    class MockPath2D {
      constructor(_d?: string) {}
    }
    (globalThis as unknown as { Path2D: typeof MockPath2D }).Path2D = MockPath2D;
  }
});

interface RecordedCalls {
  calls: Array<{ method: string; args: unknown[] }>;
  texts: string[];
}

function createMockCanvasContext(): { ctx: CanvasRenderingContext2D; recorded: RecordedCalls } {
  const recorded: RecordedCalls = { calls: [], texts: [] };
  const record =
    (method: string) =>
    (...args: unknown[]) => {
      recorded.calls.push({ method, args });
      if (method === 'fillText' && typeof args[0] === 'string') {
        recorded.texts.push(args[0]);
      }
    };

  const mock = {
    font: '500 12px sans-serif',
    fillStyle: '#000',
    strokeStyle: '#000',
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
    save: vi.fn(record('save')),
    restore: vi.fn(record('restore')),
    translate: vi.fn(record('translate')),
    scale: vi.fn(record('scale')),
    beginPath: vi.fn(record('beginPath')),
    closePath: vi.fn(record('closePath')),
    moveTo: vi.fn(record('moveTo')),
    lineTo: vi.fn(record('lineTo')),
    arc: vi.fn(record('arc')),
    arcTo: vi.fn(record('arcTo')),
    bezierCurveTo: vi.fn(record('bezierCurveTo')),
    quadraticCurveTo: vi.fn(record('quadraticCurveTo')),
    ellipse: vi.fn(record('ellipse')),
    rect: vi.fn(record('rect')),
    roundRect: vi.fn(record('roundRect')),
    fill: vi.fn(record('fill')),
    stroke: vi.fn(record('stroke')),
    fillRect: vi.fn(record('fillRect')),
    fillText: vi.fn(record('fillText')),
    setLineDash: vi.fn(record('setLineDash')),
    measureText: vi.fn((text: string) => ({ width: text.length * 6.5 })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
  };

  return { ctx: mock as unknown as CanvasRenderingContext2D, recorded };
}

describe('XMIND-STEP-02 — Rich Flexbox Node Box Model, TopicShapes & Connectors', () => {
  it('expands node bounding metrics for markers, stickers, footer tag pills, wikilinks, and TopicShapes', () => {
    const plain = cardLayout('Architecture', { root: false, badge: false });

    const withMarkers = cardLayout('Architecture', {
      root: false,
      badge: false,
      attachments: {
        markers: [
          { kind: 'priority', level: 1 },
          { kind: 'progress', percent: 75 },
          { kind: 'checkbox', state: 'done' },
        ],
        sticker: 'rocket',
      },
    });
    expect(withMarkers.leftSlotWidth).toBeGreaterThan(0);
    expect(withMarkers.width).toBeGreaterThan(plain.width + 50);

    const withPills = cardLayout('Go', {
      root: false,
      attachments: {
        labels: ['design-system', 'v2-roadmap', 'priority-zero'],
      },
      wikilinkCount: 4,
    });
    expect(withPills.footerLabelsHeight).toBe(18);
    expect(withPills.height).toBeGreaterThan(plain.height);
    expect(withPills.rightSlotWidth).toBeGreaterThan(0);
    expect(withPills.width).toBeGreaterThan(plain.width + 80);

    const plainBrainstorm = cardLayout('Brainstorm');
    const cloudMetric = cardLayout('Brainstorm', { topicShape: 'cloud' });
    const diamondMetric = cardLayout('Brainstorm', { topicShape: 'diamond' });
    expect(cloudMetric.width).toBeGreaterThan(plainBrainstorm.width);
    expect(cloudMetric.height).toBeGreaterThan(plainBrainstorm.height);
    expect(diamondMetric.shapePaddingX).toBe(topicShapePadding('diamond').x);
    expect(diamondMetric.width).toBe(plainBrainstorm.width + topicShapePadding('diamond').x);
  });

  it('extracts XMind frontmatter metadata and [[wikilinks]] counts cleanly in buildGraphProjection', () => {
    const markdown = [
      '---',
      'priority: P2',
      'progress: 65%',
      'status: done',
      'flag: "#f97316"',
      'star: true',
      'sticker: idea',
      'labels: [frontend, core, canvas]',
      'topic_shape: hexagon',
      '---',
      '# Render Engine',
      'Connects [[Composite Layout]] and [[Theme Bridge|Theme]].',
    ].join('\n');

    expect(countWikilinks(markdown)).toBe(2);
    const meta = extractRichMetadata(markdown);
    expect(meta.topicShape).toBe('hexagon');
    expect(meta.attachments?.sticker).toBe('idea');
    expect(meta.attachments?.labels).toEqual(['frontend', 'core', 'canvas']);
    expect(meta.attachments?.markers?.map((m) => m.kind)).toEqual([
      'priority',
      'progress',
      'checkbox',
      'flag',
      'star',
    ]);

    const nodes: Node[] = [
      { id: 'root', name: 'Vault', type: 'folder', parentId: null, depth: 0, tags: [], content: '' },
      { id: 'note', name: 'Engine', type: 'file', parentId: 'root', depth: 1, tags: ['ts'], content: markdown },
    ];
    const links: Link[] = [{ source: 'root', target: 'note', type: 'hierarchy' }];
    const proj = buildGraphProjection(nodes, links);

    const renderedNote = proj.byId.get('note')!;
    expect(renderedNote.topicShape).toBe('hexagon');
    expect(renderedNote.wikilinkCount).toBe(2);
    expect(renderedNote.attachments?.sticker).toBe('idea');
  });

  it('renders all 8 XMind TopicShapes and internal Flexbox attachments via Canvas2D without overlapping', async () => {
    const shapes: TopicShape[] = [
      'rounded-rect',
      'pill',
      'underline',
      'ellipse',
      'diamond',
      'hexagon',
      'cloud',
      'parallelogram',
    ];

    for (const shape of shapes) {
      const { ctx, recorded } = createMockCanvasContext();
      drawTopicShapeBox(ctx, shape, 100, 50, 140, 44, {
        fillStyle: 'rgba(15, 23, 42, 0.9)',
        strokeStyle: '#38bdf8',
        lineWidth: 1.5,
      });

      expect(recorded.calls.some((c) => c.method === 'stroke')).toBe(true);
      if (shape === 'cloud') {
        expect(recorded.calls.some((c) => c.method === 'quadraticCurveTo')).toBe(true);
      }
      if (shape === 'underline') {
        const moves = recorded.calls.filter((c) => c.method === 'moveTo');
        const lines = recorded.calls.filter((c) => c.method === 'lineTo');
        expect(moves[0]?.args).toEqual([30, 72]);
        expect(lines[0]?.args).toEqual([170, 72]);
      }
    }

    const { drawNode } = await import('@/domains/graph/shared/utils/drawNode');
    const theme = buildTheme(defaultGraphConfig);
    const richNode: RenderNode = {
      id: 'rich-1',
      name: 'Release Plan',
      type: 'file',
      parentId: 'root',
      depth: 1,
      tags: ['shipping'],
      content: 'Body text [[Spec]]',
      childCount: 2,
      wikilinkCount: 1,
      topicShape: 'pill',
      attachments: {
        markers: [
          { kind: 'checkbox', state: 'done' },
          { kind: 'priority', level: 1 },
          { kind: 'progress', percent: 50 },
        ],
        sticker: '🚀',
        labels: ['milestone'],
      },
      x: 200,
      y: 120,
    };

    const { ctx, recorded } = createMockCanvasContext();
    drawNode(ctx, richNode, {
      theme,
      zoom: 1,
      selected: false,
      hovered: false,
      dimmed: false,
      collapsed: true,
      isRoot: false,
      showLabels: true,
      labelThreshold: 0.4,
      preserveDetail: false,
      config: { ...defaultNodeConfig, topicShape: 'rounded-rect', showMarkers: true, showTagPills: true },
    });

    expect(recorded.texts).toContain('1');
    expect(recorded.texts).toContain('[[1]]');
    expect(recorded.texts).toContain('#milestone');
    expect(recorded.texts).toContain('#shipping');
    expect(recorded.texts).toContain('+2');
    expect(richNode.toggle).not.toBeNull();
    expect(resolveEffectiveTopicShape(richNode, defaultNodeConfig)).toBe('pill');

    // Direct helper verification for left slot + footer pills
    const slotCtx = createMockCanvasContext();
    const afterX = drawLeftSlotAttachments(
      slotCtx.ctx,
      10,
      20,
      richNode.attachments,
      '#38bdf8',
      theme,
    );
    expect(afterX).toBeGreaterThan(70);
    drawFooterTagPills(slotCtx.ctx, 10, 42, ['alpha', 'beta'], [42, 38], '#38bdf8', theme);
    expect(slotCtx.recorded.texts).toEqual(expect.arrayContaining(['#alpha', '#beta']));
  });

  it('draws Tapered Bezier trunks, Underline continuations, and Cross-Structure port anchors', () => {
    const theme = buildTheme(defaultGraphConfig);
    const metricOf = (): NodeMetric => ({ width: 120, height: 32 });

    // 1. Tapered Bezier trunk from depth 0 mindmap node fills ribbon instead of thin stroke
    const parent: RenderNode = {
      id: 'root',
      name: 'Central',
      type: 'folder',
      parentId: null,
      depth: 0,
      tags: [],
      content: '',
      childCount: 1,
      x: 0,
      y: 0,
    };
    const child: RenderNode = {
      id: 'c1',
      name: 'Topic',
      type: 'file',
      parentId: 'root',
      depth: 1,
      tags: [],
      content: '',
      childCount: 0,
      topicShape: 'underline',
      x: 220,
      y: 80,
    };

    const taperedMock = createMockCanvasContext();
    drawLink(taperedMock.ctx, parent, child, {
      mode: 'mindmap',
      sourceMode: 'mindmap',
      targetMode: 'mindmap',
      branchLineStyle: 'tapered-bezier',
      targetTopicShape: 'underline',
      linkType: 'hierarchy',
      boxed: true,
      theme,
      color: '#38bdf8',
      width: 2.5,
      opacity: 0.85,
      dash: [],
      dimmed: false,
      showArrow: false,
      arrowLength: 0,
      arrowRelPos: 1,
      curvature: 0.4,
      curveRotation: 0,
      particles: 0,
      particleWidth: 3,
      particleColor: '#38bdf8',
      particleProgress: 0,
      zoom: 1,
      preserveDetail: false,
      metricOf,
    });

    // Tapered bezier uses closed polygon fill() + connects to underline target bottom-left corner (220 - 60, 80 + 16) = (160, 96)
    expect(taperedMock.recorded.calls.some((c) => c.method === 'fill')).toBe(true);
    const moveArgs = taperedMock.recorded.calls.find((c) => c.method === 'moveTo')?.args;
    expect(moveArgs?.[0]).toBeGreaterThanOrEqual(55);

    // Verify drawTaperedBezierTrunk helper directly
    const rawTaper = createMockCanvasContext();
    drawTaperedBezierTrunk(
      rawTaper.ctx,
      { x: 0, y: 0 },
      { x: 60, y: 0 },
      { x: 100, y: 50 },
      { x: 160, y: 50 },
      10,
      2,
      '#22d3ee',
    );
    expect(rawTaper.recorded.calls.filter((c) => c.method === 'lineTo').length).toBeGreaterThan(20);
    expect(rawTaper.recorded.calls.some((c) => c.method === 'fill')).toBe(true);

    // 2. Cross-structure boundary (Mindmap horizontal parent -> Org-chart vertical child)
    const crossMock = createMockCanvasContext();
    drawLink(crossMock.ctx, parent, child, {
      mode: 'mindmap',
      sourceMode: 'mindmap',
      targetMode: 'org-chart',
      branchLineStyle: 'cubic-bezier',
      taperedTrunk: false,
      linkType: 'hierarchy',
      boxed: true,
      theme,
      color: '#a855f7',
      width: 2,
      opacity: 0.8,
      dash: [],
      dimmed: false,
      showArrow: false,
      arrowLength: 0,
      arrowRelPos: 1,
      curvature: 0.3,
      curveRotation: 0,
      particles: 0,
      particleWidth: 3,
      particleColor: '#a855f7',
      particleProgress: 0,
      zoom: 1,
      preserveDetail: false,
      metricOf,
    });

    const bezierCall = crossMock.recorded.calls.find((c) => c.method === 'bezierCurveTo');
    expect(bezierCall).toBeDefined();
    // Target enters North top edge of child: (tx, ty - h/2) = (220, 64)
    expect(bezierCall!.args[4]).toBe(220);
    expect(bezierCall!.args[5]).toBe(64);
  });

  it('produces zero AABB collisions when laying out richly attached TopicShape cards in mixed-structure trees', () => {
    const rawNodes: Node[] = [
      { id: 'root', name: 'Product Vision 2027', type: 'folder', parentId: null, depth: 0, tags: ['roadmap'], content: '', topicShape: 'cloud' },
      { id: 'b1', name: 'Org Engineering', type: 'folder', parentId: 'root', depth: 1, tags: ['eng', 'platform'], content: '[[Spec]]', topicShape: 'hexagon', attachments: { markers: [{ kind: 'priority', level: 1 }], sticker: 'rocket', labels: ['critical'] } },
      { id: 'b2', name: 'Launch Checklist', type: 'folder', parentId: 'root', depth: 1, tags: ['qa'], content: '', topicShape: 'diamond', attachments: { markers: [{ kind: 'progress', percent: 80 }], labels: ['q4'] } },
      { id: 'b3', name: 'Brace Components', type: 'folder', parentId: 'root', depth: 1, tags: ['ui'], content: '', topicShape: 'pill' },
    ];

    for (let i = 0; i < 6; i++) {
      rawNodes.push({
        id: `b1-c${i}`,
        name: `Team Squad ${i + 1}`,
        type: 'file',
        parentId: 'b1',
        depth: 2,
        tags: ['backend', 'infra'],
        content: 'Details [[Link]]',
        topicShape: 'parallelogram',
        attachments: {
          markers: [
            { kind: 'checkbox', state: i % 2 === 0 ? 'done' : 'todo' },
            { kind: 'priority', level: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5 },
          ],
          sticker: 'idea',
          labels: [`squad-${i}`],
        },
      });
      rawNodes.push({
        id: `b2-c${i}`,
        name: `Verification Gate ${i + 1}`,
        type: 'file',
        parentId: 'b2',
        depth: 2,
        tags: ['verify'],
        content: 'Notes',
        topicShape: i % 2 === 0 ? 'ellipse' : 'underline',
        attachments: {
          markers: [{ kind: 'star', color: '#eab308' }],
          labels: ['automated', 'zero-regression'],
        },
      });
    }

    const links: Link[] = rawNodes
      .filter((n) => n.parentId)
      .map((n) => ({ source: n.parentId!, target: n.id, type: 'hierarchy' }));
    const projection = buildGraphProjection(rawNodes, links);
    const metrics = new Map<string, NodeMetric>();
    for (const node of projection.nodes) {
      const m = measureRichNodeMetrics(node, defaultNodeConfig);
      metrics.set(node.id, { width: m.width, height: m.height });
    }

    const geometry = computeLayout(projection, {
      mode: 'mindmap',
      width: 1400,
      height: 900,
      orientation: 'balanced',
      levelGap: 110,
      siblingGap: 46,
      laneGap: 46,
      ribAngle: Math.PI / 4,
      visibleIds: projection.nodes.map((n) => n.id),
      nodeMetrics: metrics,
      subtreeOverrides: {
        b1: 'org-chart',
        b3: 'brace-map',
      },
    });

    const overlaps = findAABBOverlaps(geometry.targets, metrics, undefined, 2);
    expect(overlaps.length).toBe(0);
  });

  it('enforces clean Only Node, With Text, and With Label + Text rendering without ghost label-box shadow', () => {
    const theme = buildTheme(defaultGraphConfig);
    const folderNode: RenderNode = {
      id: 'folder-1',
      name: 'Apik Node',
      content: '',
      type: 'folder',
      parentId: null,
      depth: 0,
      tags: ['demo'],
      childCount: 2,
      wikilinkCount: 0,
      x: 100,
      y: 100,
    };

    // 1. Only Node (even if legacy preset kept labelBox: true while showLabels: false)
    const onlyNodeCanvas = createMockCanvasContext();
    drawNode(onlyNodeCanvas.ctx, folderNode, {
      theme,
      zoom: 1,
      selected: true,
      hovered: true,
      dimmed: false,
      collapsed: false,
      isRoot: true,
      showLabels: false,
      labelThreshold: 0.7,
      preserveDetail: false,
      config: { ...defaultNodeConfig, showLabels: false, labelBox: true },
    });
    expect(onlyNodeCanvas.recorded.calls.some((c) => c.method === 'roundRect')).toBe(false);
    expect(onlyNodeCanvas.recorded.texts).toEqual([]);
    expect(onlyNodeCanvas.ctx.shadowBlur).toBe(0);
    // Folder collapse toggle remains active
    expect(folderNode.toggle).not.toBeNull();

    // 2. With Text (node + text + collapse toggle, no label box)
    const withTextCanvas = createMockCanvasContext();
    drawNode(withTextCanvas.ctx, folderNode, {
      theme,
      zoom: 1,
      selected: false,
      hovered: false,
      dimmed: false,
      collapsed: false,
      isRoot: true,
      showLabels: true,
      labelThreshold: 0.7,
      preserveDetail: false,
      config: { ...defaultNodeConfig, showLabels: true, labelBox: false },
    });
    expect(withTextCanvas.recorded.calls.some((c) => c.method === 'roundRect')).toBe(false);
    expect(withTextCanvas.recorded.texts).toContain('Apik Node');

    // 3. With Label + Text (node + box + text)
    const withBoxCanvas = createMockCanvasContext();
    drawNode(withBoxCanvas.ctx, folderNode, {
      theme,
      zoom: 1,
      selected: false,
      hovered: false,
      dimmed: false,
      collapsed: false,
      isRoot: true,
      showLabels: true,
      labelThreshold: 0.7,
      preserveDetail: false,
      config: { ...defaultNodeConfig, showLabels: true, labelBox: true },
    });
    expect(withBoxCanvas.recorded.calls.some((c) => c.method === 'roundRect')).toBe(true);
    expect(withBoxCanvas.recorded.texts).toContain('Apik Node');
  });

  it('keeps With Text word wrapping intact (no mid-word chop), anchors links cleanly to dot radius, places auto labels below in Graph / beside in Mindmap, and restricts hit-area to dot', () => {
    const theme = buildTheme(defaultGraphConfig);

    // 1. No mid-word character chop + 2-line wrap limit at ~200px
    const slugLines = wrapText('kepano-obsidian-main', '500 12px sans-serif', 200, 2, false);
    expect(slugLines).toEqual(['kepano-obsidian-main']);
    const superLongLines = wrapText(
      'superlongunspacedfilenamethatexceedstwohundredpixelswidthlimit',
      '500 12px sans-serif',
      200,
      2,
      false,
    );
    expect(superLongLines).toHaveLength(1);
    expect(superLongLines[0].endsWith('…')).toBe(true);

    const multiWord = measureUnboxedText('68 Bits of Unsolicited Advice', { fontSize: 12 });
    expect(multiWord.lines.length).toBeLessThanOrEqual(2);
    expect(multiWord.lines.join(' ')).toBe('68 Bits of Unsolicited Advice');

    // 2. Auto placement switches cleanly between Knowledge Graph ('below') and Mindmap ('beside')
    expect(resolveUnboxedLabelPosition('auto', 'free-force', 'graph')).toBe('below');
    expect(resolveUnboxedLabelPosition('auto', 'mindmap', 'mindmap')).toBe('beside');
    expect(resolveUnboxedLabelPosition('beside', 'free-force', 'graph')).toBe('beside');
    expect(resolveUnboxedLabelPosition('below', 'mindmap', 'mindmap')).toBe('below');

    // 3. Draw With Text in Knowledge Graph -> text centered BELOW dot, toggle right of dot, hit-area dot-only
    const graphNode: RenderNode = {
      id: 'g-node',
      name: 'kepano-obsidian-main',
      type: 'folder',
      parentId: null,
      depth: 0,
      tags: [],
      content: '',
      childCount: 2,
      x: 200,
      y: 200,
    };
    const graphCanvas = createMockCanvasContext();
    drawNode(graphCanvas.ctx, graphNode, {
      theme,
      zoom: 1,
      selected: false,
      hovered: false,
      dimmed: false,
      collapsed: false,
      isRoot: true,
      showLabels: true,
      labelThreshold: 0.7,
      preserveDetail: false,
      layoutMode: 'free-force',
      canvasMode: 'graph',
      config: { ...defaultNodeConfig, showLabels: true, labelBox: false, labelPosition: 'auto', relSize: 6 },
    });
    const graphTextCall = graphCanvas.recorded.calls.find((c) => c.method === 'fillText');
    expect(graphTextCall?.args[1]).toBe(200); // centered horizontally on dot.x
    expect(Number(graphTextCall?.args[2])).toBeGreaterThan(206); // below dot.y + radius
    expect(graphNode.toggle!.x).toBeGreaterThan(206); // right shoulder of dot
    expect(graphNode.toggle!.y).toBe(200);

    const pointerCanvas = createMockCanvasContext();
    paintNodePointerArea(
      pointerCanvas.ctx,
      graphNode,
      '#123456',
      true,
      { ...defaultNodeConfig, showLabels: true, labelBox: false, labelPosition: 'auto', relSize: 6 },
      1,
      false,
    );
    expect(pointerCanvas.recorded.calls.some((c) => c.method === 'fillRect')).toBe(false);
    expect(pointerCanvas.recorded.calls.some((c) => c.method === 'arc')).toBe(true);

    // 4. Draw Mindmap Left Hub + Left Leaf -> leaf beside left, hub lifted above horizontal link, toggle bottom-right
    const leftHub: RenderNode = {
      id: 'hub-1',
      name: 'Clippings',
      type: 'folder',
      parentId: 'root',
      depth: 1,
      tags: [],
      content: '',
      childCount: 3,
      layoutSide: -1,
      x: 100,
      y: 200,
    };
    const leftLeaf: RenderNode = {
      id: 'leaf-1',
      name: 'New File 117',
      type: 'file',
      parentId: 'hub-1',
      depth: 2,
      tags: [],
      content: '',
      childCount: 0,
      layoutSide: -1,
      x: -100,
      y: 200,
    };
    const hubCanvas = createMockCanvasContext();
    drawNode(hubCanvas.ctx, leftHub, {
      theme,
      zoom: 1,
      selected: false,
      hovered: false,
      dimmed: false,
      collapsed: false,
      isRoot: false,
      showLabels: true,
      labelThreshold: 0.7,
      preserveDetail: false,
      layoutMode: 'mindmap',
      canvasMode: 'mindmap',
      config: { ...defaultNodeConfig, showLabels: true, labelBox: false, labelPosition: 'auto', relSize: 6 },
    });
    const hubTextCall = hubCanvas.recorded.calls.find((c) => c.method === 'fillText');
    expect(Number(hubTextCall?.args[1])).toBeLessThan(100); // outer left side
    expect(Number(hubTextCall?.args[2])).toBeLessThan(200); // cleanly lifted above horizontal link axis
    expect(leftHub.toggle!.x).toBeGreaterThan(100);
    expect(leftHub.toggle!.y).toBeGreaterThan(200); // bottom-right dot shoulder, clear of text & branch line

    const leafCanvas = createMockCanvasContext();
    drawNode(leafCanvas.ctx, leftLeaf, {
      theme,
      zoom: 1,
      selected: false,
      hovered: false,
      dimmed: false,
      collapsed: false,
      isRoot: false,
      showLabels: true,
      labelThreshold: 0.7,
      preserveDetail: false,
      layoutMode: 'mindmap',
      canvasMode: 'mindmap',
      config: { ...defaultNodeConfig, showLabels: true, labelBox: false, labelPosition: 'auto', relSize: 6 },
    });
    const leafTextCall = leafCanvas.recorded.calls.find((c) => c.method === 'fillText');
    expect(Number(leafTextCall?.args[1])).toBeLessThan(-100); // extends leftward away from incoming link
    expect(Number(leafTextCall?.args[2])).toBe(200);

    // 5. Link anchoring in With Text connects to dot perimeter (NOT huge metric.width / 2 = 80px!)
    const metricOfHuge = (): NodeMetric => ({ width: 180, height: 48 });
    const mindmapLinkCanvas = createMockCanvasContext();
    drawLink(mindmapLinkCanvas.ctx, leftHub, leftLeaf, {
      mode: 'mindmap',
      boxed: false,
      taperedTrunk: false,
      sourceDotRadius: 7,
      targetDotRadius: 7,
      theme,
      color: '#38bdf8',
      width: 2,
      opacity: 1,
      dash: [],
      dimmed: false,
      showArrow: false,
      arrowLength: 0,
      arrowRelPos: 1,
      curvature: 0.2,
      curveRotation: 0,
      particles: 0,
      particleWidth: 2,
      particleColor: '#38bdf8',
      particleProgress: 0,
      zoom: 1,
      preserveDetail: false,
      metricOf: metricOfHuge,
    });
    const moveCall = mindmapLinkCanvas.recorded.calls.find((c) => c.method === 'moveTo');
    const curveCall = mindmapLinkCanvas.recorded.calls.find((c) => c.method === 'bezierCurveTo');
    // Source dot perimeter on left side of x=100 is 100 - 7 = 93 (NOT 100 - 90 = 10!)
    expect(moveCall?.args[0]).toBeCloseTo(93, 1);
    // Target dot perimeter on right side of x=-100 is -100 + 7 = -93 (NOT -100 + 90 = -10!)
    expect(curveCall?.args[4]).toBeCloseTo(-93, 1);

    // 6. Free-force Knowledge Graph link also connects to radial dot perimeter despite large metric
    const nA: RenderNode = { ...leftHub, x: 0, y: 0 };
    const nB: RenderNode = { ...leftLeaf, x: 100, y: 0 };
    const graphLinkCanvas = createMockCanvasContext();
    drawLink(graphLinkCanvas.ctx, nA, nB, {
      mode: 'free-force',
      boxed: false,
      sourceDotRadius: 8,
      targetDotRadius: 8,
      theme,
      color: '#a855f7',
      width: 2,
      opacity: 1,
      dash: [],
      dimmed: false,
      showArrow: false,
      arrowLength: 0,
      arrowRelPos: 1,
      curvature: 0,
      curveRotation: 0,
      particles: 0,
      particleWidth: 2,
      particleColor: '#a855f7',
      particleProgress: 0,
      zoom: 1,
      preserveDetail: false,
      metricOf: metricOfHuge,
    });
    expect(graphLinkCanvas.recorded.calls.find((c) => c.method === 'moveTo')?.args).toEqual([8, 0]);
    expect(graphLinkCanvas.recorded.calls.find((c) => c.method === 'lineTo')?.args).toEqual([92, 0]);
  });
});
