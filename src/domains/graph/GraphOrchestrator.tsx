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

  // Guard satu arah: membedakan perubahan prop `view.canvasMode` eksternal vs perubahan store lokal
  const prevViewCanvasModeRef = useRef<ViewState["canvasMode"] | undefined>(undefined);
  const prevStoreCanvasModeRef = useRef(canvasMode);
  const syncingFromPropRef = useRef<ViewState["canvasMode"] | null>(null);

  // Sinkronisasi satu arah: hanya ingest prop `view.canvasMode` jika prop eksternal berubah
  useEffect(() => {
    if (view?.canvasMode && view.canvasMode !== prevViewCanvasModeRef.current) {
      prevViewCanvasModeRef.current = view.canvasMode;
      if (view.canvasMode !== canvasMode) {
        syncingFromPropRef.current = view.canvasMode;
        setCanvasMode(view.canvasMode);
      }
    }
  }, [view?.canvasMode, canvasMode, setCanvasMode]);

  // Sinkronisasi judul & mode tab ke WorkspaceStore KHUSUS untuk leafId spesifik ini
  useEffect(() => {
    if (syncingFromPropRef.current !== null) {
      if (canvasMode === syncingFromPropRef.current) {
        syncingFromPropRef.current = null;
      }
      prevStoreCanvasModeRef.current = canvasMode;
      return;
    }

    const expectedTitle = canvasMode === "mindmap" ? "Mindmap View" : "Graph View";
    const targetLeaf = useWorkspaceStore.getState().findLeafById(leafId);
    const cur = targetLeaf?.view;
    const isOutOfSync = cur ? cur.title !== expectedTitle || cur.canvasMode !== canvasMode : false;

    if (prevStoreCanvasModeRef.current === canvasMode && !isOutOfSync) {
      return;
    }

    prevStoreCanvasModeRef.current = canvasMode;
    prevViewCanvasModeRef.current = canvasMode;

    if (!targetLeaf || !cur || !isOutOfSync) return;

    useWorkspaceStore.getState().setLeafView(leafId, {
      ...cur,
      title: expectedTitle,
      canvasMode,
    });
  }, [canvasMode, leafId]);

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
        leafId={leafId}
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
  const initialLayout =
    view?.canvasMode === "graph"
      ? "free-force"
      : view?.canvasMode === "mindmap"
        ? "mindmap"
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