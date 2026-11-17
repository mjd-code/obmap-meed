import React from 'react';
import { GraphCanvas } from '@/domains/graph/components/GraphCanvas';
import { GraphFloatingDock } from '@/domains/graph/components/FloatingDock/GraphFloatingDock';
import {
  useLeafGraphConfigStore,
  LeafGraphConfigProvider,
} from '@/domains/graph/shared/stores/useLeafGraphConfigStore';
import {
  useLeafGraphInteractionStore,
  GraphInteractionProvider,
} from '@/domains/graph/shared/stores/useGraphInteractionStore';
import type { ViewState } from '@/domains/workspace/shared/utils/workspace.types';
import { useGraphOrchestratorController } from '@/domains/graph/shared/hooks/useGraphOrchestratorController';

export interface GraphOrchestratorProps {
  leafId: string;
  view?: ViewState;
  isActive?: boolean;
  className?: string;
}

function GraphSurface({
  leafId,
  view,
  className,
}: {
  leafId: string;
  view?: ViewState;
  className?: string;
}) {
  const ctrl = useGraphOrchestratorController(leafId, view);

  return (
    <div className={`relative h-full w-full overflow-hidden select-none ${className ?? ''}`}>
      <GraphCanvas
        ref={ctrl.graphRef}
        graphData={ctrl.graphData}
        selectedNode={ctrl.selectedNode}
        onNodeSelect={ctrl.handleNodeSelect}
        onNodeOpen={ctrl.handleOpen}
        onNodeMove={ctrl.handleNodeMove}
        onNodeDelete={ctrl.handleNodeDelete}
        onAddSubNode={ctrl.handleAddSubNode}
        onUpdateNodeContent={ctrl.handleUpdateNodeContent}
        graphConfig={ctrl.graphConfig}
        search={ctrl.search}
        minDepth={ctrl.minDepth}
        maxDepth={ctrl.maxDepth}
        contentFilter={ctrl.contentFilter}
        tagFilter={ctrl.tagFilter}
      />

      <GraphFloatingDock
        leafId={leafId}
        layout={ctrl.layoutMode}
        canvasMode={ctrl.canvasMode}
        onCanvasModeChange={ctrl.setCanvasMode}
        onLayoutChange={ctrl.setLayoutMode}
        orientation={ctrl.orientation}
        onOrientationChange={ctrl.setOrientation}
        collapsedCount={ctrl.collapsedIds.length}
        onExpandAll={ctrl.expandAll}
        focused={Boolean(ctrl.focusedRootId)}
        onClearFocus={() => ctrl.setFocusedRoot(null)}
        search={ctrl.search}
        onSearchChange={ctrl.setSearch}
        minDepth={ctrl.minDepth}
        onMinDepthChange={ctrl.setMinDepth}
        maxDepth={ctrl.maxDepth}
        onMaxDepthChange={ctrl.setMaxDepth}
        contentFilter={ctrl.contentFilter}
        onContentFilterChange={ctrl.setContentFilter}
        tagFilter={ctrl.tagFilter}
        onTagFilterChange={ctrl.setTagFilter}
        onSmartZoom={ctrl.handleSmartZoom}
      />
    </div>
  );
}

export const GraphOrchestrator: React.FC<GraphOrchestratorProps> = ({
  leafId,
  view,
  className,
}) => {
  const configStore = useLeafGraphConfigStore(leafId);
  const initialLayout =
    view?.canvasMode === 'graph'
      ? 'free-force'
      : view?.canvasMode === 'mindmap'
        ? 'mindmap'
        : undefined;
  const interactionStore = useLeafGraphInteractionStore(leafId, initialLayout);

  return (
    <LeafGraphConfigProvider store={configStore}>
      <GraphInteractionProvider store={interactionStore}>
        <GraphSurface leafId={leafId} view={view} className={className} />
      </GraphInteractionProvider>
    </LeafGraphConfigProvider>
  );
};

export default GraphOrchestrator;
