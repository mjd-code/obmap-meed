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
  onUpdateNodeContent?: (node: Node, nextContent: string) => Promise<void> | void;
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
      isTransitioning,
      minZoomLimit,
      canvasMode,
      subtreeLayoutOverrides,
      branchColorOverrides,
      nodeStyleOverrides,
      boundaries,
      summaries,
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
          nodeCanvasObjectMode={actions.nodeCanvasObjectMode}
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
          autoPauseRedraw={atmosphere.autoPauseRedraw && !isTransitioning}
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
          graphConfig={props.graphConfig}
          currentNodeStyle={nodeStyleOverrides?.[props.selectedNode?.id ?? '']}
          currentBranchColor={branchColorOverrides?.[props.selectedNode?.id ?? '']}
          boundaries={boundaries}
          summaries={summaries}
          currentOverride={subtreeLayoutOverrides?.[props.selectedNode?.id ?? '']}
          isFocused={focusedRootId === props.selectedNode?.id}
          onSetStructure={(mode: MindmapLayoutMode | null) => {
            if (props.selectedNode) {
              actions.setSubtreeLayoutOverride(props.selectedNode.id, mode);
            }
          }}
          onSetNodeStyleOverride={actions.setNodeStyleOverride}
          onPromoteColorToBranch={actions.promoteColorToBranch}
          onSetBranchColorOverride={actions.setBranchColorOverride}
          onUpsertBoundary={actions.upsertBoundary}
          onRemoveBoundary={actions.removeBoundary}
          onUpsertSummary={actions.upsertSummary}
          onRemoveSummary={actions.removeSummary}
          onAddSubNode={props.onAddSubNode}
          onAddBoundary={(node) => {
            const ids = new Set<string>([node.id]);
            let added = true;
            while (added) {
              added = false;
              for (const candidate of props.graphData.nodes) {
                if (candidate.parentId && ids.has(candidate.parentId) && !ids.has(candidate.id)) {
                  ids.add(candidate.id);
                  added = true;
                }
              }
            }
            actions.upsertBoundary({
              id: `boundary-${node.id}`,
              title: node.name,
              nodeIds: Array.from(ids),
              shape: 'rounded',
              padding: 16,
            });
          }}
          onAddSummary={(node) => {
            if (!node.parentId) return;
            actions.upsertSummary({
              id: `sumgrp-${node.id}`,
              parentId: node.parentId,
              rangeNodeIds: [node.id, node.id],
              summaryNodeId: `summary-${node.id}`,
              braceStyle: 'curly',
              label: `Ringkasan ${node.name}`,
            });
          }}
          onUpdateNodeContent={props.onUpdateNodeContent}
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