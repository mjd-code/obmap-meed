import React, { useEffect, useState } from "react";
import {
  BrainCircuit,
  ChevronsUpDown,
  FilePlus,
  FolderPlus,
  FolderTree,
  GitCommitHorizontal,
  GripVertical,
  Layers,
  Network,
  PanelLeftClose,
  PanelRightClose,
  Pin,
  PinOff,
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
import { addNodeAction, deleteNodeAction, moveNodeAction, switchVaultAction, updateNodeAction } from "@/domains/workspace/shared/api/workspaceActions";
import { FileExplorerTree } from "@/domains/workspace/components/WorkspaceFileExplorerTree";
import { VcsSidebarPanel } from "@/domains/vcs/components/VcsSidebarPanel";
import { WorkspaceSettingsNavList } from "@/domains/workspace/components/WorkspaceSettingsNavList";
import { WorkspaceSidebarVaultFooter } from "@/domains/workspace/components/WorkspaceSidebarVaultFooter";
import { SIDEBAR_PANEL_TITLES, useWorkspaceSidebarController, type SidebarPanelProps } from "@/domains/workspace/shared/hooks/useWorkspaceSidebarController";
import { useWorkspaceStore } from "@/domains/workspace/shared/stores/useWorkspaceStore";
import { useNodeStore, useUIStore, useVaultStore } from "@/global/stores";
import { PROTOTYPE_VAULTS } from "../mockData";
import { QuickLensViewPopover, QuickSharePopover, type SubFunctionBindings } from "./EditorQuickSubFunctionPopovers";

interface DrawerExtraProps {
  pinned: boolean;
  onTogglePin: () => void;
  subFunctions: SubFunctionBindings;
}

function DrawerPanel({
  side, activeTool, onClose, pinned, onTogglePin, subFunctions, ...rest
}: SidebarPanelProps & DrawerExtraProps) {
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
  const footerVaults = (rest.availableVaults && rest.availableVaults.length > 0)
    ? rest.availableVaults
    : PROTOTYPE_VAULTS.slice(0, 5).map((v) => ({ id: v.id, name: v.title, location: "cloud" as const, nodeCount: v.notesCount }));

  const footerNode = (
    <WorkspaceSidebarVaultFooter
      vaultName={rest.vaultName ?? subFunctions.selectedVault.title}
      currentVaultId={rest.currentVaultId ?? subFunctions.selectedVault.id}
      availableVaults={footerVaults}
      folderCount={controller.folderCount}
      fileCount={controller.fileCount}
      onSwitchVault={(id) => (rest.availableVaults?.length ? rest.onSwitchVault?.(id) : undefined)}
      onOpenSettings={() => subFunctions.onOpenSettingsHub("vault_lenses")}
    />
  );

  return (
    <aside
      ref={controller.panelRef}
      aria-label={isRight ? "Right Drawer" : "Left Drawer"}
      className={cn(
        "absolute top-0 bottom-0 z-30 md:relative md:top-auto md:bottom-auto md:shrink-0 bg-sidebar flex flex-col w-[270px] max-w-[84vw] md:w-[var(--vk-sidebar-width)] shadow-xl md:shadow-none transition-all duration-200 ease-out",
        isRight
          ? "right-0 md:right-auto border-l border-sidebar-border animate-in slide-in-from-right-4 duration-200"
          : "left-0 md:left-auto border-r border-sidebar-border animate-in slide-in-from-left-4 duration-200"
      )}
      style={{ "--vk-sidebar-width": `${controller.width}px` } as React.CSSProperties}
    >
      <div className="h-10 px-2.5 flex items-center justify-between border-b border-sidebar-border shrink-0">
        {isRight ? (
          <>
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onClose} aria-label="Collapse right drawer">
                <PanelRightClose className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className={cn("h-7 w-7", pinned ? "text-primary bg-primary/12" : "text-muted-foreground hover:text-foreground")} onClick={onTogglePin} aria-label={pinned ? "Unpin right drawer" : "Pin right drawer"} title={pinned ? "Pinned (tidak auto-tutup)" : "Unpinned (tutup saat klik tengah)"}>
                {pinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <span className="vk-text-sm font-medium text-sidebar-foreground">{SIDEBAR_PANEL_TITLES[activeTool]}</span>
          </>
        ) : (
          <>
            <span className="vk-text-sm font-medium text-sidebar-foreground">{SIDEBAR_PANEL_TITLES[activeTool]}</span>
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className={cn("h-7 w-7", pinned ? "text-primary bg-primary/12" : "text-muted-foreground hover:text-foreground")} onClick={onTogglePin} aria-label={pinned ? "Unpin left drawer" : "Pin left drawer"} title={pinned ? "Pinned (tidak auto-tutup)" : "Unpinned (tutup saat klik tengah)"}>
                {pinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onClose} aria-label="Collapse left drawer">
                <PanelLeftClose className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {activeTool === "files" && (
          <>
            <div className="px-2 py-1.5 border-b border-sidebar-border flex items-center justify-between gap-0.5 shrink-0">
              <div className="flex items-center gap-0.5">
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
              <div className="flex items-center gap-0.5 border-l border-sidebar-border pl-1">
                <QuickSharePopover bindings={subFunctions} compact />
                <QuickLensViewPopover bindings={subFunctions} compact />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <FileExplorerTree nodes={rest.nodes ?? []} selectedNode={rest.selectedNode ?? null} onNodeSelect={rest.onNodeSelect ?? (() => {})} onNodeOpen={rest.onNodeOpen} onNodeMove={rest.onNodeMove} onNodeDelete={rest.onNodeDelete} onNodeUpdate={rest.onNodeUpdate} currentVaultId={rest.currentVaultId ?? null} sortBy={controller.sortBy} />
            </ScrollArea>
            {footerNode}
          </>
        )}

        {activeTool === "vcs" && (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-hidden"><VcsSidebarPanel /></div>
            {footerNode}
          </div>
        )}

        {activeTool === "settings" && (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-hidden">
              <WorkspaceSettingsNavList
                settingsSearch={controller.settingsSearch}
                onSettingsSearchChange={controller.setSettingsSearch}
                activeSettingsSection={controller.activeSettingsSection}
                filteredSections={controller.filteredSections}
                onSelectSection={(sec) => {
                  subFunctions.onOpenSettingsHub(sec === "account" ? "account_app" : "vault_lenses");
                  if (!pinned) onClose();
                }}
              />
            </div>
            {footerNode}
          </div>
        )}
      </div>

      <div className={cn("hidden md:block absolute top-0 w-1 h-full cursor-col-resize group hover:bg-primary/50", isRight ? "left-0" : "right-0")} onMouseDown={controller.handleResizeStart}>
        <div className={cn("absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100", isRight ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2")}><GripVertical className="w-3 h-3 text-muted-foreground" /></div>
      </div>
    </aside>
  );
}

export function PrototypeWorkspaceDrawers({
  leftSidebarPinned,
  rightSidebarPinned,
  onToggleLeftPin,
  onToggleRightPin,
  subFunctions,
  centerCanvas,
}: {
  leftSidebarPinned: boolean;
  rightSidebarPinned: boolean;
  onToggleLeftPin: () => void;
  onToggleRightPin: () => void;
  subFunctions: SubFunctionBindings;
  centerCanvas: React.ReactNode;
}) {
  const activeTool = useUIStore((s) => s.activeTool);
  const rightSidebarOpen = useUIStore((s) => s.rightSidebarOpen);
  const setActiveTool = useUIStore((s) => s.setActiveTool);
  const setRightSidebarOpen = useUIStore((s) => s.setRightSidebarOpen);
  const openView = useWorkspaceStore((s) => s.openView);
  const isHelicopterActive = useWorkspaceStore((s) => s.getActiveLeaf()?.view.nodeId === "__helicopter_explorer__");
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

  useEffect(() => {
    if (!leftTool && !rightSidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!leftSidebarPinned) setActiveTool(null);
        if (!rightSidebarPinned) setRightSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [leftSidebarPinned, leftTool, rightSidebarOpen, rightSidebarPinned, setActiveTool, setRightSidebarOpen]);

  const handleCenterCanvasInteraction = () => {
    if (leftTool && !leftSidebarPinned) setActiveTool(null);
    if (rightSidebarOpen && !rightSidebarPinned) setRightSidebarOpen(false);
  };

  const availableVaults = vaultManager.getAllVaults().filter((v) => authorizedVaultIds === null || authorizedVaultIds.has(v.id)).map((v) => ({ id: v.id, name: v.name, location: v.location, nodeCount: v.graphService.getGraphData().nodes.length }));

  return (
    <>
      <div className="hidden md:flex w-9 h-full bg-sidebar/80 border-r border-sidebar-border flex-col items-center py-2 shrink-0 select-none z-30">
        <div className="flex flex-col items-center gap-1.5 w-full px-1">
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => setActiveTool(leftTool === "files" ? null : "files")} className={cn("w-7 h-7", leftTool === "files" && "bg-sidebar-accent text-primary")} aria-label="File Explorer"><FolderTree className="w-3.5 h-3.5" /></Button></TooltipTrigger><TooltipContent side="right">File Explorer</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => setActiveTool(leftTool === "vcs" ? null : "vcs")} className={cn("w-7 h-7", leftTool === "vcs" && "bg-sidebar-accent text-primary")} aria-label="Version Control"><GitCommitHorizontal className="w-3.5 h-3.5" /></Button></TooltipTrigger><TooltipContent side="right">Version Control</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => openGraphCanvas("graph")} className="w-7 h-7" aria-label="Open Graph"><Network className="w-3.5 h-3.5" /></Button></TooltipTrigger><TooltipContent side="right">Graph View</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => openGraphCanvas("mindmap")} className="w-7 h-7" aria-label="Open Mindmap"><BrainCircuit className="w-3.5 h-3.5" /></Button></TooltipTrigger><TooltipContent side="right">Mindmap View</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => subFunctions.onOpenHelicopterView(subFunctions.helicopterView)} className={cn("w-7 h-7", isHelicopterActive && "bg-sidebar-accent text-primary")} aria-label="Helicopter Explorer Tab"><Layers className="w-3.5 h-3.5" /></Button></TooltipTrigger><TooltipContent side="right">Helicopter & Lenses (Tab)</TooltipContent></Tooltip>
        </div>
      </div>

      {leftTool && (
        <DrawerPanel
          side="left" activeTool={leftTool} pinned={leftSidebarPinned} onTogglePin={onToggleLeftPin}
          subFunctions={subFunctions} onClose={() => setActiveTool(null)}
          nodes={nodes} selectedNode={selectedNode} onNodeSelect={setSelectedNode}
          onNodeOpen={(n) => { setSelectedNode(n); openView({ type: "markdown", nodeId: n.id, title: n.name }); if (!leftSidebarPinned) setActiveTool(null); }}
          onNodeMove={(id, parentId) => moveNodeAction(id, parentId)}
          onNodeDelete={(id) => deleteNodeAction(id, isAuthenticated)}
          onNodeUpdate={(n) => updateNodeAction(n, isAuthenticated)}
          onAddNode={(type) => addNodeAction(type)}
          isVaultMode={!!currentVaultId} vaultName={vault?.name ?? null} currentVaultId={currentVaultId}
          availableVaults={availableVaults} onSwitchVault={(id) => switchVaultAction(id)}
        />
      )}

      {/* Center Canvas: NO Blur Overlay; Unpinned sidebars auto-close cleanly on click inside */}
      <div onMouseDownCapture={handleCenterCanvasInteraction} className="relative flex-1 min-w-0 h-full min-h-0 overflow-hidden">
        <div className="relative z-10 isolate w-full h-full overflow-hidden">
          {centerCanvas}
        </div>
      </div>

      {rightSidebarOpen && (
        <DrawerPanel
          side="right" activeTool="settings" pinned={rightSidebarPinned} onTogglePin={onToggleRightPin}
          subFunctions={subFunctions} onClose={() => setRightSidebarOpen(false)}
          vaultName={vault?.name ?? null} currentVaultId={currentVaultId}
          availableVaults={availableVaults} onSwitchVault={(id) => switchVaultAction(id)}
        />
      )}
    </>
  );
}
