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
  RenderNode,
  RenderLink,
  NodeMetric,
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
import { resolveHierarchyLinkPaint, uniqueDepths } from '@/domains/graph/shared/utils/hierarchyColors';
import { useLayoutEngine } from '@/domains/graph/shared/hooks/useLayoutEngine';
import { useCanvasAtmosphere } from '@/domains/graph/shared/hooks/useCanvasAtmosphere';
import { useCanvasDragReparent } from '@/domains/graph/shared/hooks/useCanvasDragReparent';
import { useCanvasGestureBridge } from '@/domains/graph/shared/hooks/useCanvasGestureBridge';
import { useGraphPhysicsSimulation } from '@/domains/graph/shared/hooks/useGraphPhysicsSimulation';
import {
  LayoutTransitionController,
  prefersReducedMotion,
} from '@/domains/graph/shared/utils/transitionController';
import { drawNode, paintNodePointerArea } from '@/domains/graph/shared/utils/drawNode';
import { drawLink } from '@/domains/graph/shared/utils/drawLink';
import { usesPhysicsSimulation } from '@/domains/graph/shared/utils/layoutCategory';
import {
  calculateAdaptiveCameraLimits,
  seedDeterministicNodePositions,
  resolveAncestorsFromMap,
  topologyEnabled,
} from '@/domains/graph/shared/utils/cameraBounds';

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
  const handledExplorerFocusNonce = useRef<number | null>(null);
  const isClampingPanRef = useRef(false);
  const hasInitialFitRef = useRef(false);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const nodeCache = useRef(new Map<string, RenderNode>());
  const [timeLapseVisibleIds, setTimeLapseVisibleIds] = useState<Set<string> | null>(null);

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
    setCollapsed,
    setHovered,
    setSelected,
    setTransitionStatus,
    simulationCommand,
    isTimeLapseActive,
    stopTimeLapse,
    setTimeLapseProgress,
  } = useGraphInteractionStore();
  const prevLayoutModeRef = useRef(layoutMode);

  const explorerHoveredNodeId = useExplorerGraphSyncStore(
    (state) => state.explorerHoveredNodeId,
  );
  const explorerFocusRequest = useExplorerGraphSyncStore(
    (state) => state.focusRequest,
  );
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

  // Metrik Kartu Node (mengikuti opsi labelBox, showLabels, relSize)
  const metrics = useMemo(() => {
    const map = new Map<string, NodeMetric>();
    const showLabels = props.graphConfig.nodes.showLabels;
    const labelBox = props.graphConfig.nodes.labelBox;

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

      if (labelBox) {
        map.set(node.id, { width: layout.width, height: layout.height });
      } else if (showLabels) {
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
    props.graphConfig.nodes.labelBox,
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

  // Mesin Eksekusi Time-Lapse Hierarkis
  useEffect(() => {
    if (!isTimeLapseActive) {
      setTimeLapseVisibleIds(null);
      return;
    }

    const sortedNodes = [...projection.nodes].sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });

    if (sortedNodes.length === 0) {
      stopTimeLapse();
      return;
    }

    setTimeLapseVisibleIds(new Set());
    setTimeLapseProgress(0, sortedNodes.length);

    let currentIndex = 0;
    const accumulated = new Set<string>();

    const timer = setInterval(() => {
      if (currentIndex >= sortedNodes.length) {
        clearInterval(timer);
        stopTimeLapse();
        return;
      }

      accumulated.add(sortedNodes[currentIndex].id);
      setTimeLapseVisibleIds(new Set(accumulated));
      currentIndex++;
      setTimeLapseProgress(currentIndex, sortedNodes.length);
    }, 120);

    return () => clearInterval(timer);
  }, [isTimeLapseActive, projection, stopTimeLapse, setTimeLapseProgress]);

  // Filter Visibilitas Node (folder/file toggles + collapse + search/depth/tags)
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
        if (!props.graphConfig.nodes.showFolderNodes && node.type === 'folder') return false;
        if (!props.graphConfig.nodes.showFileNodes && node.type !== 'folder') return false;
        if (node.depth < props.minDepth || node.depth > props.maxDepth) return false;
        if (term && !node.name.toLowerCase().includes(term)) return false;
        if (content && !node.content.toLowerCase().includes(content)) return false;
        if (tag && !node.tags.some((t) => t.toLowerCase().replace(/^#/, '') === tag)) return false;
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
    props.graphConfig.nodes.showFolderNodes,
    props.graphConfig.nodes.showFileNodes,
  ]);

  // Layout Engine Computation (menggunakan parameter jarak dari useGraphEngineStore)
  const geometry = useLayoutEngine(projection, {
    mode: layoutMode,
    width: size.width,
    height: size.height,
    orientation,
    levelGap: engine.levelDistance || 110,
    siblingGap: engine.laneHeight || 46,
    laneGap: engine.laneHeight || 46,
    ribAngle: Math.PI / 4,
    rootId: focusedRootId ?? undefined,
    visibleIds,
    nodeMetrics: metrics,
    subtreeOverrides: subtreeLayoutOverrides,
  });

  // Display Data untuk ForceGraph2D (dengan initial seeding & filter topologi + mode mindmap)
  const displayData = useMemo(() => {
    const visible = new Set(timeLapseVisibleIds ?? visibleIds);
    const nodes = projection.nodes.filter((n) => visible.has(n.id));

    seedDeterministicNodePositions(
      nodes,
      projection.parentByChild,
      nodeCache.current,
      geometry.targets,
      layoutMode,
    );

    const links = projection.links.filter((l) => {
      const s = typeof l.source === 'object' ? (l.source as RenderNode).id : l.source;
      const t = typeof l.target === 'object' ? (l.target as RenderNode).id : l.target;

      if (canvasMode === 'mindmap' && l.type !== 'hierarchy') {
        return false;
      }

      return visible.has(s) && visible.has(t) && topologyEnabled(l.type, props.graphConfig);
    });
    return { nodes, links };
  }, [projection, visibleIds, timeLapseVisibleIds, props.graphConfig, geometry.targets, layoutMode, canvasMode]);

  // Eksekutor Transisi Layout & Animasi Deterministik <-> Free-Force
  useEffect(() => {
    const controller = transition.current;
    const modeChanged = prevLayoutModeRef.current !== layoutMode;
    prevLayoutModeRef.current = layoutMode;

    if (usesPhysicsSimulation(layoutMode)) {
      controller.release(displayData.nodes);
      graphRef.current?.d3ReheatSimulation?.();
      setTransitionStatus('idle');
      if (!hasInitialFitRef.current || modeChanged) {
        hasInitialFitRef.current = true;
        window.setTimeout(() => graphRef.current?.zoomToFit?.(400, 60), 250);
      }
      return;
    }

    setTransitionStatus('animating');
    controller.run(displayData.nodes, geometry.targets, {
      duration: 480,
      reducedMotion: prefersReducedMotion(),
      onTick: () => graphRef.current?.refresh?.(),
      onDone: () => {
        graphRef.current?.refresh?.();
        setTransitionStatus('idle');
        if (!hasInitialFitRef.current || modeChanged) {
          hasInitialFitRef.current = true;
          requestAnimationFrame(() => graphRef.current?.zoomToFit?.(400, 60));
        }
      },
    });

    return () => controller.cancel();
  }, [geometry, displayData.nodes, layoutMode, setTransitionStatus]);

  useEffect(() => () => transition.current.cancel(), []);

  // Transisi animasi halus saat Expand / Collapse cabang mindmap
  const handleSmoothToggleCollapse = useCallback(
    (nodeId: string) => {
      if (collapsedIds.includes(nodeId)) {
        toggleCollapsed(nodeId);
        return;
      }

      const parentNode = nodeCache.current.get(nodeId);
      const targetX = parentNode?.x ?? parentNode?.fx ?? 0;
      const targetY = parentNode?.y ?? parentNode?.fy ?? 0;

      const descendants = subtreeOf(projection, nodeId);
      descendants.delete(nodeId);

      if (descendants.size === 0 || usesPhysicsSimulation(layoutMode)) {
        toggleCollapsed(nodeId);
        return;
      }

      const collapseTargets = new Map(geometry.targets);
      for (const childId of descendants) {
        collapseTargets.set(childId, { x: targetX, y: targetY });
      }

      setTransitionStatus('animating');
      transition.current.run(displayData.nodes, collapseTargets, {
        duration: 280,
        reducedMotion: prefersReducedMotion(),
        onTick: () => graphRef.current?.refresh?.(),
        onDone: () => {
          setTransitionStatus('idle');
          toggleCollapsed(nodeId);
        },
      });
    },
    [collapsedIds, projection, geometry.targets, displayData.nodes, layoutMode, toggleCollapsed, setTransitionStatus],
  );

  // Tema Grafis
  const theme = useMemo(() => buildTheme(props.graphConfig), [props.graphConfig]);

  // Pathway Highlight (menggabungkan hover canvas & hover File Explorer)
  const activeHoverId = explorerHoveredNodeId ?? hoveredId;
  const pathway = useMemo(
    () => (highlightMode === 'pathway' ? pathwayOf(projection, activeHoverId) : new Set<string>()),
    [projection, activeHoverId, highlightMode],
  );

  // Sinkronisasi Seleksi & Focus Request dari File Explorer
  useEffect(() => {
    setSelected(props.selectedNode ? props.selectedNode.id : null);
  }, [props.selectedNode?.id, setSelected]);

  useEffect(() => {
    if (!explorerFocusRequest) return;
    if (handledExplorerFocusNonce.current === explorerFocusRequest.nonce) return;

    const targetId = explorerFocusRequest.nodeId;
    const ancestorsToUncollapse = resolveAncestorsFromMap(
      targetId,
      projection.parentByChild,
      collapsedIds,
    );

    if (ancestorsToUncollapse.length > 0) {
      setCollapsed(collapsedIds.filter((id) => !ancestorsToUncollapse.includes(id)));
      return;
    }

    const target = displayData.nodes.find((node) => node.id === targetId);
    if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.y) || !graphRef.current) {
      return;
    }

    handledExplorerFocusNonce.current = explorerFocusRequest.nonce;
    graphRef.current.centerAt?.(target.x as number, target.y as number, 450);
    graphRef.current.zoom?.(2.1, 450);
  }, [
    explorerFocusRequest,
    projection.parentByChild,
    collapsedIds,
    setCollapsed,
    displayData.nodes,
  ]);

  // Atmosphere Particles
  const atmosphere = useCanvasAtmosphere({
    graphConfig: props.graphConfig,
    layoutMode,
    decorations: geometry.decorations,
    theme,
    projection,
    zoomOutRendering: engine.zoomOutRendering,
    size,
    zoomRef,
  });

  // Simulasi Fisika D3
  useGraphPhysicsSimulation({
    graphRef,
    layoutMode,
    config: props.graphConfig,
    simulationCommand,
    nodes: displayData.nodes,
    transitionRef: transition,
  });

  // Camera Bounds & Adaptive Min Zoom
  const { minZoom: minZoomLimit, panBounds } = useMemo(
    () =>
      calculateAdaptiveCameraLimits({
        nodes: displayData.nodes,
        viewportWidth: size.width,
        viewportHeight: size.height,
        layoutMode,
        orientation,
        geometryBounds: geometry.bounds,
      }),
    [displayData.nodes, size.width, size.height, layoutMode, orientation, geometry.bounds],
  );

  const clampPanToBounds = useCallback(() => {
    if (isClampingPanRef.current || !graphRef.current) return;
    const graph = graphRef.current;
    const center = graph.centerAt?.();
    if (!center || !Number.isFinite(center.x) || !Number.isFinite(center.y)) return;

    const clampedX = Math.max(panBounds.minX, Math.min(panBounds.maxX, center.x));
    const clampedY = Math.max(panBounds.minY, Math.min(panBounds.maxY, center.y));

    if (Math.abs(center.x - clampedX) > 0.5 || Math.abs(center.y - clampedY) > 0.5) {
      isClampingPanRef.current = true;
      graph.centerAt(clampedX, clampedY);
      isClampingPanRef.current = false;
    }
  }, [panBounds]);

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
    onToggleCollapse: handleSmoothToggleCollapse,
    setSelected,
    onCanvasInteraction: () => clearExplorerHoveredNode(),
  });

  // Reactive Canvas Frame Invalidation (Rule 10): paksa repaint Canvas2D dalam mode statis
  useEffect(() => {
    graphRef.current?.refresh?.();
  }, [
    props.graphConfig,
    engine,
    theme,
    activeHoverId,
    props.selectedNode?.id,
    collapsedIds,
    pathway,
  ]);

  // Imperative Handle
  useImperativeHandle(
    ref,
    () => ({
      smartZoom: (action) => gestureBridge.smartZoom(action),
      refresh: () => graphRef.current?.refresh?.(),
    }),
    [gestureBridge],
  );

  const visibleDepths = useMemo(() => uniqueDepths(displayData.nodes), [displayData.nodes]);
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
    minZoomLimit,
    layoutMode,
    canvasMode,
    subtreeLayoutOverrides,
    focusedRootId,
    actions: {
      setFocusedRoot,
      setSubtreeLayoutOverride,
      toggleCollapsed: handleSmoothToggleCollapse,
      handleHover: (node: RenderNode | null) => {
        if (node) clearExplorerHoveredNode();
        setHovered(node?.id ?? null);
      },
      paintNode: (node: RenderNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
        zoomRef.current = globalScale;
        drawNode(ctx, node, {
          theme,
          zoom: globalScale,
          selected: props.selectedNode?.id === node.id,
          hovered: activeHoverId === node.id,
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
        clampPanToBounds();
      },
    },
  };
}