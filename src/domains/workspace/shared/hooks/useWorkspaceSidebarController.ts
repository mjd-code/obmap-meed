import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  SETTINGS_SECTIONS,
  type SettingsSectionId,
} from "@/domains/settings/shared/utils/settingsNavigation";
import type { RibbonTool } from "@/domains/workspace/components/WorkspaceIconRibbon";
import { useWorkspaceStore } from "@/domains/workspace/shared/stores/useWorkspaceStore";
import { useUIStore } from "@/global/stores";
import { useFolderNavigation } from "@/domains/workspace/shared/hooks/useFolderNavigation";

export interface SidebarNode {
  id: string;
  name: string;
  content: string;
  type: "folder" | "file" | "media" | "pdf";
  parentId: string | null;
  depth: number;
  tags: string[];
  mediaType?: "image" | "audio" | "video" | "pdf";
  mimeType?: string;
  dataUrl?: string;
}

export interface SidebarPanelProps {
  activeTool: RibbonTool | null;
  onClose: () => void;
  nodes: SidebarNode[];
  selectedNode: SidebarNode | null;
  onNodeSelect: (node: SidebarNode) => void;
  onNodeOpen?: (node: SidebarNode) => void;
  onNodeMove?: (nodeId: string, newParentId: string | null) => void;
  onNodeDelete?: (nodeId: string) => Promise<void> | void;
  onNodeUpdate?: (node: SidebarNode) => Promise<void> | void;
  onAddNode?: (type: "folder" | "file") => void;
  isVaultMode: boolean;
  vaultName: string | null;
  vaultLocation?: "folder" | "cloud";
  currentVaultId: string | null;
  availableVaults: Array<{
    id: string;
    name: string;
    location: "folder" | "cloud";
    nodeCount: number;
  }>;
  onSwitchVault: (vaultId: string) => void;
  onCloseVault: () => void;
  graphConfigTrigger?: React.ReactNode;
  onImportComplete?: (importedNodes: SidebarNode[], updatedNodes?: SidebarNode[]) => void;
}

const MIN_WIDTH = 200;
const MAX_WIDTH = 450;
const DEFAULT_WIDTH = 260;

export const SIDEBAR_PANEL_TITLES: Record<RibbonTool, string> = {
  files: "File Explorer",
  vcs: "Version Control",
  settings: "Settings",
};

interface UseWorkspaceSidebarControllerParams {
  nodes: SidebarNode[];
  selectedNode: SidebarNode | null;
  onNodeSelect: (node: SidebarNode) => void;
  onNodeOpen?: (node: SidebarNode) => void;
  onImportComplete?: (importedNodes: SidebarNode[], updatedNodes?: SidebarNode[]) => void;
}

/**
 * Headless controller for WorkspaceSidebarPanel.
 * Encapsulates resize dragging, settings search/selection, folder expansion, and media uploads.
 */
