import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { PROTOTYPE_EDITOR_FILES } from "../mockEditorData";
import type { DeepExplorerViewKind, PrototypeEditorFile } from "../types";
import type {
  OpenMode,
  PrototypeViewState,
  PrototypeWorkspaceNode,
  PrototypeWorkspaceState,
} from "./prototypeStateTypes";
import {
  allGroups,
  buildNewEditorFileRecord,
  closeAllLeavesInTree,
  closeLeafInTree,
  closeLeavesByNodeIdInTree,
  closeLeavesToRightInTree,
  createInitialWorkspaceTree,
  moveLeafInTree,
  moveLeafToNewSplitInTree,
  openViewInTree,
  renameLeafByNodeIdInTree,
  setActiveLeafInTree,
  setSplitSizesInTree,
  splitGroupInTree,
  togglePinLeafInTree,
} from "./workspaceTree";

export function useWorkspaceState(): PrototypeWorkspaceState {
  const [files, setFiles] = useState<PrototypeEditorFile[]>(() => structuredClone(PROTOTYPE_EDITOR_FILES));
  const [folders, setFolders] = useState<string[]>(() => Array.from(new Set(PROTOTYPE_EDITOR_FILES.map((f) => f.folder))));
  const initialTree = useMemo(() => createInitialWorkspaceTree(PROTOTYPE_EDITOR_FILES[0]), []);
  const [root, setRoot] = useState<PrototypeWorkspaceNode>(initialTree.root);
  const [activeGroupId, setActiveGroupId] = useState<string>(initialTree.activeGroupId);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(PROTOTYPE_EDITOR_FILES[0]?.id ?? null);
  const [leftSidebarTool, setLeftSidebarTool] = useState<"files" | "vcs" | null>("files");
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [leftSidebarPinned, setLeftSidebarPinned] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );
  const [rightSidebarPinned, setRightSidebarPinned] = useState(false);

  const activeFile = useMemo(() => files.find((f) => f.id === selectedFileId) ?? files[0] ?? null, [files, selectedFileId]);

  const applyTree = useCallback((next: { root: PrototypeWorkspaceNode; activeGroupId: string }) => {
    setRoot(next.root);
    setActiveGroupId(next.activeGroupId);
  }, []);

  const openView = useCallback(
    (view: PrototypeViewState, mode: OpenMode = "reuse-tab") => {
      applyTree(openViewInTree(root, activeGroupId, view, mode));
      if (view.type === "markdown" && view.nodeId) setSelectedFileId(view.nodeId);
    },
    [activeGroupId, applyTree, root]
  );

  const openFile = useCallback(
    (fileId: string, mode: OpenMode = "reuse-tab") => {
      const target = files.find((f) => f.id === fileId);
      if (!target) return;
      setSelectedFileId(fileId);
      openView({ type: "markdown", nodeId: target.id, title: target.name }, mode);
    },
    [files, openView]
  );

  const openDeepExplorerTab = useCallback(
    (_view?: DeepExplorerViewKind | "academy") => {
      openView({ type: "deep_explorer", nodeId: "__deep_explorer__", title: "Deep Explorer" }, "new-tab");
    },
    [openView]
  );

  const openSettingsHubTab = useCallback(() => {
    openView({ type: "settings", nodeId: "__settings_hub__", title: "Settings Hub" }, "new-tab");
  }, [openView]);

  const closeLeaf = useCallback(
    (groupId: string, leafId: string) => applyTree(closeLeafInTree(root, activeGroupId, groupId, leafId)),
    [activeGroupId, applyTree, root]
  );

  const closeLeavesToRight = useCallback(
    (groupId: string, leafId: string) => setRoot((prev) => closeLeavesToRightInTree(prev, groupId, leafId)),
    []
  );

  const closeAllLeaves = useCallback(
    (groupId: string) => applyTree(closeAllLeavesInTree(root, activeGroupId, groupId)),
    [activeGroupId, applyTree, root]
  );

  const setActiveLeaf = useCallback((groupId: string, leafId: string) => {
    setRoot((prev) => setActiveLeafInTree(prev, groupId, leafId));
    setActiveGroupId(groupId);
  }, []);

  const togglePinLeaf = useCallback(
    (groupId: string, leafId: string) => setRoot((prev) => togglePinLeafInTree(prev, groupId, leafId)),
    []
  );

  const splitGroup = useCallback(
    (groupId: string, direction: "horizontal" | "vertical") => applyTree(splitGroupInTree(root, groupId, direction)),
    [applyTree, root]
  );

  const setSplitSizes = useCallback(
    (splitId: string, sizes: number[]) => setRoot((prev) => setSplitSizesInTree(prev, splitId, sizes)),
    []
  );

  const moveLeaf = useCallback(
    (fromGroupId: string, leafId: string, toGroupId: string, index?: number) =>
      applyTree(moveLeafInTree(root, activeGroupId, fromGroupId, leafId, toGroupId, index)),
    [activeGroupId, applyTree, root]
  );

  const moveLeafToNewSplit = useCallback(
    (fromGroupId: string, leafId: string, toGroupId: string, edge: "left" | "right" | "top" | "bottom") =>
      applyTree(moveLeafToNewSplitInTree(root, activeGroupId, fromGroupId, leafId, toGroupId, edge)),
    [activeGroupId, applyTree, root]
  );

  const createFile = useCallback(
    (folder: string, name?: string, vaultId = "v-atlas"): PrototypeEditorFile => {
      const file = buildNewEditorFileRecord(folder, name, vaultId, files.length + 1);
      setFiles((prev) => [file, ...prev]);
      setFolders((prev) => (prev.includes(file.folder) ? prev : [...prev, file.folder]));
      setSelectedFileId(file.id);
      applyTree(openViewInTree(root, activeGroupId, { type: "markdown", nodeId: file.id, title: file.name }, "new-tab"));
      toast.success(`Berkas "${file.name}" dibuat di ${file.folder}.`);
      return file;
    },
    [activeGroupId, applyTree, files.length, root]
  );

  const createFolder = useCallback((folderName: string) => {
    const clean = folderName.trim();
    if (!clean) return;
    setFolders((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
    toast.success(`Folder "${clean}" ditambahkan.`);
  }, []);

  const renameFile = useCallback((fileId: string, nextName: string) => {
    const clean = nextName.trim();
    if (!clean) return;
    const finalName = clean.endsWith(".md") ? clean : `${clean}.md`;
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, name: finalName } : f)));
    setRoot((prev) => renameLeafByNodeIdInTree(prev, fileId, finalName));
  }, []);

  const deleteFile = useCallback(
    (fileId: string) => {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      const next = closeLeavesByNodeIdInTree(root, activeGroupId, fileId);
      applyTree(next);
      if (selectedFileId === fileId) {
        setSelectedFileId(allGroups(next.root)[0]?.leaves[0]?.view.nodeId ?? null);
      }
      toast.info("Berkas dihapus dari workspace lokal.");
    },
    [activeGroupId, applyTree, root, selectedFileId]
  );

  const moveFileToFolder = useCallback((fileId: string, folder: string) => {
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, folder } : f)));
    setFolders((prev) => (prev.includes(folder) ? prev : [...prev, folder]));
  }, []);

  const updateFileContent = useCallback((fileId: string, content: string) => {
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, content } : f)));
  }, []);

  const updateFileYaml = useCallback((fileId: string, yaml: Record<string, string>) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, yaml, visibility: yaml.visibility === "public" ? "public" : "private" } : f
      )
    );
  }, []);

  const syncActiveVaultFiles = useCallback(
    (vaultId: string) => {
      const vaultFile = files.find((f) => f.vaultId === vaultId);
      if (vaultFile) setSelectedFileId(vaultFile.id);
    },
    [files]
  );

  return {
    root, activeGroupId, files, folders, selectedFileId, activeFile,
    leftSidebarTool, setLeftSidebarTool, rightSidebarOpen, setRightSidebarOpen,
    leftSidebarPinned, setLeftSidebarPinned, rightSidebarPinned, setRightSidebarPinned,
    openView, openFile, openDeepExplorerTab, openSettingsHubTab,
    closeLeaf, closeLeavesToRight, closeAllLeaves, setActiveLeaf,
    setActiveGroup: setActiveGroupId, togglePinLeaf, splitGroup, setSplitSizes,
    moveLeaf, moveLeafToNewSplit, createFile, createFolder, renameFile,
    deleteFile, moveFileToFolder, updateFileContent, updateFileYaml, syncActiveVaultFiles,
  };
}
