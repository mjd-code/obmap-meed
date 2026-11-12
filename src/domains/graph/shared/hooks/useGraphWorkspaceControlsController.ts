import { useState, useCallback } from 'react';
import type { CanvasMode, LayoutMode, MindmapOrientation } from '@/domains/graph/shared/utils/graph.types';
import { useGraphStore } from '@/global/stores';
import { useGraphInteractionStore } from '@/domains/graph/shared/stores/useGraphInteractionStore';
import {
  useLeafGraphConfig,
  useLeafGraphConfigApi,
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

interface UseGraphWorkspaceControlsControllerParams {
  leafId?: string;
  canvasMode?: CanvasMode;
  onCanvasModeChange?: (mode: CanvasMode) => void;
  layout?: LayoutMode;
  onLayoutChange?: (mode: LayoutMode) => void;
  orientation?: MindmapOrientation;
  onOrientationChange?: (orientation: MindmapOrientation) => void;
}

export function useGraphWorkspaceControlsController({
  leafId,
  canvasMode: controlledCanvasMode,
  onCanvasModeChange,
  layout: controlledLayout,
  onLayoutChange,
  orientation: controlledOrientation,
  onOrientationChange,
}: UseGraphWorkspaceControlsControllerParams) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'layout' | 'color' | 'atmosphere' | 'appearance' | 'templates'>('layout');

  const leafConfig = useLeafGraphConfig();
  const leafApi = useLeafGraphConfigApi();
  const isLeafScoped = Boolean(leafId && leafApi);

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
  const config = isLeafScoped && leafConfig ? leafConfig : globalConfig;

  const handleModeSwitch = useCallback((mode: CanvasMode) => {
    if (onCanvasModeChange) onCanvasModeChange(mode);
    else setStoreCanvasMode(mode);
  }, [onCanvasModeChange, setStoreCanvasMode]);

  const handleLayoutChange = useCallback((mode: LayoutMode) => {
    if (onLayoutChange) onLayoutChange(mode);
    else setStoreLayoutMode(mode);
  }, [onLayoutChange, setStoreLayoutMode]);

  const handleOrientationChange = useCallback((ori: MindmapOrientation) => {
    if (onOrientationChange) onOrientationChange(ori);
    else setStoreOrientation(ori);
  }, [onOrientationChange, setStoreOrientation]);

  const updateNodeConfig = useCallback((upd: Partial<NodeConfig>) => {
    if (isLeafScoped && leafApi) leafApi.getState().setNodeConfig(upd);
    else useGraphStore.getState().updateNodeConfig(upd);
  }, [isLeafScoped, leafApi]);

  const updateLinkConfig = useCallback((upd: Partial<LinkConfig>) => {
    if (isLeafScoped && leafApi) leafApi.getState().setLinkConfig(upd);
    else useGraphStore.getState().updateLinkConfig(upd);
  }, [isLeafScoped, leafApi]);

  const updateTopologyConfig = useCallback((upd: Partial<TopologyConfig>) => {
    if (isLeafScoped && leafApi) leafApi.getState().setTopologyConfig(upd);
    else useGraphStore.getState().updateTopologyConfig(upd);
  }, [isLeafScoped, leafApi]);

  const updateTopologyStyle = useCallback((type: LinkStyleType, upd: Partial<LinkStyle>) => {
    useGraphStore.getState().updateTopologyStyle(type, upd);
  }, []);

  const updateHierarchyConfig = useCallback((upd: Partial<HierarchyColorConfig>) => {
    if (isLeafScoped && leafApi) {
      const current = leafApi.getState().config.hierarchy;
      leafApi.getState().setHierarchyConfig({ ...current, ...upd });
    } else {
      useGraphStore.getState().updateHierarchyConfig(upd);
    }
  }, [isLeafScoped, leafApi]);

  const updateAtmosphereConfig = useCallback((upd: Partial<GraphConfigState['atmosphere']>) => {
    if (isLeafScoped && leafApi) leafApi.getState().setAtmosphereConfig(upd);
    else useGraphStore.getState().updateAtmosphereConfig(upd);
  }, [isLeafScoped, leafApi]);

  const resetConfig = useCallback(() => {
    if (isLeafScoped && leafApi) leafApi.getState().resetToDefault();
    else useGraphStore.getState().resetConfig();
  }, [isLeafScoped, leafApi]);

  return {
    isOpen,
    setIsOpen,
    activeTab,
    setActiveTab,
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