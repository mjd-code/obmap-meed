import { useState } from "react";
import type {
  GraphConfigState,
  NodeConfig,
  LinkConfig,
  TopologyConfig,
  LinkStyle,
  HierarchyColorConfig,
} from "@/domains/graph/shared/stores/useGraphStore";

export type LabelMode = "nodes" | "labels" | "boxes";
export type LinkStyleType = keyof TopologyConfig["styles"];

export const LINK_STYLE_TYPES: { value: LinkStyleType; label: string }[] = [
  { value: "hierarchy", label: "Hierarchy" },
  { value: "backlink", label: "Backlinks" },
  { value: "tag", label: "Tags" },
  { value: "semantic", label: "Semantic" },
];

export const LINE_STYLES: { value: LinkStyle["lineStyle"]; label: string }[] = [
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
];

export const FONT_STYLES: { value: NodeConfig["labelFontStyle"]; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "bold", label: "Bold" },
  { value: "italic", label: "Italic" },
  { value: "bold-italic", label: "Bold Italic" },
];

export const NODE_SHAPES: { value: NodeConfig["shape"]; label: string }[] = [
  { value: "circle", label: "Circle" },
  { value: "square", label: "Square" },
  { value: "diamond", label: "Diamond" },
  { value: "triangle", label: "Triangle" },
  { value: "hexagon", label: "Hexagon" },
];

export interface UseGraphAppearanceControllerProps {
  config: GraphConfigState;
  updateNodeConfig: (upd: Partial<NodeConfig>) => void;
  updateTopologyConfig: (upd: Partial<TopologyConfig>) => void;
  updateTopologyStyle: (type: LinkStyleType, upd: Partial<LinkStyle>) => void;
  updateHierarchyConfig: (upd: Partial<HierarchyColorConfig>) => void;
  updateLinkConfig: (upd: Partial<LinkConfig>) => void;
}

export function useGraphAppearanceController({
  config,
  updateNodeConfig,
}: UseGraphAppearanceControllerProps) {
  const [activeTab, setActiveTab] = useState<"nodes" | "links">("nodes");
  const [styleType, setStyleType] = useState<LinkStyleType>("hierarchy");

  const labelMode: LabelMode = !config.nodes.showLabels
    ? "nodes"
    : config.nodes.labelBox
      ? "boxes"
      : "labels";

  const setLabelMode = (mode: LabelMode) => {
    if (mode === "nodes") updateNodeConfig({ showLabels: false, labelBox: false });
    else if (mode === "labels") updateNodeConfig({ showLabels: true, labelBox: false });
    else updateNodeConfig({ showLabels: true, labelBox: true });
  };

  const currentStyle = config.topology.styles[styleType] ?? {
    color: "#94a3b8",
    lineStyle: "solid",
    opacity: 0.6,
    width: 1.2,
  };

  return {
    activeTab,
    setActiveTab,
    styleType,
    setStyleType,
    labelMode,
    setLabelMode,
    currentStyle,
  };
}
