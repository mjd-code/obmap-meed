import { useCallback, useEffect, useState, useMemo } from "react";
import { Cloud, Database, Laptop } from "lucide-react";
import { toast } from "sonner";
import { useVaultSync } from "@/domains/vault/shared/hooks/useVaultSync";
import { useAuth } from "@/domains/auth/shared/hooks/useAuth";
import { supabase } from "@/global/api/untypedSupabase";
import { VaultMemberService } from "@/domains/vault/shared/api/VaultMemberService";
import { getVaultManager } from "@/domains/vault/shared/api/VaultManagerSingleton";
import type {
  VaultLocation,
  BackupConfig,
} from "@/domains/vault/shared/utils/vault.types";
import type { VaultMemberRole } from "@/types/collaboration";

export interface BackupSnapshot {
  id: string;
  vaultId: string;
  timestamp: number;
  nodeCount: number;
  linkCount: number;
  description: string;
}

export interface VaultEntry {
  id: string;
  name: string;
  location: VaultLocation;
  cloudSync: boolean;
  nodeCount: number;
  linkCount: number;
  lastModified: number;
  stats?: {
    fileCount: number;
    folderCount: number;
    tagCount: number;
    orphanedNodes: number;
    avgConnections: number;
  };
}

export const LOCATION_META: Record<
  VaultLocation,
  { label: string; icon: typeof Database; desc: string }
> = {
  folder: {
    label: "Local folder",
    icon: Laptop,
    desc: "Tersimpan langsung di filesystem perangkat Anda.",
  },
  cloud: {
    label: "Cloud vault",
    icon: Cloud,
    desc: "Tersimpan di akun cloud dan disinkronkan ke seluruh perangkat.",
  },
};

/**
 * Headless controller for SettingsVaultSection.
 * Orchestrates vault discovery, role permissions, cloud/local creation, and backup operations.
 */
