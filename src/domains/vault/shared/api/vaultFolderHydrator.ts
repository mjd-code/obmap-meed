/**
 * Vault Folder & Storage Hydrator (TD-003)
 * Handles deserialization, folder handle restoration, and disk synchronization for VaultManager.
 */

import { GraphService } from "@/domains/graph/shared/api/GraphService";
import { VaultHistory } from "@/domains/vault/shared/api/VaultHistory";
import type { VaultStorage } from "@/domains/vault/shared/api/VaultStorage";
import { getFileSystemService } from "@/domains/vault/shared/api/FileSystemServiceSingleton";
import { directoryHandleStore } from "@/domains/vault/shared/api/directoryHandleStore";
import { hasGrantedPermission } from "@/domains/vault/shared/api/repositoryCapabilities";
import {
  migrateLegacyStrategy,
  type VaultLocation,
} from "@/domains/vault/shared/utils/vault.types";
import type { Vault } from "@/domains/vault/shared/api/VaultManager";

export function hydrateVaultFromStorageRecord(vaultData: any): Vault {
  const graphService = new GraphService();
  graphService.initialize();

  (vaultData.graphData?.nodes ?? []).forEach((node: any) =>
    graphService.setNode(node),
  );
  graphService.setLinks(vaultData.graphData?.links || []);

  const history = new VaultHistory();
  history.setState(vaultData.history);

  const legacy = migrateLegacyStrategy(
    vaultData.metadata.storageStrategy,
    vaultData.metadata.type,
  );
  const location: VaultLocation =
    vaultData.metadata.location ?? legacy.location;
  const cloudSync: boolean = vaultData.metadata.cloudSync ?? legacy.cloudSync;

  return {
    id: vaultData.metadata.id,
    name: vaultData.metadata.name,
    location,
    cloudSync,
    type: location === "folder" ? "local-folder" : "in-memory",
    cloudId: vaultData.metadata.cloudId,
    graphService,
    history,
    graphConfig: vaultData.graphConfig || null,
    backupConfig: vaultData.backupConfig || null,
    settings: vaultData.settings || {},
    workspaceLayout: vaultData.workspaceLayout || null,
    createdAt: vaultData.metadata.createdAt,
    lastModified: vaultData.metadata.lastModified,
  };
}

export async function readFolderIntoVault(vault: Vault): Promise<boolean> {
  if (!vault.directoryHandle) return false;
  const fs = getFileSystemService();
  if (!(await fs.verifyPermission(vault.directoryHandle))) return false;
  fs.attach(vault.directoryHandle);
  vault.persistenceService = fs;
  await fs.readVaultStructure(vault.directoryHandle);
  vault.graphService.finalizeGraph();
  return true;
}

export async function tryRestoreFolderVaultFromHandle(
  metadata: any,
  storage: VaultStorage,
): Promise<Vault | null> {
  try {
    const handle = await directoryHandleStore.get(metadata.id);
    if (!handle) return null;
    const vaultData = await storage.getVault(metadata.id);
    if (!vaultData) return null;

    const graphService = new GraphService();
    graphService.initialize();

    const vault: Vault = {
      id: vaultData.metadata.id,
      name: vaultData.metadata.name,
      location: "folder",
      cloudSync: vaultData.metadata.cloudSync ?? false,
      type: "local-folder",
      cloudId: vaultData.metadata.cloudId,
      graphService,
      history: new VaultHistory(),
      directoryHandle: handle,
      graphConfig: vaultData.graphConfig || null,
      backupConfig: vaultData.backupConfig || null,
      settings: vaultData.settings || {},
      workspaceLayout: vaultData.workspaceLayout || null,
      createdAt: vaultData.metadata.createdAt,
      lastModified: vaultData.metadata.lastModified,
    };

    if (await hasGrantedPermission(handle)) {
      await readFolderIntoVault(vault);
    }
    return vault;
  } catch (error) {
    console.warn(
      "VaultManager: could not restore folder vault",
      metadata?.id,
      error,
    );
    return null;
  }
}

export async function flushVaultNodesToDirectory(
  vault: Vault,
  handle: FileSystemDirectoryHandle,
): Promise<boolean> {
  const persistenceService = getFileSystemService();
  persistenceService.attach(handle);
  if (!(await persistenceService.verifyPermission(handle))) return false;

  vault.persistenceService = persistenceService;
  vault.directoryHandle = handle;
  vault.location = "folder";
  vault.type = "local-folder";
  vault.lastModified = Date.now();

  const { nodes } = vault.graphService.getGraphData();
  for (const node of nodes as any[]) {
    if (node.type === "folder" && node.path) {
      await persistenceService.ensureDirectory(node.path);
    }
  }
  for (const node of nodes as any[]) {
    if (node.type === "file" && node.path) {
      await persistenceService.saveFile(node.path, node.content ?? "");
    }
  }
  return true;
}

export function buildStoragePayloadForVault(vault: Vault) {
  const graphData = vault.graphService.getGraphData();
  const isFolder = vault.location === "folder";

  return {
    metadata: {
      id: vault.id,
      name: vault.name,
      location: vault.location,
      cloudSync: vault.cloudSync,
      cloudId: vault.cloudId,
      createdAt: vault.createdAt,
      lastModified: vault.lastModified,
      nodeCount: graphData.nodes.length,
      linkCount: graphData.links.length,
    },
    graphData: isFolder ? { nodes: [], links: [] } : graphData,
    history: isFolder ? { past: [], future: [] } : vault.history.getState(),
    graphConfig: vault.graphConfig || undefined,
    backupConfig: vault.backupConfig || undefined,
    settings: vault.settings || undefined,
    workspaceLayout: vault.workspaceLayout || undefined,
  };
}
