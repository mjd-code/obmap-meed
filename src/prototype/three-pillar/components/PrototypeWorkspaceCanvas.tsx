import React, { Fragment, useState } from "react";
import { PanelLeft, PanelRight, Pin, Plus, SplitSquareHorizontal, SplitSquareVertical, X } from "lucide-react";
import { cn } from "@/global/utils";
import { Button } from "@/global/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/global/ui/resizable";
import { LeafView } from "@/domains/workspace/components/WorkspaceViewRegistry";
import { TabContextMenu } from "@/domains/workspace/components/WorkspaceTabContextMenu";
import { useWorkspaceStore } from "@/domains/workspace/shared/stores/useWorkspaceStore";
import type { WorkspaceGroup as WorkspaceGroupType, WorkspaceNode } from "@/domains/workspace/shared/utils/workspace.types";
import { useUIStore } from "@/global/stores";
import { EditorHelicopterPanel, type HelicopterExplorerBindings } from "./EditorHelicopterPanel";
import { QuickLensViewPopover, QuickSharePopover, type SubFunctionBindings } from "./EditorQuickSubFunctionPopovers";
import { PrototypeSettingsHub, type AdaptiveSettingsHubProps } from "./PrototypeSettingsHub";

const DRAG_KEY = "application/x-workspace-leaf";
type Edge = "left" | "right" | "top" | "bottom" | null;

export type WorkspaceCanvasSettingsProps = Omit<AdaptiveSettingsHubProps, "mode" | "onBackOrClose">;

