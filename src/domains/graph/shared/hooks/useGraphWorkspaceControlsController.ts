import { useState, useCallback } from 'react';
import type { CanvasMode, LayoutMode } from '@/domains/graph/shared/utils/graph.types';
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
  HierarchyColorConfig,
} from '@/domains/graph/shared/stores/useGraphStore';

interface UseGraphWorkspaceControlsControllerParams {
  leafId?: string;
  onCanvasModeChange?: (mode: CanvasMode) => void;
}

export function useGraphWorkspaceControlsController({
  leafId,
  onCanvasModeChange,
}: UseGraphWorkspaceControlsControllerParams) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'layout' | 'color' | 'atmosphere' | 'appearance' | 'templates'>('layout');

  const leafConfig = useLeafGraphConfig();
  const leafApi = useLeafGraphConfigApi();
  const isLeafScoped = Boolean(leafId && leafApi);

  const canvasMode = useGraphInteractionStore((s) => s.canvasMode);
  const layoutMode = useGraphInteractionStore((s) => s.layoutMode);
  const layoutArrangement = useGraphInteractionStore((s) => s.layoutArrangement);
  const setStoreCanvasMode = useGraphInteractionStore((s) => s.setCanvasMode);
  const setLayoutMode = useGraphInteractionStore((s) => s.setLayoutMode);
  const setLayoutArrangement = useGraphInteractionStore((s) => s.setLayoutArrangement);

  const globalConfig = useGraphStore((s) => s.config);
  const config = isLeafScoped && leafConfig ? leafConfig : globalConfig;

  const handleModeSwitch = useCallback((mode: CanvasMode) => {
    if (onCanvasModeChange) {
      onCanvasModeChange(mode);
    } else {
      setStoreCanvasMode(mode);
    }
  }, [onCanvasModeChange, setStoreCanvasMode]);

  const updateNodeConfig = useCallback((upd: Partial<NodeConfig>) => {
    if (isLeafScoped && leafApi) leafApi.updateNodeConfig(upd);
    else useGraphStore.getState().updateNodeConfig(upd);
  }, [isLeafScoped, leafApi]);

  const updateLinkConfig = useCallback((upd: Partial<LinkConfig>) => {
    if (isLeafScoped && leafApi) leafApi.updateLinkConfig(upd);
    else useGraphStore.getState().updateLinkConfig(upd);
  }, [isLeafScoped, leafApi]);

  const updateHierarchyConfig = useCallback((upd: Partial<HierarchyColorConfig>) => {
    if (isLeafScoped && leafApi) leafApi.updateHierarchyConfig(upd);
    else useGraphStore.getState().updateHierarchyConfig(upd);
  }, [isLeafScoped, leafApi]);

  const updateAtmosphereConfig = useCallback((upd: Partial<GraphConfigState['atmosphere']>) => {
    if (isLeafScoped && leafApi) leafApi.updateAtmosphereConfig(upd);
    else useGraphStore.getState().updateAtmosphereConfig(upd);
  }, [isLeafScoped, leafApi]);

  const resetConfig = useCallback(() => {
    if (isLeafScoped && leafApi) leafApi.resetConfig();
    else useGraphStore.getState().resetConfig();
  }, [isLeafScoped, leafApi]);

  return {
    isOpen,
    setIsOpen,
    activeTab,
    setActiveTab,
    canvasMode,
    layoutMode,
    layoutArrangement,
    config,
    actions: {
      handleModeSwitch,
      setLayoutMode,
      setLayoutArrangement,
      updateNodeConfig,
      updateLinkConfig,
      updateHierarchyConfig,
      updateAtmosphereConfig,
      resetConfig,
    },
  };
}