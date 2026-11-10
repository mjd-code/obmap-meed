import React from 'react';
import { SyncAutoSaveIndicator } from '@/domains/sync/components/SyncAutoSaveIndicator';
import { SyncStatusIndicator } from '@/domains/sync/components/SyncStatusIndicator';
export { SyncCoordinator } from '@/domains/sync/shared/api/SyncCoordinator';
export { SyncEngine } from '@/domains/sync/shared/api/SyncEngine';
export { useOfflineStore } from '@/domains/sync/shared/stores/useOfflineStore';

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
