import React from 'react';
import { SyncAutoSaveIndicator } from './components/SyncAutoSaveIndicator';
import { SyncStatusIndicator } from './components/SyncStatusIndicator';
export { SyncCoordinator } from './shared/api/SyncCoordinator';
export { SyncEngine } from './shared/api/SyncEngine';
export { useOfflineStore } from './shared/stores/useOfflineStore';

/**
 * SyncOrchestrator: Entry point tunggal sinkronisasi data & status offline/cloud
 */
export const SyncOrchestrator: React.FC = () => {
  return (
    <div className="sync-orchestrator flex items-center gap-2">
      <SyncAutoSaveIndicator />
      <SyncStatusIndicator />
    </div>
  );
};

export default SyncOrchestrator;
