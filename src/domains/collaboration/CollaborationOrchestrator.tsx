import React from 'react';
import { CollabDocumentSharePopover } from './components/CollabDocumentSharePopover';
import { CollabBulkPublishModal } from './components/CollabBulkPublishModal';

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
