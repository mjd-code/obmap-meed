import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { validateAppConfigJson } from "../configSchemaValidator";
import {
  INITIAL_BACKUP_SCHEDULE,
  INITIAL_IMPORT_EXPORT_HISTORY,
} from "../mockSettingsDefaults";
import {
  buildAppConfigJson,
  PROTOTYPE_ACCESS_GRANTS,
  PROTOTYPE_MERGE_REQUESTS,
  PROTOTYPE_SNAPSHOTS,
  PROTOTYPE_VISUAL_DIFFS,
} from "../mockVcsAndConfigData";
import type {
  ImportExportFormatId,
  PrototypeBackupSchedule,
  PrototypeImportExportRecord,
} from "../settingsTypes";
import type {
  AppCentralConfigJsonV2,
  CollaboratorRole,
  DeepExplorerViewKind,
  PresentationLens,
  PrototypeAccessGrant,
  PrototypeMergeRequest,
  PrototypeSnapshot,
  PublishVisibility,
  ShareStudioSubTab,
  SimulatedRole,
  StorageOrigin,
  TargetScopeMode,
  WorkspaceModeId,
} from "../types";
import {
  buildInitialNotes,
  buildInitialVaults,
  slugifyVaultItem,
  type PublishNoteRecord,
  type PublishVaultRecord,
} from "./vaultInitializers";
import {
  applyReplacedAppConfig,
  applyVaultConfigPatch,
  buildVaultExportPayload,
  computeCrossVaultStats,
  type VaultConfigPatch,
} from "./vaultPublishCollabActions";

export type { PublishNoteRecord, PublishVaultRecord };

