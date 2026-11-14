import { cn } from "@/global/utils";
import { Button } from "@/global/ui/button";
import { ScrollArea } from "@/global/ui/scroll-area";
import {
  X,
  ChevronsUpDown,
  GripVertical,
  FolderPlus,
  FilePlus,
  SortAsc,
  Upload,
  Image as ImageIcon,
  FileText,
  Mic,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/global/ui/dropdown-menu";
import { FileExplorerTree } from "@/domains/workspace/components/WorkspaceFileExplorerTree";
import { VcsSidebarPanel } from "@/domains/vcs/components/VcsSidebarPanel";
import { WorkspaceSettingsNavList } from "@/domains/workspace/components/WorkspaceSettingsNavList";
import { WorkspaceSidebarVaultFooter } from "@/domains/workspace/components/WorkspaceSidebarVaultFooter";
import {
  SIDEBAR_PANEL_TITLES,
  useWorkspaceSidebarController,
  type SidebarPanelProps,
} from "@/domains/workspace/shared/hooks/useWorkspaceSidebarController";

/** Declarative view for the workspace sidebar panel supporting Files, VCS, and Settings tools. */
export function SidebarPanel({
  activeTool,
  onClose,
  nodes,
  selectedNode,
  onNodeSelect,
  onNodeOpen,
  onNodeMove,
  onNodeDelete,
  onNodeUpdate,
  onAddNode,
  isVaultMode,
  vaultName,
  currentVaultId,
  availableVaults,
  onSwitchVault,
  onImportComplete,
}: SidebarPanelProps) {
  const controller = useWorkspaceSidebarController({
    nodes,
    selectedNode,
    onNodeSelect,
    onNodeOpen,
    onImportComplete,
  });

  if (!activeTool) return null;

  return (
    <div
      ref={controller.panelRef}
      className={cn(
        "h-full bg-sidebar border-r border-sidebar-border flex flex-col relative",
        "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:shadow-2xl max-md:w-[280px] max-md:max-w-[85vw]",
        "animate-in slide-in-from-left-2 duration-200 ease-out",
      )}
      style={{
        width: window.innerWidth < 768 ? undefined : `${controller.width}px`,
      }}
    >
      {/* Panel Header */}
      <div className="h-8 px-3 flex items-center justify-between border-b border-sidebar-border shrink-0">
        <span className="text-sm font-medium text-sidebar-foreground">
          {SIDEBAR_PANEL_TITLES[activeTool]}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTool === "files" && (
          <div className="h-full flex flex-col">
            <div className="px-2 py-0.5 border-b border-sidebar-border flex items-center justify-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onAddNode?.("folder")}
                title="Add Folder"
              >
                <FolderPlus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onAddNode?.("file")}
                title="Add File"
              >
                <FilePlus className="w-4 h-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Upload Media / PDF"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => controller.triggerUpload("image/*")}>
                    <ImageIcon className="w-4 h-4 mr-2 text-emerald-500" />
                    Upload Image
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => controller.triggerUpload("audio/*")}>
                    <Mic className="w-4 h-4 mr-2 text-purple-500" />
                    Upload Sound / Voice
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => controller.triggerUpload(".pdf,application/pdf")}
                  >
                    <FileText className="w-4 h-4 mr-2 text-rose-500" />
                    Upload PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => controller.triggerUpload("image/*,audio/*,.pdf")}
                  >
                    <Upload className="w-4 h-4 mr-2 text-primary" />
                    Upload All Files...
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <input
                ref={controller.fileUploadInputRef}
                type="file"
                multiple
                accept={controller.uploadAcceptFilter}
                className="hidden"
                onChange={controller.handleFileUploadChange}
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Sort">
                    <SortAsc className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => controller.setSortBy("name")}>
                    Sort by Name {controller.sortBy === "name" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => controller.setSortBy("type")}>
                    Sort by Type {controller.sortBy === "type" && "✓"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={
                  controller.expandedFolders.size > 0
                    ? controller.collapseAll
                    : controller.expandAll
                }
                title={
                  controller.expandedFolders.size > 0
                    ? "Collapse All"
                    : "Expand All"
                }
              >
                <ChevronsUpDown className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <FileExplorerTree
                nodes={nodes}
                selectedNode={selectedNode}
                onNodeSelect={onNodeSelect}
                onNodeOpen={onNodeOpen}
                onNodeMove={onNodeMove}
                onNodeDelete={onNodeDelete}
                onNodeUpdate={onNodeUpdate}
                currentVaultId={currentVaultId}
                sortBy={controller.sortBy}
              />
            </ScrollArea>

            {isVaultMode && (
              <WorkspaceSidebarVaultFooter
                vaultName={vaultName}
                currentVaultId={currentVaultId}
                availableVaults={availableVaults}
                folderCount={controller.folderCount}
                fileCount={controller.fileCount}
                onSwitchVault={onSwitchVault}
                onOpenSettings={controller.handleOpenSettings}
              />
            )}
          </div>
        )}

        {activeTool === "vcs" && <VcsSidebarPanel />}

        {activeTool === "settings" && (
          <WorkspaceSettingsNavList
            settingsSearch={controller.settingsSearch}
            onSettingsSearchChange={controller.setSettingsSearch}
            activeSettingsSection={controller.activeSettingsSection}
            filteredSections={controller.filteredSections}
            onSelectSection={controller.selectSettingsSection}
          />
        )}
      </div>

      {/* Resize Handle */}
      <div
        className={cn(
          "absolute top-0 right-0 w-1 h-full cursor-col-resize group",
          "hover:bg-primary/50 transition-colors",
          controller.isResizing && "bg-primary/50",
        )}
        onMouseDown={controller.handleResizeStart}
      >
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>
      <div
        className="fixed inset-0 bg-background/60 backdrop-blur-xs z-[-1] md:hidden"
        onClick={onClose}
      />
    </div>
  );
}

// Wave 2 Dual Named Export Compatibility
export { SidebarPanel as WorkspaceSidebarPanel };
