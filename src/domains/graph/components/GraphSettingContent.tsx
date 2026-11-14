import { Globe, Link2, Network, Palette, Search, Sparkles, type LucideIcon } from 'lucide-react';
import type { CanvasMode, LayoutMode, MindmapOrientation } from '@/domains/graph/shared/utils/graph.types';
import type {
  GraphConfigState,
  NodeConfig,
  LinkConfig,
  TopologyConfig,
  LinkStyle,
  HierarchyColorConfig,
} from '@/domains/graph/shared/stores/useGraphStore';
import { mergeAtmosphereConfig } from '@/domains/graph/shared/utils/atmosphereConfig';
import { SearchPanel } from '@/domains/graph/components/GraphSearchPanel';
import { LayoutPanel } from '@/domains/graph/components/GraphLayoutPanel';
import { AppearancePanel, type LinkStyleType } from '@/domains/graph/components/GraphAppearancePanel';
import { GlobalTemplatesPanel } from '@/domains/graph/components/GraphGlobalTemplatesPanel';
import { ColorEngineControls } from '@/domains/graph/components/GraphColorEngineControls';
import { AtmosphereControls } from '@/domains/graph/components/GraphAtmosphereControls';

export type SettingGroup = 'search' | 'layout' | 'colors' | 'atmosphere' | 'appearance' | 'global';
export type SmartZoomAction = 'fit' | 'selection' | 'reset';

export const PANEL_TITLES: Record<SettingGroup, string> = {
  search: 'Search & Filters',
  layout: 'Layout & Hierarchy',
  colors: 'Color Engine',
  atmosphere: 'Atmosphere & Living Canvas',
  appearance: 'Nodes & Links',
  global: 'Graph Global & Templates',
};

export interface GraphNavItemConfig {
  id: SettingGroup;
  label: string;
  icon: LucideIcon;
  iconClassName?: string;
  badgeFilter?: boolean;
}

export const GRAPH_CONTROL_NAV_ITEMS: GraphNavItemConfig[] = [
  { id: 'search', label: 'Search & Filters', icon: Search, badgeFilter: true },
  { id: 'layout', label: 'Layout & Hierarchy', icon: Network },
  { id: 'colors', label: 'Color Engine', icon: Palette, iconClassName: 'text-primary' },
  {
    id: 'atmosphere',
    label: 'Atmosphere & Living Canvas',
    icon: Sparkles,
    iconClassName: 'text-primary',
  },
  { id: 'appearance', label: 'Nodes & Links', icon: Link2 },
  { id: 'global', label: 'Graph Global & Templates', icon: Globe },
];

export interface GraphSettingContentProps {
  activePanel: SettingGroup;
  config: GraphConfigState;
  layout: LayoutMode;
  canvasMode: CanvasMode;
  orientation: MindmapOrientation;
  compact?: boolean;
  onCanvasModeChange: (mode: CanvasMode) => void;
  onLayoutChange: (layout: LayoutMode) => void;
  onOrientationChange: (orientation: MindmapOrientation) => void;
  search: string;
  onSearchChange: (value: string) => void;
  minDepth: number;
  onMinDepthChange: (value: number) => void;
  maxDepth: number;
  onMaxDepthChange: (value: number) => void;
  contentFilter: string;
  onContentFilterChange: (value: string) => void;
  tagFilter: string;
  onTagFilterChange: (value: string) => void;
  updateNodeConfig: (upd: Partial<NodeConfig>) => void;
  updateLinkConfig: (upd: Partial<LinkConfig>) => void;
  updateTopologyConfig: (upd: Partial<TopologyConfig>) => void;
  updateTopologyStyle: (type: LinkStyleType, upd: Partial<LinkStyle>) => void;
  updateHierarchyConfig: (upd: Partial<HierarchyColorConfig>) => void;
  updateAtmosphereConfig: (upd: Partial<GraphConfigState['atmosphere']>) => void;
  setConfig: (cfg: GraphConfigState) => void;
  resetConfig: () => void;
}

/** Pure content dispatcher rendering all 6 Visual Engine configuration panels. */
export function GraphSettingContent({
  activePanel,
  compact = true,
  config,
  layout,
  canvasMode,
  orientation,
  onCanvasModeChange,
  onLayoutChange,
  onOrientationChange,
  search,
  onSearchChange,
  minDepth,
  onMinDepthChange,
  maxDepth,
  onMaxDepthChange,
  contentFilter,
  onContentFilterChange,
  tagFilter,
  onTagFilterChange,
  updateNodeConfig,
  updateLinkConfig,
  updateTopologyConfig,
  updateTopologyStyle,
  updateHierarchyConfig,
  updateAtmosphereConfig,
  setConfig,
  resetConfig,
}: GraphSettingContentProps) {
  return (
    <>
      {activePanel === 'search' && (
        <SearchPanel
          search={search}
          onSearchChange={onSearchChange}
          minDepth={minDepth}
          maxDepth={maxDepth}
          onMinDepthChange={onMinDepthChange}
          onMaxDepthChange={onMaxDepthChange}
          contentFilter={contentFilter}
          onContentFilterChange={onContentFilterChange}
          tagFilter={tagFilter}
          onTagFilterChange={onTagFilterChange}
        />
      )}

      {activePanel === 'layout' && (
        <LayoutPanel
          compact={compact}
          canvasMode={canvasMode}
          layout={layout}
          orientation={orientation}
          onModeSwitch={onCanvasModeChange}
          onLayoutChange={onLayoutChange}
          onOrientationChange={onOrientationChange}
        />
      )}

      {activePanel === 'colors' && (
        <div className="space-y-3.5">
          <ColorEngineControls
            compact={compact}
            hierarchy={config.hierarchy}
            nodeConfig={config.nodes}
            onHierarchyUpdate={updateHierarchyConfig}
            onNodeConfigUpdate={updateNodeConfig}
          />
        </div>
      )}

      {activePanel === 'atmosphere' && (
        <AtmosphereControls
          atmosphere={mergeAtmosphereConfig(config.atmosphere)}
          linkConfig={config.links}
          nodeConfig={config.nodes}
          onAtmosphereUpdate={updateAtmosphereConfig}
          onLinkUpdate={updateLinkConfig}
          onNodeUpdate={updateNodeConfig}
        />
      )}

      {activePanel === 'appearance' && (
        <AppearancePanel
          config={config}
          updateNodeConfig={updateNodeConfig}
          updateTopologyConfig={updateTopologyConfig}
          updateTopologyStyle={updateTopologyStyle}
          updateHierarchyConfig={updateHierarchyConfig}
          updateLinkConfig={updateLinkConfig}
        />
      )}

      {activePanel === 'global' && (
        <GlobalTemplatesPanel
          config={config}
          layout={layout}
          orientation={orientation}
          onLayoutChange={onLayoutChange}
          onOrientationChange={onOrientationChange}
          setConfig={setConfig}
          resetConfig={resetConfig}
        />
      )}
    </>
  );
}
