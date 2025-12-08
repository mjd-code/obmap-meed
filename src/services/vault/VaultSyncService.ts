/**
 * VaultSyncService - Bridges local VaultManager with Cloud storage
 * 
 * Handles bidirectional sync between IndexedDB and Supabase with proper
 * conflict resolution and session-based data isolation.
 */

import { supabase } from '@/integrations/supabase/client';
import { cloudVaultService, CloudVault } from './CloudVaultService';
import { VaultManager } from './VaultManager';
import type { Json } from '@/integrations/supabase/types';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface SyncResult {
  success: boolean;
  error?: string;
  syncedVaults?: number;
}

export class VaultSyncService {
  private syncStatus: SyncStatus = 'idle';
  private lastSyncTime: Date | null = null;
  private syncListeners: Set<(status: SyncStatus) => void> = new Set();

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return this.syncStatus;
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  /**
   * Subscribe to sync status changes
   */
  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }

  private setStatus(status: SyncStatus) {
    this.syncStatus = status;
    this.syncListeners.forEach(cb => cb(status));
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  }

  /**
   * Sync all local vaults to cloud
   */
  async syncToCloud(vaultManager: VaultManager): Promise<SyncResult> {
    if (!navigator.onLine) {
      this.setStatus('offline');
      return { success: false, error: 'No internet connection' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    this.setStatus('syncing');

    try {
      const localVaults = vaultManager.getAllVaults();
      let syncedCount = 0;

      for (const vault of localVaults) {
        if (vault.type !== 'in-memory') continue;

        const graphData = vault.graphService.getGraphData();
        
        // Check if vault exists in cloud (by checking if ID is a UUID vs local format)
        const isCloudVault = vault.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        
        if (isCloudVault) {
          // Update existing cloud vault
          const { error } = await cloudVaultService.updateVault(vault.id, {
            name: vault.name,
            graph_data: graphData,
            graph_config: vault.graphConfig || {},
            backup_config: vault.backupConfig || {},
          });
          
          if (error) {
            console.error('Failed to sync vault to cloud:', error);
            continue;
          }
        } else {
          // Create new vault in cloud
          const { data, error } = await cloudVaultService.createVault(
            vault.name,
            undefined,
            graphData
          );
          
          if (error || !data) {
            console.error('Failed to create vault in cloud:', error);
            continue;
          }

          // Update vault config if exists
          if (vault.graphConfig || vault.backupConfig) {
            await cloudVaultService.updateVault(data.id, {
              graph_config: vault.graphConfig || {},
              backup_config: vault.backupConfig || {},
            });
          }
        }
        
        syncedCount++;
      }

      this.lastSyncTime = new Date();
      this.setStatus('synced');
      
      return { success: true, syncedVaults: syncedCount };
    } catch (error) {
      console.error('Sync to cloud failed:', error);
      this.setStatus('error');
      return { success: false, error: String(error) };
    }
  }

  /**
   * Pull vaults from cloud and merge with local
   */
  async syncFromCloud(vaultManager: VaultManager): Promise<SyncResult> {
    if (!navigator.onLine) {
      this.setStatus('offline');
      return { success: false, error: 'No internet connection' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    this.setStatus('syncing');

    try {
      const { data: cloudVaults, error } = await cloudVaultService.getVaults();
      
      if (error || !cloudVaults) {
        this.setStatus('error');
        return { success: false, error: error?.message || 'Failed to fetch cloud vaults' };
      }

      let syncedCount = 0;

      for (const cloudVault of cloudVaults) {
        // Check if vault already exists locally
        const localVault = vaultManager.getVault(cloudVault.id);
        
        if (!localVault) {
          // Create local vault from cloud data
          // We need to manually set up the vault since it comes from cloud
          const graphData = cloudVault.graph_data || { nodes: [], links: [] };
          
          // Import the vault by creating a new one with the cloud ID
          await this.importCloudVault(vaultManager, cloudVault);
          syncedCount++;
        } else {
          // Vault exists - compare timestamps for conflict resolution
          const cloudUpdated = new Date(cloudVault.updated_at).getTime();
          const localUpdated = localVault.lastModified;
          
          if (cloudUpdated > localUpdated) {
            // Cloud is newer - update local
            const graphData = cloudVault.graph_data || { nodes: [], links: [] };
            localVault.graphService.clearGraph();
            graphData.nodes.forEach(node => localVault.graphService.setNode(node));
            localVault.graphService.setLinks(graphData.links || []);
            localVault.lastModified = cloudUpdated;
            syncedCount++;
          }
        }
      }

      this.lastSyncTime = new Date();
      this.setStatus('synced');
      
      return { success: true, syncedVaults: syncedCount };
    } catch (error) {
      console.error('Sync from cloud failed:', error);
      this.setStatus('error');
      return { success: false, error: String(error) };
    }
  }

  /**
   * Import a cloud vault into the local VaultManager
   */
  private async importCloudVault(vaultManager: VaultManager, cloudVault: CloudVault): Promise<void> {
    // Access private method via creating in-memory and then updating
    // This is a workaround - ideally VaultManager would expose a method for this
    const vaultId = await vaultManager.createInMemoryVault(cloudVault.name);
    const vault = vaultManager.getVault(vaultId);
    
    if (vault) {
      const graphData = cloudVault.graph_data || { nodes: [], links: [] };
      vault.graphService.clearGraph();
      graphData.nodes.forEach(node => vault.graphService.setNode(node));
      vault.graphService.setLinks(graphData.links || []);
      
      if (cloudVault.graph_config) {
        await vaultManager.setGraphConfig(vaultId, cloudVault.graph_config);
      }
      if (cloudVault.backup_config) {
        await vaultManager.setBackupConfig(vaultId, cloudVault.backup_config);
      }
    }
  }

  /**
   * Full bidirectional sync
   */
  async fullSync(vaultManager: VaultManager): Promise<SyncResult> {
    // First pull from cloud, then push local changes
    const pullResult = await this.syncFromCloud(vaultManager);
    if (!pullResult.success) {
      return pullResult;
    }
    
    const pushResult = await this.syncToCloud(vaultManager);
    return pushResult;
  }

  /**
   * Sync a single vault to cloud
   */
  async syncVaultToCloud(vaultManager: VaultManager, vaultId: string): Promise<SyncResult> {
    if (!navigator.onLine) {
      return { success: false, error: 'No internet connection' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const vault = vaultManager.getVault(vaultId);
    if (!vault || vault.type !== 'in-memory') {
      return { success: false, error: 'Vault not found or not syncable' };
    }

    try {
      const graphData = vault.graphService.getGraphData();
      const isCloudVault = vault.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isCloudVault) {
        const { error } = await cloudVaultService.updateVault(vault.id, {
          name: vault.name,
          graph_data: graphData,
          graph_config: vault.graphConfig || {},
          backup_config: vault.backupConfig || {},
        });
        
        if (error) {
          return { success: false, error: error.message };
        }
      } else {
        const { data, error } = await cloudVaultService.createVault(
          vault.name,
          undefined,
          graphData
        );
        
        if (error || !data) {
          return { success: false, error: error?.message || 'Failed to create vault' };
        }

        if (vault.graphConfig || vault.backupConfig) {
          await cloudVaultService.updateVault(data.id, {
            graph_config: vault.graphConfig || {},
            backup_config: vault.backupConfig || {},
          });
        }
      }

      return { success: true, syncedVaults: 1 };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Clear all local vault data (for logout)
   */
  async clearLocalData(): Promise<void> {
    // Clear IndexedDB vault data
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase('VaultManagerDB');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
      request.onblocked = () => {
        console.warn('IndexedDB deletion blocked - will be deleted on next session');
        resolve();
      };
    });
  }
}

export const vaultSyncService = new VaultSyncService();
