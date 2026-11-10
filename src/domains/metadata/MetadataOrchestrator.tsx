import React from 'react';
import { MetadataBacklinksView } from './components/MetadataBacklinksView';
import { MetadataUnlinkedMentions } from './components/MetadataUnlinkedMentions';
export { MetadataCache } from './shared/api/MetadataCache';
export { useMetadataCache } from './shared/hooks/useMetadataCache';

export interface MetadataOrchestratorProps {
  currentNoteId?: string;
  view?: 'backlinks' | 'unlinked';
}

/**
 * MetadataOrchestrator: Entry point tunggal metadata, tautan & backlinks
 */
export const MetadataOrchestrator: React.FC<MetadataOrchestratorProps> = ({ view = 'backlinks' }) => {
  return (
    <div className="metadata-orchestrator p-4">
      {view === 'backlinks' ? <MetadataBacklinksView /> : <MetadataUnlinkedMentions />}
    </div>
  );
};

export default MetadataOrchestrator;