export function useVaultGovernanceState(role: SimulatedRole) {
  const [vaults, setVaults] = useState<PublishVaultRecord[]>(buildInitialVaults);
  const [notes, setNotes] = useState<PublishNoteRecord[]>(buildInitialNotes);
  const [selectedVaultId, setSelectedVaultId] = useState<string>("v-atlas");
  const [shareSubTab, setShareSubTab] = useState<ShareStudioSubTab>("publish");
  const [targetScope, setTargetScope] = useState<TargetScopeMode>("vault");
  const [selectedTargetNodeTitle, setSelectedTargetNodeTitle] = useState("sintesis-graf-pengetahuan.md");
  const [accessGrants, setAccessGrants] = useState<PrototypeAccessGrant[]>(PROTOTYPE_ACCESS_GRANTS);
  const [snapshots, setSnapshots] = useState<PrototypeSnapshot[]>(PROTOTYPE_SNAPSHOTS);
  const [selectedDiffId, setSelectedDiffId] = useState<string>(PROTOTYPE_VISUAL_DIFFS[0]?.id ?? "diff-1");
  const [mergeRequests, setMergeRequests] = useState<PrototypeMergeRequest[]>(PROTOTYPE_MERGE_REQUESTS);
  const [backupSchedule, setBackupSchedule] = useState<PrototypeBackupSchedule>(INITIAL_BACKUP_SCHEDULE);
  const [importExportLogs, setImportExportLogs] = useState<PrototypeImportExportRecord[]>(INITIAL_IMPORT_EXPORT_HISTORY);
  const [lastExportPreview, setLastExportPreview] = useState<string | null>(null);

  const selectedVault = useMemo(
    () => vaults.find((v) => v.id === selectedVaultId) ?? vaults[0],
    [selectedVaultId, vaults]
  );

  const crossVaultStats = useMemo(() => computeCrossVaultStats(vaults, notes), [notes, vaults]);

  const guardStage2 = useCallback(() => {
    if (role === "stage2_pending") {
      toast.warning("Akun Stage 2 Pending: publikasi ke /@username menunggu approval Admin.");
      return true;
    }
    return false;
  }, [role]);

  const createVault = useCallback(
    (params: { title: string; primaryMode: WorkspaceModeId; origin: StorageOrigin; lens?: PresentationLens; defaultView?: DeepExplorerViewKind }) => {
      const cleanTitle = params.title.trim() || `Vault Baru ${vaults.length + 1}`;
      const id = `v-${Date.now()}`;
      const view = params.defaultView ?? "graph";
      const lens = params.lens ?? "atlas";
      const visibility: PublishVisibility =
        params.origin === "public_listed" ? "public_listed" : params.origin === "public_unlisted" ? "public_unlisted" : params.origin === "shared" ? "shared" : "private";
      const created: PublishVaultRecord = {
        id,
        slug: slugifyVaultItem(cleanTitle),
        title: cleanTitle,
        origin: params.origin,
        lens,
        primaryMode: params.primaryMode,
        defaultDeepExplorerView: view,
        defaultHelicopterView: view,
        visibility,
        license: "CC BY-SA 4.0",
        allowCitation: true,
        allowFork: true,
        isPublished: visibility === "public_listed" || visibility === "public_unlisted",
        storageSizeKb: 48,
        connectionsCount: 4,
        yamlHealthPct: 100,
        syncStatus: params.origin === "local_folder" || params.origin === "indexed_db" ? "local_only" : "synced",
        appConfig: buildAppConfigJson({ vaultId: id, name: cleanTitle, primaryMode: params.primaryMode, defaultDeepExplorerView: view, lens, visibility }),
      };
      setVaults((prev) => [created, ...prev]);
      setSelectedVaultId(id);
      toast.success(`Vault "${cleanTitle}" dibuat.`);
      return created;
    },
    [vaults.length]
  );

  const deleteVault = useCallback(
    (vaultId: string) => {
      if (vaults.length <= 1) {
        toast.warning("Minimal 1 vault aktif harus dipertahankan.");
        return false;
      }
      const nextVaults = vaults.filter((v) => v.id !== vaultId);
      setVaults(nextVaults);
      setNotes((prev) => prev.filter((n) => n.vaultId !== vaultId));
      if (selectedVaultId === vaultId && nextVaults[0]) setSelectedVaultId(nextVaults[0].id);
      toast.info("Vault dihapus dari sesi lokal.");
      return true;
    },
    [selectedVaultId, vaults]
  );

  const toggleVaultPublish = useCallback((vaultId: string) => {
    setVaults((prev) =>
      prev.map((v) => {
        if (v.id !== vaultId) return v;
        if (!v.isPublished && guardStage2()) return v;
        const nextPub = !v.isPublished;
        const nextVis: PublishVisibility = nextPub ? (v.visibility === "private" ? "public_listed" : v.visibility) : "private";
        toast.success(nextPub ? `Vault "${v.title}" diterbitkan (${v.license})` : `Vault "${v.title}" di-unpublish ke Private`);
        return { ...v, isPublished: nextPub, visibility: nextVis, appConfig: { ...v.appConfig, publishing: { ...v.appConfig.publishing, visibility: nextVis } } };
      })
    );
  }, [guardStage2]);

  const bulkSetVaultPublish = useCallback((vaultIds: string[], publish: boolean) => {
    if (vaultIds.length === 0 || (publish && guardStage2())) return;
    const setIds = new Set(vaultIds);
    const nextVis: PublishVisibility = publish ? "public_listed" : "private";
    setVaults((prev) =>
      prev.map((v) => (setIds.has(v.id) ? { ...v, isPublished: publish, visibility: nextVis, appConfig: { ...v.appConfig, publishing: { ...v.appConfig.publishing, visibility: nextVis } } } : v))
    );
    toast.success(`${vaultIds.length} vault berhasil di-${publish ? "publish" : "unpublish"}`);
  }, [guardStage2]);

  const updateVaultConfig = useCallback((vaultId: string, patch: VaultConfigPatch) => {
    setVaults((prev) => prev.map((v) => (v.id === vaultId ? applyVaultConfigPatch(v, patch) : v)));
  }, []);

  const replaceSelectedVaultAppConfig = useCallback(
    (nextConfig: AppCentralConfigJsonV2) => {
      setVaults((prev) => prev.map((v) => (v.id === selectedVault.id ? applyReplacedAppConfig(v, nextConfig) : v)));
    },
    [selectedVault.id]
  );

  const toggleNotePublish = useCallback((noteId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== noteId) return n;
        if (!n.isPublished && guardStage2()) return n;
        if (!n.isPublished && n.isYamlPrivate) { toast.warning(`"${n.title}" dikunci visibility: private.`); return n; }
        const nextPub = !n.isPublished;
        toast.success(nextPub ? `"${n.title}" dipublikasikan` : `"${n.title}" di-unpublish`);
        return { ...n, isPublished: nextPub };
      })
    );
  }, [guardStage2]);

  const bulkSetNotePublish = useCallback((noteIds: string[], publish: boolean) => {
    if (noteIds.length === 0 || (publish && guardStage2())) return;
    const setIds = new Set(noteIds);
    let skipped = 0;
    setNotes((prev) => prev.map((n) => (!setIds.has(n.id) ? n : publish && n.isYamlPrivate ? ((skipped += 1), n) : { ...n, isPublished: publish })));
    toast.success(skipped > 0 ? `Bulk selesai (${skipped} catatan Private 🔒 tetap terlindungi)` : `${noteIds.length} catatan di-${publish ? "publish" : "unpublish"}`);
  }, [guardStage2]);

  const toggleNotePrivateLock = useCallback((noteId: string) => {
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, isYamlPrivate: !n.isYamlPrivate, isPublished: !n.isYamlPrivate ? false : n.isPublished } : n)));
  }, []);

  const addAccessGrant = useCallback((subjectHandle: string, grantRole: CollaboratorRole, scope: TargetScopeMode, crud: string[], timeWindow: string, targetName: string) => {
    const clean = subjectHandle.startsWith("@") ? subjectHandle : `@${subjectHandle}`;
    setAccessGrants((prev) => [{ id: `grant-${Date.now()}`, subjectName: clean.replace("@", ""), subjectHandle: clean, role: grantRole, scope, targetName, crudPermissions: crud, timeWindow }, ...prev]);
    toast.success(`Give Access AS ${grantRole} (${scope}) ke ${clean} tersimpan di .app/config.json`);
  }, []);

  const updateAccessGrant = useCallback((id: string, patch: Partial<Pick<PrototypeAccessGrant, "role" | "crudPermissions" | "timeWindow">>) => {
    setAccessGrants((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }, []);

  const removeAccessGrant = useCallback((id: string) => {
    setAccessGrants((prev) => prev.filter((g) => g.id !== id));
    toast.info("Akses kolaborator dicabut.");
  }, []);

  const createSnapshot = useCallback((label: string) => {
    setSnapshots((prev) => [{ id: `snap-${Date.now()}`, label: label || `snapshot-${prev.length + 1}`, timestamp: "Baru saja", author: "@dr.aras.wicaksono", summary: "Checkpoint manual sebelum restrukturisasi", changedNodesCount: 4 }, ...prev]);
    toast.success("Snapshot VCS baru berhasil dibuat.");
  }, []);

  const rollbackToSnapshot = useCallback((snap: PrototypeSnapshot) => {
    toast.success(`Rollback deterministik ke "${snap.label}" (${snap.changedNodesCount} node dipulihkan).`);
  }, []);

  const mergeKmr = useCallback((kmrId: string) => {
    setMergeRequests((prev) => prev.map((k) => (k.id === kmrId ? { ...k, status: "merged", updatedAt: "Baru saja" } : k)));
    toast.success("Knowledge Merge Request berhasil digabungkan ke cabang utama!");
  }, []);

  const rejectKmr = useCallback((kmrId: string) => {
    setMergeRequests((prev) => prev.map((k) => (k.id === kmrId ? { ...k, status: "rejected", updatedAt: "Baru saja" } : k)));
    toast.info("Knowledge Merge Request ditolak.");
  }, []);

  const updateBackupSchedule = useCallback((patch: Partial<PrototypeBackupSchedule>) => {
    setBackupSchedule((prev) => ({ ...prev, ...patch }));
    toast.success("Jadwal backup otomatis diperbarui.");
  }, []);

  const triggerManualBackup = useCallback(() => {
    setBackupSchedule((prev) => ({ ...prev, lastBackupAt: "Baru saja (terverifikasi)" }));
    createSnapshot(`backup-${new Date().toISOString().slice(0, 10)}`);
  }, [createSnapshot]);

  const simulateImportVault = useCallback((format: ImportExportFormatId, sourceLabel: string, rawConfigText?: string) => {
    if (format === "config_json" && rawConfigText) {
      const res = validateAppConfigJson(rawConfigText);
      if (!res.valid) {
        toast.error(`Impor .app/config.json ditolak: ${res.errors[0]?.message ?? "Skema tidak valid"}`);
        return false;
      }
      if (res.parsed) replaceSelectedVaultAppConfig(res.parsed);
    } else {
      createVault({ title: sourceLabel.trim() || `Imported Vault (${format})`, primaryMode: "atlas", origin: format === "obsidian_folder" ? "local_folder" : "cloud_private" });
    }
    setImportExportLogs((prev) => [{ id: `io-${Date.now()}`, direction: "import", format, label: sourceLabel.trim() || `import-${format}`, itemCount: format === "config_json" ? 1 : 12, timestamp: "Baru saja" }, ...prev]);
    return true;
  }, [createVault, replaceSelectedVaultAppConfig]);

  const simulateExportVault = useCallback((format: ImportExportFormatId) => {
    const { payload, noteCount } = buildVaultExportPayload(selectedVault, notes, format);
    setLastExportPreview(payload);
    setImportExportLogs((prev) => [{ id: `io-${Date.now()}`, direction: "export", format, label: `${selectedVault.slug}.${format === "markdown_zip" ? "zip" : "json"}`, itemCount: noteCount, timestamp: "Baru saja" }, ...prev]);
    toast.success(`Ekspor simulasi "${selectedVault.title}" (${format}) siap.`);
    return payload;
  }, [notes, selectedVault]);

  return {
    vaults, notes, selectedVaultId, setSelectedVaultId, selectedVault, createVault, deleteVault, crossVaultStats,
    shareSubTab, setShareSubTab, targetScope, setTargetScope, selectedTargetNodeTitle, setSelectedTargetNodeTitle,
    accessGrants, addAccessGrant, updateAccessGrant, removeAccessGrant,
    snapshots, createSnapshot, rollbackToSnapshot, visualDiffs: PROTOTYPE_VISUAL_DIFFS, selectedDiffId, setSelectedDiffId,
    mergeRequests, mergeKmr, rejectKmr, backupSchedule, updateBackupSchedule, triggerManualBackup,
    toggleVaultPublish, bulkSetVaultPublish, updateVaultConfig, replaceSelectedVaultAppConfig,
    toggleNotePublish, bulkSetNotePublish, toggleNotePrivateLock,
    importExportLogs, lastExportPreview, simulateImportVault, simulateExportVault,
  };
}
