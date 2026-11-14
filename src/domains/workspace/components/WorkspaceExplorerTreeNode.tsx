import React from "react";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { ChevronRight, ChevronDown } from "lucide-react";
import { ExplorerContextMenu } from "@/domains/workspace/components/WorkspaceExplorerContextMenu";
import {
  TREE_INDENT_WIDTH,
  WorkspaceTreeConnectorLines,
  getExplorerNodeIcon,
} from "@/domains/workspace/components/WorkspaceTreeConnectorLines";
import type {
  ExplorerNode,
  useWorkspaceFileExplorerController,
} from "@/domains/workspace/shared/hooks/useWorkspaceFileExplorerController";

type ExplorerController = ReturnType<typeof useWorkspaceFileExplorerController>;

interface WorkspaceExplorerTreeNodeProps {
  node: ExplorerNode;
  level?: number;
  isLastChild?: boolean;
  parentLines?: boolean[];
  siblingIndex?: number;
  targetSiblingIndex?: number;
  selectedNodeId: string | null;
  controller: ExplorerController;
  onNodeSelect: (node: ExplorerNode) => void;
  onNodeOpen?: (node: ExplorerNode) => void;
  onNodeDelete?: (nodeId: string) => Promise<void> | void;
}

/** Declarative recursive row component for rendering a single tree node and its expanded children. */
export const WorkspaceExplorerTreeNode: React.FC<
  WorkspaceExplorerTreeNodeProps
> = ({
  node,
  level = 0,
  isLastChild = true,
  parentLines = [],
  siblingIndex = 0,
  targetSiblingIndex = -1,
  selectedNodeId,
  controller,
  onNodeSelect,
  onNodeOpen,
  onNodeDelete,
}) => {
  const children = controller.getChildren(node.id);
  const hasChildren = children.length > 0;
  const isFolder = node.type === "folder";
  const isExpanded = controller.expandedFolders.has(node.id);
  const isDragOver = controller.dragOverNode === node.id;
  const isSelected = selectedNodeId === node.id;
  const activeChildIndex = children.findIndex((child) =>
    controller.selectedPathSet.has(child.id),
  );

  return (
    <div className="relative">
      <WorkspaceTreeConnectorLines
        level={level}
        parentLines={parentLines}
        isLastChild={isLastChild}
        hasChildren={hasChildren}
        siblingIndex={siblingIndex}
        targetSiblingIndex={targetSiblingIndex}
      />

      <ExplorerContextMenu
        node={node}
        onAddNodeUnder={controller.handleAddNodeUnder}
        onStartRename={controller.setRenamingNodeId}
        onDeleteNode={onNodeDelete}
        onOpenFile={controller.openFile}
        onPublishFolder={(targetNode) =>
          controller.setPublishingFolder(targetNode as ExplorerNode)
        }
      >
        <div
          className={cn(
            "relative group",
            isDragOver && isFolder && "bg-accent/30 rounded-md",
          )}
          draggable
          onDragStart={(e) => controller.handleDragStart(node, e)}
          onDragOver={(e) => controller.handleDragOver(node, e)}
          onDragLeave={controller.handleDragLeave}
          onDrop={(e) => controller.handleDrop(node, e)}
        >
          {/* Stem Vertikal dari Chevron Parent ke Anak-anak */}
          {isFolder && hasChildren && isExpanded && (
            <div
              className={cn(
                "absolute w-[1px] pointer-events-none transition-colors duration-150",
                activeChildIndex !== -1
                  ? "bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)] z-10"
                  : "bg-border/40",
              )}
              style={{
                left: `${level * TREE_INDENT_WIDTH + 14}px`,
                top: "20px",
                bottom: 0,
              }}
            />
          )}

          <div
            ref={(element) =>
              controller.registerItemRef(node.id, isSelected, element)
            }
            onMouseEnter={() => {
              if (controller.hoverSyncEnabled) {
                controller.setExplorerHoveredNodeId(node.id);
              }
            }}
            onMouseLeave={() => controller.clearExplorerHoveredNode(node.id)}
            onClick={() => {
              onNodeSelect(node);
              if (controller.focusSyncEnabled) {
                controller.requestGraphFocus(node.id);
              }
              if (isFolder && hasChildren) {
                controller.toggleFolder(node.id);
              }
            }}
            onDoubleClick={() => onNodeOpen?.(node)}
            className={cn(
              "w-full flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-md transition-colors cursor-pointer select-none",
              "hover:bg-accent/50",
              isSelected && "bg-accent/20",
            )}
            style={{
              paddingLeft: `${level * TREE_INDENT_WIDTH + 8}px`,
            }}
          >
            {isFolder && hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  controller.toggleFolder(node.id);
                }}
                className="w-4 h-4 flex items-center justify-center p-0.5 rounded hover:bg-accent shrink-0 text-muted-foreground hover:text-foreground z-10"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            ) : (
              <span className="w-4 h-4 shrink-0" />
            )}

            {getExplorerNodeIcon(node)}

            {controller.renamingNodeId === node.id ? (
              <input
                type="text"
                defaultValue={node.name}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    controller.handleRename(node, e.currentTarget.value);
                  } else if (e.key === "Escape") {
                    controller.setRenamingNodeId(null);
                  }
                }}
                onBlur={(e) =>
                  controller.handleRename(node, e.currentTarget.value)
                }
                className="h-5 flex-1 min-w-0 bg-background border border-primary/60 text-xs px-1.5 rounded text-foreground outline-none ring-1 ring-primary/40"
              />
            ) : (
              <div className="relative min-w-0 flex-1 flex items-center overflow-hidden">
                <span
                  className="truncate flex-1 text-left select-none text-xs leading-5"
                  style={{
                    maskImage:
                      "linear-gradient(to right, black calc(100% - 24px), transparent 100%)",
                    WebkitMaskImage:
                      "linear-gradient(to right, black calc(100% - 24px), transparent 100%)",
                  }}
                  title={node.name}
                >
                  {node.name}
                </span>
              </div>
            )}

            {node.tags.length > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] px-1 py-0 h-4 shrink-0 ml-auto"
              >
                {node.tags.length}
              </Badge>
            )}
          </div>
        </div>
      </ExplorerContextMenu>

      {hasChildren && isExpanded && (
        <div className="relative">
          {children.map((child, idx) => (
            <WorkspaceExplorerTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              isLastChild={idx === children.length - 1}
              parentLines={[...parentLines, !isLastChild]}
              siblingIndex={idx}
              targetSiblingIndex={activeChildIndex}
              selectedNodeId={selectedNodeId}
              controller={controller}
              onNodeSelect={onNodeSelect}
              onNodeOpen={onNodeOpen}
              onNodeDelete={onNodeDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
