import { useState } from "react";
import {
  HIERARCHY_PRESETS,
  presetById,
  generateHarmonyPalette,
  transformPaletteSpreadAndSaturation,
  type HierarchyColorConfig,
  type HierarchyPresetId,
  type HierarchyOverflow,
} from "@/domains/graph/shared/utils/hierarchyColors";
import type { NodeConfig } from "@/domains/graph/shared/stores/useGraphStore";

export type ColorEngineMode = "hierarchy" | "categorical" | "custom";
export { HIERARCHY_PRESETS, type HierarchyPresetId, type HierarchyOverflow };

export interface UseGraphColorEngineControllerProps {
  hierarchy: HierarchyColorConfig;
  nodeConfig: NodeConfig;
  onHierarchyUpdate: (updates: Partial<HierarchyColorConfig>) => void;
  onNodeConfigUpdate: (updates: Partial<NodeConfig>) => void;
}

export function useGraphColorEngineController({
  hierarchy,
  nodeConfig,
  onHierarchyUpdate,
  onNodeConfigUpdate,
}: UseGraphColorEngineControllerProps) {
  const activeMode: ColorEngineMode = hierarchy.enabled
    ? "hierarchy"
    : nodeConfig.autoColorBy === "tags" || nodeConfig.autoColorBy === "branch"
      ? "categorical"
      : "custom";

  const [colorSpread, setColorSpread] = useState(1.0);
  const [saturationShift, setSaturationShift] = useState(0);

  const handleModeChange = (mode: ColorEngineMode) => {
    if (mode === "hierarchy") {
      onHierarchyUpdate({ enabled: true });
      onNodeConfigUpdate({ autoColorBy: "depth" });
    } else if (mode === "categorical") {
      onHierarchyUpdate({ enabled: false });
      if (nodeConfig.autoColorBy !== "tags" && nodeConfig.autoColorBy !== "branch") {
        onNodeConfigUpdate({ autoColorBy: "tags" });
      }
    } else {
      onHierarchyUpdate({ enabled: false });
      onNodeConfigUpdate({ autoColorBy: "type" });
    }
  };

  const handleApplyPreset = (presetId: HierarchyPresetId) => {
    const found = presetById(presetId);
    if (found) {
      onHierarchyUpdate({
        enabled: true,
        preset: presetId,
        levelColors: [...found.colors],
      });
      onNodeConfigUpdate({ autoColorBy: "depth" });
    }
  };

  const handleGenerateHarmony = () => {
    const base = hierarchy.levelColors[0] || "hsl(45, 95%, 60%)";
    const newColors = generateHarmonyPalette(base, Math.max(4, hierarchy.levelColors.length));
    onHierarchyUpdate({
      enabled: true,
      preset: "custom",
      levelColors: newColors,
    });
    onNodeConfigUpdate({ autoColorBy: "depth" });
  };

  const handleApplySpreadAndSat = (spread: number, sat: number) => {
    setColorSpread(spread);
    setSaturationShift(sat);
    const updated = transformPaletteSpreadAndSaturation(hierarchy.levelColors, spread, sat);
    onHierarchyUpdate({ levelColors: updated, preset: "custom" });
  };

  const setLevelColor = (index: number, color: string) => {
    const nextColors = [...hierarchy.levelColors];
    nextColors[index] = color;
    onHierarchyUpdate({ levelColors: nextColors, preset: "custom" });
  };

  const addLevel = () => {
    const lastColor =
      hierarchy.levelColors[hierarchy.levelColors.length - 1] || "hsl(200, 80%, 55%)";
    onHierarchyUpdate({
      levelColors: [...hierarchy.levelColors, lastColor],
      preset: "custom",
    });
  };

  const removeLevel = (index: number) => {
    if (hierarchy.levelColors.length <= 2) return;
    onHierarchyUpdate({
      levelColors: hierarchy.levelColors.filter((_, i) => i !== index),
      preset: "custom",
    });
  };

  return {
    activeMode,
    colorSpread,
    saturationShift,
    handleModeChange,
    handleApplyPreset,
    handleGenerateHarmony,
    handleApplySpreadAndSat,
    setLevelColor,
    addLevel,
    removeLevel,
  };
}
