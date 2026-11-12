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
import type { Node, Link } from '@/global/types';
import type { RenderNode, RenderLink } from '@/domains/graph/shared/utils/graph.types';
import type { GraphCanvasProps, GraphCanvasHandle } from '@/domains/graph/components/GraphCanvas';
import { useGraphEngineStore } from '@/domains/graph/shared/stores/useGraphEngineStore';
import { useGraphInteractionStore } from '@/domains/graph/shared/stores/useGraphInteractionStore';
import { useCanvasAtmosphere } from '@/domains/graph/shared/hooks/useCanvasAtmosphere';
import { useCanvasDragReparent } from '@/domains/graph/shared/hooks/useCanvasDragReparent';
import { useCanvasGestureBridge } from '@/domains/graph/shared/hooks/useCanvasGestureBridge';
import { useLayoutEngine } from '@/domains/graph/shared/hooks/useLayoutEngine';
import { useGraphPhysicsSimulation } from '@/domains/graph/shared/hooks/useGraphPhysicsSimulation';
import { LayoutTransitionController } from '@/domains/graph/shared/utils/transitionController';
import {
  calculateCameraBounds,
  seedInitialNodePositions,
  resolveAncestorsToUncollapse,
} from '@/domains/graph/shared/utils/cameraBounds';

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
    uncollapseNode,
    setHoveredNode,
    timeLapseStep,
    timeLapseTotal,
    isTimeLapseActive,
  } = useGraphInteractionStore();

  // ResizeObserver for Container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) {
        const { width, height } = entry.contentRect;
        setSize({ width: Math.max(width, 100), height: Math.max(height, 100) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Seed Layout Nodes
  const seededNodes = useMemo(() => {
    return seedInitialNodePositions(props.graphData.nodes, nodeCache.current);
  }, [props.graphData.nodes]);

  // Layout Engine solver computation
  const displayData = useLayoutEngine({
    nodes: seededNodes,
    links: props.graphData.links,
    layoutMode,
    layoutArrangement,
    orientation,
    collapsedIds,
    focusedRootId,
    subtreeLayoutOverrides,
    search: props.search,
    minDepth: props.minDepth,
    maxDepth: props.maxDepth,
    contentFilter: props.contentFilter,
    tagFilter: props.tagFilter,
  });

  // Keep node cache fresh
  useEffect(() => {
    displayData.nodes.forEach((n) => {
      nodeCache.current.set(n.id, n);
    });
  }, [displayData.nodes]);

  // Atmosphere Particles & Living Canvas
  const atmosphere = useCanvasAtmosphere({
    enabled: props.graphConfig.atmosphere?.particles?.enabled ?? false,
    intensity: props.graphConfig.atmosphere?.particles?.intensity ?? 35,
    speed: props.graphConfig.atmosphere?.particles?.speed ?? 1,
    flowGlow: props.graphConfig.atmosphere?.links?.flowGlow ?? false,
  });

  // Physics Simulation
  useGraphPhysicsSimulation({
    graphRef,
    layoutMode,
    config: props.graphConfig,
  });

  // Drag Reparenting Hook
  const dragReparent = useCanvasDragReparent({
    graphData: displayData,
    onNodeMove: props.onNodeMove,
  });

  // Contextual Toolbar Position State
  const [toolbarNode, setToolbarNode] = useState<Node | null>(null);
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);

  const closeToolbar = useCallback(() => {
    setToolbarNode(null);
    setToolbarPos(null);
  }, []);

  // Gesture Bridge (Touch, Right Click, Double Click)
  const gestureBridge = useCanvasGestureBridge({
    containerRef,
    graphRef,
    onNodeRightClick: (node, event) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setToolbarNode(node);
        setToolbarPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      }
    },
    onNodeDoubleClick: (node) => {
      props.onNodeOpen?.(node);
    },
  });

  // Imperative Handle for Parent (Smart Zoom, Fit, Reset)
  useImperativeHandle(
    ref,
    () => ({
      smartZoom: (action) => {
        const fg = graphRef.current;
        if (!fg) return;

        if (action === 'fit') {
          const bounds = calculateCameraBounds(displayData.nodes, {
            viewportWidth: size.width,
            viewportHeight: size.height,
          });
          fg.centerAt(bounds.centerX, bounds.centerY, 400);
          fg.zoomToFit(400, bounds.dynamicPadding);
        } else if (action === 'reset') {
          fg.centerAt(0, 0, 400);
          fg.zoom(1, 400);
        } else if (action === 'selection' && props.selectedNode) {
          const target = displayData.nodes.find((n) => n.id === props.selectedNode?.id);
          if (target && typeof target.x === 'number' && typeof target.y === 'number') {
            fg.centerAt(target.x, target.y, 400);
            fg.zoom(1.8, 400);
          }
        }
      },
      refresh: () => {
        graphRef.current?.refresh?.();
      },
    }),
    [displayData.nodes, props.selectedNode, size.width, size.height],
  );

  return {
    containerRef,
    graphRef,
    size,
    displayData,
    atmosphere,
    dragReparent,
    gestureBridge,
    toolbar: {
      node: toolbarNode,
      position: toolbarPos,
      close: closeToolbar,
    },
    actions: {
      onNodeClick: (node: RenderNode) => {
        props.onNodeSelect(node);
      },
      onNodeHover: (node: RenderNode | null) => {
        setHoveredNode(node ? node.id : null);
      },
      onZoom: ({ k }: { k: number }) => {
        zoomRef.current = k;
      },
      setFocusedRoot,
      setSubtreeLayoutOverride,
    },
    canvasMode,
    layoutMode,
  };
}