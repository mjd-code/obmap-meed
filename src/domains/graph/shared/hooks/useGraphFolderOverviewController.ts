import { useState, useMemo, useEffect } from "react";
import type { Node } from "@/domains/graph/shared/utils/graph.types";
import { useNodeStore } from "@/global/stores";
import { useWorkspaceStore } from "@/domains/workspace/shared/stores/useWorkspaceStore";
import { useVaultStore } from "@/domains/vault/shared/stores/useVaultStore";
import { useVaultPermission } from "@/domains/auth/shared/hooks/useVaultPermission";
import { NoteService } from "@/domains/vault/shared/api/NoteService";
import {
  updateNodeAction,
  deleteNodeAction,
} from "@/domains/workspace/shared/api/workspaceActions";
import { useAuth } from "@/domains/auth/shared/hooks/useAuth";
import { BulkPublishService } from "@/domains/collaboration/shared/api/BulkPublishService";
import { openGraphCanvas } from "@/domains/workspace/shared/api/graphCanvasCommands";
import { toast } from "sonner";

export function useGraphFolderOverviewController(folderNode: Node) {
  const nodes = useNodeStore((s) => s.nodes);
  const openFile = useWorkspaceStore((s) => s.openFile);
  const currentVaultId = useVaultStore((s) => s.currentVaultId);
  const permissions = useVaultPermission();
  const { user, session } = useAuth();
  const isAuthenticated = Boolean(user && session);

  const [selectedForPublishIds, setSelectedForPublishIds] = useState<string[] | undefined>(
    undefined,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [publishedMap, setPublishedMap] = useState<
    Record<string, { status: string; slug: string }>
  >({});
  const [bulkModalFolder, setBulkModalFolder] = useState<Node | null>(null);

  const childNodes = useMemo(
    () => nodes.filter((n) => n.parentId === folderNode.id),
    [nodes, folderNode.id],
  );

  const totalDescendants = useMemo(
    () => BulkPublishService.collectDescendantsRecursive(folderNode.id, nodes, false),
    [folderNode.id, nodes],
  );

  const stats = useMemo(() => {
    const total = childNodes.length;
    const notesCount = childNodes.filter((n) => n.type === "file").length;
    const subfolders = childNodes.filter((n) => n.type === "folder").length;
    const media = childNodes.filter((n) => n.type === "media" || n.type === "pdf").length;
    return { total, notes: notesCount, subfolders, media };
  }, [childNodes]);

  useEffect(() => {
    if (!currentVaultId || childNodes.length === 0) return;

    let isMounted = true;
    const fetchStatuses = async () => {
      const results: Record<string, { status: string; slug: string }> = {};
      for (const item of childNodes) {
        try {
          const rec = await NoteService.findNoteInVault(currentVaultId, item.id, item.name);
          if (rec) {
            results[item.id] = { status: rec.status, slug: rec.slug };
          }
        } catch {
          // Offline / local draft
        }
      }
      if (isMounted) {
        setPublishedMap(results);
      }
    };

    fetchStatuses();
    return () => {
      isMounted = false;
    };
  }, [currentVaultId, childNodes]);

  const filteredChildren = useMemo(() => {
    if (!searchQuery.trim()) return childNodes;
    const q = searchQuery.toLowerCase();
    return childNodes.filter((n) => n.name.toLowerCase().includes(q));
  }, [childNodes, searchQuery]);

  const isAllSelected =
    filteredChildren.length > 0 && filteredChildren.every((n) => selectedIds.has(n.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set<string>();
      filteredChildren.forEach((n) => next.add(n.id));
      setSelectedIds(next);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startRename = (node: Node) => {
    setEditingId(node.id);
    setEditingName(node.name);
  };

  const commitRename = (node: Node) => {
    if (!editingName.trim() || editingName === node.name) {
      setEditingId(null);
      return;
    }
    updateNodeAction({ ...node, name: editingName.trim() }, isAuthenticated);
    setEditingId(null);
    toast.success("Nama berhasil diperbarui");
  };

  const handlePublishSelectedOnly = () => {
    if (selectedIds.size === 0) return;
    setSelectedForPublishIds(Array.from(selectedIds));
    setBulkModalFolder(folderNode);
  };

  const handlePublishFolderRecursive = (targetFolder: Node) => {
    setBulkModalFolder(targetFolder);
  };

  const handlePublishSingleItem = (item: Node) => {
    if (!currentVaultId) return;
    NoteService.publishOrUpdateNote({
      vaultId: currentVaultId,
      nodeId: item.id,
      title: item.name,
      content: item.content || "",
      status: "published",
      frontmatter: {
        type: "file",
        parentId: item.parentId,
        depth: item.depth,
        local_node_id: item.id,
      },
    }).then(() => {
      toast.success(`"${item.name}" berhasil dipublikasikan!`);
      setPublishedMap((prev) => ({
        ...prev,
        [item.id]: { status: "published", slug: item.name },
      }));
    });
  };

  const handleDeleteItem = (itemId: string) => {
    deleteNodeAction(itemId, isAuthenticated);
    toast.success("Item dihapus");
  };

  const handleOpenInGraph = (item: Node) => {
    useNodeStore.getState().setSelectedNode(item as any);
    openGraphCanvas("graph");
  };

  const closeBulkModal = () => {
    setBulkModalFolder(null);
    setSelectedForPublishIds(undefined);
  };

  return {
    nodes,
    openFile,
    currentVaultId,
    canPublish: permissions.canPublish,
    searchQuery,
    setSearchQuery,
    selectedIds,
    clearSelection: () => setSelectedIds(new Set()),
    editingId,
    setEditingId,
    editingName,
    setEditingName,
    publishedMap,
    bulkModalFolder,
    selectedForPublishIds,
    totalDescendants,
    stats,
    filteredChildren,
    isAllSelected,
    toggleSelectAll,
    toggleSelectOne,
    startRename,
    commitRename,
    handlePublishSelectedOnly,
    handlePublishFolderRecursive,
    handlePublishSingleItem,
    handleDeleteItem,
    handleOpenInGraph,
    closeBulkModal,
  };
}
