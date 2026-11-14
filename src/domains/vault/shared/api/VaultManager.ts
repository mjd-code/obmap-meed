/**
 * VaultManager - Multi-Vault Orchestrator
 *
 * A vault has two independent settings:
 * - location: 'folder' (Markdown files in a real folder) or 'cloud' (in the account)
 * - cloudSync: whether the vault is mirrored to the user's cloud account
 *
 * Folder vaults get a derived `.vault-config.json` export at their root.
 * Cloud vaults keep the same structure in IndexedDB + the cloud record.
 */

import { GraphService } from "@/domains/graph/shared/api/GraphService";
import { VaultStorage } from "@/domains/vault/shared/api/VaultStorage";
import { VaultHistory } from "@/domains/vault/shared/api/VaultHistory";
import { VaultBackupService } from "@/domains/vault/shared/api/VaultBackupService";
import type { FileSystemService } from "@/domains/vault/shared/api/FileSystemService";
import { getFileSystemService } from "@/domains/vault/shared/api/FileSystemServiceSingleton";
import { directoryHandleStore } from "@/domains/vault/shared/api/directoryHandleStore";
import { writeVaultConfigFile } from "@/domains/settings/shared/api/VaultConfigFile";
import {
  BackupConfig,
  VaultLocation,
  VaultGraphConfig,
  VaultConfigSnapshot,
  migrateLegacyStrategy,
} from "@/domains/vault/shared/utils/vault.types";
import {
  emitVaultCreated,
  emitVaultDeleted,
  emitVaultRenamed,
  emitVaultSwitched,
} from "@/global/stores/events";
import { VaultValidationService } from "@/domains/vault/shared/api/VaultValidationService";
import { cloudVaultService } from "@/domains/vault/shared/api/CloudVaultService";
import { calculateVaultStats } from "@/domains/vault/shared/utils/vaultStatsCalculator";
import {
  buildStoragePayloadForVault,
  flushVaultNodesToDirectory,
  hydrateVaultFromStorageRecord,
  readFolderIntoVault,
  tryRestoreFolderVaultFromHandle,
} from "@/domains/vault/shared/api/vaultFolderHydrator";

export interface Vault {
  id: string;
  name: string;
  /** Where the notes physically live. */
  location: VaultLocation;
  /** Mirrored to the user's cloud account. */
  cloudSync: boolean;
  /** Legacy shape kept for older UI props: folder vaults are 'local-folder'. */
  type: "in-memory" | "local-folder";
  cloudId?: string;
  graphService: GraphService;
  history: VaultHistory;
  persistenceService?: FileSystemService;
  directoryHandle?: FileSystemDirectoryHandle;
  createdAt: number;
  lastModified: number;
  graphConfig?: VaultGraphConfig | null;
  backupConfig?: BackupConfig | null;
  settings?: Record<string, any>;
  workspaceLayout?: any;
}

