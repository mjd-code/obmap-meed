import React from 'react';
import { CollabDocumentSharePopover } from '@/domains/collaboration/components/CollabDocumentSharePopover';
import { CollabBulkPublishModal } from '@/domains/collaboration/components/CollabBulkPublishModal';

export interface CollaborationOrchestratorProps {
  noteId?: string;
}

/**
 * CollaborationOrchestrator: Entry point tunggal domain Kolaborasi & Publikasi
 */
export const CollaborationOrchestrator: React.FC<CollaborationOrchestratorProps> = () => {
  return (
    <div className="collaboration-orchestrator flex items-center gap-2">
      <CollabDocumentSharePopover />
    </div>
  );
};

export default CollaborationOrchestrator;
