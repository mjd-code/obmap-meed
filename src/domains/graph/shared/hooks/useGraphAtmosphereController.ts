import type { NodeConfig, LinkConfig } from "@/domains/graph/shared/stores/useGraphStore";
import {
  COSMIC_PRESETS,
  type AtmosphereConfig,
  defaultAtmosphereConfig,
} from "@/domains/graph/shared/utils/atmosphereConfig";
import { useGraphInteractionStore } from "@/domains/graph/shared/stores/useGraphInteractionStore";
import {
  useExplorerGraphSyncStore,
  type ExplorerGraphSyncMode,
} from "@/domains/graph/shared/stores/useExplorerGraphSyncStore";

export { COSMIC_PRESETS, defaultAtmosphereConfig, type AtmosphereConfig, type ExplorerGraphSyncMode };

export const EXPLORER_SYNC_OPTIONS: Array<{
  value: ExplorerGraphSyncMode;
  label: string;
  description: string;
}> = [
  {
    value: "off",
    label: "Selection only",
    description: "Seleksi File Explorer dan Graph tetap sinkron, tanpa pergerakan kamera.",
  },
  {
    value: "hover-highlight",
    label: "Hover highlight",
    description: "Hover item Explorer menyorot node tanpa memindahkan kamera.",
  },
  {
    value: "select-focus",
    label: "Select & focus",
    description: "Klik item Explorer membuka dan memusatkan node di graph.",
  },
  {
    value: "hover-and-focus",
    label: "Hover + focus",
    description: "Highlight saat hover, fokus graph saat item dipilih.",
  },
];

export interface UseGraphAtmosphereControllerProps {
  atmosphere: AtmosphereConfig;
  linkConfig: LinkConfig;
  nodeConfig: NodeConfig;
  onAtmosphereUpdate: (updates: Partial<AtmosphereConfig>) => void;
  onLinkUpdate: (updates: Partial<LinkConfig>) => void;
  onNodeUpdate: (updates: Partial<NodeConfig>) => void;
}

export function useGraphAtmosphereController({
  linkConfig,
  onAtmosphereUpdate,
  onLinkUpdate,
}: UseGraphAtmosphereControllerProps) {
  const flowEnabled = linkConfig.showParticles && linkConfig.particles > 0;
  const highlightMode = useGraphInteractionStore((s) => s.highlightMode);
  const setHighlightMode = useGraphInteractionStore((s) => s.setHighlightMode);
  const explorerGraphSyncMode = useExplorerGraphSyncStore((s) => s.mode);
  const setExplorerGraphSyncMode = useExplorerGraphSyncStore((s) => s.setMode);

  const activeSyncDesc = EXPLORER_SYNC_OPTIONS.find(
    (opt) => opt.value === explorerGraphSyncMode,
  )?.description;

  const handleResetCosmic = () =>
    onAtmosphereUpdate({
      cosmicParticles: defaultAtmosphereConfig.cosmicParticles,
      cosmicSpeed: defaultAtmosphereConfig.cosmicSpeed,
    });

  const handleToggleFlow = (checked: boolean) =>
    onLinkUpdate({
      showParticles: checked,
      ...(checked
        ? {
            particles: Math.max(1, linkConfig.particles || 3),
            particleSpeed: linkConfig.particleSpeed || 0.01,
          }
        : {}),
    });

  return {
    flowEnabled,
    highlightMode,
    setHighlightMode,
    explorerGraphSyncMode,
    setExplorerGraphSyncMode,
    activeSyncDesc,
    handleResetCosmic,
    handleToggleFlow,
  };
}
