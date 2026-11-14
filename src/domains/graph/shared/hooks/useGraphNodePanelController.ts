import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { openGraphCanvas } from "@/domains/workspace/shared/api/graphCanvasCommands";
import { useNodeStore } from "@/global/stores";
import {
  undoActiveEditor,
  redoActiveEditor,
  canUndoActiveEditor,
  canRedoActiveEditor,
} from "@/domains/editor/shared/api/activeEditor";

export interface GraphPanelNode {
  id: string;
  name: string;
  content: string;
  type: "folder" | "file" | "media" | "pdf";
  parentId: string | null;
  depth: number;
  tags: string[];
  mediaType?: "image" | "audio" | "video" | "pdf";
  dataUrl?: string;
  mimeType?: string;
}

export interface UseGraphNodePanelControllerProps {
  node: GraphPanelNode | null;
  onClose: () => void;
  onUpdate: (node: GraphPanelNode) => void;
  onDelete: (nodeId: string) => void;
  autoSaveDelay?: number;
}

export function useGraphNodePanelController({
  node,
  onClose,
  onUpdate,
  onDelete,
  autoSaveDelay = 1500,
}: UseGraphNodePanelControllerProps) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [editorMode, setEditorMode] = useState<"editor" | "reading">("editor");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"wide" | "narrow">("wide");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastNodeIdRef = useRef<string | null>(null);
  const [historyStatus, setHistoryStatus] = useState({ canUndo: false, canRedo: false });
  const lastSavedContentRef = useRef<string>(node?.content || "");

  const refreshHistoryStatus = useCallback(() => {
    setHistoryStatus({
      canUndo: canUndoActiveEditor(),
      canRedo: canRedoActiveEditor(),
    });
  }, []);

  useEffect(() => {
    if (!node) return;
    const isDirty = content !== lastSavedContentRef.current || name !== node.name;
    setHasChanges(isDirty);
    refreshHistoryStatus();
  }, [content, name, node, refreshHistoryStatus]);

  const handleSave = useCallback(
    (isAutoSave = false) => {
      if (!node || isSaving) return;

      setIsSaving(true);
      lastSavedContentRef.current = content;

      onUpdate({
        ...node,
        name,
        content,
        tags,
      });

      setHasChanges(false);
      setIsSaving(false);

      if (!isAutoSave) {
        toast.success("Catatan berhasil disimpan");
      }
    },
    [node, name, content, tags, onUpdate, isSaving],
  );

  useEffect(() => {
    const handleGlobalUndoRedo = (e: KeyboardEvent) => {
      if (editorMode === "reading") return;

      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === "INPUT" ||
        (target?.tagName === "TEXTAREA" && !target.closest(".cm-editor"));
      if (isInput) return;

      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;

      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        if (e.shiftKey) {
          redoActiveEditor();
        } else {
          undoActiveEditor();
        }
        refreshHistoryStatus();
      } else if (e.key === "y" || e.key === "Y") {
        e.preventDefault();
        redoActiveEditor();
        refreshHistoryStatus();
      }
    };

    window.addEventListener("keydown", handleGlobalUndoRedo);
    return () => window.removeEventListener("keydown", handleGlobalUndoRedo);
  }, [editorMode, refreshHistoryStatus]);

  useEffect(() => {
    if (node) {
      if (lastNodeIdRef.current !== node.id) {
        setName(node.name);
        setContent(node.content);
        setTags(node.tags || []);
        setHasChanges(false);
        lastNodeIdRef.current = node.id;
        lastSavedContentRef.current = node.content || "";
      }
    }
  }, [node?.id]);

  useEffect(() => {
    if (node && lastNodeIdRef.current === node.id && !hasChanges) {
      setName(node.name);
      setContent(node.content);
      setTags(node.tags || []);
    }
  }, [node, hasChanges]);

  useEffect(() => {
    if (node && lastNodeIdRef.current === node.id) {
      const hasNameChange = name !== node.name;
      const hasContentChange = content !== node.content;
      const hasTagsChange = JSON.stringify(tags) !== JSON.stringify(node.tags || []);
      setHasChanges(hasNameChange || hasContentChange || hasTagsChange);
    }
  }, [name, content, tags, node]);

  useEffect(() => {
    if (hasChanges && node && autoSaveDelay > 0) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        handleSave(true);
      }, autoSaveDelay);

      return () => {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
      };
    }
  }, [hasChanges, name, content, tags, autoSaveDelay, handleSave, node]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const handleDelete = useCallback(() => {
    if (!node) return;
    onDelete(node.id);
    onClose();
    toast.success("Catatan dihapus");
  }, [node, onDelete, onClose]);

  const copyEmbedLink = useCallback(() => {
    if (!node) return;
    const embedSyntax = node.mediaType === "image" ? `![[${node.name}]]` : `[[${node.name}]]`;
    navigator.clipboard.writeText(embedSyntax);
    toast.success("Tautan disalin ke clipboard");
  }, [node]);

  const handleOpenInGraph = useCallback(() => {
    if (!node) return;
    useNodeStore.getState().setSelectedNode(node as any);
    openGraphCanvas("graph");
  }, [node]);

  const handleContentRestore = useCallback((restoredContent: string) => {
    setContent(restoredContent);
    setHasChanges(true);
  }, []);

  const handleCitationClick = useCallback((label: string) => {
    const targetDef = document.getElementById(`citation-def-${label}`);
    if (targetDef) {
      targetDef.scrollIntoView({ behavior: "smooth", block: "center" });
      targetDef.classList.add("ring-1", "ring-primary", "bg-primary/15");
      setTimeout(() => {
        targetDef.classList.remove("ring-1", "ring-primary", "bg-primary/15");
      }, 1200);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (hasChanges) handleSave(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, handleSave]);

  return {
    name,
    setName,
    content,
    setContent,
    tags,
    editorMode,
    setEditorMode,
    hasChanges,
    isSaving,
    layoutMode,
    setLayoutMode,
    titleInputRef,
    historyStatus,
    refreshHistoryStatus,
    handleSave,
    handleDelete,
    copyEmbedLink,
    handleOpenInGraph,
    handleContentRestore,
    handleCitationClick,
  };
}
