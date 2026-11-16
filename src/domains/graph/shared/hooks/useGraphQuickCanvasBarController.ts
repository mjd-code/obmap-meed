import { useCallback, useMemo } from 'react';
import type {
  CanvasMode,
  LayoutMode,
  MindmapOrientation,
  SkeletonPresetId,
} from '@/domains/graph/shared/utils/graph.types';
import { useGraphStore, useNodeStore } from '@/global/stores';
import { useGraphInteractionStore } from '@/domains/graph/shared/stores/useGraphInteractionStore';
import {
  useLeafGraphConfig,
  useLeafGraphConfigApi,
} from '@/domains/graph/shared/stores/useLeafGraphConfigStore';
import {
  SKELETON_PRESETS,
  resolveSkeletonPreset,
} from '@/domains/graph/shared/utils/cascadingStyleResolver';

export type QuickCanvasMode = 'mindmap' | 'graph' | 'outline';
export type QuickStructureValue =
  | 'mindmap-balanced'
  | 'mindmap-radial'
  | 'org-chart'
  | 'brace-map'
  | 'timeline'
  | 'fishbone'
  | 'free-force';

export interface UseGraphQuickCanvasBarControllerParams {
  onSmartZoom?: (action: 'fit' | 'selection' | 'reset') => void;
  isOutlineMode?: boolean;
  onToggleOutlineMode?: (active: boolean) => void;
  onAddRootSubtopic?: () => void;
}

