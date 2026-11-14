import React from "react";
import { BulkPublishModal } from "@/domains/collaboration/components/CollabBulkPublishModal";
import { WorkspaceExplorerTreeNode } from "@/domains/workspace/components/WorkspaceExplorerTreeNode";
import {
  useWorkspaceFileExplorerController,
  type ExplorerNode,
  type FileExplorerTreeProps,
} from "@/domains/workspace/shared/hooks/useWorkspaceFileExplorerController";

export type { ExplorerNode, FileExplorerTreeProps };

/** Declarative view for the workspace hierarchical file explorer tree. */
export const FileExplorerTree: React.FC<FileExplorerTreeProps> = ({
  nodes,
  selectedNode,
  onNodeSelect,
  onNodeOpen,
  onNodeMove,
  onNodeDelete,
  onNodeUpdate,
  currentVaultId,
  sortBy = "type",
}) => {
  const controller = useWorkspaceFileExplorerController({
    nodes,
    selectedNode,
    onNodeSelect,
    onNodeMove,
    onNodeUpdate,
    currentVaultId,
    sortBy,
  });

  return (
    <div
      className="p-2 min-h-full"
      onDragOver={(e) => {
        e.preventDefault();
        if (controller.draggedNode) e.dataTransfer.dropEffect = "move";
      }}
      onDrop={controller.handleDropOnRoot}
    >
      {nodes.length > 0 ? (
        controller.rootNodes.map((node, idx) => (
          <WorkspaceExplorerTreeNode
            key={node.id}
            node={node}
            level={0}
            isLastChild={idx === controller.rootNodes.length - 1}
            parentLines={[]}
            siblingIndex={idx}
            targetSiblingIndex={controller.rootActiveIndex}
            selectedNodeId={selectedNode?.id ?? null}
            controller={controller}
            onNodeSelect={onNodeSelect}
            onNodeOpen={onNodeOpen}
            onNodeDelete={onNodeDelete}
          />
        ))
      ) : (
        <div className="text-center py-6 text-muted-foreground text-xs">
          No files yet. Import or create your first node.
        </div>
      )}

      {/* RENDER MODAL TEPAT SATU KALI DI ROOT LEVEL */}
      <BulkPublishModal
        open={!!controller.publishingFolder}
        onOpenChange={(isOpen) => {
          if (!isOpen) controller.setPublishingFolder(null);
        }}
        folderNode={controller.publishingFolder}
        allNodes={nodes}
        currentVaultId={currentVaultId}
      />
    </div>
  );
};

// Wave 2 Dual Named Export Compatibility
export { FileExplorerTree as WorkspaceFileExplorerTree };
