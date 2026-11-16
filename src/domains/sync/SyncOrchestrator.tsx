import React from 'react';
import { AutoSaveIndicator } from '@/domains/sync/components/SyncAutoSaveIndicator';
import { SyncStatusIndicator } from '@/domains/sync/components/SyncStatusIndicator';
import { useVaultStore } from '@/domains/vault/shared/stores/useVaultStore';
export { syncCoordinator } from '@/domains/sync/shared/api/SyncCoordinator';
export { SyncEngine } from '@/domains/sync/shared/api/SyncEngine';
export { useOfflineStore } from '@/domains/sync/shared/stores/useOfflineStore';

/**
 * SyncOrchestrator: Entry point tunggal sinkronisasi data & status offline/cloud
 */
export const SyncOrchestrator: React.FC = () => {
  const saveStatus = useVaultStore((state) => state.saveStatus);
  const lastSaved = useVaultStore((state) => state.lastSaved);

  return (
    <div className="sync-orchestrator flex items-center gap-2">
      <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />
      <SyncStatusIndicator />
    </div>
  );
};

export default SyncOrchestrator;
