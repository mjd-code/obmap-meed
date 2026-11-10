import React from 'react';
import { MetadataBacklinksView } from '@/domains/metadata/components/MetadataBacklinksView';
import { MetadataUnlinkedMentions } from '@/domains/metadata/components/MetadataUnlinkedMentions';
export { MetadataCache } from '@/domains/metadata/shared/api/MetadataCache';
export { useMetadataCache } from '@/domains/metadata/shared/hooks/useMetadataCache';

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
