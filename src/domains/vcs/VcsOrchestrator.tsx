import React from 'react';
import { VcsSidebarPanel } from '@/domains/vcs/components/VcsSidebarPanel';
import { VcsBranchSelector } from '@/domains/vcs/components/VcsBranchSelector';
export { useVcsStore } from '@/domains/vcs/shared/stores/useVcsStore';

/**
 * VcsOrchestrator: Entry point tunggal version control system & branching
 */
export const VcsOrchestrator: React.FC = () => {
  return (
    <div className="vcs-orchestrator w-full h-full">
      <VcsSidebarPanel />
    </div>
  );
};

export default VcsOrchestrator;
