import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWorkspaceStore } from "@/domains/workspace/shared/stores/useWorkspaceStore";
import { useNodeStore } from "@/global/stores";
import { getVaultManager } from "@/domains/vault/shared/api/VaultManagerSingleton";
import { writeNodeToDisk } from "@/domains/vault/shared/api/VaultFileWriter";
import { useFolderNavigation } from "@/domains/workspace/shared/hooks/useFolderNavigation";
import { getAncestorIdSet, isNodeDescendant } from "@/domains/graph/shared/utils/hierarchyTraversal";
import { useExplorerGraphSyncStore } from "@/domains/graph/shared/stores/useExplorerGraphSyncStore";

export interface ExplorerNode {
  id: string;
  name: string;
  content: string;
  type: "folder" | "file" | "media" | "pdf";
  parentId: string | null;
  depth: number;
  tags: string[];
  mediaType?: "image" | "audio" | "video" | "pdf";
}

export interface FileExplorerTreeProps {
  nodes: ExplorerNode[];
  selectedNode: ExplorerNode | null;
  onNodeSelect: (node: ExplorerNode) => void;
  onNodeOpen?: (node: ExplorerNode) => void;
  onNodeMove?: (nodeId: string, newParentId: string | null) => void;
  onNodeDelete?: (nodeId: string) => Promise<void> | void;
  onNodeUpdate?: (node: ExplorerNode) => Promise<void> | void;
  currentVaultId: string | null;
  sortBy?: "name" | "type";
}

/**
 * Headless controller for WorkspaceFileExplorerTree.
 * Coordinates drag-and-drop reparenting, inline renaming, explorer-graph sync, and node creation.
 */
