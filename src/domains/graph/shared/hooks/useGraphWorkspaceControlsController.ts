import { useState, useCallback } from 'react';
import type { CanvasMode, LayoutMode, MindmapOrientation } from '@/domains/graph/shared/utils/graph.types';
import { useGraphStore } from '@/global/stores';
import { useGraphInteractionStore } from '@/domains/graph/shared/stores/useGraphInteractionStore';
import { useGraphToolbarStore } from '@/domains/graph/shared/stores/useGraphToolbarStore';
import {
  useLeafGraphConfig,
  useLeafGraphConfigApi,
  type LeafGraphConfigState,
} from '@/domains/graph/shared/stores/useLeafGraphConfigStore';
import type {
  GraphConfigState,
  NodeConfig,
  LinkConfig,
  TopologyConfig,
  LinkStyle,
  HierarchyColorConfig,
} from '@/domains/graph/shared/stores/useGraphStore';
import type { LinkStyleType } from '@/domains/graph/components/GraphAppearancePanel';
import type { SettingGroup } from '@/domains/graph/components/GraphSettingContent';

interface UseGraphWorkspaceControlsControllerParams {
  leafId?: string;
  canvasMode?: CanvasMode;
  onCanvasModeChange?: (mode: CanvasMode) => void;
  layout?: LayoutMode;
  onLayoutChange?: (mode: LayoutMode) => void;
  orientation?: MindmapOrientation;
  onOrientationChange?: (orientation: MindmapOrientation) => void;
  search?: string;
  minDepth?: number;
  maxDepth?: number;
  contentFilter?: string;
  tagFilter?: string;
}

