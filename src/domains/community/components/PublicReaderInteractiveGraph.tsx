// src/domains/community/components/PublicReaderInteractiveGraph.tsx
import React from "react";
import { GraphCanvas } from "@/domains/graph/components/GraphCanvas";
import type { GraphData } from "@/domains/graph/shared/utils/graph.types";
import type { NoteRecord } from "@/types/collaboration";
import { Input } from "@/global/ui/input";
import { Button } from "@/global/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/global/ui/tooltip";
import { PublicGraphSettingsPopover } from "@/domains/community/components/PublicReaderGraphSettingsPopover";
import { PublicNodePreviewDrawer } from "@/domains/community/components/PublicReaderNodePreviewDrawer";
import { usePublicReaderInteractiveGraphController } from "@/domains/community/shared/hooks/usePublicReaderInteractiveGraphController";
import {
  Search,
  Compass,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Scan,
  Download,
  X,
} from "lucide-react";

export interface PublicInteractiveGraphProps {
  graphData: GraphData;
  publishedNotes: NoteRecord[];
  onOpenArticle: (note: NoteRecord) => void;
  vaultName: string;
}

/**
 * Pure declarative interactive graph viewport for the public reader experience.
 */
export const PublicInteractiveGraph: React.FC<PublicInteractiveGraphProps> = ({
  graphData,
  publishedNotes,
  onOpenArticle,
  vaultName,
}) => {
  const {
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
  } = usePublicReaderInteractiveGraphController({
    graphData,
    publishedNotes,
    vaultName,
  });

  return (
    <TooltipProvider delayDuration={250}>
      <div
        ref={containerRef}
        className="relative w-full h-full min-h-0 overflow-hidden bg-background select-none flex flex-col"
      >
        {/* 1. TOP BAR: Search & Status Pill */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none gap-2">
          {/* Live Search Input */}
          <div className="pointer-events-auto relative w-64 sm:w-72 shadow-md rounded-xl">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari ide & catatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs bg-background/90 backdrop-blur-md border-border/80 rounded-xl"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Info Pill */}
          <div className="pointer-events-auto hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-md border border-border/80 text-xs text-muted-foreground shadow-sm">
            <Compass className="w-3.5 h-3.5 text-primary" />
            <span>{graphData.nodes.length} Catatan</span>
            <span className="opacity-40">â€¢</span>
            <span>{graphData.links.length} Relasi</span>
          </div>
        </div>

        {/* 2. FLOATING ACTION DOCK (Kanan Bawah) */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-col items-center gap-1.5 pointer-events-auto">
          <div className="flex flex-col items-center p-1 rounded-xl border border-border/80 bg-background/90 backdrop-blur-md shadow-lg space-y-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">Perbesar (+)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">Perkecil (-)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFitCamera}
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <Scan className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">Pusatkan Seluruh Graf</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleFullscreen}
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                {isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleExportSnapshot}
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">Unduh Gambar Snapshot (PNG)</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* 3. SETTINGS GEAR WIDGET (Kiri Bawah) */}
        <div className="absolute bottom-4 left-4 z-20 pointer-events-auto">
          <PublicGraphSettingsPopover
            config={localGraphConfig}
            onConfigChange={setLocalGraphConfig}
            currentLayout={currentLayout}
            onLayoutChange={setLayoutMode}
            onResetDefaults={handleResetDefaults}
            onFitCamera={handleFitCamera}
          />
        </div>

        {/* 4. SIDE PEEK / BOTTOM SHEET DRAWER */}
        <PublicNodePreviewDrawer
          selectedNode={selectedNode}
          activeNoteRecord={activeNoteRecord}
          allNotes={publishedNotes}
          graphLinks={graphData.links}
          onClose={() => setSelectedNode(null)}
          onNavigateToNode={handleTraverseToSlug}
          onReadFullArticle={onOpenArticle}
        />

        {/* 5. CANVAS CORE (Full Bleed) */}
        <div className="flex-1 w-full h-full min-h-0">
          <GraphCanvas
            ref={graphCanvasRef}
            graphData={enhancedGraphData}
            selectedNode={selectedNode}
            onNodeSelect={handleNodeSelect}
            onNodeOpen={handleNodeSelect}
            graphConfig={localGraphConfig}
            search={searchTerm}
            minDepth={0}
            maxDepth={10}
            contentFilter=""
            tagFilter=""
          />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PublicInteractiveGraph;
