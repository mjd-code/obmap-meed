import type { PrototypeCrossVaultStats } from "../settingsTypes";
import type { AppCentralConfigJsonV2, PublishVisibility } from "../types";
import type { PublishNoteRecord, PublishVaultRecord } from "./vaultInitializers";

export function computeCrossVaultStats(
  vaults: PublishVaultRecord[],
  notes: PublishNoteRecord[]
): PrototypeCrossVaultStats {
  const totalVaults = vaults.length;
  const totalNotes = notes.length;
  const totalConnections = vaults.reduce((acc, v) => acc + v.connectionsCount, 0);
  const localStorageKb = vaults
    .filter((v) => v.origin === "local_folder" || v.origin === "indexed_db")
    .reduce((acc, v) => acc + v.storageSizeKb, 0);
  const cloudStorageKb = vaults
    .filter((v) => v.origin !== "local_folder" && v.origin !== "indexed_db")
    .reduce((acc, v) => acc + v.storageSizeKb, 0);
  const avgYamlHealthPct = totalVaults
    ? Math.round(vaults.reduce((acc, v) => acc + v.yamlHealthPct, 0) / totalVaults)
    : 100;
  const syncedVaultsCount = vaults.filter((v) => v.syncStatus === "synced").length;
  return {
    totalVaults,
    totalNotes,
    totalConnections,
    localStorageKb,
    cloudStorageKb,
    avgYamlHealthPct,
    syncedVaultsCount,
  };
}

export type VaultConfigPatch = Partial<
  Pick<
    PublishVaultRecord,
    | "lens"
    | "visibility"
    | "allowCitation"
    | "allowFork"
    | "primaryMode"
    | "defaultDeepExplorerView"
    | "defaultHelicopterView"
  >
>;

export function applyVaultConfigPatch(
  vault: PublishVaultRecord,
  patch: VaultConfigPatch
): PublishVaultRecord {
  const resolvedView =
    patch.defaultDeepExplorerView ?? patch.defaultHelicopterView ?? vault.defaultDeepExplorerView;
  const next = {
    ...vault,
    ...patch,
    defaultDeepExplorerView: resolvedView,
    defaultHelicopterView: resolvedView,
  };
  const isPublished = patch.visibility
    ? patch.visibility === "public_listed" || patch.visibility === "public_unlisted"
    : next.isPublished;
  return {
    ...next,
    isPublished,
    appConfig: {
      ...next.appConfig,
      mode: { ...next.appConfig.mode, primary_mode: next.primaryMode },
      deep_explorer: { ...next.appConfig.deep_explorer, default_view: resolvedView },
      publishing: {
        ...next.appConfig.publishing,
        default_lens: next.lens,
        visibility: next.visibility,
        allow_citation: next.allowCitation,
        allow_fork: next.allowFork,
      },
    },
  };
}

export function applyReplacedAppConfig(
  vault: PublishVaultRecord,
  nextConfig: AppCentralConfigJsonV2
): PublishVaultRecord {
  const nextVis: PublishVisibility = nextConfig.publishing.visibility;
  return {
    ...vault,
    primaryMode: nextConfig.mode.primary_mode,
    defaultDeepExplorerView: nextConfig.deep_explorer.default_view,
    defaultHelicopterView: nextConfig.deep_explorer.default_view,
    lens: nextConfig.publishing.default_lens,
    visibility: nextVis,
    license: nextConfig.publishing.license,
    allowCitation: nextConfig.publishing.allow_citation,
    allowFork: nextConfig.publishing.allow_fork,
    isPublished: nextVis === "public_listed" || nextVis === "public_unlisted",
    appConfig: nextConfig,
  };
}

export function buildVaultExportPayload(
  selectedVault: PublishVaultRecord,
  notes: PublishNoteRecord[],
  format: string
): { payload: string; noteCount: number } {
  const noteCount = notes.filter((n) => n.vaultId === selectedVault.id).length;
  const payload =
    format === "community_preset"
      ? JSON.stringify(
          {
            preset_name: selectedVault.title,
            mode: selectedVault.appConfig.mode,
            deep_explorer: selectedVault.appConfig.deep_explorer,
            visual_engine: selectedVault.appConfig.visual_engine,
          },
          null,
          2
        )
      : JSON.stringify(
          {
            vault: selectedVault.title,
            format,
            exported_notes: noteCount,
            app_config: selectedVault.appConfig,
          },
          null,
          2
        );
  return { payload, noteCount };
}
