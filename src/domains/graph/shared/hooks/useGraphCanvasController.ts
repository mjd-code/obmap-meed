import {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
  useImperativeHandle,
  type ForwardedRef,
} from 'react';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import type {
  Node,
  Link,
  RenderNode,
  RenderLink,
  NodeMetric,
  MindmapLayoutMode,
} from '@/domains/graph/shared/utils/graph.types';
import type { GraphCanvasProps, GraphCanvasHandle } from '@/domains/graph/components/GraphCanvas';
import { useGraphEngineStore } from '@/domains/graph/shared/stores/useGraphEngineStore';
import { useGraphInteractionStore } from '@/domains/graph/shared/stores/useGraphInteractionStore';
import { useExplorerGraphSyncStore } from '@/domains/graph/shared/stores/useExplorerGraphSyncStore';
import { defaultLinkConfig, defaultTopologyConfig } from '@/domains/graph/shared/stores/useGraphStore';
import { buildGraphProjection } from '@/domains/graph/shared/utils/buildGraphProjection';
import { buildTheme } from '@/domains/graph/shared/utils/theme';
import { cardLayout } from '@/domains/graph/shared/utils/textLayout';
import { hiddenByCollapse, pathwayOf, subtreeOf } from '@/domains/graph/shared/utils/graphTraversal';
import { resolveHierarchyLinkPaint } from '@/domains/graph/shared/utils/hierarchyColors';
import { useLayoutEngine } from '@/domains/graph/shared/hooks/useLayoutEngine';
import { useCanvasAtmosphere } from '@/domains/graph/shared/hooks/useCanvasAtmosphere';
import { useCanvasDragReparent } from '@/domains/graph/shared/hooks/useCanvasDragReparent';
import { useCanvasGestureBridge } from '@/domains/graph/shared/hooks/useCanvasGestureBridge';
import { useGraphPhysicsSimulation } from '@/domains/graph/shared/hooks/useGraphPhysicsSimulation';
import { LayoutTransitionController } from '@/domains/graph/shared/utils/transitionController';
import { drawNode, paintNodePointerArea } from '@/domains/graph/shared/utils/drawNode';
import { drawLink } from '@/domains/graph/shared/utils/drawLink';
import { usesPhysicsSimulation } from '@/domains/graph/shared/utils/layoutCategory';

const dashFor = (style: string | undefined, width: number): number[] => {
  if (style === 'dashed') return [width * 3, width * 2];
  if (style === 'dotted') return [1, width * 2];
  return [];
};

const parseDash = (value: string, width: number): number[] => {
  const parsed = value
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isFinite(part) && part > 0);
  return parsed.length ? parsed : dashFor(undefined, width);
};