const newVaultId = (): string =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `vault-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

export class VaultManager {
  private vaults: Map<string, Vault> = new Map();
  private activeVaultId: string | null = null;
  private static readonly ACTIVE_KEY = "obmap.activeVaultId";
  private storage: VaultStorage;
  private backupService: VaultBackupService;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.storage = new VaultStorage();
    this.backupService = new VaultBackupService();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializationPromise) return this.initializationPromise;
    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      await this.storage.initialize();
      await this.loadVaultsFromStorage();
      this.restoreActiveVault();
      this.initialized = true;
    } catch (error) {
      console.error("VaultManager: Initialization failed", error);
      this.initializationPromise = null;
      throw error;
    }
  }

  private async loadVaultsFromStorage(): Promise<void> {
    const vaultMetadata = await this.storage.getAllVaults();

    for (const metadata of vaultMetadata) {
      const { location } = migrateLegacyStrategy(
        (metadata as any).storageStrategy,
        (metadata as any).type,
      );
      const resolvedLocation: VaultLocation =
        (metadata as any).location ?? location;

      if (resolvedLocation === "folder") {
        const restored = await tryRestoreFolderVaultFromHandle(
          metadata,
          this.storage,
        );
        if (restored) this.vaults.set(restored.id, restored);
        continue;
      }

      const vaultData = await this.storage.getVault(metadata.id);
      if (vaultData) {
        const vault = hydrateVaultFromStorageRecord(vaultData);
        this.vaults.set(vault.id, vault);
      }
    }
  }

  private restoreActiveVault(): void {
    try {
      const saved = localStorage.getItem(VaultManager.ACTIVE_KEY);
      if (saved && this.vaults.has(saved)) {
        this.activeVaultId = saved;
        return;
      }
    } catch {
      /* private mode — fall back to the first vault */
    }
    const first = this.vaults.keys().next();
    if (!first.done) this.activeVaultId = first.value;
  }

  private rememberActiveVault(): void {
    try {
      if (this.activeVaultId)
        localStorage.setItem(VaultManager.ACTIVE_KEY, this.activeVaultId);
      else localStorage.removeItem(VaultManager.ACTIVE_KEY);
    } catch {
      /* ignore */
    }
  }

  async reconnectFolderVault(vaultId: string): Promise<boolean> {
    const vault = this.vaults.get(vaultId);
    if (!vault) return false;
    const ok = await readFolderIntoVault(vault);
    if (ok) await this.persistVault(vault);
    return ok;
  }

  // ---------------------------------------------------------------- creation

  async createCloudVault(
    name: string,
    cloudSync = true,
    id?: string,
  ): Promise<string> {
    const vaultId = id ?? newVaultId();
    const graphService = new GraphService();
    graphService.initialize();

    const vault: Vault = {
      id: vaultId,
      name,
      location: "cloud",
      cloudSync,
      type: "in-memory",
      graphService,
      history: new VaultHistory(),
      createdAt: Date.now(),
      lastModified: Date.now(),
      settings: {},
    };

    this.vaults.set(vaultId, vault);
    this.activeVaultId = vaultId;
    this.rememberActiveVault();
    await this.persistVault(vault);
    emitVaultCreated({ vaultId, vaultName: name, storageStrategy: "cloud" });
    return vaultId;
  }

  async openFolderVault(
    handle: FileSystemDirectoryHandle,
    options: { createSubfolder?: string; cloudSync?: boolean } = {},
  ): Promise<string> {
    let root = handle;
    if (options.createSubfolder) {
      const safe = options.createSubfolder.replace(/[\\/:*?"<>|]/g, "").trim();
      if (!safe) throw new Error("Please choose a valid vault name");
      root = await handle.getDirectoryHandle(safe, { create: true });
    }

    const vaultId = newVaultId();
    const graphService = new GraphService();
    graphService.initialize();

    const persistenceService = getFileSystemService();
    persistenceService.attach(root);

    const granted = await persistenceService.verifyPermission(root);
    if (!granted)
      throw new Error("Permission to write in this folder was denied");

    await persistenceService.readVaultStructure(root);
    graphService.finalizeGraph();

    const vault: Vault = {
      id: vaultId,
      name: root.name,
      location: "folder",
      cloudSync: options.cloudSync ?? false,
      type: "local-folder",
      graphService,
      history: new VaultHistory(),
      persistenceService,
      directoryHandle: root,
      createdAt: Date.now(),
      lastModified: Date.now(),
      graphConfig: null,
      backupConfig: null,
      settings: {},
      workspaceLayout: null,
    };

    this.vaults.set(vaultId, vault);
    this.activeVaultId = vaultId;
    this.rememberActiveVault();
    await this.persistVault(vault);
    await directoryHandleStore.put(vaultId, root);
    emitVaultCreated({
      vaultId,
      vaultName: vault.name,
      storageStrategy: "folder",
    });
    return vaultId;
  }

  async attachFolder(
    vaultId: string,
    handle: FileSystemDirectoryHandle,
  ): Promise<boolean> {
    const vault = this.vaults.get(vaultId);
    if (!vault) return false;

    const ok = await flushVaultNodesToDirectory(vault, handle);
    if (!ok) return false;

    await this.writeConfigExport(vault);
    await this.persistVault(vault);
    await directoryHandleStore.put(vaultId, handle);
    return true;
  }

  // ------------------------------------------------------------ cloud toggle

  async setCloudSync(
    vaultId: string,
    enabled: boolean,
  ): Promise<{ needsCloudSync: boolean; cloudId?: string }> {
    const vault = this.vaults.get(vaultId);
    if (!vault) return { needsCloudSync: false };

    const previousCloudId = vault.cloudId;
    vault.cloudSync = enabled;
    vault.lastModified = Date.now();
    if (!enabled) vault.cloudId = undefined;

    await this.writeConfigExport(vault);
    await this.persistVault(vault);
    return { needsCloudSync: enabled, cloudId: previousCloudId };
  }

  getCloudVaults(): Vault[] {
    return Array.from(this.vaults.values()).filter((v) => v.cloudSync);
  }

  getFolderVaults(): Vault[] {
    return Array.from(this.vaults.values()).filter(
      (v) => v.location === "folder",
    );
  }

  // ------------------------------------------------------------- vault state

  async switchVault(vaultId: string): Promise<boolean> {
    const vault = this.vaults.get(vaultId);
    if (!vault) return false;

    if (this.activeVaultId && this.activeVaultId !== vaultId) {
      const current = this.vaults.get(this.activeVaultId);
      if (current) await this.persistVault(current);
    }

    if (vault.directoryHandle) {
      const granted = await vault.persistenceService?.verifyPermission(
        vault.directoryHandle,
      );
      if (granted) await this.writeConfigExport(vault);
    }

    if (
      vault.location === "folder" &&
      vault.directoryHandle &&
      !vault.persistenceService
    ) {
      const reconnected = await readFolderIntoVault(vault);
      if (reconnected) await this.persistVault(vault);
    }

    this.activeVaultId = vaultId;
    this.rememberActiveVault();
    vault.lastModified = Date.now();
    emitVaultSwitched(vaultId);
    return true;
  }

  async deleteVault(
    vaultId: string,
  ): Promise<{ cloudId?: string; wasCloudVault: boolean }> {
    const vault = this.vaults.get(vaultId);
    if (!vault) return { wasCloudVault: false };

    const wasCloudVault = vault.cloudSync;
    const cloudId = vault.cloudId;

    if (cloudId && wasCloudVault && navigator.onLine) {
      try {
        const { cloudVaultService: cloudSvc } = await import(
          "@/domains/vault/shared/api/CloudVaultService"
        );
        await cloudSvc.deleteVault(cloudId);
      } catch (error) {
        console.warn("Cloud vault deletion failed:", error);
      }
    }

    vault.persistenceService?.closeVault();
    vault.graphService.cleanup();

    this.backupService.stopAutoBackup(vaultId);
    await this.storage.deleteVaultBackups(vaultId);

    this.vaults.delete(vaultId);
    await this.storage.deleteVault(vaultId);
    await directoryHandleStore.remove(vaultId);

    if (this.activeVaultId === vaultId) {
      this.activeVaultId = this.vaults.keys().next().value ?? null;
      this.rememberActiveVault();
    }

    emitVaultDeleted({ vaultId, wasCloudVault });
    return { cloudId, wasCloudVault };
  }

  getActiveVault(): Vault | null {
    if (!this.activeVaultId) return null;
    return this.vaults.get(this.activeVaultId) || null;
  }

  getAllVaults(): Vault[] {
    return Array.from(this.vaults.values());
  }

  getVaults(): Vault[] {
    return this.getAllVaults();
  }

  getVault(vaultId: string): Vault | null {
    return this.vaults.get(vaultId) || null;
  }

  getVaultGraphData(vaultId: string) {
    const vault = this.vaults.get(vaultId);
    return vault ? vault.graphService.getGraphData() : null;
  }

  getVaultStats(vaultId: string) {
    const vault = this.vaults.get(vaultId);
    if (!vault) return null;
    return calculateVaultStats(vault.graphService.getGraphData());
  }

  canUndo(vaultId: string): boolean {
    return this.vaults.get(vaultId)?.history.canUndo() ?? false;
  }

  canRedo(vaultId: string): boolean {
    return this.vaults.get(vaultId)?.history.canRedo() ?? false;
  }

  async undo(vaultId: string): Promise<boolean> {
    const vault = this.vaults.get(vaultId);
    if (!vault) return false;
    const previousState = vault.history.undo();
    if (!previousState) return false;

    vault.graphService.clearGraph();
    previousState.nodes.forEach((node) => vault.graphService.setNode(node));
    vault.graphService.setLinks(previousState.links);
    await this.persistVault(vault);
    return true;
  }

  async redo(vaultId: string): Promise<boolean> {
    const vault = this.vaults.get(vaultId);
    if (!vault) return false;
    const nextState = vault.history.redo();
    if (!nextState) return false;

    vault.graphService.clearGraph();
    nextState.nodes.forEach((node) => vault.graphService.setNode(node));
    vault.graphService.setLinks(nextState.links);
    await this.persistVault(vault);
    return true;
  }

  async renameVault(
    vaultId: string,
    newName: string,
    userId?: string,
  ): Promise<{ success: boolean; error?: string }> {
    const vault = this.vaults.get(vaultId);
    if (!vault) {
      return { success: false, error: "Vault tidak ditemukan." };
    }

    const trimmed = newName.trim();
    if (trimmed === vault.name) {
      return { success: true };
    }

    const check = await VaultValidationService.checkAvailability({
      name: trimmed,
      excludeVaultId: vaultId,
      currentUserId: userId,
    });

    if (!check.available) {
      return {
        success: false,
        error: check.reason || "Nama vault sudah digunakan.",
      };
    }

    const oldName = vault.name;
    vault.name = trimmed;
    vault.lastModified = Date.now();

    await this.writeConfigExport(vault);
    await this.persistVault(vault);

    if (vault.cloudSync || vault.cloudId || vault.location === "cloud") {
      try {
        await cloudVaultService.updateVault(vault.cloudId || vault.id, {
          name: vault.name,
          slug: check.slug,
        } as any);
      } catch (cloudErr) {
        console.warn(
          "VaultManager: Gagal memperbarui nama di cloud:",
          cloudErr,
        );
      }
    }

    emitVaultRenamed({ vaultId, oldName, newName: vault.name });
    return { success: true };
  }

  // ----------------------------------------------------------- persistence

  private async persistVault(vault: Vault): Promise<void> {
    await this.storage.saveVault(buildStoragePayloadForVault(vault));
  }

  private async writeConfigExport(vault: Vault): Promise<void> {
    await writeVaultConfigFile(vault.directoryHandle);
  }

  async setCloudId(vaultId: string, cloudId: string): Promise<void> {
    const vault = this.vaults.get(vaultId);
    if (!vault) return;
    vault.cloudId = cloudId;
    await this.writeConfigExport(vault);
    await this.persistVault(vault);
  }

  getVaultConfig(vaultId: string): VaultConfigSnapshot | null {
    const vault = this.vaults.get(vaultId);
    if (!vault) return null;
    return {
      vault: {
        id: vault.id,
        name: vault.name,
        createdAt: vault.createdAt,
        cloudSync: vault.cloudSync,
        cloudId: vault.cloudId,
      },
      settings: vault.settings ?? {},
      graph: vault.graphConfig ?? null,
      workspace: vault.workspaceLayout ?? null,
      backup: vault.backupConfig ?? null,
    };
  }

  getGraphConfig(vaultId: string): VaultGraphConfig | null {
    return this.vaults.get(vaultId)?.graphConfig ?? null;
  }

  async setGraphConfig(
    vaultId: string,
    config: VaultGraphConfig,
  ): Promise<void> {
    const vault = this.vaults.get(vaultId);
    if (!vault) return;
    vault.graphConfig = config;
    vault.lastModified = Date.now();
    await this.writeConfigExport(vault);
    await this.persistVault(vault);
  }

  getSettings(vaultId: string): Record<string, any> {
    return this.vaults.get(vaultId)?.settings ?? {};
  }

  async setSettings(
    vaultId: string,
    settings: Record<string, any>,
  ): Promise<void> {
    const vault = this.vaults.get(vaultId);
    if (!vault) return;
    vault.settings = settings;
    vault.lastModified = Date.now();
    await this.writeConfigExport(vault);
    await this.persistVault(vault);
  }

  async setWorkspaceLayout(vaultId: string, layout: any): Promise<void> {
    const vault = this.vaults.get(vaultId);
    if (!vault) return;
    vault.workspaceLayout = layout;
    await this.writeConfigExport(vault);
    await this.persistVault(vault);
  }

  async saveCurrentVault(): Promise<void> {
    if (!this.activeVaultId) return;
    const vault = this.vaults.get(this.activeVaultId);
    if (vault) await this.persistVault(vault);
  }

  // ------------------------------------------------------------- backups

  async createBackup(vaultId: string): Promise<void> {
    const vault = this.vaults.get(vaultId);
    if (!vault) return;

    const graphData = vault.graphService.getGraphData();
    const config = this.getBackupConfig(vaultId);
    const snapshot = this.backupService.createSnapshot(
      vaultId,
      graphData.nodes,
      graphData.links,
    );

    await this.storage.saveBackup(snapshot);
    await this.storage.pruneOldBackups(vaultId, config.maxSnapshots);
  }

  async getBackups(vaultId: string): Promise<any[]> {
    const config = this.getBackupConfig(vaultId);
    return this.storage.getBackups(vaultId, config.maxSnapshots);
  }

  async restoreBackup(vaultId: string, backupId: string): Promise<boolean> {
    const vault = this.vaults.get(vaultId);
    if (!vault) return false;

    const backups = await this.storage.getBackups(vaultId, 1000);
    const backup = backups.find((b) => b.id === backupId);
    if (!backup) return false;

    vault.graphService.clearGraph();
    backup.nodes.forEach((node: any) => vault.graphService.setNode(node));
    vault.graphService.setLinks(backup.links || []);

    vault.history.clear();
    vault.history.addState(backup.nodes, backup.links);

    await this.persistVault(vault);
    return true;
  }

  async deleteBackup(backupId: string): Promise<void> {
    await this.storage.deleteBackup(backupId);
  }

  getBackupConfig(vaultId: string): BackupConfig {
    const vault = this.vaults.get(vaultId);
    return vault?.backupConfig ?? this.backupService.getConfig(vaultId);
  }

  async setBackupConfig(vaultId: string, config: BackupConfig): Promise<void> {
    const vault = this.vaults.get(vaultId);
    if (!vault) return;

    vault.backupConfig = config;
    vault.lastModified = Date.now();
    this.backupService.setConfig(vaultId, config);

    await this.writeConfigExport(vault);
    await this.persistVault(vault);

    this.backupService.stopAutoBackup(vaultId);
    this.backupService.startAutoBackup(vaultId, async () => {
      await this.createBackup(vaultId);
    });
  }

  startAutoBackup(vaultId: string): void {
    this.backupService.startAutoBackup(vaultId, async () => {
      await this.createBackup(vaultId);
    });
  }

  async recordVaultChange(vaultId: string): Promise<void> {
    await this.backupService.recordChange(vaultId, async () => {
      await this.createBackup(vaultId);
    });
  }

  stopAutoBackup(vaultId: string): void {
    this.backupService.stopAutoBackup(vaultId);
  }
}
