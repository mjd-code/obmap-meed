import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/domains/auth/shared/hooks/useAuth';
import { useGraphStore, useNodeStore, useVaultStore } from '@/global/stores';
import { useLeafGraphConfig } from '@/domains/graph/shared/stores/useLeafGraphConfigStore';
import {
  useGraphInteractionStore,
  useGraphInteractionStoreApi,
} from '@/domains/graph/shared/stores/useGraphInteractionStore';
import { useGraphData } from '@/domains/graph/shared/hooks/useGraphData';
import { useWorkspaceStore } from '@/domains/workspace/shared/stores/useWorkspaceStore';
import type { ViewState } from '@/domains/workspace/shared/utils/workspace.types';
import type { GraphCanvasHandle } from '@/domains/graph/components/GraphCanvas';
import type { Node } from '@/domains/graph/shared/utils/graph.types';
import {
  addNodeAction,
  deleteNodeAction,
  moveNodeAction,
  updateNodeAction,
} from '@/domains/workspace/shared/api/workspaceActions';
import {
  loadVaultMindmapManifest,
  saveVaultMindmapManifest,
} from '@/domains/graph/shared/utils/mindmapLayoutManifest';

export function useGraphOrchestratorController(leafId: string, view?: ViewState) {
  const { user, session } = useAuth();
  const isAuthenticated = Boolean(user && session);

  const currentVaultId = useVaultStore((s) => s.currentVaultId);
  const nodes = useNodeStore((s) => s.nodes);
  const selectedNode = useNodeStore((s) => s.selectedNode);
  const setSelectedNode = useNodeStore((s) => s.setSelectedNode);

  const localConfig = useLeafGraphConfig((s) => s.config);
  const fallbackConfig = useGraphStore((s) => s.config);
  const graphConfig = localConfig ?? fallbackConfig;
  const vaultGraphData = useGraphData(graphConfig);

  const interactionApi = useGraphInteractionStoreApi();
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
    boundaries,
    summaries,
    relationships,
    manualNodeOffsets,
  } = useGraphInteractionStore();

  // Sync leaf view <-> canvasMode (one-directional ref guard)
  const prevViewCanvasModeRef = useRef<ViewState['canvasMode'] | undefined>(undefined);
  const prevStoreCanvasModeRef = useRef(canvasMode);
  const syncingFromPropRef = useRef<ViewState['canvasMode'] | null>(null);

  useEffect(() => {
    if (view?.canvasMode && view.canvasMode !== prevViewCanvasModeRef.current) {
      prevViewCanvasModeRef.current = view.canvasMode;
      if (view.canvasMode !== canvasMode) {
        syncingFromPropRef.current = view.canvasMode;
        setCanvasMode(view.canvasMode);
      }
    }
  }, [view?.canvasMode, canvasMode, setCanvasMode]);

  useEffect(() => {
    if (syncingFromPropRef.current !== null) {
      if (canvasMode === syncingFromPropRef.current) {
        syncingFromPropRef.current = null;
      }
      prevStoreCanvasModeRef.current = canvasMode;
      return;
    }

    const expectedTitle = canvasMode === 'mindmap' ? 'Mindmap View' : 'Graph View';
    const targetLeaf = useWorkspaceStore.getState().findLeafById(leafId);
    const cur = targetLeaf?.view;
    const isOutOfSync = cur ? cur.title !== expectedTitle || cur.canvasMode !== canvasMode : false;

    if (prevStoreCanvasModeRef.current === canvasMode && !isOutOfSync) return;

    prevStoreCanvasModeRef.current = canvasMode;
    prevViewCanvasModeRef.current = canvasMode;
    if (!targetLeaf || !cur || !isOutOfSync) return;

    useWorkspaceStore.getState().setLeafView(leafId, {
      ...cur,
      title: expectedTitle,
      canvasMode,
    });
  }, [canvasMode, leafId]);

  // XMIND-STEP-06 Sidecar Spatial Manifest (.vk/mindmap-layout.json + .obmap/ fallback)
  const loadedManifestVaultRef = useRef<string | null>(null);
  const canPersistEmptyManifestRef = useRef(false);
  useEffect(() => {
    if (!currentVaultId || loadedManifestVaultRef.current === currentVaultId) return;
    loadedManifestVaultRef.current = currentVaultId;
    const loaded = loadVaultMindmapManifest(currentVaultId);
    if (loaded) {
      canPersistEmptyManifestRef.current = true;
      interactionApi.setState({
        boundaries: loaded.boundaries,
        summaries: loaded.summaries,
        relationships: loaded.relationships,
        manualNodeOffsets: loaded.manualNodeOffsets,
      });
    } else {
      canPersistEmptyManifestRef.current = false;
    }
  }, [currentVaultId, interactionApi]);

  useEffect(() => {
    if (!currentVaultId || loadedManifestVaultRef.current !== currentVaultId) return;
    const hasSpatial =
      boundaries.length > 0 ||
      summaries.length > 0 ||
      relationships.length > 0 ||
      Object.keys(manualNodeOffsets).length > 0;
    if (hasSpatial) canPersistEmptyManifestRef.current = true;
    if (!hasSpatial && !canPersistEmptyManifestRef.current) return;
    saveVaultMindmapManifest(currentVaultId, {
      boundaries,
      summaries,
      relationships,
      manualNodeOffsets,
    });
  }, [currentVaultId, boundaries, summaries, relationships, manualNodeOffsets]);

  // Filters & Layer 1/2/3 UX state
  const [search, setSearch] = useState('');
  const [minDepth, setMinDepth] = useState(0);
  const [maxDepth, setMaxDepth] = useState(10);
  const [contentFilter, setContentFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  const handleNodeSelect = useCallback(
    (node: Node | null) => {
      setSelectedNode(node);
    },
    [setSelectedNode],
  );

  const handleUpdateNodeContent = useCallback(
    async (node: Node, nextContent: string) => {
      await updateNodeAction({ ...node, content: nextContent }, isAuthenticated);
    },
    [isAuthenticated],
  );

  const handleAddSubNode = useCallback(
    async (parentId: string, type: 'file' | 'folder') => {
      const parentNode = nodes.find((n) => n.id === parentId);
      if (!parentNode) return;
      if (parentNode.type !== 'folder') {
        await updateNodeAction({ ...parentNode, type: 'folder' }, isAuthenticated);
      }
      await addNodeAction(type, isAuthenticated);
    },
    [nodes, isAuthenticated],
  );

  const handleNodeMove = useCallback(
    async (nodeId: string, newParentId: string | null) => {
      await moveNodeAction(nodeId, newParentId, isAuthenticated);
    },
    [isAuthenticated],
  );

  const handleNodeDelete = useCallback(
    async (nodeId: string) => {
      await deleteNodeAction(nodeId, isAuthenticated);
    },
    [isAuthenticated],
  );

  const handleOpen = useCallback((node: Node | null) => {
    if (!node) return;
    useWorkspaceStore.getState().openFile(node.id, node.name);
  }, []);

  const graphRef = useRef<GraphCanvasHandle>(null);

  return {
    isAuthenticated,
    graphRef,
    graphConfig,
    graphData: vaultGraphData,
    selectedNode,
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
    search,
    setSearch,
    minDepth,
    setMinDepth: (value: number) => {
      setMinDepth(value);
      if (value > maxDepth) setMaxDepth(value);
    },
    maxDepth,
    setMaxDepth: (value: number) => {
      setMaxDepth(value);
      if (value < minDepth) setMinDepth(value);
    },
    contentFilter,
    setContentFilter,
    tagFilter,
    setTagFilter,
    handleNodeSelect,
    handleOpen,
    handleNodeMove,
    handleNodeDelete,
    handleAddSubNode,
    handleUpdateNodeContent,
    handleSmartZoom: (action: 'fit' | 'selection' | 'reset') => graphRef.current?.smartZoom(action),
  };
}
