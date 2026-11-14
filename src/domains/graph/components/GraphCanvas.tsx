import { forwardRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { Node, Link, MindmapLayoutMode } from '@/domains/graph/shared/utils/graph.types';
import type { GraphConfigState } from '@/domains/graph/shared/stores/useGraphStore';
import { useGraphCanvasController } from '@/domains/graph/shared/hooks/useGraphCanvasController';
import { GraphCanvasUtilityDock } from '@/domains/graph/components/GraphCanvasUtilityDock';
import { GraphContextualToolbarOverlay } from '@/domains/graph/components/GraphContextualToolbarOverlay';

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
      theme,
      visibleDepths,
      atmosphere,
      dragReparent,
      gestureBridge,
      isPhysicsActive,
      minZoomLimit,
      canvasMode,
      subtreeLayoutOverrides,
      focusedRootId,
      actions,
    } = useGraphCanvasController(props, ref);

    return (
      <div
        ref={containerRef}
        className="relative w-full h-full select-none overflow-hidden"
        onTouchStart={gestureBridge.handleTouchStart}
      >
        <ForceGraph2D
          ref={graphRef as any}
          graphData={displayData}
          width={size.width}
          height={size.height}
          backgroundColor={theme.card}
          minZoom={minZoomLimit}
          maxZoom={8}
          nodeRelSize={props.graphConfig.nodes.relSize}
          nodeCanvasObject={actions.paintNode as any}
          nodePointerAreaPaint={actions.paintPointer as any}
          linkCanvasObject={actions.paintLink as any}
          linkCanvasObjectMode={() => 'replace'}
          onRenderFramePost={gestureBridge.updateToolbarPosition}
          onZoom={gestureBridge.updateToolbarPosition}
          onZoomEnd={actions.handleZoomEnd}
          onNodeClick={gestureBridge.handleClick}
          onNodeRightClick={gestureBridge.handleNodeRightClick}
          onNodeHover={actions.handleHover as any}
          enableNodeDrag={true}
          enablePanInteraction={true}
          onNodeDrag={dragReparent.handleNodeDrag}
          onNodeDragEnd={dragReparent.handleNodeDragEnd}
          dagMode={
            isPhysicsActive && props.graphConfig.forces.dagMode !== 'null'
              ? (props.graphConfig.forces.dagMode as any)
              : undefined
          }
          dagLevelDistance={props.graphConfig.forces.dagLevelDistance}
          warmupTicks={isPhysicsActive ? props.graphConfig.forces.warmupTicks : 0}
          cooldownTicks={isPhysicsActive ? props.graphConfig.forces.cooldownTicks : 0}
          cooldownTime={isPhysicsActive ? props.graphConfig.forces.cooldownTime : 0}
          d3AlphaDecay={props.graphConfig.forces.alphaDecay}
          d3VelocityDecay={props.graphConfig.forces.velocityDecay}
          onBackgroundClick={gestureBridge.handleBackgroundClick}
          onBackgroundRightClick={gestureBridge.handleBackgroundRightClick}
          autoPauseRedraw={atmosphere.autoPauseRedraw}
          onRenderFramePre={actions.renderDecorations}
        />

        <GraphCanvasUtilityDock
          depths={visibleDepths}
          hierarchy={props.graphConfig.hierarchy}
          nodes={displayData.nodes}
          links={displayData.links}
          graphRef={graphRef}
          viewportWidth={size.width}
          viewportHeight={size.height}
          folderColor={theme.folder}
          fileColor={theme.file}
          linkColor={theme.link}
          selectedNodeId={props.selectedNode?.id ?? null}
          onSmartZoom={gestureBridge.smartZoom}
        />

        <GraphContextualToolbarOverlay
          isVisible={gestureBridge.isToolbarVisible}
          selectedNode={props.selectedNode}
          toolbarCoords={gestureBridge.toolbarCoords}
          canvasMode={canvasMode}
          currentOverride={subtreeLayoutOverrides?.[props.selectedNode?.id ?? '']}
          isFocused={focusedRootId === props.selectedNode?.id}
          onSetStructure={(mode: MindmapLayoutMode | null) => {
            if (props.selectedNode && mode) {
              actions.setSubtreeLayoutOverride(props.selectedNode.id, mode);
            }
          }}
          onAddSubNode={props.onAddSubNode}
          onNodeDelete={props.onNodeDelete}
          onToggleFocus={() => {
            if (props.selectedNode) {
              actions.setFocusedRoot(
                focusedRootId === props.selectedNode.id ? null : props.selectedNode.id,
              );
            }
          }}
          onZoomToSelection={() => gestureBridge.smartZoom('selection')}
          onClose={() => gestureBridge.setIsToolbarVisible(false)}
        />
      </div>
    );
  },
);