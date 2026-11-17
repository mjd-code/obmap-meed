import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CanvasMode, LayoutMode, MindmapOrientation, SkeletonPresetId } from '@/domains/graph/shared/utils/graph.types';
import { isDeterministicLayout } from '@/domains/graph/shared/utils/layoutCategory';
import { useGraphStore, useNodeStore, useUIStore } from '@/global/stores';
import { useGraphInteractionStore } from '@/domains/graph/shared/stores/useGraphInteractionStore';
import { useLeafGraphConfig, useLeafGraphConfigApi } from '@/domains/graph/shared/stores/useLeafGraphConfigStore';
import type {
  ForceConfig,
  GraphConfigState,
  HierarchyColorConfig,
  LinkConfig,
  LinkStyle,
  NodeConfig,
  TopologyConfig,
} from '@/domains/graph/shared/stores/useGraphStore';
import { SKELETON_PRESETS, resolveSkeletonPreset } from '@/domains/graph/shared/utils/cascadingStyleResolver';
import type { LinkStyleType } from '@/domains/graph/components/GraphAppearancePanel';
import { useWorkspaceStore } from '@/domains/workspace/shared/stores/useWorkspaceStore';

export type DockClusterId = 'layout' | 'filter' | 'appearance' | 'physics' | 'zoom' | 'more';
export type QuickCanvasMode = 'mindmap' | 'graph';
export type AppearanceSubTab = 'presets' | 'atmosphere' | 'metrics';
export type QuickStructureValue =
  | 'mindmap-balanced'
  | 'mindmap-radial'
  | 'org-chart'
  | 'brace-map'
  | 'timeline'
  | 'fishbone'
  | 'free-force';

export interface UseGraphFloatingDockParams {
  leafId?: string;
  canvasMode?: CanvasMode;
  onCanvasModeChange?: (mode: CanvasMode) => void;
  layout: LayoutMode;
  onLayoutChange: (layout: LayoutMode) => void;
  orientation: MindmapOrientation;
  onOrientationChange: (orientation: MindmapOrientation) => void;
  collapsedCount?: number;
  onExpandAll?: () => void;
  focused?: boolean;
  onClearFocus?: () => void;
  search?: string;
  onSearchChange?: (val: string) => void;
  minDepth?: number;
  onMinDepthChange?: (val: number) => void;
  maxDepth?: number;
  onMaxDepthChange?: (val: number) => void;
  contentFilter?: string;
  onContentFilterChange?: (val: string) => void;
  tagFilter?: string;
  onTagFilterChange?: (val: string) => void;
  onSmartZoom?: (action: 'fit' | 'selection' | 'reset') => void;
}

function buildConfigBridge(leafApi: ReturnType<typeof useLeafGraphConfigApi>) {
  const g = () => useGraphStore.getState();
  const l = () => leafApi?.getState();
  return {
    updateNodeConfig: (u: Partial<NodeConfig>) => (l() ? l()!.setNodeConfig(u) : g().updateNodeConfig(u)),
    updateLinkConfig: (u: Partial<LinkConfig>) => (l() ? l()!.setLinkConfig(u) : g().updateLinkConfig(u)),
    updateTopologyConfig: (u: Partial<TopologyConfig>) =>
      l() ? l()!.setTopologyConfig(u) : g().updateTopologyConfig(u),
    updateTopologyStyle: (t: LinkStyleType, u: Partial<LinkStyle>) =>
      l()
        ? l()!.setTopologyConfig((p) => ({ styles: { ...p.styles, [t]: { ...p.styles[t], ...u } } }))
        : g().updateTopologyStyle(t, u),
    updateHierarchyConfig: (u: Partial<HierarchyColorConfig>) =>
      l() ? l()!.setHierarchyConfig({ ...l()!.config.hierarchy, ...u }) : g().updateHierarchyConfig(u),
    updateAtmosphereConfig: (u: Partial<GraphConfigState['atmosphere']>) =>
      l() ? l()!.setAtmosphereConfig(u) : g().updateAtmosphereConfig(u),
    updateForceConfig: (u: Partial<ForceConfig>) => (l() ? l()!.setForceConfig(u) : g().updateForceConfig(u)),
    setFullConfig: (c: GraphConfigState) => (l() ? l()!.setFullConfig(c) : g().setConfig(c)),
    resetConfig: () => (l() ? l()!.resetToDefault() : g().resetConfig()),
    applySkeletonPreset: (presetId: SkeletonPresetId) => {
      const preset = SKELETON_PRESETS[presetId];
      if (!preset) return;
      if (l()) {
        l()!.setHierarchyConfig({ ...l()!.config.hierarchy, enabled: true, skeletonPreset: presetId });
        l()!.setLinkConfig({ branchLineStyle: preset.defaultBranchStyle });
      } else {
        g().updateHierarchyConfig({ enabled: true, skeletonPreset: presetId });
        g().updateLinkConfig({ branchLineStyle: preset.defaultBranchStyle });
      }
    },
  };
}

