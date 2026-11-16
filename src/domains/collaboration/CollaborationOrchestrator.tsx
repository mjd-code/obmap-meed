import React from 'react';
import { DocumentSharePopover } from '@/domains/collaboration/components/CollabDocumentSharePopover';
import { BulkPublishModal } from '@/domains/collaboration/components/CollabBulkPublishModal';
import type { ExplorerNode } from '@/domains/workspace/components/WorkspaceFileExplorerTree';

export interface CollaborationOrchestratorProps {
  noteId?: string;
  noteTitle?: string;
  currentContent?: string;
  onContentRestore?: (content: string) => void;
  bulkPublishOpen?: boolean;
  onBulkPublishOpenChange?: (open: boolean) => void;
  folderNode?: ExplorerNode | null;
  allNodes?: ExplorerNode[];
  currentVaultId?: string | null;
  selectedNodeIds?: string[];
}

/**
 * CollaborationOrchestrator: Entry point tunggal domain Kolaborasi & Publikasi
 */
export const CollaborationOrchestrator: React.FC<CollaborationOrchestratorProps> = (props) => {
  return (
    <div className="collaboration-orchestrator flex items-center gap-2">
      {props.noteId && props.onContentRestore && (
        <DocumentSharePopover noteId={props.noteId} noteTitle={props.noteTitle ?? ''} currentContent={props.currentContent ?? ''} onContentRestore={props.onContentRestore} />
      )}
      {props.onBulkPublishOpenChange && props.allNodes && (
        <BulkPublishModal open={props.bulkPublishOpen ?? false} onOpenChange={props.onBulkPublishOpenChange} folderNode={props.folderNode ?? null} allNodes={props.allNodes} currentVaultId={props.currentVaultId ?? null} selectedNodeIds={props.selectedNodeIds} />
      )}
    </div>
  );
};

export default CollaborationOrchestrator;
