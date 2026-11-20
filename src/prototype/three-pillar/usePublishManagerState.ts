import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getVaultManager } from "@/domains/vault/shared/api/VaultManagerSingleton";
import { useNodeStore, useVaultStore } from "@/global/stores";
import {
  buildAppConfigJson,
  PROTOTYPE_ACCESS_GRANTS,
  PROTOTYPE_EDITOR_FILES,
  PROTOTYPE_MERGE_REQUESTS,
  PROTOTYPE_SNAPSHOTS,
  PROTOTYPE_VAULTS,
} from "./mockData";
import type {
  AppCentralConfigJson,
  CollaboratorRole,
  HelicopterViewKind,
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
} from "./types";

export interface PublishVaultRecord {
  id: string;
  slug: string;
  title: string;
  origin: StorageOrigin;
  lens: PresentationLens;
  primaryMode: WorkspaceModeId;
  defaultHelicopterView: HelicopterViewKind;
  visibility: PublishVisibility;
  license: string;
  allowCitation: boolean;
  allowFork: boolean;
  isPublished: boolean;
  isRealLiveVault?: boolean;
  appConfig: AppCentralConfigJson;
}

export interface PublishNoteRecord {
  id: string;
  vaultId: string;
  title: string;
  folder: string;
  slug: string;
  epistemicStatus: string;
  isPublished: boolean;
  isYamlPrivate: boolean;
}

const slugify = (raw: string) =>
  raw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";

function buildInitialVaults(): PublishVaultRecord[] {
  return PROTOTYPE_VAULTS.map((v) => ({
    id: v.id,
    slug: v.slug,
    title: v.title,
    origin: v.origin,
    lens: v.lens,
    primaryMode: v.primaryMode,
    defaultHelicopterView: v.defaultHelicopterView,
    visibility: v.appConfig.publishing.visibility,
    license: v.appConfig.publishing.license,
    allowCitation: v.appConfig.publishing.allow_citation,
    allowFork: v.appConfig.publishing.allow_fork,
    isPublished: v.origin === "public_listed" || v.origin === "public_unlisted",
    appConfig: v.appConfig,
  }));
}

function buildInitialNotes(): PublishNoteRecord[] {
  const fromFiles: PublishNoteRecord[] = PROTOTYPE_EDITOR_FILES.map((f) => ({
    id: f.id,
    vaultId: f.vaultId,
    title: f.name.replace(/\.md$/i, ""),
    folder: f.folder,
    slug: slugify(f.name.replace(/\.md$/i, "")),
    epistemicStatus: f.status,
    isPublished: f.visibility === "public",
    isYamlPrivate: f.visibility === "private",
  }));
  const extras: PublishNoteRecord[] = [
    { id: "n-ex-1", vaultId: "v-atlas", title: "peta-epistemologi-kognisi", folder: "01-Fondasi", slug: "peta-epistemologi-kognisi", epistemicStatus: "evergreen", isPublished: true, isYamlPrivate: false },
    { id: "n-ex-2", vaultId: "v-atlas", title: "referensi-zettelkasten-luhmann", folder: "03-Referensi", slug: "referensi-zettelkasten-luhmann", epistemicStatus: "budding", isPublished: false, isYamlPrivate: false },
    { id: "n-ex-3", vaultId: "v-lms", title: "modul-01-dasar-graf", folder: "Kurikulum-LMS", slug: "modul-01-dasar-graf", epistemicStatus: "evergreen", isPublished: true, isYamlPrivate: false },
    { id: "n-ex-4", vaultId: "v-lms", title: "modul-02-properti-dag", folder: "Kurikulum-LMS", slug: "modul-02-properti-dag", epistemicStatus: "evergreen", isPublished: true, isYamlPrivate: false },
    { id: "n-ex-5", vaultId: "v-lms", title: "kunci-jawaban-evaluasi", folder: "99-Private-Drafts", slug: "kunci-jawaban-evaluasi", epistemicStatus: "seedling", isPublished: false, isYamlPrivate: true },
    { id: "n-ex-6", vaultId: "v-shared", title: "notulensi-sprint-lab-itb", folder: "Rapat", slug: "notulensi-sprint-lab-itb", epistemicStatus: "budding", isPublished: false, isYamlPrivate: false },
    { id: "n-ex-7", vaultId: "v-cloud-priv", title: "bab-1-tinjauan-pustaka", folder: "Disertasi", slug: "bab-1-tinjauan-pustaka", epistemicStatus: "budding", isPublished: false, isYamlPrivate: true },
  ];
  return [...fromFiles, ...extras];
}

