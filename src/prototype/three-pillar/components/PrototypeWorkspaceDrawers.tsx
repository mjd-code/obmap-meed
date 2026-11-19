import React, { useEffect, useState } from "react";
import {
  BrainCircuit,
  ChevronsUpDown,
  FilePlus,
  FolderPlus,
  FolderTree,
  GitCommitHorizontal,
  GripVertical,
  Network,
  PanelLeftClose,
  PanelRightClose,
  Rocket,
  Settings2,
  SortAsc,
} from "lucide-react";
import { cn } from "@/global/utils";
import { Button } from "@/global/ui/button";
import { ScrollArea } from "@/global/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/global/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/global/ui/dropdown-menu";
import { useAuth } from "@/domains/auth/shared/hooks/useAuth";
import { supabase } from "@/global/api/supabaseClient";
import { getVaultManager } from "@/domains/vault/shared/api/VaultManagerSingleton";
import { openGraphCanvas } from "@/domains/workspace/shared/api/graphCanvasCommands";
import { addNodeAction, closeVaultAction, deleteNodeAction, moveNodeAction, switchVaultAction, updateNodeAction } from "@/domains/workspace/shared/api/workspaceActions";
import { FileExplorerTree } from "@/domains/workspace/components/WorkspaceFileExplorerTree";
import { VcsSidebarPanel } from "@/domains/vcs/components/VcsSidebarPanel";
import { WorkspaceSettingsNavList } from "@/domains/workspace/components/WorkspaceSettingsNavList";
import { WorkspaceSidebarVaultFooter } from "@/domains/workspace/components/WorkspaceSidebarVaultFooter";
import { SIDEBAR_PANEL_TITLES, useWorkspaceSidebarController, type SidebarPanelProps } from "@/domains/workspace/shared/hooks/useWorkspaceSidebarController";
import { useWorkspaceStore } from "@/domains/workspace/shared/stores/useWorkspaceStore";
import { useNodeStore, useUIStore, useVaultStore } from "@/global/stores";

