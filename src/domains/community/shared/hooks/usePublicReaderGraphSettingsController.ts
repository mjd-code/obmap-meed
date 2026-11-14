import { useState } from "react";
import type { GraphConfigState } from "@/domains/graph/shared/stores/useGraphStore";
import type { LayoutMode } from "@/domains/graph/shared/utils/graph.types";

export interface ColorThemePreset {
  id: string;
  name: string;
  fileColor: string;
  folderColor: string;
  linkColor: string;
  accentColor: string;
}

export const GRAPH_THEME_PRESETS: ColorThemePreset[] = [
  {
    id: "default",
    name: "Classic ObMap",
    fileColor: "#3b82f6",
    folderColor: "#eab308",
    linkColor: "#60a5fa",
    accentColor: "#2563eb",
  },
  {
    id: "obsidian",
    name: "Obsidian Violet",
    fileColor: "#a855f7",
    folderColor: "#ec4899",
    linkColor: "#c084fc",
    accentColor: "#9333ea",
  },
  {
    id: "emerald",
    name: "Cyber Emerald",
    fileColor: "#10b981",
    folderColor: "#06b6d4",
    linkColor: "#34d399",
    accentColor: "#059669",
  },
  {
    id: "sunset",
    name: "Warm Sunset",
    fileColor: "#f97316",
    folderColor: "#ef4444",
    linkColor: "#fb923c",
    accentColor: "#ea580c",
  },
  {
    id: "slate",
    name: "Monochrome Slate",
    fileColor: "#94a3b8",
    folderColor: "#cbd5e1",
    linkColor: "#64748b",
    accentColor: "#475569",
  },
];

export const AVAILABLE_LAYOUTS: Array<{ id: LayoutMode; label: string; desc: string }> = [
  { id: "free-force", label: "Free Force", desc: "Simulasi pegas dinamis" },
  { id: "fr-radial", label: "Radial Spread", desc: "Penyebaran konsentris teratur" },
  { id: "kamada-kawai", label: "Kamada-Kawai", desc: "Keseimbangan topologis global" },
  { id: "mindmap", label: "Mindmap Tree", desc: "Pohon hierarki seimbang" },
  { id: "timeline", label: "Timeline", desc: "Urutan kronologis waktu" },
];

export interface UsePublicReaderGraphSettingsControllerParams {
  onConfigChange: (updater: (prev: GraphConfigState) => GraphConfigState) => void;
  onResetDefaults: () => void;
}

/**
 * Headless controller for PublicReaderGraphSettingsPopover: manages active color preset,
 * reset handling, and typed helpers for updating node & force visual settings.
 */
export function usePublicReaderGraphSettingsController({
  onConfigChange,
  onResetDefaults,
}: UsePublicReaderGraphSettingsControllerParams) {
  const [activeThemeId, setActiveThemeId] = useState<string>("default");

  const activeThemeName =
    GRAPH_THEME_PRESETS.find((p) => p.id === activeThemeId)?.name || "Kustom";

  const handleApplyTheme = (preset: ColorThemePreset) => {
    setActiveThemeId(preset.id);
    onConfigChange((prev) => ({
      ...prev,
      nodes: {
        ...prev.nodes,
        fileColor: preset.fileColor,
        folderColor: preset.folderColor,
      },
      links: {
        ...prev.links,
        color: preset.linkColor,
      },
    }));
  };

  const handleReset = () => {
    setActiveThemeId("default");
    onResetDefaults();
  };

  const updateNodeOption = <K extends keyof GraphConfigState["nodes"]>(
    key: K,
    value: GraphConfigState["nodes"][K]
  ) => {
    onConfigChange((prev) => ({
      ...prev,
      nodes: { ...prev.nodes, [key]: value },
    }));
  };

  const updateForceOption = <K extends keyof GraphConfigState["forces"]>(
    key: K,
    value: GraphConfigState["forces"][K]
  ) => {
    onConfigChange((prev) => ({
      ...prev,
      forces: { ...prev.forces, [key]: value },
    }));
  };

  return {
    activeThemeId,
    activeThemeName,
    handleApplyTheme,
    handleReset,
    updateNodeOption,
    updateForceOption,
  };
}