export function usePublishManagerState(role: SimulatedRole) {
  const currentVaultId = useVaultStore((s) => s.currentVaultId);
  const liveNodes = useNodeStore((s) => s.nodes);
  const [vaults, setVaults] = useState<PublishVaultRecord[]>(buildInitialVaults);
  const [notes, setNotes] = useState<PublishNoteRecord[]>(buildInitialNotes);
  const [selectedVaultId, setSelectedVaultId] = useState<string>("v-atlas");

  // Unified "Share · Access · Versions" state
  const [shareSubTab, setShareSubTab] = useState<ShareStudioSubTab>("publish");
  const [targetScope, setTargetScope] = useState<TargetScopeMode>("vault");
  const [selectedTargetNodeTitle, setSelectedTargetNodeTitle] = useState<string>("sintesis-graf-pengetahuan.md");
  const [accessGrants, setAccessGrants] = useState<PrototypeAccessGrant[]>(PROTOTYPE_ACCESS_GRANTS);
  const [snapshots, setSnapshots] = useState<PrototypeSnapshot[]>(PROTOTYPE_SNAPSHOTS);
  const [mergeRequests, setMergeRequests] = useState<PrototypeMergeRequest[]>(PROTOTYPE_MERGE_REQUESTS);

  useEffect(() => {
    const liveVault = currentVaultId ? getVaultManager().getVault(currentVaultId) : null;
    if (!liveVault) return;
    setVaults((prev) => {
      if (prev.some((v) => v.id === liveVault.id)) return prev;
      const appConfig = buildAppConfigJson({
        vaultId: liveVault.id,
        name: liveVault.name,
        primaryMode: "atlas",
        defaultHelicopterView: "graph",
        lens: "atlas",
        visibility: "private",
      });
      return [
        {
          id: liveVault.id,
          slug: slugify(liveVault.name),
          title: liveVault.name,
          origin: liveVault.location === "folder" ? "local_folder" : "cloud_private",
          lens: "atlas",
          primaryMode: "atlas",
          defaultHelicopterView: "graph",
          visibility: "private",
          license: "CC BY-SA 4.0",
          allowCitation: true,
          allowFork: true,
          isPublished: false,
          isRealLiveVault: true,
          appConfig,
        },
        ...prev,
      ];
    });
    setSelectedVaultId((prev) => (prev === "v-atlas" ? liveVault.id : prev));

    const fileNodes = liveNodes.filter((n) => n.type === "file");
    if (fileNodes.length > 0) {
      setNotes((prev) => {
        const existingMap = new Map(prev.map((n) => [n.id, n]));
        const others = prev.filter((n) => n.vaultId !== liveVault.id);
        const mapped: PublishNoteRecord[] = fileNodes.map((n) => {
          const existing = existingMap.get(n.id);
          const yamlPriv = /^---[\s\S]*?\bvisibility:\s*private\b[\s\S]*?---/m.test(n.content);
          if (existing) return { ...existing, title: n.name.replace(/\.md$/i, ""), isYamlPrivate: existing.isYamlPrivate || yamlPriv };
          return {
            id: n.id, vaultId: liveVault.id, title: n.name.replace(/\.md$/i, ""), folder: "Workspace",
            slug: slugify(n.name.replace(/\.md$/i, "")), epistemicStatus: "budding", isPublished: !yamlPriv, isYamlPrivate: yamlPriv,
          };
        });
        return [...mapped, ...others];
      });
    }
  }, [currentVaultId, liveNodes]);

  const guardStage2 = useCallback(() => {
    if (role === "stage2_pending") {
      toast.warning("Akun Stage 2 Pending: publikasi ke /@username menunggu approval Admin.");
      return true;
    }
    return false;
  }, [role]);

  const toggleVaultPublish = useCallback((vaultId: string) => {
    setVaults((prev) =>
      prev.map((v) => {
        if (v.id !== vaultId) return v;
        if (!v.isPublished && guardStage2()) return v;
        const nextPub = !v.isPublished;
        const nextVis: PublishVisibility = nextPub ? (v.visibility === "private" ? "public_listed" : v.visibility) : "private";
        toast.success(nextPub ? `Vault "${v.title}" diterbitkan (${v.license})` : `Vault "${v.title}" di-unpublish ke Private`);
        return {
          ...v,
          isPublished: nextPub,
          visibility: nextVis,
          appConfig: { ...v.appConfig, publishing: { ...v.appConfig.publishing, visibility: nextVis } },
        };
      })
    );
  }, [guardStage2]);

  const bulkSetVaultPublish = useCallback((vaultIds: string[], publish: boolean) => {
    if (vaultIds.length === 0 || (publish && guardStage2())) return;
    const setIds = new Set(vaultIds);
    const nextVis: PublishVisibility = publish ? "public_listed" : "private";
    setVaults((prev) =>
      prev.map((v) =>
        setIds.has(v.id)
          ? { ...v, isPublished: publish, visibility: nextVis, appConfig: { ...v.appConfig, publishing: { ...v.appConfig.publishing, visibility: nextVis } } }
          : v
      )
    );
    toast.success(`${vaultIds.length} vault berhasil di-${publish ? "publish" : "unpublish"}`);
  }, [guardStage2]);

  const updateVaultConfig = useCallback(
    (
      vaultId: string,
      patch: Partial<Pick<PublishVaultRecord, "lens" | "visibility" | "allowCitation" | "allowFork" | "primaryMode" | "defaultHelicopterView">>
    ) => {
      setVaults((prev) =>
        prev.map((v) => {
          if (v.id !== vaultId) return v;
          const next = { ...v, ...patch };
          const isPublished = patch.visibility ? patch.visibility === "public_listed" || patch.visibility === "public_unlisted" : next.isPublished;
          return {
            ...next,
            isPublished,
            appConfig: {
              ...next.appConfig,
              mode: { ...next.appConfig.mode, primary_mode: next.primaryMode, default_helicopter_view: next.defaultHelicopterView },
              publishing: { ...next.appConfig.publishing, default_lens: next.lens, visibility: next.visibility, allow_citation: next.allowCitation, allow_fork: next.allowFork },
            },
          };
        })
      );
    },
    []
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

  const selectedVault = useMemo(() => vaults.find((v) => v.id === selectedVaultId) ?? vaults[0], [selectedVaultId, vaults]);

  return {
    vaults, notes, selectedVaultId, setSelectedVaultId, selectedVault,
    shareSubTab, setShareSubTab, targetScope, setTargetScope, selectedTargetNodeTitle, setSelectedTargetNodeTitle,
    accessGrants, addAccessGrant, removeAccessGrant,
    snapshots, createSnapshot, rollbackToSnapshot,
    mergeRequests, mergeKmr,
    toggleVaultPublish, bulkSetVaultPublish, updateVaultConfig,
    toggleNotePublish, bulkSetNotePublish, toggleNotePrivateLock,
  };
}