export function useWorkspaceFileExplorerController({
  nodes,
  selectedNode,
  onNodeSelect,
  onNodeMove,
  onNodeUpdate,
  currentVaultId,
  sortBy = "type",
}: Pick<
  FileExplorerTreeProps,
  | "nodes"
  | "selectedNode"
  | "onNodeSelect"
  | "onNodeMove"
  | "onNodeUpdate"
  | "currentVaultId"
  | "sortBy"
>) {
  const openFile = useWorkspaceStore((state) => state.openFile);
  const { expandedFolders, toggleFolder, expandFolder, expandAll } = useFolderNavigation();
  const syncMode = useExplorerGraphSyncStore((state) => state.mode);
  const setExplorerHoveredNodeId = useExplorerGraphSyncStore(
    (state) => state.setExplorerHoveredNodeId,
  );
  const clearExplorerHoveredNode = useExplorerGraphSyncStore(
    (state) => state.clearExplorerHoveredNode,
  );
  const requestGraphFocus = useExplorerGraphSyncStore((state) => state.requestFocus);

  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const selectedRowRef = useRef<HTMLDivElement | null>(null);
  const lastProcessedNodeIdRef = useRef<string | null>(null);

  const hoverSyncEnabled =
    syncMode === "hover-highlight" || syncMode === "hover-and-focus";
  const focusSyncEnabled =
    syncMode === "select-focus" || syncMode === "hover-and-focus";

  const [draggedNode, setDraggedNode] = useState<ExplorerNode | null>(null);
  const [dragOverNode, setDragOverNode] = useState<string | null>(null);
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [publishingFolder, setPublishingFolder] = useState<ExplorerNode | null>(null);

  // Lacak rantai leluhur aktif untuk dynamic tree line highlighting
  const selectedPathSet = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    return getAncestorIdSet(selectedNode.id, nodes as ExplorerNode[], true);
  }, [selectedNode, nodes]);

  // Auto-expand dan scroll hanya saat mode focus aktif.
  // Mode "Selection only" tetap menyinkronkan selected state,
  // tetapi tidak menggerakkan atau membuka Explorer secara otomatis.
  useEffect(() => {
    if (!focusSyncEnabled) {
      lastProcessedNodeIdRef.current = null;
      return;
    }

    const currentId = selectedNode?.id ?? null;

    if (!currentId) {
      lastProcessedNodeIdRef.current = null;
      return;
    }

    // Hindari pekerjaan ulang pada node yang sama agar tidak memicu render loop.
    if (lastProcessedNodeIdRef.current === currentId) {
      return;
    }

    lastProcessedNodeIdRef.current = currentId;

    const ancestorIds = Array.from(
      getAncestorIdSet(currentId, nodes as ExplorerNode[], false),
    );

    if (ancestorIds.length > 0) {
      expandAll(ancestorIds);
    }

    const scrollTimer = window.setTimeout(() => {
      selectedRowRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 100);

    return () => window.clearTimeout(scrollTimer);

    // `nodes` sengaja tidak menjadi dependency:
    // rename/update node tidak boleh mengulang scroll/focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode?.id, focusSyncEnabled, expandAll]);

  const handleDragStart = useCallback((node: ExplorerNode, e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedNode(node);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback(
    (node: ExplorerNode, e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (node.type === "folder" && draggedNode && draggedNode.id !== node.id) {
        setDragOverNode(node.id);
        e.dataTransfer.dropEffect = "move";
      }
    },
    [draggedNode],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverNode(null);
  }, []);

  const handleDrop = useCallback(
    (targetNode: ExplorerNode, e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverNode(null);

      if (!draggedNode || !onNodeMove) return;

      if (targetNode.type === "folder" && draggedNode.id !== targetNode.id) {
        const isDescendant = isNodeDescendant(
          targetNode.id,
          draggedNode.id,
          nodes as ExplorerNode[],
        );

        if (!isDescendant) {
          onNodeMove(draggedNode.id, targetNode.id);
        }
      }

      setDraggedNode(null);
    },
    [draggedNode, nodes, onNodeMove],
  );

  const handleDropOnRoot = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverNode(null);

      if (draggedNode && onNodeMove) {
        onNodeMove(draggedNode.id, null);
      }

      setDraggedNode(null);
    },
    [draggedNode, onNodeMove],
  );

  const handleRename = useCallback(
    (node: ExplorerNode, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed || trimmed === node.name) {
        setRenamingNodeId(null);
        return;
      }
      onNodeUpdate?.({ ...node, name: trimmed });
      setRenamingNodeId(null);
    },
    [onNodeUpdate],
  );

  const handleAddNodeUnder = useCallback(
    async (targetNode: ExplorerNode, type: "file" | "folder") => {
      let parentId: string | null = null;
      let depth = 0;

      if (targetNode.type === "folder") {
        parentId = targetNode.id;
        depth = targetNode.depth + 1;
        expandFolder(targetNode.id);
      } else {
        parentId = targetNode.parentId;
        depth = targetNode.depth;
      }

      const newNode: ExplorerNode = {
        id: `node-${Date.now()}`,
        name:
          type === "folder"
            ? `New Folder ${nodes.filter((n) => n.type === "folder").length + 1}`
            : `New File ${nodes.filter((n) => n.type === "file").length + 1}`,
        content: "",
        type,
        parentId,
        depth,
        tags: [],
      };

      useNodeStore.getState().addNode(newNode);
      onNodeSelect(newNode);
      if (type === "file") {
        openFile(newNode.id, newNode.name, "tab");
      }

      if (currentVaultId) {
        const vault = getVaultManager().getVault(currentVaultId);
        if (vault) {
          const allNodes = useNodeStore.getState().nodes;
          vault.graphService.setNode(newNode);
          await writeNodeToDisk(vault, allNodes, newNode.id);
          vault.history.addState(allNodes, []);
          await getVaultManager().saveCurrentVault();
        }
      }
    },
    [currentVaultId, expandFolder, nodes, onNodeSelect, openFile],
  );

  const rootNodes = useMemo(
    () => nodes.filter((node) => node.parentId === null),
    [nodes],
  );

  const getChildren = useCallback(
    (parentId: string): ExplorerNode[] => {
      return nodes
        .filter((node) => node.parentId === parentId)
        .sort((a, b) => {
          if (sortBy === "type") {
            if (a.type === "folder" && b.type !== "folder") return -1;
            if (a.type !== "folder" && b.type === "folder") return 1;
          }
          return a.name.localeCompare(b.name);
        });
    },
    [nodes, sortBy],
  );

  const rootActiveIndex = useMemo(
    () => rootNodes.findIndex((n) => selectedPathSet.has(n.id)),
    [rootNodes, selectedPathSet],
  );

  const registerItemRef = useCallback(
    (nodeId: string, isSelected: boolean, element: HTMLDivElement | null) => {
      if (element) {
        itemRefs.current.set(nodeId, element);
      } else {
        itemRefs.current.delete(nodeId);
      }
      if (isSelected) selectedRowRef.current = element;
    },
    [],
  );

  return {
    openFile,
    expandedFolders,
    toggleFolder,
    hoverSyncEnabled,
    focusSyncEnabled,
    setExplorerHoveredNodeId,
    clearExplorerHoveredNode,
    requestGraphFocus,
    draggedNode,
    dragOverNode,
    renamingNodeId,
    setRenamingNodeId,
    publishingFolder,
    setPublishingFolder,
    selectedPathSet,
    rootNodes,
    rootActiveIndex,
    getChildren,
    registerItemRef,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDropOnRoot,
    handleRename,
    handleAddNodeUnder,
  };
}
