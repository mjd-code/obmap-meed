import { forwardRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { Node, Link } from '@/global/types';
import type { GraphConfigState } from '@/domains/graph/shared/stores/useGraphStore';
import { useGraphCanvasController } from '@/domains/graph/shared/hooks/useGraphCanvasController';
import { GraphContextualToolbarOverlay } from '@/domains/graph/components/GraphContextualToolbarOverlay';
import { FloatingZoomControls } from '@/domains/graph/components/GraphFloatingZoomControls';
import { GraphMiniMap } from '@/domains/graph/components/GraphMiniMap';
import { drawNode } from '@/domains/graph/shared/utils/drawNode';
import { drawLink } from '@/domains/graph/shared/utils/drawLink';

export interface GraphCanvasProps {
  graphData: { nodes: Node[]; links: Link[] };
  selectedNode: Node | null;
  onNodeSelect: (node: Node | null) => void;
  onNodeOpen?: (node: Node) => void;
  graphConfig: GraphConfigState;
  onNodeMove?: (nodeId: string, newParentId: string | null) => Promise<void> | void;
  onNodeDelete?: (nodeId: string) => Promise<void> | void;
  onAddSubNode?: (parentId: string, type: 'file' | 'folder') => Promise<void> | void;
  search: string;
  minDepth: number;
  maxDepth: number;
  contentFilter: string;
  tagFilter: string;
}

export interface GraphCanvasHandle {
  smartZoom: (action: 'fit' | 'selection' | 'reset') => void;
  refresh?: () => void;
}

export const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>(
  function GraphCanvas(props, ref) {
    const {
      containerRef,
      graphRef,
      size,
      displayData,
      atmosphere,
      dragReparent,
      gestureBridge,
      toolbar,
      actions,
      layoutMode,
    } = useGraphCanvasController(props, ref);

    return (
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden select-none bg-background"
        onContextMenu={gestureBridge.handleContextMenu}
        onTouchStart={gestureBridge.handleTouchStart}
        onTouchEnd={gestureBridge.handleTouchEnd}
      >
        <ForceGraph2D
          ref={graphRef as any}
          width={size.width}
          height={size.height}
          graphData={displayData}
          nodeLabel="name"
          nodeCanvasObject={(node, ctx, globalScale) =>
            drawNode(node as any, ctx, globalScale, props.graphConfig, props.selectedNode?.id)
          }
          linkCanvasObject={(link, ctx, globalScale) =>
            drawLink(link as any, ctx, globalScale, props.graphConfig)
          }
          onNodeClick={actions.onNodeClick}
          onNodeHover={actions.onNodeHover}
          onNodeDrag={dragReparent.handleNodeDrag}
          onNodeDragEnd={dragReparent.handleNodeDragEnd}
          onZoom={actions.onZoom}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          cooldownTicks={layoutMode === 'free-force' ? 120 : 0}
        />

        <GraphContextualToolbarOverlay
          activeNode={toolbar.node}
          position={toolbar.position}
          layoutMode={layoutMode}
          onFocusBranch={actions.setFocusedRoot}
          onSelectSubtreeLayout={actions.setSubtreeLayoutOverride}
          onClose={toolbar.close}
          onAddSubNode={props.onAddSubNode}
          onDeleteNode={props.onNodeDelete}
        />

        <FloatingZoomControls
          onZoomIn={() => graphRef.current?.zoom((graphRef.current?.zoom() || 1) * 1.2, 300)}
          onZoomOut={() => graphRef.current?.zoom((graphRef.current?.zoom() || 1) / 1.2, 300)}
          onFitView={() => (ref as any)?.current?.smartZoom('fit')}
        />

        <GraphMiniMap graphData={displayData} selectedNodeId={props.selectedNode?.id} />
      </div>
    );
  },
);
