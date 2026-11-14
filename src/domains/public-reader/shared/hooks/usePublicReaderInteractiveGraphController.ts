import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { GraphCanvasHandle } from "@/domains/graph/components/GraphCanvas";
import { defaultGraphConfig, type GraphConfigState } from "@/domains/graph/shared/stores/useGraphStore";
import { useGraphInteractionStore } from "@/domains/graph/shared/stores/useGraphInteractionStore";
import type { GraphData, Node, Link as GraphLink } from "@/domains/graph/shared/utils/graph.types";
import type { NoteRecord } from "@/types/collaboration";

export interface UsePublicReaderInteractiveGraphControllerParams {
  graphData: GraphData;
  publishedNotes: NoteRecord[];
  vaultName: string;
}

const INITIAL_PUBLIC_GRAPH_CONFIG: GraphConfigState = {
  ...defaultGraphConfig,
  nodes: {
    ...defaultGraphConfig.nodes,
    showLabels: true,
    labelSize: 12,
    labelBox: true,
    showFileNodes: true,
    showFolderNodes: true,
    fileColor: "#3b82f6",
    folderColor: "#eab308",
  },
  forces: {
    ...defaultGraphConfig.forces,
    linkDistance: 85,
    chargeStrength: -180,
  },
};

/**
 * Headless controller for PublicReaderInteractiveGraph: derives node degrees and
 * 1-hop neighborhood dimming, manages zoom/fullscreen/PNG snapshot actions, and links node selection.
 */
export function usePublicReaderInteractiveGraphController({
  graphData,
  publishedNotes,
  vaultName,
}: UsePublicReaderInteractiveGraphControllerParams) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphCanvasRef = useRef<GraphCanvasHandle>(null);

  const [localGraphConfig, setLocalGraphConfig] = useState<GraphConfigState>(
    () => INITIAL_PUBLIC_GRAPH_CONFIG
  );
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNeighborhoodFocusActive] = useState(true);

  const currentLayout = useGraphInteractionStore((s) => s.layoutMode);
  const setLayoutMode = useGraphInteractionStore((s) => s.setLayoutMode);

  const slugToNoteMap = useMemo(() => {
    const map = new Map<string, NoteRecord>();
    for (const note of publishedNotes) {
      map.set(note.slug, note);
      map.set(note.id, note);
    }
    return map;
  }, [publishedNotes]);

  const degreeMap = useMemo(() => {
    const degrees = new Map<string, number>();
    for (const link of graphData.links) {
      const sId = typeof link.source === "object" ? (link.source as { id: string }).id : link.source;
      const tId = typeof link.target === "object" ? (link.target as { id: string }).id : link.target;
      degrees.set(sId, (degrees.get(sId) || 0) + 1);
      degrees.set(tId, (degrees.get(tId) || 0) + 1);
    }
    return degrees;
  }, [graphData.links]);

  const neighborNodeIds = useMemo(() => {
    if (!selectedNode || !isNeighborhoodFocusActive) return null;
    const neighbors = new Set<string>();
    neighbors.add(selectedNode.id);

    for (const link of graphData.links) {
      const sId = typeof link.source === "object" ? (link.source as { id: string }).id : link.source;
      const tId = typeof link.target === "object" ? (link.target as { id: string }).id : link.target;
      if (sId === selectedNode.id) neighbors.add(tId);
      if (tId === selectedNode.id) neighbors.add(sId);
    }
    return neighbors;
  }, [selectedNode, isNeighborhoodFocusActive, graphData.links]);

  const enhancedGraphData = useMemo<GraphData>(() => {
    return {
      nodes: graphData.nodes.map((node) => {
        const degree = degreeMap.get(node.id) || 0;
        const isDimmed = neighborNodeIds ? !neighborNodeIds.has(node.id) : false;

        return {
          ...node,
          val: Math.max(3, Math.min(16, 4 + degree * 1.5)),
          dimmed: isDimmed,
        } as Node;
      }),
      links: graphData.links.map((link) => {
        const sId = typeof link.source === "object" ? (link.source as { id: string }).id : link.source;
        const tId = typeof link.target === "object" ? (link.target as { id: string }).id : link.target;
        const isConnected =
          !neighborNodeIds || (neighborNodeIds.has(sId) && neighborNodeIds.has(tId));

        return {
          ...link,
          dimmed: !isConnected,
        } as GraphLink;
      }),
    };
  }, [graphData, degreeMap, neighborNodeIds]);

  const handleNodeSelect = (node: Node | null) => {
    setSelectedNode(node);
  };

  const handleTraverseToSlug = (targetSlug: string) => {
    const targetNote = slugToNoteMap.get(targetSlug);
    if (targetNote) {
      const targetNode = graphData.nodes.find((n) => n.id === targetNote.id);
      if (targetNode) {
        setSelectedNode(targetNode);
        graphCanvasRef.current?.smartZoom("selection");
      }
    }
  };

  const handleZoomIn = () => {
    const canvas = containerRef.current?.querySelector("canvas");
    if (canvas) {
      canvas.dispatchEvent(new WheelEvent("wheel", { deltaY: -120, bubbles: true }));
    }
  };

  const handleZoomOut = () => {
    const canvas = containerRef.current?.querySelector("canvas");
    if (canvas) {
      canvas.dispatchEvent(new WheelEvent("wheel", { deltaY: 120, bubbles: true }));
    }
  };

  const handleFitCamera = () => {
    graphCanvasRef.current?.smartZoom("fit");
  };

  const handleResetDefaults = () => {
    setLocalGraphConfig(defaultGraphConfig);
    setLayoutMode("free-force");
    graphCanvasRef.current?.smartZoom("fit");
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const handleExportSnapshot = useCallback(() => {
    const canvas = containerRef.current?.querySelector("canvas");
    if (!canvas) {
      toast.error("Kanvas graf tidak ditemukan.");
      return;
    }

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      const safeVaultName = vaultName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      downloadLink.download = `${safeVaultName}-graph-snapshot.png`;
      downloadLink.href = dataUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success("Snapshot graf berhasil diunduh!");
    } catch {
      toast.error("Gagal mengekspor snapshot graf.");
    }
  }, [vaultName]);

  const activeNoteRecord = selectedNode ? slugToNoteMap.get(selectedNode.id) || null : null;

  return {
    containerRef,
    graphCanvasRef,
    localGraphConfig,
    setLocalGraphConfig,
    selectedNode,
    setSelectedNode,
    searchTerm,
    setSearchTerm,
    isFullscreen,
    currentLayout,
    setLayoutMode,
    enhancedGraphData,
    activeNoteRecord,
    handleNodeSelect,
    handleTraverseToSlug,
    handleZoomIn,
    handleZoomOut,
    handleFitCamera,
    handleResetDefaults,
    handleToggleFullscreen,
    handleExportSnapshot,
  };
}
