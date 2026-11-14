import { Tabs, TabsList, TabsTrigger } from "@/global/ui/tabs";
import { Link2, Shapes } from "lucide-react";
import type {
  GraphConfigState,
  NodeConfig,
  LinkConfig,
  TopologyConfig,
  LinkStyle,
  HierarchyColorConfig,
} from "@/domains/graph/shared/stores/useGraphStore";
import {
  useGraphAppearanceController,
  type LinkStyleType,
} from "@/domains/graph/shared/hooks/useGraphAppearanceController";
import { GraphAppearanceLinksSection } from "@/domains/graph/components/GraphAppearanceLinksSection";
import { GraphAppearanceNodesSection } from "@/domains/graph/components/GraphAppearanceNodesSection";

export type { LinkStyleType };

export interface AppearancePanelProps {
  config: GraphConfigState;
  updateNodeConfig: (upd: Partial<NodeConfig>) => void;
  updateTopologyConfig: (upd: Partial<TopologyConfig>) => void;
  updateTopologyStyle: (type: LinkStyleType, upd: Partial<LinkStyle>) => void;
  updateHierarchyConfig: (upd: Partial<HierarchyColorConfig>) => void;
  updateLinkConfig: (upd: Partial<LinkConfig>) => void;
}

/**
 * Pure declarative appearance settings panel switching between Nodes and Links controls.
 */
export function AppearancePanel({
  config,
  updateNodeConfig,
  updateTopologyConfig,
  updateTopologyStyle,
  updateHierarchyConfig,
  updateLinkConfig,
}: AppearancePanelProps) {
  const ctrl = useGraphAppearanceController({
    config,
    updateNodeConfig,
    updateTopologyConfig,
    updateTopologyStyle,
    updateHierarchyConfig,
    updateLinkConfig,
  });

  return (
    <div className="space-y-3.5">
      {/* Sub-Switch: Nodes vs Links */}
      <div className="flex items-center justify-between w-full">
        <Tabs
          value={ctrl.activeTab}
          onValueChange={(val) => ctrl.setActiveTab(val as "nodes" | "links")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 h-8 p-1 bg-muted/60">
            <TabsTrigger value="nodes" className="h-6 text-xs gap-1.5">
              <Shapes className="h-3.5 w-3.5" />
              <span>Node</span>
            </TabsTrigger>
            <TabsTrigger value="links" className="h-6 text-xs gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              <span>Links</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {ctrl.activeTab === "nodes" ? (
        <GraphAppearanceNodesSection
          config={config}
          labelMode={ctrl.labelMode}
          setLabelMode={ctrl.setLabelMode}
          updateNodeConfig={updateNodeConfig}
        />
      ) : (
        <GraphAppearanceLinksSection
          config={config}
          styleType={ctrl.styleType}
          setStyleType={ctrl.setStyleType}
          currentStyle={ctrl.currentStyle}
          updateTopologyConfig={updateTopologyConfig}
          updateTopologyStyle={updateTopologyStyle}
          updateHierarchyConfig={updateHierarchyConfig}
          updateLinkConfig={updateLinkConfig}
        />
      )}
    </div>
  );
}
