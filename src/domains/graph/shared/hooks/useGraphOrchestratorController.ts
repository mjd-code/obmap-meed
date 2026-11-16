import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  addOutlineSubtopicInMarkdown,
  deleteOutlineTopicInMarkdown,
  parseMarkdownOutlineToMindmap,
  reparentOutlineTopicInMarkdown,
  toggleOutlineTaskInMarkdown,
} from '@/domains/graph/shared/utils/markdownOutlineMindmapBridge';

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
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // In-Note Outline AST Mode state
  const [isOutlineMode, setIsOutlineMode] = useState(false);
  const [outlineNoteId, setOutlineNoteId] = useState<string | null>(null);
  const [selectedOutlineNodeId, setSelectedOutlineNodeId] = useState<string | null>(null);

  const activeOutlineNote = useMemo(() => {
    if (outlineNoteId) {
      const exact = nodes.find((n) => n.id === outlineNoteId && n.type === 'file');
      if (exact) return exact;
    }
    if (selectedNode && selectedNode.type === 'file') return selectedNode;
    return nodes.find((n) => n.type === 'file') ?? null;
  }, [outlineNoteId, nodes, selectedNode]);

  const handleToggleOutlineMode = useCallback(
    (active: boolean) => {
      if (active) {
        const target =
          selectedNode && selectedNode.type === 'file'
            ? selectedNode
            : activeOutlineNote;
        if (!target) return;
        setOutlineNoteId(target.id);
        setSelectedOutlineNodeId(null);
        setIsOutlineMode(true);
      } else {
        setIsOutlineMode(false);
        setSelectedOutlineNodeId(null);
      }
    },
    [selectedNode, activeOutlineNote],
  );

  const outlineProjection = useMemo(() => {
    if (!isOutlineMode || !activeOutlineNote) return null;
    return parseMarkdownOutlineToMindmap(
      activeOutlineNote.id,
      activeOutlineNote.name,
      activeOutlineNote.content ?? '',
    );
  }, [isOutlineMode, activeOutlineNote]);

  const effectiveGraphData = outlineProjection ? outlineProjection.graphData : vaultGraphData;
  const effectiveSelectedNode = useMemo(() => {
    if (!isOutlineMode || !outlineProjection) return selectedNode;
    const list = outlineProjection.graphData.nodes;
    return list.find((n) => n.id === selectedOutlineNodeId) ?? list[0] ?? null;
  }, [isOutlineMode, outlineProjection, selectedOutlineNodeId, selectedNode]);

  const handleNodeSelect = useCallback(
    (node: Node | null) => {
      if (isOutlineMode) {
        setSelectedOutlineNodeId(node?.id ?? null);
        return;
      }
      setSelectedNode(node);
    },
    [isOutlineMode, setSelectedNode],
  );

  const handleUpdateOutlineContent = useCallback(
    async (nextMarkdown: string) => {
      if (!activeOutlineNote) return;
      await updateNodeAction({ ...activeOutlineNote, content: nextMarkdown }, isAuthenticated);
    },
    [activeOutlineNote, isAuthenticated],
  );

  const handleAddSubNode = useCallback(
    async (parentId: string, type: 'file' | 'folder') => {
      if (isOutlineMode && activeOutlineNote) {
        const nextMd = addOutlineSubtopicInMarkdown(
          activeOutlineNote.id,
          activeOutlineNote.name,
          activeOutlineNote.content ?? '',
          parentId,
          type === 'folder' ? 'Bagian Baru' : 'Poin Baru',
          { asHeading: type === 'folder', asTask: false },
        );
        await updateNodeAction({ ...activeOutlineNote, content: nextMd }, isAuthenticated);
        return;
      }
      const parentNode = nodes.find((n) => n.id === parentId);
      if (!parentNode) return;
      if (parentNode.type !== 'folder') {
        await updateNodeAction({ ...parentNode, type: 'folder' }, isAuthenticated);
      }
      await addNodeAction(type, isAuthenticated);
    },
    [isOutlineMode, activeOutlineNote, nodes, isAuthenticated],
  );

  const handleNodeMove = useCallback(
    async (nodeId: string, newParentId: string | null) => {
      if (isOutlineMode && activeOutlineNote && newParentId) {
        const nextMd = reparentOutlineTopicInMarkdown(
          activeOutlineNote.id,
          activeOutlineNote.name,
          activeOutlineNote.content ?? '',
          nodeId,
          newParentId,
        );
        await updateNodeAction({ ...activeOutlineNote, content: nextMd }, isAuthenticated);
        return;
      }
      await moveNodeAction(nodeId, newParentId, isAuthenticated);
    },
    [isOutlineMode, activeOutlineNote, isAuthenticated],
  );

  const handleNodeDelete = useCallback(
    async (nodeId: string) => {
      if (isOutlineMode && activeOutlineNote) {
        const nextMd = deleteOutlineTopicInMarkdown(
          activeOutlineNote.id,
          activeOutlineNote.name,
          activeOutlineNote.content ?? '',
          nodeId,
        );
        await updateNodeAction({ ...activeOutlineNote, content: nextMd }, isAuthenticated);
        return;
      }
      await deleteNodeAction(nodeId, isAuthenticated);
    },
    [isOutlineMode, activeOutlineNote, isAuthenticated],
  );

  const handleToggleTask = useCallback(
    async (topicId: string) => {
      if (!isOutlineMode || !activeOutlineNote) return;
      const nextMd = toggleOutlineTaskInMarkdown(
        activeOutlineNote.id,
        activeOutlineNote.name,
        activeOutlineNote.content ?? '',
        topicId,
      );
      await updateNodeAction({ ...activeOutlineNote, content: nextMd }, isAuthenticated);
    },
    [isOutlineMode, activeOutlineNote, isAuthenticated],
  );

  const handleOpen = useCallback(
    (node: Node | null) => {
      if (!node) return;
      if (isOutlineMode && activeOutlineNote) {
        useWorkspaceStore.getState().openFile(activeOutlineNote.id, activeOutlineNote.name);
        return;
      }
      useWorkspaceStore.getState().openFile(node.id, node.name);
    },
    [isOutlineMode, activeOutlineNote],
  );

  const graphRef = useRef<GraphCanvasHandle>(null);

  return {
    isAuthenticated,
    graphRef,
    graphConfig,
    effectiveGraphData,
    effectiveSelectedNode,
    activeOutlineNote,
    isOutlineMode,
    isInspectorOpen,
    setIsInspectorOpen,
    toggleInspector: () => setIsInspectorOpen((prev) => !prev),
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
    handleToggleOutlineMode,
    handleNodeSelect,
    handleOpen,
    handleNodeMove,
    handleNodeDelete,
    handleAddSubNode,
    handleToggleTask,
    handleUpdateOutlineContent,
    handleSmartZoom: (action: 'fit' | 'selection' | 'reset') => graphRef.current?.smartZoom(action),
  };
}
