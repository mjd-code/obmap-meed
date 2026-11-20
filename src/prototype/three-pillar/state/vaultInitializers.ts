import { PROTOTYPE_EDITOR_FILES } from "../mockEditorData";
import { PROTOTYPE_VAULTS } from "../mockProfileData";
import type {
  AppCentralConfigJsonV2,
  DeepExplorerViewKind,
  PresentationLens,
  PublishVisibility,
  StorageOrigin,
  WorkspaceModeId,
} from "../types";

export interface PublishVaultRecord {
  id: string;
  slug: string;
  title: string;
  origin: StorageOrigin;
  lens: PresentationLens;
  primaryMode: WorkspaceModeId;
  defaultDeepExplorerView: DeepExplorerViewKind;
  // @deprecated M1->M2/M3 compat shim
  defaultHelicopterView?: DeepExplorerViewKind;
  visibility: PublishVisibility;
  license: string;
  allowCitation: boolean;
  allowFork: boolean;
  isPublished: boolean;
  isRealLiveVault?: boolean;
  storageSizeKb: number;
  connectionsCount: number;
  yamlHealthPct: number;
  syncStatus: "synced" | "local_only" | "pending";
  appConfig: AppCentralConfigJsonV2;
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

export function slugifyVaultItem(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
}

export function buildInitialVaults(): PublishVaultRecord[] {
  return PROTOTYPE_VAULTS.map((v) => ({
    id: v.id,
    slug: v.slug,
    title: v.title,
    origin: v.origin,
    lens: v.lens,
    primaryMode: v.primaryMode,
    defaultDeepExplorerView: v.defaultDeepExplorerView,
    defaultHelicopterView: v.defaultDeepExplorerView,
    visibility: v.appConfig.publishing.visibility,
    license: v.appConfig.publishing.license,
    allowCitation: v.appConfig.publishing.allow_citation,
    allowFork: v.appConfig.publishing.allow_fork,
    isPublished: v.origin === "public_listed" || v.origin === "public_unlisted",
    storageSizeKb: v.storageSizeKb,
    connectionsCount: v.connectionsCount,
    yamlHealthPct: v.yamlHealthPct,
    syncStatus: v.syncStatus,
    appConfig: structuredClone(v.appConfig),
  }));
}

export function buildInitialNotes(): PublishNoteRecord[] {
  const fromFiles: PublishNoteRecord[] = PROTOTYPE_EDITOR_FILES.map((f) => ({
    id: f.id,
    vaultId: f.vaultId,
    title: f.name.replace(/\.md$/i, ""),
    folder: f.folder,
    slug: slugifyVaultItem(f.name.replace(/\.md$/i, "")),
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