export function useGraphCanvasController(
  props: GraphCanvasProps,
  ref: ForwardedRef<GraphCanvasHandle>,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphMethods<RenderNode, RenderLink> & { refresh: () => unknown }>();
  const transition = useRef(new LayoutTransitionController());
  const zoomRef = useRef(1);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const nodeCache = useRef(new Map<string, RenderNode>());

  const engine = useGraphEngineStore();
  const {
    canvasMode,
    layoutMode,
    layoutArrangement,
    orientation,
    highlightMode,
    collapsedIds,
    hoveredId,
    focusedRootId,
    subtreeLayoutOverrides,
    setSubtreeLayoutOverride,
    setFocusedRoot,
    toggleCollapsed,
    setHovered,
    setSelected,
  } = useGraphInteractionStore();

  const clearExplorerHoveredNode = useExplorerGraphSyncStore(
    (state) => state.clearExplorerHoveredNode,
  );

  // ResizeObserver untuk Container Kanvas
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setSize({ width, height });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Proyeksi Grafis
  const projection = useMemo(() => {
    const next = buildGraphProjection(props.graphData.nodes, props.graphData.links, {
      timeField: engine.timeField,
    });
    const activeIds = new Set(next.nodes.map((node) => node.id));
    const nodes = next.nodes.map((node) => {
      const existing = nodeCache.current.get(node.id);
      if (!existing) {
        nodeCache.current.set(node.id, node);
        return node;
      }
      Object.assign(existing, node);
      return existing;
    });
    for (const id of nodeCache.current.keys()) {
      if (!activeIds.has(id)) nodeCache.current.delete(id);
    }
    return { ...next, nodes, byId: new Map(nodes.map((node) => [node.id, node])) };
  }, [props.graphData.nodes, props.graphData.links, engine.timeField]);

  // Metrik Kartu Node
  const metrics = useMemo(() => {
    const map = new Map<string, NodeMetric>();
    const showLabels = props.graphConfig.nodes.showLabels;

    for (const node of projection.nodes) {
      const label = props.graphConfig.nodes.labelField === 'id' ? node.id : node.name;
      const depthScale = props.graphConfig.nodes.sizeByDepth
        ? Math.max(0.45, 1 - node.depth * props.graphConfig.nodes.depthSizeInterval * 0.08)
        : 1;
      const diameter = Math.max(3, props.graphConfig.nodes.relSize * depthScale) * 2;

      const layout = cardLayout(label, {
        root: node.parentId === null,
        badge: node.childCount > 0,
        fontSize: props.graphConfig.nodes.labelSize + (node.parentId === null ? 2 : 0),
      });

      if (showLabels) {
        map.set(node.id, {
          width: layout.width,
          height: Math.max(diameter + 10, layout.height),
        });
      } else {
        map.set(node.id, { width: diameter, height: diameter });
      }
    }
    return map;
  }, [
    projection.nodes,
    props.graphConfig.nodes.showLabels,
    props.graphConfig.nodes.labelField,
    props.graphConfig.nodes.labelSize,
    props.graphConfig.nodes.relSize,
    props.graphConfig.nodes.sizeByDepth,
    props.graphConfig.nodes.depthSizeInterval,
  ]);

  const metricOf = useCallback(
    (node: RenderNode) => {
      const metric = metrics.get(node.id) ?? { width: 90, height: 28 };
      if (engine.zoomOutRendering !== 'full-detail') return metric;
      const scale = 1 / Math.max(0.05, zoomRef.current);
      return { width: metric.width * scale, height: metric.height * scale };
    },
    [metrics, engine.zoomOutRendering],
  );

  // Filter Visibilitas Node
  const visibleIds = useMemo(() => {
    const hidden = hiddenByCollapse(projection, collapsedIds);
    const focusSet = focusedRootId ? subtreeOf(projection, focusedRootId) : null;
    const term = props.search.trim().toLowerCase();
    const content = props.contentFilter.trim().toLowerCase();
    const tag = props.tagFilter.trim().toLowerCase().replace(/^#/, '');

    return projection.nodes
      .filter((node) => {
        if (hidden.has(node.id)) return false;
        if (focusSet && !focusSet.has(node.id)) return false;
        if (node.depth < props.minDepth || node.depth > props.maxDepth) return false;
        if (term && !node.name.toLowerCase().includes(term)) return false;
        if (content && !node.content.toLowerCase().includes(content)) return false;
        if (tag && !node.tags.some((t) => t.toLowerCase() === tag)) return false;
        return true;
      })
      .map((n) => n.id);
  }, [
    projection,
    collapsedIds,
    focusedRootId,
    props.search,
    props.contentFilter,
    props.tagFilter,
    props.minDepth,
    props.maxDepth,
  ]);

  // Layout Engine Computation
  const geometry = useLayoutEngine(projection, {
    mode: layoutMode,
    width: size.width,
    height: size.height,
    orientation,
    levelGap: 140,
    siblingGap: 36,
    laneGap: 80,
    ribAngle: Math.PI / 4,
    rootId: focusedRootId ?? undefined,
    visibleIds,
    nodeMetrics: metrics,
    subtreeOverrides: subtreeLayoutOverrides,
  });

  // Display Data untuk ForceGraph2D
  const displayData = useMemo(() => {
    const visibleSet = new Set(visibleIds);
    const nodes = projection.nodes.filter((n) => visibleSet.has(n.id));
    const links = projection.links.filter((l) => {
      const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return visibleSet.has(s) && visibleSet.has(t);
    });
    return { nodes, links };
  }, [projection, visibleIds]);

  // Tema Grafis (Memperbaiki error TS2554 Baris 204)
  const theme = useMemo(() => buildTheme(props.graphConfig), [props.graphConfig]);

  // Pathway Highlight
  const pathway = useMemo(
    () => (highlightMode === 'pathway' ? pathwayOf(projection, hoveredId) : new Set<string>()),
    [projection, hoveredId, highlightMode],
  );

  // Atmosphere Particles
  const atmosphere = useCanvasAtmosphere({
    graphConfig: props.graphConfig,
    layoutMode,
    decorations: geometry.decorations,
    theme,
    projection,
    zoomOutRendering: 'dots',
    size,
    zoomRef,
  });

  // Simulasi Fisika
  useGraphPhysicsSimulation({
    graphRef,
    layoutMode,
    config: props.graphConfig,
  });

  // Drag Reparenting Hook
  const dragReparent = useCanvasDragReparent({
    nodes: displayData.nodes,
    parentByChild: projection.parentByChild,
    childrenByParent: projection.childrenByParent,
    layoutMode,
    layoutArrangement,
    layoutTargets: geometry.targets,
    transitionRef: transition,
    graphRef,
    onNodeMove: props.onNodeMove,
  });

  // Gesture Bridge (Touch, Click, Double Click)
  const gestureBridge = useCanvasGestureBridge({
    containerRef,
    graphRef,
    zoomRef,
    nodes: displayData.nodes,
    rawNodes: props.graphData.nodes,
    selectedNode: props.selectedNode,
    onNodeSelect: props.onNodeSelect,
    onNodeOpen: props.onNodeOpen,
    onToggleCollapse: (nodeId) => toggleCollapsed(nodeId),
    setSelected,
    onCanvasInteraction: () => clearExplorerHoveredNode(),
  });

  // Imperative Handle
  useImperativeHandle(
    ref,
    () => ({
      smartZoom: (action) => gestureBridge.smartZoom(action),
      refresh: () => graphRef.current?.refresh?.(),
    }),
    [gestureBridge],
  );

  const visibleDepths = useMemo(() => {
    return Array.from(new Set(displayData.nodes.map((n) => n.depth))).sort((a, b) => a - b);
  }, [displayData.nodes]);

  const isPhysicsActive = usesPhysicsSimulation(layoutMode);

  return {
    containerRef,
    graphRef,
    size,
    displayData,
    theme,
    geometry,
    visibleDepths,
    atmosphere,
    dragReparent,
    gestureBridge,
    isPhysicsActive,
    layoutMode,
    canvasMode,
    subtreeLayoutOverrides,
    focusedRootId,
    actions: {
      setFocusedRoot,
      setSubtreeLayoutOverride,
      toggleCollapsed,
      paintNode: (node: RenderNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
        zoomRef.current = globalScale;
        drawNode(ctx, node, {
          theme,
          zoom: globalScale,
          selected: props.selectedNode?.id === node.id,
          hovered: hoveredId === node.id,
          dimmed: pathway.size > 0 && !pathway.has(node.id),
          collapsed: collapsedIds.includes(node.id),
          isRoot: node.parentId === null,
          showLabels: engine.showLabels && props.graphConfig.nodes.showLabels,
          labelThreshold: engine.labelZoomThreshold,
          preserveDetail: engine.zoomOutRendering === 'full-detail',
          config: props.graphConfig.nodes,
          glowPhase: atmosphere.glowPhase.current,
          isDragged: dragReparent.dragRef.current.draggedNodeId === node.id,
          isDropTarget: dragReparent.dragRef.current.hoveredTargetId === node.id,
          dropTargetValid: dragReparent.dragRef.current.isValidDrop,
        });
      },
      paintPointer: (node: RenderNode, color: string, ctx: CanvasRenderingContext2D, globalScale: number) => {
        paintNodePointerArea(
          ctx,
          node,
          color,
          node.parentId === null,
          props.graphConfig.nodes,
          globalScale || zoomRef.current,
          engine.zoomOutRendering === 'full-detail',
        );
      },
      paintLink: (link: RenderLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const source = link.source as RenderNode;
        const target = link.target as RenderNode;
        if (typeof source !== 'object' || typeof target !== 'object') return;

        if (layoutMode === 'fishbone' && (link.type ?? 'hierarchy') === 'hierarchy') return;

        const style =
          props.graphConfig.topology.styles[
            (link.type ?? 'hierarchy') as keyof typeof props.graphConfig.topology.styles
          ] ?? props.graphConfig.topology.styles.hierarchy;
        const type = (link.type ?? 'hierarchy') as keyof typeof props.graphConfig.topology.styles;
        const defaultTypeStyle =
          defaultTopologyConfig.styles[type] ?? defaultTopologyConfig.styles.hierarchy;
        const widthScale = props.graphConfig.links.width / defaultLinkConfig.width;
        const opacityScale = props.graphConfig.links.opacity / defaultLinkConfig.opacity;
        const usesDefaultTypeColor = style.color === defaultTypeStyle.color;

        const hierarchyPaint =
          props.graphConfig.hierarchy.enabled && type === 'hierarchy'
            ? resolveHierarchyLinkPaint(source.depth, target.depth, props.graphConfig.hierarchy)
            : null;
        const strokeColor = hierarchyPaint
          ? hierarchyPaint.color
          : usesDefaultTypeColor
            ? theme.link
            : style.color;

        drawLink(ctx, source, target, {
          mode: layoutMode,
          theme,
          color: strokeColor,
          width: Math.max(0.25, style.width * widthScale),
          opacity: hierarchyPaint?.opacity ?? Math.min(1, style.opacity * opacityScale),
          dash:
            style.lineStyle === 'solid'
              ? parseDash(props.graphConfig.links.dashArray, style.width * widthScale)
              : dashFor(style.lineStyle, style.width * widthScale),
          dimmed: pathway.size > 0 && !(pathway.has(source.id) && pathway.has(target.id)),
          showArrow: props.graphConfig.links.showArrows,
          arrowLength: props.graphConfig.links.arrowLength,
          arrowRelPos: props.graphConfig.links.arrowRelPos,
          curvature: props.graphConfig.links.curvature,
          curveRotation: props.graphConfig.links.curveRotation,
          particles: props.graphConfig.links.showParticles ? props.graphConfig.links.particles : 0,
          particleWidth: props.graphConfig.links.particleWidth,
          particleColor: hierarchyPaint ? hierarchyPaint.color : props.graphConfig.links.particleColor,
          particleProgress: atmosphere.particleProgress.current,
          zoom: globalScale || zoomRef.current,
          preserveDetail: engine.zoomOutRendering === 'full-detail',
          metricOf,
        });
      },
      renderDecorations: (ctx: CanvasRenderingContext2D, globalScale: number) => {
        atmosphere.renderDecorations(ctx, globalScale);
      },
      handleZoomEnd: () => {
        gestureBridge.updateToolbarPosition();
      },
    },
  };
}