/**
 * Headless controller for the unified top-center GraphFloatingDock.
 * Coordinates cluster popovers, write-through leaf/global config stores, and smart zoom actions.
 */
export function useGraphFloatingDockController(params: UseGraphFloatingDockParams) {
  const dockRootRef = useRef<HTMLDivElement>(null);
  const [activeCluster, setActiveCluster] = useState<DockClusterId | null>(null);
  const [appearanceSubTab, setAppearanceSubTab] = useState<AppearanceSubTab>('presets');

  const leafConfig = useLeafGraphConfig();
  const leafApi = useLeafGraphConfigApi();
  const globalConfig = useGraphStore((s) => s.config);
  const config = leafApi && leafConfig ? leafConfig : globalConfig;

  const nodes = useNodeStore((s) => s.nodes);
  const ix = useGraphInteractionStore();

  const canvasMode = params.canvasMode ?? ix.canvasMode;
  const layoutMode = params.layout ?? ix.layoutMode;
  const orientation = params.orientation ?? ix.orientation;
  const collapsedCount = params.collapsedCount ?? ix.collapsedIds.length;
  const focused = params.focused ?? Boolean(ix.focusedRootId);
  const search = params.search ?? '';
  const minDepth = params.minDepth ?? 0;
  const maxDepth = params.maxDepth ?? 10;
  const contentFilter = params.contentFilter ?? '';
  const tagFilter = params.tagFilter ?? '';

  const activeCanvasTab: QuickCanvasMode = canvasMode;
  const isDeterministic = canvasMode === 'mindmap' || isDeterministicLayout(layoutMode);

  const currentStructure: QuickStructureValue = useMemo(() => {
    if (layoutMode === 'free-force' || canvasMode === 'graph') return 'free-force';
    if (layoutMode === 'mindmap' && orientation === 'radial') return 'mindmap-radial';
    if (layoutMode === 'org-chart' || layoutMode === 'brace-map' || layoutMode === 'timeline' || layoutMode === 'fishbone') {
      return layoutMode;
    }
    return 'mindmap-balanced';
  }, [layoutMode, canvasMode, orientation]);

  const skeletonList = useMemo(() => Object.values(SKELETON_PRESETS), []);
  const activeSkeleton = useMemo(
    () => resolveSkeletonPreset(config.hierarchy?.skeletonPreset),
    [config.hierarchy?.skeletonPreset],
  );
  const filterCount =
    Number(minDepth > 0) + Number(maxDepth < 10) + Number(Boolean(search)) + Number(Boolean(contentFilter)) + Number(Boolean(tagFilter));

  useEffect(() => {
    if (!activeCluster) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveCluster(null);
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target || dockRootRef.current?.contains(target)) return;
      if (target.closest('[data-radix-popper-content-wrapper], [role="listbox"], [role="dialog"], [role="menu"]')) return;
      setActiveCluster(null);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [activeCluster]);

  const toggleCluster = useCallback((cluster: DockClusterId) => {
    setActiveCluster((prev) => (prev === cluster ? null : cluster));
  }, []);

  const { onCanvasModeChange, onLayoutChange, onOrientationChange } = params;
  const applyMode = useCallback(
    (m: CanvasMode) => (onCanvasModeChange ? onCanvasModeChange(m) : ix.setCanvasMode(m)),
    [onCanvasModeChange, ix],
  );
  const applyLayout = useCallback(
    (m: LayoutMode) => (onLayoutChange ? onLayoutChange(m) : ix.setLayoutMode(m)),
    [onLayoutChange, ix],
  );
  const applyOrientation = useCallback(
    (o: MindmapOrientation) => (onOrientationChange ? onOrientationChange(o) : ix.setOrientation(o)),
    [onOrientationChange, ix],
  );

  const configBridge = useMemo(() => buildConfigBridge(leafApi), [leafApi]);

  const actions = {
    ...configBridge,
    handleModeSwitch: applyMode,
    handleLayoutChange: applyLayout,
    handleOrientationChange: applyOrientation,
    switchCanvasTab: (tab: QuickCanvasMode) => {
      applyMode(tab);
      if (tab === 'graph' && layoutMode !== 'free-force') applyLayout('free-force');
      else if (tab === 'mindmap' && layoutMode === 'free-force') applyLayout('mindmap');
    },
    selectStructure: (value: QuickStructureValue) => {
      if (value === 'free-force') {
        applyMode('graph');
        applyLayout('free-force');
        return;
      }
      applyMode('mindmap');
      if (value === 'mindmap-radial') {
        applyOrientation('radial');
        applyLayout('mindmap');
        return;
      }
      applyOrientation('balanced');
      applyLayout(value === 'mindmap-balanced' ? 'mindmap' : (value as LayoutMode));
    },
    applyDepthFold: (level: 1 | 2 | 3 | 'all') => {
      if (level === 'all') {
        if (params.onExpandAll) params.onExpandAll();
        else ix.expandAll();
        return;
      }
      ix.setCollapsed(nodes.filter((n) => n.depth >= level).map((n) => n.id));
    },
    resetAllFilters: () => {
      params.onSearchChange?.('');
      params.onContentFilterChange?.('');
      params.onTagFilterChange?.('');
      params.onMinDepthChange?.(0);
      params.onMaxDepthChange?.(10);
    },
    toggleShowRelationships: () => ix.setShowMindmapRelationships(!ix.showMindmapRelationships),
    toggleArrangementMode: () =>
      ix.layoutArrangement === 'auto' ? ix.setLayoutArrangement('custom') : ix.tidyUpLayout(),
    expandAllAndClearFocus: () => {
      if (params.onExpandAll) params.onExpandAll();
      else ix.expandAll();
      if (params.onClearFocus) params.onClearFocus();
      else ix.setFocusedRoot(null);
    },
    smartZoom: (action: 'fit' | 'selection' | 'reset') => params.onSmartZoom?.(action),
    openWorkspaceGraphSettings: () => {
      setActiveCluster(null);
      useWorkspaceStore.getState().openView({
        type: 'settings',
        title: 'Graph Engine',
        settingsSection: 'graph-engine',
      });
      if (typeof window === 'undefined' || window.innerWidth >= 768) {
        useUIStore.getState().setRightSidebarOpen(true);
      }
    },
  };

  return {
    dockRootRef,
    activeCluster,
    setActiveCluster,
    toggleCluster,
    appearanceSubTab,
    setAppearanceSubTab,
    config,
    canvasMode,
    layoutMode,
    orientation,
    layoutArrangement: ix.layoutArrangement,
    showMindmapRelationships: ix.showMindmapRelationships,
    activeCanvasTab,
    currentStructure,
    skeletonList,
    activeSkeleton,
    isDeterministic,
    collapsedCount,
    focused,
    filterCount,
    search,
    minDepth,
    maxDepth,
    contentFilter,
    tagFilter,
    onSearchChange: params.onSearchChange,
    onMinDepthChange: params.onMinDepthChange,
    onMaxDepthChange: params.onMaxDepthChange,
    onContentFilterChange: params.onContentFilterChange,
    onTagFilterChange: params.onTagFilterChange,
    actions,
  };
}

export type GraphFloatingDockController = ReturnType<typeof useGraphFloatingDockController>;
