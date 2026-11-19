import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getVaultManager } from "@/domains/vault/shared/api/VaultManagerSingleton";
import { useNodeStore, useVaultStore } from "@/global/stores";
import { PROTOTYPE_EDITOR_FILES, PROTOTYPE_VAULTS } from "./mockData";
import type { PresentationLens, PublishVisibility, SimulatedRole, StorageOrigin } from "./types";

export interface PublishVaultRecord {
  id: string;
  slug: string;
  title: string;
  origin: StorageOrigin;
  lens: PresentationLens;
  visibility: PublishVisibility;
  isPublished: boolean;
  isRealLiveVault?: boolean;
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
    visibility:
      v.origin === "public_listed"
        ? "public_listed"
        : v.origin === "public_unlisted"
          ? "public_unlisted"
          : v.origin === "shared"
            ? "shared"
            : "private",
    isPublished: v.origin === "public_listed" || v.origin === "public_unlisted",
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

  // Sync real active vault & notes from VaultManager/useNodeStore into manager state
  useEffect(() => {
    const liveVault = currentVaultId ? getVaultManager().getVault(currentVaultId) : null;
    if (!liveVault) return;
    setVaults((prev) => {
      if (prev.some((v) => v.id === liveVault.id)) return prev;
      return [
        {
          id: liveVault.id,
          slug: slugify(liveVault.name),
          title: liveVault.name,
          origin: liveVault.location === "folder" ? "local_folder" : "cloud_private",
          lens: "atlas",
          visibility: "private",
          isPublished: false,
          isRealLiveVault: true,
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
            id: n.id,
            vaultId: liveVault.id,
            title: n.name.replace(/\.md$/i, ""),
            folder: "Workspace",
            slug: slugify(n.name.replace(/\.md$/i, "")),
            epistemicStatus: "budding",
            isPublished: !yamlPriv,
            isYamlPrivate: yamlPriv,
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
        toast.success(nextPub ? `Vault "${v.title}" diterbitkan (CC BY-SA 4.0)` : `Vault "${v.title}" di-unpublish ke Private`);
        return { ...v, isPublished: nextPub, visibility: nextPub ? (v.visibility === "private" ? "public_listed" : v.visibility) : "private" };
      })
    );
  }, [guardStage2]);

  const bulkSetVaultPublish = useCallback((vaultIds: string[], publish: boolean) => {
    if (vaultIds.length === 0) return;
    if (publish && guardStage2()) return;
    const setIds = new Set(vaultIds);
    setVaults((prev) =>
      prev.map((v) =>
        setIds.has(v.id)
          ? { ...v, isPublished: publish, visibility: publish ? "public_listed" : "private" }
          : v
      )
    );
    toast.success(`${vaultIds.length} vault berhasil di-${publish ? "publish" : "unpublish"}`);
  }, [guardStage2]);

  const updateVaultConfig = useCallback((vaultId: string, patch: Partial<Pick<PublishVaultRecord, "lens" | "visibility">>) => {
    setVaults((prev) => prev.map((v) => (v.id === vaultId ? { ...v, ...patch, isPublished: patch.visibility ? patch.visibility === "public_listed" || patch.visibility === "public_unlisted" : v.isPublished } : v)));
  }, []);

  const toggleNotePublish = useCallback((noteId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== noteId) return n;
        if (!n.isPublished && guardStage2()) return n;
        if (!n.isPublished && n.isYamlPrivate) {
          toast.warning(`"${n.title}" dikunci visibility: private. Buka kunci dulu untuk publish.`);
          return n;
        }
        const nextPub = !n.isPublished;
        toast.success(nextPub ? `"${n.title}" dipublikasikan` : `"${n.title}" di-unpublish`);
        return { ...n, isPublished: nextPub };
      })
    );
  }, [guardStage2]);

  const bulkSetNotePublish = useCallback((noteIds: string[], publish: boolean) => {
    if (noteIds.length === 0) return;
    if (publish && guardStage2()) return;
    const setIds = new Set(noteIds);
    let skippedPrivate = 0;
    setNotes((prev) =>
      prev.map((n) => {
        if (!setIds.has(n.id)) return n;
        if (publish && n.isYamlPrivate) {
          skippedPrivate += 1;
          return n;
        }
        return { ...n, isPublished: publish };
      })
    );
    toast.success(
      skippedPrivate > 0
        ? `Bulk ${publish ? "Publish" : "Unpublish"} selesai (${skippedPrivate} catatan Private 🔒 tetap terlindungi)`
        : `${noteIds.length} catatan berhasil di-${publish ? "publish" : "unpublish"}`
    );
  }, [guardStage2]);

  const toggleNotePrivateLock = useCallback((noteId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== noteId) return n;
        const nextPriv = !n.isYamlPrivate;
        toast.info(nextPriv ? `"${n.title}" dikunci (visibility: private)` : `Kunci private "${n.title}" dibuka`);
        return { ...n, isYamlPrivate: nextPriv, isPublished: nextPriv ? false : n.isPublished };
      })
    );
  }, []);

  const selectedVault = useMemo(
    () => vaults.find((v) => v.id === selectedVaultId) ?? vaults[0],
    [selectedVaultId, vaults]
  );

  return {
    vaults,
    notes,
    selectedVaultId,
    setSelectedVaultId,
    selectedVault,
    toggleVaultPublish,
    bulkSetVaultPublish,
    updateVaultConfig,
    toggleNotePublish,
    bulkSetNotePublish,
    toggleNotePrivateLock,
  };
}