export function useWorkspaceSidebarController({
  nodes,
  selectedNode,
  onNodeSelect,
  onNodeOpen,
  onImportComplete,
}: UseWorkspaceSidebarControllerParams) {
  const openView = useWorkspaceStore((state) => state.openView);
  const activeLeafSettingsSection = useWorkspaceStore((state) => {
    const leaf = state.getActiveLeaf();
    return leaf?.view.type === "settings" ? leaf.view.settingsSection : undefined;
  });
  const setExpandedFolderIds = useUIStore((state) => state.setExpandedFolderIds);
  const setActiveTool = useUIStore((state) => state.setActiveTool);
  const { expandedFolders } = useFolderNavigation();

  const [lastSettingsSection, setLastSettingsSection] =
    useState<SettingsSectionId>("account");
  const activeSettingsSection: SettingsSectionId =
    activeLeafSettingsSection ?? lastSettingsSection;
  const [settingsSearch, setSettingsSearch] = useState("");
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "type">("type");
  const [uploadAcceptFilter, setUploadAcceptFilter] = useState<string>("image/*,audio/*,.pdf");

  const panelRef = useRef<HTMLDivElement>(null);
  const fileUploadInputRef = useRef<HTMLInputElement>(null);

  const folderCount = useMemo(
    () => nodes.filter((n) => n.type === "folder").length,
    [nodes],
  );
  const fileCount = useMemo(
    () => nodes.filter((n) => n.type === "file").length,
    [nodes],
  );

  const filteredSections = useMemo(() => {
    const q = settingsSearch.trim().toLowerCase();
    if (!q) return null;
    return SETTINGS_SECTIONS.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.group.toLowerCase().includes(q),
    );
  }, [settingsSearch]);

  const handleOpenSettings = useCallback(() => {
    setActiveTool("settings");
    openView({
      type: "settings",
      title: "Settings",
      settingsSection: activeSettingsSection,
    });
  }, [setActiveTool, openView, activeSettingsSection]);

  const selectSettingsSection = useCallback(
    (section: SettingsSectionId, label: string) => {
      setLastSettingsSection(section);
      openView({ type: "settings", title: label, settingsSection: section });
    },
    [openView],
  );

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;
      const panelRect = panelRef.current.getBoundingClientRect();
      const newWidth = e.clientX - panelRect.left;
      setWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth)));
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeEnd);
    };
  }, [isResizing]);

  const expandAll = useCallback(() => {
    setExpandedFolderIds(
      nodes.filter((node) => node.type === "folder").map((node) => node.id),
    );
  }, [nodes, setExpandedFolderIds]);

  const collapseAll = useCallback(() => {
    setExpandedFolderIds([]);
  }, [setExpandedFolderIds]);

  const triggerUpload = useCallback((accept: string) => {
    setUploadAcceptFilter(accept);
    setTimeout(() => {
      fileUploadInputRef.current?.click();
    }, 50);
  }, []);

  const handleFileUploadChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      let targetParentId: string | null = null;
      let targetDepth = 0;

      if (selectedNode) {
        if (selectedNode.type === "folder") {
          targetParentId = selectedNode.id;
          targetDepth = selectedNode.depth + 1;
        } else if (selectedNode.parentId) {
          targetParentId = selectedNode.parentId;
          const parentFolder = nodes.find((n) => n.id === selectedNode.parentId);
          targetDepth = parentFolder ? parentFolder.depth + 1 : 0;
        }
      }

      const newNodes: SidebarNode[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const lowerName = file.name.toLowerCase();

        let mediaType: "image" | "audio" | "pdf" = "image";
        if (file.type.startsWith("audio/") || lowerName.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/)) {
          mediaType = "audio";
        } else if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
          mediaType = "pdf";
        } else if (
          file.type.startsWith("image/") ||
          lowerName.match(/\.(png|jpg|jpeg|gif|webp|svg|bmp)$/)
        ) {
          mediaType = "image";
        }

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const newNode: SidebarNode = {
          id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: file.name,
          content: `Uploaded ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
          type: "media",
          parentId: targetParentId,
          depth: targetDepth,
          tags: [mediaType],
          mediaType,
          mimeType: file.type || (mediaType === "pdf" ? "application/pdf" : undefined),
          dataUrl,
        };

        newNodes.push(newNode);
      }

      if (newNodes.length > 0 && onImportComplete) {
        onImportComplete(newNodes);
        toast.success(`Berhasil mengunggah ${newNodes.length} file`);

        const lastNode = newNodes[newNodes.length - 1];
        onNodeSelect(lastNode);
        onNodeOpen?.(lastNode);
      }

      if (fileUploadInputRef.current) {
        fileUploadInputRef.current.value = "";
      }
    },
    [nodes, selectedNode, onImportComplete, onNodeSelect, onNodeOpen],
  );

  return {
    panelRef,
    fileUploadInputRef,
    width,
    isResizing,
    sortBy,
    setSortBy,
    expandedFolders,
    folderCount,
    fileCount,
    activeSettingsSection,
    settingsSearch,
    setSettingsSearch,
    filteredSections,
    uploadAcceptFilter,
    handleOpenSettings,
    selectSettingsSection,
    handleResizeStart,
    expandAll,
    collapseAll,
    triggerUpload,
    handleFileUploadChange,
  };
}
