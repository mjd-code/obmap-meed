import React, { useRef, useState, useEffect, useCallback } from "react";
import { GraphCanvas, type GraphCanvasHandle } from "@/domains/graph/components/GraphCanvas";
import {
  GraphWorkspaceControls,
  type SmartZoomAction,
} from "@/domains/graph/components/GraphWorkspaceControls";
import {
  useLeafGraphConfigStore,
  LeafGraphConfigProvider,
  useLeafGraphConfig,
} from "@/domains/graph/shared/stores/useLeafGraphConfigStore";
import {
  useLeafGraphInteractionStore,
  GraphInteractionProvider,
  useGraphInteractionStore,
} from "@/domains/graph/shared/stores/useGraphInteractionStore";
import { useGraphStore, useNodeStore } from "@/global/stores";
import { useGraphData } from "@/domains/graph/shared/hooks/useGraphData";
import { useAuth } from "@/domains/auth/shared/hooks/useAuth";
import { useWorkspaceStore } from "@/domains/workspace/shared/stores/useWorkspaceStore";
import type { ViewState } from "@/domains/workspace/shared/utils/workspace.types";
import {
  moveNodeAction,
  deleteNodeAction,
  updateNodeAction,
  addNodeAction,
} from "@/domains/workspace/shared/api/workspaceActions";

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
  const { user, session } = useAuth();
  const isAuthenticated = !!user && !!session;

  const nodes = useNodeStore((s) => s.nodes);
  const selectedNode = useNodeStore((s) => s.selectedNode);
  const setSelectedNode = useNodeStore((s) => s.setSelectedNode);

  const localConfig = useLeafGraphConfig((s) => s.config);
  const fallbackConfig = useGraphStore((s) => s.config);
  const graphConfig = localConfig ?? fallbackConfig;

  const graphData = useGraphData(graphConfig);

  const {
    layoutMode,
    setLayoutMode,
    orientation,
    setOrientation,
    collapsedIds,
    expandAll,
    focusedRootId,
    setFocusedRoot,
    canvasMode,
    setCanvasMode,
  } = useGraphInteractionStore();

  // Guard: Mencegah siklus update timbal-balik antar-tab
  const isSyncingRef = useRef<boolean>(false);

  // Ingest mode dari view prop hanya jika berbeda dan tidak sedang dalam sinkronisasi
  useEffect(() => {
    if (view?.canvasMode && view.canvasMode !== canvasMode) {
      isSyncingRef.current = true;
      setCanvasMode(view.canvasMode);
      // Lepaskan lock pada microtask berikutnya
      Promise.resolve().then(() => {
        isSyncingRef.current = false;
      });
    }
  }, [view?.canvasMode, canvasMode, setCanvasMode]);

  // Sinkronkan judul tab ke WorkspaceStore HANYA untuk leafId spesifik ini (BUKAN getActiveLeaf)
  const currentViewTitle = view?.title;
  const currentViewCanvasMode = view?.canvasMode;

  useEffect(() => {
    if (isSyncingRef.current) return;

    const expectedTitle = canvasMode === "mindmap" ? "Mindmap View" : "Graph View";
    if (currentViewTitle !== expectedTitle || currentViewCanvasMode !== canvasMode) {
      // Ambil view KHUSUS milik leafId ini dari root tree
      const targetLeaf = useWorkspaceStore.getState().findLeafById(leafId);
      if (!targetLeaf) return;

      const currentTargetView = targetLeaf.view;
      if (
        currentTargetView.title === expectedTitle &&
        currentTargetView.canvasMode === canvasMode
      ) {
        return; // Sudah sama, cegah re-render loop
      }

      useWorkspaceStore.getState().setLeafView(leafId, {
        ...currentTargetView,
        title: expectedTitle,
        canvasMode,
      });
    }
  }, [canvasMode, leafId, currentViewTitle, currentViewCanvasMode]);

  const [search, setSearch] = useState("");
  const [minDepth, setMinDepth] = useState(0);
  const [maxDepth, setMaxDepth] = useState(10);
  const [contentFilter, setContentFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const graphRef = useRef<GraphCanvasHandle>(null);

  const handleSmartZoom = (action: SmartZoomAction) => {
    graphRef.current?.smartZoom(action);
  };

  const handleAddSubNode = async (parentId: string, type: "file" | "folder") => {
    const parentNode = nodes.find((n) => n.id === parentId);
    if (!parentNode) return;

    if (parentNode.type !== "folder") {
      await updateNodeAction({ ...parentNode, type: "folder" }, isAuthenticated);
    }

    await addNodeAction(type);
  };

  const handleOpen = (node: typeof selectedNode) => {
    if (node) {
      useWorkspaceStore.getState().openFile(node.id, node.name);
    }
  };

  return (
    <div className={`relative h-full w-full overflow-hidden select-none ${className ?? ""}`}>
      <GraphCanvas
        ref={graphRef}
        graphData={graphData}
        selectedNode={selectedNode}
        onNodeSelect={setSelectedNode}
        onNodeOpen={handleOpen}
        onNodeMove={(nodeId, newParentId) => moveNodeAction(nodeId, newParentId)}
        onNodeDelete={(nodeId) => deleteNodeAction(nodeId, isAuthenticated)}
        onAddSubNode={handleAddSubNode}
        graphConfig={graphConfig}
        search={search}
        minDepth={minDepth}
        maxDepth={maxDepth}
        contentFilter={contentFilter}
        tagFilter={tagFilter}
      />

      <GraphWorkspaceControls
        layout={layoutMode}
        canvasMode={canvasMode}
        onCanvasModeChange={setCanvasMode}
        onLayoutChange={setLayoutMode}
        orientation={orientation}
        onOrientationChange={setOrientation}
        collapsedCount={collapsedIds.length}
        onExpandAll={expandAll}
        focused={Boolean(focusedRootId)}
        onClearFocus={() => setFocusedRoot(null)}
        search={search}
        onSearchChange={setSearch}
        minDepth={minDepth}
        onMinDepthChange={(value) => {
          setMinDepth(value);
          if (value > maxDepth) setMaxDepth(value);
        }}
        maxDepth={maxDepth}
        onMaxDepthChange={(value) => {
          setMaxDepth(value);
          if (value < minDepth) setMinDepth(value);
        }}
        contentFilter={contentFilter}
        onContentFilterChange={setContentFilter}
        tagFilter={tagFilter}
        onTagFilterChange={setTagFilter}
        onSmartZoom={handleSmartZoom}
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
  const interactionStore = useLeafGraphInteractionStore(leafId);

  return (
    <LeafGraphConfigProvider store={configStore}>
      <GraphInteractionProvider store={interactionStore}>
        <GraphSurface leafId={leafId} view={view} className={className} />
      </GraphInteractionProvider>
    </LeafGraphConfigProvider>
  );
};

export default GraphOrchestrator;