import React from 'react';
import { PublicReaderFileTree } from './components/PublicReaderFileTree';
import { PublicReaderMarkdownReader } from './components/PublicReaderMarkdownReader';
import { PublicReaderInteractiveGraph } from './components/PublicReaderInteractiveGraph';

export interface PublicReaderOrchestratorProps {
  username?: string;
  vaultSlug?: string;
  noteSlug?: string;
}

/**
 * PublicReaderOrchestrator: Entry point tunggal untuk pembaca publik dokumen vault
 */
export const PublicReaderOrchestrator: React.FC<PublicReaderOrchestratorProps> = () => {
  return (
    <div className="public-reader-orchestrator flex w-full h-screen overflow-hidden bg-background">
      <PublicReaderFileTree />
      <main className="flex-1 overflow-auto">
        <PublicReaderMarkdownReader />
      </main>
    </div>
  );
};

export default PublicReaderOrchestrator;