export function useGraphQuickCanvasBarController({
  onSmartZoom,
  isOutlineMode = false,
  onToggleOutlineMode,
}: UseGraphQuickCanvasBarControllerParams) {
  const leafConfig = useLeafGraphConfig();
  const leafApi = useLeafGraphConfigApi();
  const globalConfig = useGraphStore((s) => s.config);
  const config = leafApi && leafConfig ? leafConfig : globalConfig;

  const nodes = useNodeStore((s) => s.nodes);
  const selectedNode = useNodeStore((s) => s.selectedNode);

  const canvasMode = useGraphInteractionStore((s) => s.canvasMode);
  const layoutMode = useGraphInteractionStore((s) => s.layoutMode);
  const orientation = useGraphInteractionStore((s) => s.orientation);
  const layoutArrangement = useGraphInteractionStore((s) => s.layoutArrangement);
  const showMindmapRelationships = useGraphInteractionStore((s) => s.showMindmapRelationships);
  const boundaries = useGraphInteractionStore((s) => s.boundaries);
  const summaries = useGraphInteractionStore((s) => s.summaries);
  const collapsedIds = useGraphInteractionStore((s) => s.collapsedIds);

  const setCanvasMode = useGraphInteractionStore((s) => s.setCanvasMode);
  const setLayoutMode = useGraphInteractionStore((s) => s.setLayoutMode);
  const setOrientation = useGraphInteractionStore((s) => s.setOrientation);
  const setLayoutArrangement = useGraphInteractionStore((s) => s.setLayoutArrangement);
  const setShowMindmapRelationships = useGraphInteractionStore((s) => s.setShowMindmapRelationships);
  const setCollapsed = useGraphInteractionStore((s) => s.setCollapsed);
  const expandAll = useGraphInteractionStore((s) => s.expandAll);
  const tidyUpLayout = useGraphInteractionStore((s) => s.tidyUpLayout);

  const activeCanvasTab: QuickCanvasMode = isOutlineMode ? 'outline' : canvasMode;

  const currentStructure: QuickStructureValue = useMemo(() => {
    if (layoutMode === 'free-force' || canvasMode === 'graph') return 'free-force';
    if (layoutMode === 'mindmap' && orientation === 'radial') return 'mindmap-radial';
    if (
      layoutMode === 'org-chart' ||
      layoutMode === 'brace-map' ||
      layoutMode === 'timeline' ||
      layoutMode === 'fishbone'
    ) {
      return layoutMode;
    }
    return 'mindmap-balanced';
  }, [layoutMode, canvasMode, orientation]);

  const skeletonList = useMemo(() => Object.values(SKELETON_PRESETS), []);
  const activeSkeleton = useMemo(
    () => resolveSkeletonPreset(config.hierarchy?.skeletonPreset),
    [config.hierarchy?.skeletonPreset],
  );

  const switchCanvasTab = useCallback(
    (tab: QuickCanvasMode) => {
      if (tab === 'outline') {
        setCanvasMode('mindmap');
        setLayoutMode('mindmap');
        onToggleOutlineMode?.(true);
        return;
      }
      onToggleOutlineMode?.(false);
      setCanvasMode(tab as CanvasMode);
      if (tab === 'graph' && layoutMode !== 'free-force') {
        setLayoutMode('free-force');
      } else if (tab === 'mindmap' && layoutMode === 'free-force') {
        setLayoutMode('mindmap');
      }
    },
    [setCanvasMode, setLayoutMode, onToggleOutlineMode, layoutMode],
  );

  const selectStructure = useCallback(
    (value: QuickStructureValue) => {
      if (value === 'free-force') {
        onToggleOutlineMode?.(false);
        setCanvasMode('graph');
        setLayoutMode('free-force');
        return;
      }
      setCanvasMode('mindmap');
      if (value === 'mindmap-radial') {
        setOrientation('radial');
        setLayoutMode('mindmap');
        return;
      }
      if (value === 'mindmap-balanced') {
        setOrientation('balanced');
        setLayoutMode('mindmap');
        return;
      }
      setOrientation('balanced' as MindmapOrientation);
      setLayoutMode(value as LayoutMode);
    },
    [onToggleOutlineMode, setCanvasMode, setOrientation, setLayoutMode],
  );

  const applySkeletonPreset = useCallback(
    (presetId: SkeletonPresetId) => {
      const preset = SKELETON_PRESETS[presetId];
      if (!preset) return;
      if (leafApi) {
        leafApi.getState().setHierarchyConfig({
          ...leafApi.getState().config.hierarchy,
          enabled: true,
          skeletonPreset: presetId,
        });
        leafApi.getState().setLinkConfig({ branchLineStyle: preset.defaultBranchStyle });
      } else {
        const g = useGraphStore.getState();
        g.updateHierarchyConfig({ enabled: true, skeletonPreset: presetId });
        g.updateLinkConfig({ branchLineStyle: preset.defaultBranchStyle });
      }
    },
    [leafApi],
  );

  const toggleShowRelationships = useCallback(() => {
    setShowMindmapRelationships(!showMindmapRelationships);
  }, [setShowMindmapRelationships, showMindmapRelationships]);

  const toggleArrangementMode = useCallback(() => {
    if (layoutArrangement === 'auto') {
      setLayoutArrangement('custom');
    } else {
      tidyUpLayout();
    }
  }, [layoutArrangement, setLayoutArrangement, tidyUpLayout]);

  const applyDepthFold = useCallback(
    (level: 1 | 2 | 3 | 'all') => {
      if (level === 'all') {
        expandAll();
        return;
      }
      const nextCollapsed = nodes.filter((n) => n.depth >= level).map((n) => n.id);
      setCollapsed(nextCollapsed);
    },
    [nodes, expandAll, setCollapsed],
  );

  return {
    activeCanvasTab,
    currentStructure,
    skeletonList,
    activeSkeleton,
    layoutArrangement,
    showMindmapRelationships,
    boundariesCount: boundaries.length,
    summariesCount: summaries.length,
    collapsedCount: collapsedIds.length,
    hasSelectedFileNote: Boolean(selectedNode && selectedNode.type === 'file'),
    switchCanvasTab,
    selectStructure,
    applySkeletonPreset,
    toggleShowRelationships,
    toggleArrangementMode,
    tidyUpLayout,
    applyDepthFold,
    fitView: () => onSmartZoom?.('fit'),
    centerRoot: () => onSmartZoom?.('reset'),
  };
}