function DrawerPanel({ side, activeTool, onClose, ...rest }: SidebarPanelProps) {
  const controller = useWorkspaceSidebarController({
    side,
    nodes: rest.nodes ?? [],
    selectedNode: rest.selectedNode ?? null,
    onNodeSelect: rest.onNodeSelect ?? (() => {}),
    onNodeOpen: rest.onNodeOpen,
    onImportComplete: rest.onImportComplete,
  });
  if (!activeTool) return null;
  const isRight = side === "right";
  return (
    <aside
      ref={controller.panelRef}
      aria-label={isRight ? "Settings Drawer" : "Workspace Drawer"}
      className={cn(
        "absolute top-0 bottom-0 z-30 md:relative md:top-auto md:bottom-auto md:shrink-0 bg-sidebar flex flex-col w-[265px] max-w-[82vw] md:w-[var(--vk-sidebar-width)] shadow-2xl md:shadow-none",
        isRight
          ? "right-0 md:right-auto border-l border-sidebar-border animate-in slide-in-from-right-4 duration-200"
          : "left-0 md:left-auto border-r border-sidebar-border animate-in slide-in-from-left-4 duration-200"
      )}
      style={{ "--vk-sidebar-width": `${controller.width}px` } as React.CSSProperties}
    >
      <div className="h-10 px-3 flex items-center justify-between border-b border-sidebar-border shrink-0">
        {isRight ? (
          <>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onClose} aria-label="Collapse right drawer">
              <PanelRightClose className="w-4 h-4" />
            </Button>
            <span className="vk-text-sm font-medium text-sidebar-foreground">{SIDEBAR_PANEL_TITLES[activeTool]}</span>
          </>
        ) : (
          <>
            <span className="vk-text-sm font-medium text-sidebar-foreground">{SIDEBAR_PANEL_TITLES[activeTool]}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onClose} aria-label="Collapse left drawer">
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTool === "files" && (
          <div className="h-full flex flex-col">
            <div className="px-2 py-1.5 border-b border-sidebar-border flex items-center justify-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => rest.onAddNode?.("folder")} title="Add Folder"><FolderPlus className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => rest.onAddNode?.("file")} title="Add File"><FilePlus className="w-4 h-4" /></Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" title="Sort"><SortAsc className="w-4 h-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => controller.setSortBy("name")}>Sort by Name {controller.sortBy === "name" && "✓"}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => controller.setSortBy("type")}>Sort by Type {controller.sortBy === "type" && "✓"}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={controller.expandedFolders.size > 0 ? controller.collapseAll : controller.expandAll} title="Expand / Collapse"><ChevronsUpDown className="w-4 h-4" /></Button>
            </div>
            <ScrollArea className="flex-1">
              <FileExplorerTree nodes={rest.nodes ?? []} selectedNode={rest.selectedNode ?? null} onNodeSelect={rest.onNodeSelect ?? (() => {})} onNodeOpen={rest.onNodeOpen} onNodeMove={rest.onNodeMove} onNodeDelete={rest.onNodeDelete} onNodeUpdate={rest.onNodeUpdate} currentVaultId={rest.currentVaultId ?? null} sortBy={controller.sortBy} />
            </ScrollArea>
            {rest.isVaultMode && (
              <WorkspaceSidebarVaultFooter vaultName={rest.vaultName ?? null} currentVaultId={rest.currentVaultId ?? null} availableVaults={rest.availableVaults ?? []} folderCount={controller.folderCount} fileCount={controller.fileCount} onSwitchVault={rest.onSwitchVault ?? (() => {})} onOpenSettings={controller.handleOpenSettings} />
            )}
          </div>
        )}
        {activeTool === "vcs" && <VcsSidebarPanel />}
        {activeTool === "settings" && (
          <WorkspaceSettingsNavList settingsSearch={controller.settingsSearch} onSettingsSearchChange={controller.setSettingsSearch} activeSettingsSection={controller.activeSettingsSection} filteredSections={controller.filteredSections} onSelectSection={controller.selectSettingsSection} />
        )}
      </div>
      <div className={cn("hidden md:block absolute top-0 w-1 h-full cursor-col-resize group hover:bg-primary/50", isRight ? "left-0" : "right-0")} onMouseDown={controller.handleResizeStart}>
        <div className={cn("absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100", isRight ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2")}><GripVertical className="w-3 h-3 text-muted-foreground" /></div>
      </div>
    </aside>
  );
}

export function PrototypeWorkspaceDrawers({
  onOpenPublishTab,
  centerCanvas,
}: {
  onOpenPublishTab: () => void;
  centerCanvas: React.ReactNode;
}) {
  const activeTool = useUIStore((s) => s.activeTool);
  const rightSidebarOpen = useUIStore((s) => s.rightSidebarOpen);
  const setActiveTool = useUIStore((s) => s.setActiveTool);
  const setRightSidebarOpen = useUIStore((s) => s.setRightSidebarOpen);
  const openView = useWorkspaceStore((s) => s.openView);
  const isPublishTabActive = useWorkspaceStore((s) => s.getActiveLeaf()?.view.nodeId === "__publish_studio__");
  const { user, session } = useAuth();
  const isAuthenticated = !!user && !!session;
  const nodes = useNodeStore((s) => s.nodes);
  const selectedNode = useNodeStore((s) => s.selectedNode);
  const setSelectedNode = useNodeStore((s) => s.setSelectedNode);
  const currentVaultId = useVaultStore((s) => s.currentVaultId);
  const vaultManager = getVaultManager();
  const vault = currentVaultId ? vaultManager.getVault(currentVaultId) : null;
  const [authorizedVaultIds, setAuthorizedVaultIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    let active = true;
    async function loadAuthVaults() {
      if (!user) { setAuthorizedVaultIds(new Set()); return; }
      const { data: superadmin } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "superadmin").maybeSingle();
      if (superadmin) { if (active) setAuthorizedVaultIds(null); return; }
      const [own, member] = await Promise.all([supabase.from("user_vaults").select("id").eq("user_id", user.id), supabase.from("vault_members").select("vault_id").eq("user_id", user.id)]);
      if (!active) return;
      setAuthorizedVaultIds(new Set([...(own.data || []).map((v) => v.id), ...(member.data || []).map((m) => m.vault_id)]));
    }
    void loadAuthVaults();
    return () => { active = false; };
  }, [user]);

  const leftTool = activeTool === "files" || activeTool === "vcs" ? activeTool : null;
  const hasOpenDrawer = Boolean(leftTool || rightSidebarOpen);
  const closeAllDrawers = () => { setActiveTool(null); setRightSidebarOpen(false); };

  useEffect(() => {
    if (!hasOpenDrawer) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") { setActiveTool(null); setRightSidebarOpen(false); } };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasOpenDrawer, setActiveTool, setRightSidebarOpen]);

  const availableVaults = vaultManager.getAllVaults().filter((v) => authorizedVaultIds === null || authorizedVaultIds.has(v.id)).map((v) => ({ id: v.id, name: v.name, location: v.location, nodeCount: v.graphService.getGraphData().nodes.length }));

  return (
    <>
      <div className="hidden md:flex w-9 h-full bg-sidebar/80 border-r border-sidebar-border flex-col items-center py-2 shrink-0 select-none z-30">
        <div className="flex flex-col items-center gap-1.5 w-full px-1">
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => setActiveTool(leftTool === "files" ? null : "files")} className={cn("w-7 h-7", leftTool === "files" && "bg-sidebar-accent text-primary")} aria-label="File Explorer"><FolderTree className="w-3.5 h-3.5" /></Button></TooltipTrigger><TooltipContent side="right">File Explorer</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => setActiveTool(leftTool === "vcs" ? null : "vcs")} className={cn("w-7 h-7", leftTool === "vcs" && "bg-sidebar-accent text-primary")} aria-label="Version Control"><GitCommitHorizontal className="w-3.5 h-3.5" /></Button></TooltipTrigger><TooltipContent side="right">Version Control</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => openGraphCanvas("graph")} className="w-7 h-7" aria-label="Open Graph"><Network className="w-3.5 h-3.5" /></Button></TooltipTrigger><TooltipContent side="right">Graph View</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => openGraphCanvas("mindmap")} className="w-7 h-7" aria-label="Open Mindmap"><BrainCircuit className="w-3.5 h-3.5" /></Button></TooltipTrigger><TooltipContent side="right">Mindmap View</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={onOpenPublishTab} className={cn("w-7 h-7", isPublishTabActive && "bg-sidebar-accent text-primary")} aria-label="Publish Studio Tab"><Rocket className="w-3.5 h-3.5" /></Button></TooltipTrigger><TooltipContent side="right">Publish Studio (Tab)</TooltipContent></Tooltip>
        </div>
        <div className="flex-1" />
        <div className="flex flex-col items-center w-full px-1">
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => setRightSidebarOpen(!rightSidebarOpen)} className={cn("w-7 h-7", rightSidebarOpen && "bg-sidebar-accent text-primary")} aria-label="Settings"><Settings2 className="w-3.5 h-3.5" /></Button></TooltipTrigger><TooltipContent side="right">Settings Drawer</TooltipContent></Tooltip>
        </div>
      </div>

      {leftTool && (
        <DrawerPanel
          side="left"
          activeTool={leftTool}
          onClose={() => setActiveTool(null)}
          nodes={nodes}
          selectedNode={selectedNode}
          onNodeSelect={setSelectedNode}
          onNodeOpen={(n) => { setSelectedNode(n); openView({ type: "markdown", nodeId: n.id, title: n.name }); setActiveTool(null); }}
          onNodeMove={(id, parentId) => moveNodeAction(id, parentId)}
          onNodeDelete={(id) => deleteNodeAction(id, isAuthenticated)}
          onNodeUpdate={(n) => updateNodeAction(n, isAuthenticated)}
          onAddNode={(type) => addNodeAction(type)}
          isVaultMode={!!currentVaultId}
          vaultName={vault?.name ?? null}
          vaultLocation={vault?.location}
          currentVaultId={currentVaultId}
          availableVaults={availableVaults}
          onSwitchVault={(id) => switchVaultAction(id)}
          onCloseVault={() => closeVaultAction()}
        />
      )}

      {/* Center Canvas Isolated Stacking Context: GraphFloatingDock & GraphCanvasUtilityDock stay strictly inside this relative container! */}
      <div className="relative flex-1 min-w-0 h-full min-h-0 overflow-hidden">
        <div className="relative z-10 isolate w-full h-full overflow-hidden">
          {centerCanvas}
        </div>
        {hasOpenDrawer && (
          <div onClick={closeAllDrawers} className="absolute inset-0 z-20 bg-background/25 backdrop-blur-[1px]" aria-label="Tutup drawer" />
        )}
      </div>

      {rightSidebarOpen && <DrawerPanel side="right" activeTool="settings" onClose={() => setRightSidebarOpen(false)} />}
    </>
  );
}
