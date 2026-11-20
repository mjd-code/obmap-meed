import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { validateAppConfigJson } from "../configSchemaValidator";
import {
  applyPresetToConfig,
  BUILT_IN_PRESETS,
  COMMUNITY_PRESETS,
  computePresetImpactDiff,
  INITIAL_USER_CUSTOM_PRESETS,
} from "../presetCatalogData";
import type {
  PrototypeAppearanceState,
  PrototypeVisualEngineState,
  WorkspacePresetEntry,
} from "../settingsTypes";
import type { AppCentralConfigJsonV2 } from "../vcsAndConfigTypes";
import { buildCustomPresetFromLive, buildLiveConfigSnapshot } from "./configBlockMappers";
import type {
  PrototypeDeepExplorerState,
  PrototypePresetConfigState,
} from "./prototypeStateTypes";

export function usePresetAndConfigState(params: {
  baseConfig: AppCentralConfigJsonV2;
  appearanceState: PrototypeAppearanceState;
  visualEngineState: PrototypeVisualEngineState;
  deepExplorerState: PrototypeDeepExplorerState;
  onHydrateFromConfig: (cfg: AppCentralConfigJsonV2) => void;
}): PrototypePresetConfigState {
  const { baseConfig, appearanceState, visualEngineState, deepExplorerState, onHydrateFromConfig } = params;
  const [customPresets, setCustomPresets] = useState<WorkspacePresetEntry[]>(INITIAL_USER_CUSTOM_PRESETS);
  const [activePresetId, setActivePresetId] = useState<string>(baseConfig.mode.active_preset_id);
  const [pendingPresetId, setPendingPresetId] = useState<string | null>(null);
  const [isRawDirty, setIsRawDirty] = useState(false);

  useEffect(() => {
    setActivePresetId(baseConfig.mode.active_preset_id);
    setIsRawDirty(false);
  }, [baseConfig.meta.vault_id, baseConfig.mode.active_preset_id]);

  const liveConfig = useMemo<AppCentralConfigJsonV2>(
    () => buildLiveConfigSnapshot({ baseConfig, activePresetId, appearanceState, visualEngineState, deepExplorerState }),
    [activePresetId, appearanceState, baseConfig, deepExplorerState, visualEngineState]
  );

  const [rawDraft, setRawDraftState] = useState<string>(() => JSON.stringify(liveConfig, null, 2));

  useEffect(() => {
    if (!isRawDirty) setRawDraftState(JSON.stringify(liveConfig, null, 2));
  }, [isRawDirty, liveConfig]);

  const allPresets = useMemo(
    () => [...BUILT_IN_PRESETS, ...customPresets, ...COMMUNITY_PRESETS],
    [customPresets]
  );

  const pendingPreset = useMemo(
    () => (pendingPresetId ? allPresets.find((p) => p.id === pendingPresetId) ?? null : null),
    [allPresets, pendingPresetId]
  );

  const pendingImpactDiff = useMemo(
    () => (pendingPreset ? computePresetImpactDiff(liveConfig, pendingPreset) : []),
    [liveConfig, pendingPreset]
  );

  const validationResult = useMemo(() => validateAppConfigJson(rawDraft), [rawDraft]);

  const stagePresetForPreview = useCallback((presetId: string) => setPendingPresetId(presetId), []);
  const cancelPresetPreview = useCallback(() => setPendingPresetId(null), []);

  const confirmApplyPreset = useCallback(() => {
    if (!pendingPreset) return false;
    const nextConfig = applyPresetToConfig(liveConfig, pendingPreset);
    const check = validateAppConfigJson(JSON.stringify(nextConfig, null, 2));
    if (!check.valid || !check.parsed) {
      toast.error("Preset gagal divalidasi terhadap Schema v2.");
      return false;
    }
    setActivePresetId(pendingPreset.id);
    setPendingPresetId(null);
    setIsRawDirty(false);
    onHydrateFromConfig(check.parsed);
    toast.success(`Preset "${pendingPreset.name}" diterapkan ke .app/config.json.`);
    return true;
  }, [liveConfig, onHydrateFromConfig, pendingPreset]);

  const createCustomPreset = useCallback(
    (name: string, description: string, basePresetId?: string): WorkspacePresetEntry => {
      const entry = buildCustomPresetFromLive({
        name,
        description,
        template: allPresets.find((p) => p.id === basePresetId),
        liveConfig,
        deepExplorerState,
        visualEngineState,
        appearanceState,
        fallbackIndex: customPresets.length + 1,
      });
      setCustomPresets((prev) => [entry, ...prev]);
      toast.success(`Custom Preset "${entry.name}" disimpan.`);
      return entry;
    },
    [allPresets, appearanceState, customPresets.length, deepExplorerState, liveConfig, visualEngineState]
  );

  const updateCustomPreset = useCallback(
    (presetId: string, patch: Partial<Pick<WorkspacePresetEntry, "name" | "description">>) => {
      setCustomPresets((prev) => prev.map((p) => (p.id === presetId ? { ...p, ...patch } : p)));
    },
    []
  );

  const duplicatePreset = useCallback(
    (presetId: string) => {
      const src = allPresets.find((p) => p.id === presetId);
      if (!src) return null;
      const copy: WorkspacePresetEntry = {
        ...src,
        id: `custom-${Date.now()}`,
        name: `${src.name} (Copy)`,
        group: "user_custom",
        origin: "user_custom",
        isDefault: false,
        previewOnly: false,
        badge: "Duplicated Custom",
        configPatch: { ...src.configPatch, presetOrigin: "user_custom" },
      };
      setCustomPresets((prev) => [copy, ...prev]);
      toast.success(`Preset "${src.name}" diduplikasi ke User Custom Presets.`);
      return copy;
    },
    [allPresets]
  );

  const deleteCustomPreset = useCallback((presetId: string) => {
    setCustomPresets((prev) => prev.filter((p) => p.id !== presetId));
    toast.info("Custom preset dihapus.");
  }, []);

  const setDefaultCustomPreset = useCallback((presetId: string) => {
    setCustomPresets((prev) =>
      prev.map((p) => ({
        ...p,
        isDefault: p.id === presetId,
        badge: p.id === presetId ? "Default Custom" : undefined,
      }))
    );
    toast.success("Custom preset ditetapkan sebagai default.");
  }, []);

  const adoptCommunityPreset = useCallback((presetId: string, customize = false) => {
    const target = COMMUNITY_PRESETS.find((p) => p.id === presetId);
    if (!target) return null;
    if (customize) {
      const adopted: WorkspacePresetEntry = {
        ...target,
        id: `custom-${Date.now()}`,
        name: `${target.name} (Customized)`,
        group: "user_custom",
        origin: "user_custom",
        badge: "Adopted Custom",
        configPatch: { ...target.configPatch, presetOrigin: "user_custom" },
      };
      setCustomPresets((prev) => [adopted, ...prev]);
      setPendingPresetId(adopted.id);
      toast.success(`Community preset disalin ke Custom Presets untuk pratinjau.`);
      return adopted;
    }
    setPendingPresetId(target.id);
    return target;
  }, []);

  const setRawDraft = useCallback((next: string) => {
    setIsRawDirty(true);
    setRawDraftState(next);
  }, []);

  const formatRawConfigJson = useCallback(() => {
    const check = validateAppConfigJson(rawDraft);
    if (!check.valid || !check.parsed) {
      toast.error("Tidak dapat memformat JSON sebelum sintaks/skema valid.");
      return false;
    }
    setRawDraftState(JSON.stringify(check.parsed, null, 2));
    toast.success("JSON .app/config.json dirapikan.");
    return true;
  }, [rawDraft]);

  const applyRawConfigJson = useCallback(() => {
    const check = validateAppConfigJson(rawDraft);
    if (!check.valid || !check.parsed) {
      toast.error("Penyimpanan ditolak: perbaiki error Schema v2 terlebih dahulu.");
      return check;
    }
    setIsRawDirty(false);
    setActivePresetId(check.parsed.mode.active_preset_id);
    onHydrateFromConfig(check.parsed);
    toast.success("Perubahan .app/config.json Schema v2 diterapkan.");
    return check;
  }, [onHydrateFromConfig, rawDraft]);

  const resetConfigToDefault = useCallback(() => {
    setIsRawDirty(false);
    setRawDraftState(JSON.stringify(liveConfig, null, 2));
    toast.info("Draf .app/config.json disinkronkan ulang ke status aktif.");
  }, [liveConfig]);

  return {
    builtInPresets: BUILT_IN_PRESETS,
    customPresets,
    communityPresets: COMMUNITY_PRESETS,
    activePresetId,
    pendingPresetId,
    pendingPreset,
    pendingImpactDiff,
    stagePresetForPreview,
    confirmApplyPreset,
    cancelPresetPreview,
    createCustomPreset,
    updateCustomPreset,
    duplicatePreset,
    deleteCustomPreset,
    setDefaultCustomPreset,
    adoptCommunityPreset,
    liveConfig,
    rawDraft,
    isRawDirty,
    validationResult,
    setRawDraft,
    formatRawConfigJson,
    applyRawConfigJson,
    resetConfigToDefault,
  };
}