export function useSettingsVaultController() {
  const vaultManager = getVaultManager();
  const { user } = useAuth();
  const { isAuthenticated, syncVaultToCloud } = useVaultSync();

  const [activeTab, setActiveTab] = useState<string>("vaults");
  const [vaultFilter, setVaultFilter] = useState<"mine" | "shared">("mine");
  const [vaults, setVaults] = useState<VaultEntry[]>([]);
  const [activeVaultId, setActiveVaultId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [backupVaultId, setBackupVaultId] = useState<string | null>(null);
  const [settingsVaultId, setSettingsVaultId] = useState<string | null>(null);
  const [vaultRoles, setVaultRoles] = useState<
    Record<string, VaultMemberRole | "owner" | "none">
  >({});
  const [backups, setBackups] = useState<Record<string, BackupSnapshot[]>>({});
  const [backupConfigs, setBackupConfigs] = useState<
    Record<string, BackupConfig>
  >({});

  const loadVaults = useCallback(async () => {
    const all = vaultManager.getAllVaults();
    const active = vaultManager.getActiveVault();

    setVaults(
      all.map((v) => {
        const graphData = vaultManager.getVaultGraphData(v.id) || {
          nodes: [],
          links: [],
        };
        return {
          id: v.id,
          name: v.name,
          location: v.location,
          cloudSync: v.cloudSync ?? false,
          nodeCount: graphData.nodes.length,
          linkCount: graphData.links.length,
          lastModified: v.lastModified,
          stats: vaultManager.getVaultStats(v.id) || undefined,
        };
      }),
    );
    setActiveVaultId(active?.id || null);

    if (user) {
      try {
        const rolesMap: Record<string, VaultMemberRole | "owner" | "none"> =
          {};

        const { data: ownedVaults } = await supabase
          .from("user_vaults")
          .select("id, user_id")
          .eq("user_id", user.id);

        (ownedVaults || []).forEach((ov) => {
          rolesMap[ov.id] = "owner";
        });

        const { data: memberRows } = await supabase
          .from("vault_members")
          .select("vault_id, role")
          .eq("user_id", user.id);

        (memberRows || []).forEach((mr) => {
          if (!rolesMap[mr.vault_id]) {
            rolesMap[mr.vault_id] = mr.role as VaultMemberRole;
          }
        });

        setVaultRoles(rolesMap);
      } catch (err) {
        console.warn("[VaultSettings] Gagal memuat peran vault:", err);
      }
    }

    const backupData: Record<string, BackupSnapshot[]> = {};
    const configData: Record<string, BackupConfig> = {};
    for (const vault of all) {
      try {
        backupData[vault.id] = (await vaultManager.getBackups(
          vault.id,
        )) as BackupSnapshot[];
        configData[vault.id] = vaultManager.getBackupConfig(vault.id);
      } catch (err) {
        console.warn(
          `[VaultSettings] Gagal memuat backup vault ${vault.id}:`,
          err,
        );
        backupData[vault.id] = [];
      }
    }
    setBackups(backupData);
    setBackupConfigs(configData);
  }, [vaultManager, user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await vaultManager.initialize();
        if (cancelled) return;
        setIsInitialized(true);
        await loadVaults();
      } catch (err) {
        console.error("[VaultSettings] Inisialisasi gagal:", err);
        toast.error("Gagal menginisialisasi sistem vault");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vaultManager, loadVaults]);

  const activeVault = vaults.find((v) => v.id === activeVaultId) || null;

  const filteredVaults = useMemo(() => {
    return vaults.filter((vault) => {
      const role = vaultRoles[vault.id];
      const isLocal = vault.location === "folder";

      if (vaultFilter === "mine") {
        return isLocal || role === "owner" || !role;
      }
      return !isLocal && role && role !== "owner" && role !== "none";
    });
  }, [vaults, vaultRoles, vaultFilter]);

  const handleCreateCloudVault = async (name: string) => {
    const vaultId = await vaultManager.createCloudVault(name);
    vaultManager.startAutoBackup(vaultId);
    await loadVaults();
    if (isAuthenticated) await syncVaultToCloud(vaultId);
    toast.success(`Vault "${name}" berhasil dibuat`);
    return vaultId;
  };

  const handleCreateFolderVault = async (
    handle: FileSystemDirectoryHandle,
    name: string,
    cloudSync: boolean,
  ) => {
    const vaultId = await vaultManager.openFolderVault(handle, {
      createSubfolder: name,
      cloudSync: cloudSync && isAuthenticated,
    });
    vaultManager.startAutoBackup(vaultId);
    await loadVaults();
    if (cloudSync && isAuthenticated) await syncVaultToCloud(vaultId);
    toast.success(`Vault "${name}" dibuat di folder lokal Anda`);
    return vaultId;
  };

  const handleOpenFolderVault = async (handle: FileSystemDirectoryHandle) => {
    const vaultId = await vaultManager.openFolderVault(handle);
    vaultManager.startAutoBackup(vaultId);
    await loadVaults();
    toast.success("Vault berhasil dibuka");
    return vaultId;
  };

  const handleSelectVault = async (vaultId: string) => {
    await vaultManager.switchVault(vaultId);
    await loadVaults();
    toast.success("Beralih ke vault baru");
  };

  const handleDeleteVault = async (vaultId: string) => {
    if (!confirm("Hapus vault ini? Seluruh cadangannya juga akan dihapus."))
      return;
    await vaultManager.deleteVault(vaultId);
    await loadVaults();
    toast.success("Vault berhasil dihapus");
  };

  const handleLeaveVault = async (vaultId: string) => {
    if (!user) return;
    if (
      !confirm(
        "Tinggalkan vault kolaborasi ini? Anda tidak akan dapat mengaksesnya lagi kecuali diundang kembali.",
      )
    )
      return;

    const res = await VaultMemberService.leaveVault(vaultId, user.id);
    if (res.success) {
      toast.success("Anda telah meninggalkan vault kolaborasi ini");
      await loadVaults();
    } else {
      toast.error(res.error || "Gagal meninggalkan vault");
    }
  };

  const handleRenameVault = async (vaultId: string, newName: string) => {
    const res = await vaultManager.renameVault(vaultId, newName, user?.id);
    await loadVaults();
    if (res.success) {
      toast.success(`Nama vault berhasil diubah menjadi "${newName}"`);
    } else {
      toast.error(res.error || "Gagal mengubah nama vault");
    }
  };

  const handleCloudSyncChange = async (vaultId: string, enabled: boolean) => {
    const { needsCloudSync } = await vaultManager.setCloudSync(vaultId, enabled);
    await loadVaults();
    if (needsCloudSync && isAuthenticated) {
      const result = await syncVaultToCloud(vaultId);
      if (result.success) toast.success("Sinkronisasi cloud aktif — vault diunggah");
      else toast.error(`Gagal mengunggah ke cloud: ${result.error}`);
    } else {
      toast.success(enabled ? "Cloud sync aktif" : "Cloud sync dinonaktifkan");
    }
  };

  const handleAttachFolder = async (vaultId: string) => {
    try {
      const picker = (
        window as unknown as {
          showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
        }
      ).showDirectoryPicker;
      if (!picker) {
        toast.error("Browser tidak mendukung File System Access API");
        return;
      }
      const handle = await picker();
      if (!handle) return;
      const ok = await vaultManager.attachFolder(vaultId, handle);
      await loadVaults();
      if (ok) toast.success("Folder lokal ditautkan — catatan ditulis ke disk");
      else toast.error("Tidak dapat menggunakan folder tersebut");
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError")
        toast.error(error.message);
    }
  };

  const handleImportComplete = async () => {
    await loadVaults();
    toast.success("Konten berhasil diimpor");
  };

  const getVaultNodes = useCallback(
    (vaultId: string) => {
      return vaultManager.getVaultGraphData(vaultId)?.nodes || [];
    },
    [vaultManager],
  );

  const handleRestoreBackup = async (
    vaultId: string,
    backupId: string,
    successMessage: string,
    errorMessage: string,
  ) => {
    const ok = await vaultManager.restoreBackup(vaultId, backupId);
    await loadVaults();
    if (ok) toast.success(successMessage);
    else toast.error(errorMessage);
  };

  const handleDeleteBackup = async (backupId: string) => {
    await vaultManager.deleteBackup(backupId);
    await loadVaults();
    toast.success("Cadangan dihapus");
  };

  const handleCreateManualBackup = async (
    vaultId: string,
    notifySuccess: boolean,
  ) => {
    await vaultManager.createBackup(vaultId);
    await loadVaults();
    if (notifySuccess) toast.success("Snapshot cadangan baru dibuat");
  };

  const handleSaveBackupConfig = async (
    vaultId: string,
    newConfig: BackupConfig,
  ) => {
    await vaultManager.setBackupConfig(vaultId, newConfig);
    setBackupConfigs((prev) => ({ ...prev, [vaultId]: newConfig }));
    setSettingsVaultId(null);
    toast.success("Konfigurasi cadangan otomatis disimpan");
  };

  return {
    userId: user?.id,
    isAuthenticated,
    activeTab,
    setActiveTab,
    vaultFilter,
    setVaultFilter,
    activeVault,
    activeVaultId,
    filteredVaults,
    vaultRoles,
    backups,
    backupConfigs,
    isInitialized,
    isSelectorOpen,
    setIsSelectorOpen,
    backupVaultId,
    setBackupVaultId,
    settingsVaultId,
    setSettingsVaultId,
    handleCreateCloudVault,
    handleCreateFolderVault,
    handleOpenFolderVault,
    handleSelectVault,
    handleDeleteVault,
    handleLeaveVault,
    handleRenameVault,
    handleCloudSyncChange,
    handleAttachFolder,
    handleImportComplete,
    getVaultNodes,
    handleRestoreBackup,
    handleDeleteBackup,
    handleCreateManualBackup,
    handleSaveBackupConfig,
  };
}