export function useGraphWorkspaceControlsController({
  canvasMode: controlledCanvasMode,
  onCanvasModeChange,
  layout: controlledLayout,
  onLayoutChange,
  orientation: controlledOrientation,
  onOrientationChange,
  search = '',
  minDepth = 0,
  maxDepth = 10,
  contentFilter = '',
  tagFilter = '',
}: UseGraphWorkspaceControlsControllerParams) {
  const displayMode = useGraphToolbarStore((s) => s.mode);
  const isRibbonExpanded = useGraphToolbarStore((s) => s.isExpanded);
  const toggleRibbonExpanded = useGraphToolbarStore((s) => s.toggleExpanded);
  const ribbonActiveTab = useGraphToolbarStore((s) => s.activeTab);
  const setRibbonActiveTab = useGraphToolbarStore((s) => s.setActiveTab);

  const [isGearOpen, setIsGearOpen] = useState(true);
  const [gearActivePanel, setGearActivePanel] = useState<SettingGroup | null>(null);

  const leafConfig = useLeafGraphConfig();
  const leafApi = useLeafGraphConfigApi();

  const storeCanvasMode = useGraphInteractionStore((s) => s.canvasMode);
  const storeLayoutMode = useGraphInteractionStore((s) => s.layoutMode);
  const storeOrientation = useGraphInteractionStore((s) => s.orientation);
  const layoutArrangement = useGraphInteractionStore((s) => s.layoutArrangement);

  const setStoreCanvasMode = useGraphInteractionStore((s) => s.setCanvasMode);
  const setStoreLayoutMode = useGraphInteractionStore((s) => s.setLayoutMode);
  const setStoreOrientation = useGraphInteractionStore((s) => s.setOrientation);
  const setLayoutArrangement = useGraphInteractionStore((s) => s.setLayoutArrangement);

  const canvasMode = controlledCanvasMode ?? storeCanvasMode;
  const layoutMode = controlledLayout ?? storeLayoutMode;
  const orientation = controlledOrientation ?? storeOrientation;

  const globalConfig = useGraphStore((s) => s.config);
  const config = leafApi && leafConfig ? leafConfig : globalConfig;

  const filterCount =
    Number(minDepth > 0) +
    Number(maxDepth < 10) +
    Number(Boolean(search)) +
    Number(Boolean(contentFilter)) +
    Number(Boolean(tagFilter));

  const handleModeSwitch = useCallback(
    (mode: CanvasMode) => {
      if (onCanvasModeChange) onCanvasModeChange(mode);
      else setStoreCanvasMode(mode);
    },
    [onCanvasModeChange, setStoreCanvasMode],
  );

  const handleLayoutChange = useCallback(
    (mode: LayoutMode) => {
      if (onLayoutChange) onLayoutChange(mode);
      else setStoreLayoutMode(mode);
    },
    [onLayoutChange, setStoreLayoutMode],
  );

  const handleOrientationChange = useCallback(
    (ori: MindmapOrientation) => {
      if (onOrientationChange) onOrientationChange(ori);
      else setStoreOrientation(ori);
    },
    [onOrientationChange, setStoreOrientation],
  );

  const setFullConfig = useCallback(
    (cfg: GraphConfigState) => {
      if (leafApi) leafApi.getState().setFullConfig(cfg);
      else useGraphStore.getState().setConfig(cfg);
    },
    [leafApi],
  );

  const updateNodeConfig = useCallback(
    (upd: Parameters<LeafGraphConfigState['setNodeConfig']>[0]) => {
      if (leafApi) leafApi.getState().setNodeConfig(upd);
      else if (typeof upd !== 'function') useGraphStore.getState().updateNodeConfig(upd as Partial<NodeConfig>);
    },
    [leafApi],
  );

  const updateLinkConfig = useCallback(
    (upd: Parameters<LeafGraphConfigState['setLinkConfig']>[0]) => {
      if (leafApi) leafApi.getState().setLinkConfig(upd);
      else if (typeof upd !== 'function') useGraphStore.getState().updateLinkConfig(upd as Partial<LinkConfig>);
    },
    [leafApi],
  );

  const updateTopologyConfig = useCallback(
    (upd: Parameters<LeafGraphConfigState['setTopologyConfig']>[0]) => {
      if (leafApi) leafApi.getState().setTopologyConfig(upd);
      else if (typeof upd !== 'function') useGraphStore.getState().updateTopologyConfig(upd as Partial<TopologyConfig>);
    },
    [leafApi],
  );

  const updateTopologyStyle = useCallback(
    (type: LinkStyleType, upd: Partial<LinkStyle>) => {
      if (leafApi) {
        leafApi.getState().setTopologyConfig((prev) => ({
          styles: { ...prev.styles, [type]: { ...prev.styles[type], ...upd } },
        }));
        return;
      }
      useGraphStore.getState().updateTopologyStyle(type, upd);
    },
    [leafApi],
  );

  const updateHierarchyConfig = useCallback(
    (upd: Partial<HierarchyColorConfig>) => {
      if (leafApi) {
        const current = leafApi.getState().config.hierarchy;
        leafApi.getState().setHierarchyConfig({ ...current, ...upd });
        return;
      }
      useGraphStore.getState().updateHierarchyConfig(upd);
    },
    [leafApi],
  );

  const updateAtmosphereConfig = useCallback(
    (upd: Partial<GraphConfigState['atmosphere']>) => {
      if (leafApi) leafApi.getState().setAtmosphereConfig(upd);
      else useGraphStore.getState().updateAtmosphereConfig(upd);
    },
    [leafApi],
  );

  const resetConfig = useCallback(() => {
    if (leafApi) leafApi.getState().resetToDefault();
    else useGraphStore.getState().resetConfig();
  }, [leafApi]);

  const handleToggleGear = useCallback(() => {
    setIsGearOpen((prev) => {
      if (prev) setGearActivePanel(null);
      return !prev;
    });
  }, []);

  const handleSelectGearPanel = useCallback((panel: SettingGroup) => {
    setGearActivePanel((prev) => (prev === panel ? null : panel));
  }, []);

  return {
    displayMode,
    isRibbonExpanded,
    toggleRibbonExpanded,
    ribbonActiveTab,
    setRibbonActiveTab,
    isGearOpen,
    gearActivePanel,
    handleToggleGear,
    handleSelectGearPanel,
    closeGearPanel: () => setGearActivePanel(null),
    filterCount,
    canvasMode,
    layoutMode,
    orientation,
    layoutArrangement,
    config,
    actions: {
      handleModeSwitch,
      handleLayoutChange,
      handleOrientationChange,
      setLayoutArrangement,
      setFullConfig,
      updateNodeConfig,
      updateLinkConfig,
      updateTopologyConfig,
      updateTopologyStyle,
      updateHierarchyConfig,
      updateAtmosphereConfig,
      resetConfig,
    },
  };
}