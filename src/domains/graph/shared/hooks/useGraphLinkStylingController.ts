import { Link2, GitBranch, Tags } from "lucide-react";
import type { LinkConfig, TopologyConfig, LinkStyle } from "@/domains/graph/shared/stores/useGraphStore";

export const DASH_PRESETS = [
  { value: "solid", label: "Solid" },
  { value: "8,4", label: "Dashed" },
  { value: "2,3", label: "Dotted" },
  { value: "12,3,3,3", label: "Dash-Dot" },
  { value: "20,5", label: "Long Dash" },
];

export const LINE_STYLES = [
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
];

export const LINK_TYPE_INFO = {
  hierarchy: {
    label: "Hierarchy",
    description: "Parent-child folder structure",
    icon: GitBranch,
  },
  backlink: {
    label: "Backlinks",
    description: "Wikilink connections between notes",
    icon: Link2,
  },
  tag: {
    label: "Tags",
    description: "Shared tag connections",
    icon: Tags,
  },
} as const;

export interface UseGraphLinkStylingControllerProps {
  config: LinkConfig;
  topologyConfig: TopologyConfig;
  onUpdate: (updates: Partial<LinkConfig>) => void;
  onTopologyUpdate: (updates: Partial<TopologyConfig>) => void;
  onTopologyStyleUpdate: (
    linkType: keyof TopologyConfig["styles"],
    updates: Partial<LinkStyle>,
  ) => void;
}

export function useGraphLinkStylingController({
  config,
  topologyConfig,
  onUpdate,
  onTopologyUpdate,
  onTopologyStyleUpdate,
}: UseGraphLinkStylingControllerProps) {
  const handleDashPresetChange = (value: string) => {
    onUpdate({ dashArray: value === "solid" ? "" : value });
  };

  const curveDegrees = Math.round(config.curveRotation * (180 / Math.PI));
  const arrowPercent = Math.round(config.arrowRelPos * 100);
  const opacityPercent = Math.round(config.opacity * 100);

  return {
    config,
    topologyConfig,
    onUpdate,
    onTopologyUpdate,
    onTopologyStyleUpdate,
    handleDashPresetChange,
    curveDegrees,
    arrowPercent,
    opacityPercent,
  };
}
