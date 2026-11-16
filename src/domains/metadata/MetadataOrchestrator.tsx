import React from 'react';
import { BacklinksView } from '@/domains/metadata/components/MetadataBacklinksView';
import { UnlinkedMentions } from '@/domains/metadata/components/MetadataUnlinkedMentions';
import type { Node } from '@/domains/graph/shared/utils/graph.types';
export { metadataCache as MetadataCache } from '@/domains/metadata/shared/api/MetadataCache';
export { useMetadataVersion, useIndexedNodes } from '@/domains/metadata/shared/hooks/useMetadataCache';

export interface MetadataOrchestratorProps {
  currentNoteId?: string;
  view?: 'backlinks' | 'unlinked';
  node?: Node;
  nodes?: Node[];
  onOpenNode?: (nodeId: string) => void;
  onLinkMention?: (sourceNodeId: string, targetName: string) => void;
}

/**
 * MetadataOrchestrator: Entry point tunggal metadata, tautan & backlinks
 */
export const MetadataOrchestrator: React.FC<MetadataOrchestratorProps> = ({ view = 'backlinks', node, nodes = [], onOpenNode, onLinkMention }) => {
  if (!node || !onOpenNode || !onLinkMention) return null;
  return (
    <div className="metadata-orchestrator p-4">
      {view === 'backlinks' ? <BacklinksView node={node} nodes={nodes} onOpenNode={onOpenNode} onLinkMention={onLinkMention} /> : <UnlinkedMentions node={node} nodes={nodes} onOpenNode={onOpenNode} onLinkMention={onLinkMention} />}
    </div>
  );
};

export default MetadataOrchestrator;
