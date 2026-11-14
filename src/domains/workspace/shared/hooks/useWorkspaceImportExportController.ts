import { useState, useRef, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  importExportService,
  type ImportResult,
  type ExportOptions,
  type GraphNode,
  type DuplicateStrategy,
} from "@/domains/vault/shared/api/ImportExportService";

export interface ImportExportNode {
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
  wikilinks?: string[];
}

export interface ImportExportPanelProps {
  nodes: ImportExportNode[];
  onImportComplete: (
    importedNodes: ImportExportNode[],
    updatedNodes?: ImportExportNode[],
  ) => void;
  isSheet?: boolean;
}

/**
 * Headless controller for WorkspaceImportExportPanel.
 * Manages import progress/results, duplicate resolution strategies, and selective ZIP exports.
 */
export function useWorkspaceImportExportController({
  nodes,
  onImportComplete,
}: Pick<ImportExportPanelProps, "nodes" | "onImportComplete">) {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);
  const [selectedExportNodes, setSelectedExportNodes] = useState<Set<string>>(
    () => new Set(),
  );
  const [includeMedia, setIncludeMedia] = useState(true);
  const [duplicateStrategy, setDuplicateStrategy] =
    useState<DuplicateStrategy>("rename");
  const [showImportSettings, setShowImportSettings] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const nodesRef = useRef<ImportExportNode[]>(nodes);
  nodesRef.current = nodes;

  const handleFileImport = useCallback(
    async (files: FileList | null, _type: string) => {
      if (!files || files.length === 0) return;

      setIsImporting(true);
      setImportProgress(10);

      try {
        setImportProgress(30);
        const result = await importExportService.importFiles(
          files,
          nodesRef.current as GraphNode[],
          duplicateStrategy,
        );
        setImportProgress(100);
        setLastResult(result);

        if (result.nodes.length > 0 || result.updatedNodes.length > 0) {
          onImportComplete(
            result.nodes as ImportExportNode[],
            result.updatedNodes as ImportExportNode[],
          );

          const parts: string[] = [];
          if (result.folders > 0) parts.push(`${result.folders} folders`);
          if (result.files > 0) parts.push(`${result.files} files`);
          if (result.media > 0) parts.push(`${result.media} media`);
          if (result.overwritten > 0) parts.push(`${result.overwritten} overwritten`);
          if (result.merged > 0) parts.push(`${result.merged} merged`);
          if (result.skipped > 0) parts.push(`${result.skipped} skipped`);

          toast.success(`Imported: ${parts.join(", ")}`);
        } else if (result.errors.length > 0) {
          toast.warning(`Import completed with ${result.errors.length} errors`);
        } else if (result.skipped > 0) {
          toast.info(`Skipped ${result.skipped} duplicate items`);
        } else {
          toast.info("No supported files found to import");
        }
      } catch (error) {
        toast.error(
          `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      } finally {
        setIsImporting(false);
        setImportProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (folderInputRef.current) folderInputRef.current.value = "";
        if (zipInputRef.current) zipInputRef.current.value = "";
        if (mediaInputRef.current) mediaInputRef.current.value = "";
      }
    },
    [duplicateStrategy, onImportComplete],
  );

  const handleExport = useCallback(
    async (type: ExportOptions["type"]) => {
      const options: ExportOptions = {
        type,
        includeMedia,
        nodeIds:
          type === "folder" || type === "files"
            ? Array.from(selectedExportNodes)
            : undefined,
      };

      if (
        (type === "folder" || type === "files") &&
        selectedExportNodes.size === 0
      ) {
        toast.error("Please select items to export");
        return;
      }

      try {
        const blob = await importExportService.exportData(
          nodes as GraphNode[],
          options,
        );

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const timestamp = new Date().toISOString().split("T")[0];
        a.download = `export_${type}_${timestamp}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Exported successfully");
      } catch (error) {
        toast.error(
          `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    [includeMedia, nodes, selectedExportNodes],
  );

  const toggleNodeSelection = useCallback((nodeId: string) => {
    setSelectedExportNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const folders = useMemo(
    () => nodes.filter((n) => n.type === "folder"),
    [nodes],
  );
  const files = useMemo(() => nodes.filter((n) => n.type === "file"), [nodes]);
  const media = useMemo(
    () => nodes.filter((n) => n.type === "media" || n.mediaType),
    [nodes],
  );

  return {
    isImporting,
    importProgress,
    lastResult,
    selectedExportNodes,
    includeMedia,
    setIncludeMedia,
    duplicateStrategy,
    setDuplicateStrategy,
    showImportSettings,
    setShowImportSettings,
    fileInputRef,
    folderInputRef,
    zipInputRef,
    mediaInputRef,
    folders,
    files,
    media,
    handleFileImport,
    handleExport,
    toggleNodeSelection,
  };
}