function PrototypeGroupPane({
  group,
  isActive,
  settingsHubProps,
  helicopterProps,
  subFunctions,
}: {
  group: WorkspaceGroupType;
  isActive: boolean;
  settingsHubProps: WorkspaceCanvasSettingsProps;
  helicopterProps: HelicopterExplorerBindings;
  subFunctions: SubFunctionBindings;
}) {
  const { setActiveLeaf, setActiveGroup, closeLeaf, splitGroup, moveLeaf, moveLeafToNewSplit, openView } =
    useWorkspaceStore();
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [edge, setEdge] = useState<Edge>(null);
  const isLeftOpen = useUIStore((s) => s.activeTool === "files" || s.activeTool === "vcs");
  const rightOpen = useUIStore((s) => s.rightSidebarOpen);
  const activeLeaf = group.leaves.find((l) => l.id === group.activeLeafId) ?? group.leaves[0] ?? null;

  const readLeafId = (e: React.DragEvent) => e.dataTransfer.getData(DRAG_KEY) || e.dataTransfer.getData("text/plain");
  const edgeFromEvent = (e: React.DragEvent<HTMLDivElement>): Edge => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    return x < 0.2 ? "left" : x > 0.8 ? "right" : y < 0.2 ? "top" : y > 0.8 ? "bottom" : null;
  };

  return (
    <div
      className={cn("flex flex-col min-w-0 min-h-0 h-full bg-background", isActive && "ring-1 ring-inset ring-sidebar-ring/30")}
      onMouseDown={() => !isActive && setActiveGroup(group.id)}
    >
      <div className="h-10 flex items-stretch border-t lg:border-t-0 lg:border-b border-border bg-muted/30 shrink-0 select-none order-2 lg:order-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => useUIStore.getState().setActiveTool(isLeftOpen ? null : "files")}
          className={cn("h-10 w-10 rounded-none border-r border-border shrink-0 text-muted-foreground md:hidden", isLeftOpen && "bg-accent/60 text-primary")}
          aria-label="Toggle Left Drawer"
        >
          <PanelLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1 flex items-stretch min-w-0 overflow-x-auto no-scrollbar">
          {group.leaves.map((leaf, index) => {
            const isTabActive = leaf.id === activeLeaf?.id;
            return (
              <TabContextMenu key={leaf.id} leaf={leaf} group={group} index={index}>
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DRAG_KEY, leaf.id);
                    e.dataTransfer.setData("text/plain", leaf.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropIndex(index);
                  }}
                  onDragLeave={() => setDropIndex((i) => (i === index ? null : i))}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const id = readLeafId(e);
                    setDropIndex(null);
                    if (id) moveLeaf(id, group.id, index);
                  }}
                  onClick={() => setActiveLeaf(group.id, leaf.id)}
                  className={cn(
                    "group relative flex items-center gap-2 px-3 vk-text-xs cursor-pointer select-none whitespace-nowrap border-r border-border shrink-0 transition-colors",
                    isTabActive ? "bg-background text-foreground font-medium" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                    dropIndex === index && "border-l-2 border-l-primary"
                  )}
                >
                  {leaf.pinned && <Pin className="w-3 h-3 shrink-0 text-primary rotate-45" />}
                  <span className="truncate max-w-[11rem]">{leaf.view.title}</span>
                  {!leaf.pinned && (
                    <button
                      aria-label={`Close ${leaf.view.title}`}
                      className={cn("hover:text-foreground p-0.5 rounded transition-opacity", isTabActive ? "opacity-80" : "opacity-0 group-hover:opacity-100")}
                      onClick={(e) => {
                        e.stopPropagation();
                        closeLeaf(leaf.id);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </TabContextMenu>
            );
          })}
          <div
            className="flex-1 min-w-6"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = readLeafId(e);
              if (id) moveLeaf(id, group.id);
            }}
          />
        </div>

        {/* Inline Tab Bar Sub-Function Popovers + Split/New Tab */}
        <div className="flex items-center gap-0.5 px-1 shrink-0 border-l border-border bg-muted/30">
          <QuickSharePopover
            bindings={{
              ...subFunctions,
              activeNodeTitle: activeLeaf?.view.title || subFunctions.activeNodeTitle,
            }}
          />
          <QuickLensViewPopover bindings={subFunctions} />
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" aria-label="New tab" onClick={() => { setActiveGroup(group.id); openView({ type: "empty", title: "New tab" }); }}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden md:inline-flex h-7 w-7 text-muted-foreground" aria-label="Split right" onClick={() => splitGroup(group.id, "horizontal")}>
            <SplitSquareHorizontal className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden md:inline-flex h-7 w-7 text-muted-foreground" aria-label="Split down" onClick={() => splitGroup(group.id, "vertical")}>
            <SplitSquareVertical className="w-3.5 h-3.5" />
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => useUIStore.getState().toggleRightSidebar()}
          className={cn("h-10 w-10 rounded-none border-l border-border shrink-0 text-muted-foreground md:hidden", rightOpen && "bg-accent/60 text-primary")}
          aria-label="Toggle Right Drawer"
        >
          <PanelRight className="w-4 h-4" />
        </Button>
      </div>

      <div
        className="relative flex-1 min-h-0 overflow-hidden order-1 lg:order-2"
        onDragOver={(e) => { e.preventDefault(); setEdge(edgeFromEvent(e)); }}
        onDragLeave={() => setEdge(null)}
        onDrop={(e) => {
          e.preventDefault();
          const id = readLeafId(e);
          const where = edgeFromEvent(e);
          setEdge(null);
          if (!id) return;
          if (!where) { moveLeaf(id, group.id); return; }
          moveLeafToNewSplit(id, group.id, where === "left" || where === "right" ? "horizontal" : "vertical", where === "left" || where === "top");
        }}
      >
        {group.leaves.map((leaf) => {
          const isTabActive = leaf.id === activeLeaf?.id;
          const isSettingsLeaf =
            leaf.view.nodeId === "__settings_hub__" ||
            leaf.view.nodeId === "__publish_studio__" ||
            leaf.view.type === "settings";
          const isHelicopterLeaf = leaf.view.nodeId === "__helicopter_explorer__";

          return (
            <div key={leaf.id} className={cn("w-full h-full min-h-0", !isTabActive && "hidden")} aria-hidden={!isTabActive}>
              {isSettingsLeaf ? (
                <PrototypeSettingsHub
                  mode="workspace_tab"
                  {...settingsHubProps}
                  onBackOrClose={() => closeLeaf(leaf.id)}
                />
              ) : isHelicopterLeaf ? (
                <EditorHelicopterPanel {...helicopterProps} />
              ) : (
                <LeafView leaf={leaf} isActive={isTabActive} />
              )}
            </div>
          );
        })}
        {edge && <div className={cn("pointer-events-none absolute bg-primary/20 border border-primary", edge === "left" && "left-0 top-0 bottom-0 w-1/2", edge === "right" && "right-0 top-0 bottom-0 w-1/2", edge === "top" && "left-0 top-0 right-0 h-1/2", edge === "bottom" && "left-0 bottom-0 right-0 h-1/2")} />}
      </div>
    </div>
  );
}

export function PrototypeWorkspaceCanvas({
  node,
  settingsHubProps,
  helicopterProps,
  subFunctions,
}: {
  node: WorkspaceNode;
  settingsHubProps: WorkspaceCanvasSettingsProps;
  helicopterProps: HelicopterExplorerBindings;
  subFunctions: SubFunctionBindings;
}) {
  const activeGroupId = useWorkspaceStore((s) => s.activeGroupId);
  const setSizes = useWorkspaceStore((s) => s.setSizes);

  if (node.kind === "group") {
    return (
      <PrototypeGroupPane
        group={node}
        isActive={node.id === activeGroupId}
        settingsHubProps={settingsHubProps}
        helicopterProps={helicopterProps}
        subFunctions={subFunctions}
      />
    );
  }
  return (
    <ResizablePanelGroup direction={node.direction} onLayout={(sizes) => setSizes(node.id, sizes)}>
      {node.children.map((child, idx) => (
        <Fragment key={child.id}>
          {idx > 0 && <ResizableHandle withHandle />}
          <ResizablePanel defaultSize={node.sizes[idx] ?? 100 / node.children.length} minSize={15}>
            <PrototypeWorkspaceCanvas
              node={child}
              settingsHubProps={settingsHubProps}
              helicopterProps={helicopterProps}
              subFunctions={subFunctions}
            />
          </ResizablePanel>
        </Fragment>
      ))}
    </ResizablePanelGroup>
  );
}
