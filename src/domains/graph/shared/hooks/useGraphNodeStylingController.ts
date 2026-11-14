import { NodeConfig, useGraphStore } from "@/domains/graph/shared/stores/useGraphStore";

export interface UseGraphNodeStylingControllerProps {
  config: NodeConfig;
  onUpdate: (updates: Partial<NodeConfig>) => void;
}

export function useGraphNodeStylingController({
  config,
  onUpdate,
}: UseGraphNodeStylingControllerProps) {
  const hierarchy = useGraphStore((s) => s.config.hierarchy);
  const updateHierarchyConfig = useGraphStore((s) => s.updateHierarchyConfig);

  const handleShapeChange = (shape: NodeConfig["shape"]) => onUpdate({ shape });
  const handleRelSizeChange = ([relSize]: number[]) => onUpdate({ relSize });
  const handleSizeByDepthChange = (sizeByDepth: boolean) => onUpdate({ sizeByDepth });
  const handleDepthIntervalChange = ([depthSizeInterval]: number[]) =>
    onUpdate({ depthSizeInterval });
  const handleResolutionChange = ([resolution]: number[]) => onUpdate({ resolution });
  const handleGlowChange = (glow: boolean) => onUpdate({ glow });
  const handleGlowIntensityChange = ([glowIntensity]: number[]) => onUpdate({ glowIntensity });
  const handleGlowSpeedChange = ([glowSpeed]: number[]) => onUpdate({ glowSpeed });
  const handleVisibleChange = (visible: boolean) => onUpdate({ visible });
  const handleOpacityChange = ([opacity]: number[]) => onUpdate({ opacity });
  const handleAutoColorChange = (autoColorBy: NodeConfig["autoColorBy"]) =>
    onUpdate({ autoColorBy });

  return {
    config,
    hierarchy,
    updateHierarchyConfig,
    onUpdate,
    handleShapeChange,
    handleRelSizeChange,
    handleSizeByDepthChange,
    handleDepthIntervalChange,
    handleResolutionChange,
    handleGlowChange,
    handleGlowIntensityChange,
    handleGlowSpeedChange,
    handleVisibleChange,
    handleOpacityChange,
    handleAutoColorChange,
  };
}
