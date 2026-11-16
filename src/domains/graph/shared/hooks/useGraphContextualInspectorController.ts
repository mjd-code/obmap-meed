import { useCallback, useMemo } from 'react';
import type {
  BoundaryShape,
  MindmapLayoutMode,
  Node,
  SkeletonPresetId,
  SummaryBraceStyle,
  TopicShape,
} from '@/domains/graph/shared/utils/graph.types';
import {
  useGraphStore,
  useNodeStore,
} from '@/global/stores';
import type {
  ForceConfig,
  LinkConfig,
  NodeConfig,
} from '@/domains/graph/shared/stores/useGraphStore';
import { useGraphInteractionStore } from '@/domains/graph/shared/stores/useGraphInteractionStore';
import {
  useLeafGraphConfig,
  useLeafGraphConfigApi,
} from '@/domains/graph/shared/stores/useLeafGraphConfigStore';
import {
  SKELETON_PRESETS,
  resolveSkeletonPreset,
} from '@/domains/graph/shared/utils/cascadingStyleResolver';
import {
  readNodeFrontmatterMindmapProps,
  upsertNodeFrontmatterMindmapProps,
  type NodeFrontmatterMindmapPatch,
} from '@/domains/graph/shared/utils/frontmatterMindmapSync';
import { updateNodeAction } from '@/domains/workspace/shared/api/workspaceActions';

export type InspectorScope = 'canvas' | 'topic' | 'decoration';

export interface UseGraphContextualInspectorControllerParams {
  activeOutlineNote?: Node | null;
  isOutlineMode?: boolean;
  isAuthenticated?: boolean;
  onUpdateOutlineContent?: (nextMarkdown: string) => void;
}

export function useGraphContextualInspectorController({
  activeOutlineNote,
  isOutlineMode = false,
  isAuthenticated = false,
  onUpdateOutlineContent,
}: UseGraphContextualInspectorControllerParams = {}) {

  const selectedNode = useNodeStore((s) => s.selectedNode);
  const nodes = useNodeStore((s) => s.nodes);
  const getDescendants = useNodeStore((s) => s.getDescendants);

  const leafConfig = useLeafGraphConfig();
  const leafApi = useLeafGraphConfigApi();
  const globalConfig = useGraphStore((s) => s.config);
  const config = leafApi && leafConfig ? leafConfig : globalConfig;

  const layoutMode = useGraphInteractionStore((s) => s.layoutMode);
  const layoutArrangement = useGraphInteractionStore((s) => s.layoutArrangement);
  const subtreeLayoutOverrides = useGraphInteractionStore((s) => s.subtreeLayoutOverrides);
  const branchColorOverrides = useGraphInteractionStore((s) => s.branchColorOverrides);
  const nodeStyleOverrides = useGraphInteractionStore((s) => s.nodeStyleOverrides);
  const boundaries = useGraphInteractionStore((s) => s.boundaries);
  const summaries = useGraphInteractionStore((s) => s.summaries);
  const relationships = useGraphInteractionStore((s) => s.relationships);

  const setSubtreeLayoutOverride = useGraphInteractionStore((s) => s.setSubtreeLayoutOverride);
  const setBranchColorOverride = useGraphInteractionStore((s) => s.setBranchColorOverride);
  const setNodeStyleOverride = useGraphInteractionStore((s) => s.setNodeStyleOverride);
  const promoteColorToBranch = useGraphInteractionStore((s) => s.promoteColorToBranch);
  const upsertBoundary = useGraphInteractionStore((s) => s.upsertBoundary);
  const removeBoundary = useGraphInteractionStore((s) => s.removeBoundary);
  const upsertSummary = useGraphInteractionStore((s) => s.upsertSummary);
  const removeSummary = useGraphInteractionStore((s) => s.removeSummary);
  const setLayoutArrangement = useGraphInteractionStore((s) => s.setLayoutArrangement);
  const tidyUpLayout = useGraphInteractionStore((s) => s.tidyUpLayout);

  const scope: InspectorScope = selectedNode
    ? 'topic'
    : boundaries.length > 0 || summaries.length > 0
      ? 'decoration'
      : 'canvas';

  const activeSkeleton = useMemo(
    () => resolveSkeletonPreset(config.hierarchy?.skeletonPreset),
    [config.hierarchy?.skeletonPreset],
  );

  const targetFileNode = useMemo(() => {
    if (isOutlineMode && activeOutlineNote) return activeOutlineNote;
    if (selectedNode && selectedNode.type === 'file') return selectedNode;
    return null;
  }, [isOutlineMode, activeOutlineNote, selectedNode]);

  const frontmatterProps = useMemo(
    () => (targetFileNode ? readNodeFrontmatterMindmapProps(targetFileNode.content ?? '') : {}),
    [targetFileNode],
  );

  const updateFrontmatter = useCallback(
    async (patch: NodeFrontmatterMindmapPatch) => {
      if (!targetFileNode) return;
      const nextContent = upsertNodeFrontmatterMindmapProps(targetFileNode.content ?? '', patch);
      if (isOutlineMode && onUpdateOutlineContent) {
        onUpdateOutlineContent(nextContent);
        return;
      }
      await updateNodeAction({ ...targetFileNode, content: nextContent }, isAuthenticated);
    },
    [targetFileNode, isOutlineMode, onUpdateOutlineContent, isAuthenticated],
  );

  const setSkeletonPreset = useCallback(
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

  const updateNodeSetting = useCallback(
    (patch: Partial<NodeConfig>) => {
      if (leafApi) leafApi.getState().setNodeConfig(patch);
      else useGraphStore.getState().updateNodeConfig(patch);
    },
    [leafApi],
  );

  const updateLinkSetting = useCallback(
    (patch: Partial<LinkConfig>) => {
      if (leafApi) leafApi.getState().setLinkConfig(patch);
      else useGraphStore.getState().updateLinkConfig(patch);
    },
    [leafApi],
  );

  const updateForceSetting = useCallback(
    (patch: Partial<ForceConfig>) => {
      if (leafApi) leafApi.getState().setForceConfig(patch);
      else useGraphStore.getState().updateForceConfig(patch);
    },
    [leafApi],
  );

  const setSubtreeStructure = useCallback(
    (mode: MindmapLayoutMode | null) => {
      if (!selectedNode) return;
      setSubtreeLayoutOverride(selectedNode.id, mode);
      if (!isOutlineMode && selectedNode.type === 'file') {
        void updateFrontmatter({ structure_class: mode });
      }
    },
    [selectedNode, setSubtreeLayoutOverride, isOutlineMode, updateFrontmatter],
  );

  const setTopicShape = useCallback(
    (topicShape: TopicShape | null) => {
      if (!selectedNode) return;
      const prev = nodeStyleOverrides[selectedNode.id] ?? {};
      const next = { ...prev };
      if (!topicShape) delete next.topicShape;
      else next.topicShape = topicShape;
      setNodeStyleOverride(selectedNode.id, Object.keys(next).length > 0 ? next : null);
      if (!isOutlineMode && selectedNode.type === 'file') {
        void updateFrontmatter({ topic_shape: topicShape });
      }
    },
    [selectedNode, nodeStyleOverrides, setNodeStyleOverride, isOutlineMode, updateFrontmatter],
  );

  const applyTopicColor = useCallback(
    (color: string, applyToBranch: boolean) => {
      if (!selectedNode) return;
      if (applyToBranch) {
        promoteColorToBranch(selectedNode.id, color);
        if (!isOutlineMode && selectedNode.type === 'file') {
          void updateFrontmatter({ branch_color: color });
        }
      } else {
        const prev = nodeStyleOverrides[selectedNode.id] ?? {};
        setNodeStyleOverride(selectedNode.id, { ...prev, fillColor: color });
      }
    },
    [selectedNode, promoteColorToBranch, nodeStyleOverrides, setNodeStyleOverride, isOutlineMode, updateFrontmatter],
  );

  const resetSelectedStyle = useCallback(() => {
    if (!selectedNode) return;
    setNodeStyleOverride(selectedNode.id, null);
    setBranchColorOverride(selectedNode.id, null);
    setSubtreeLayoutOverride(selectedNode.id, null);
    if (!isOutlineMode && selectedNode.type === 'file') {
      void updateFrontmatter({ topic_shape: null, branch_color: null, structure_class: null });
    }
  }, [
    selectedNode,
    setNodeStyleOverride,
    setBranchColorOverride,
    setSubtreeLayoutOverride,
    isOutlineMode,
    updateFrontmatter,
  ]);

  const wrapSelectedInBoundary = useCallback(
    (shape: BoundaryShape = 'rounded') => {
      if (!selectedNode) return;
      const descendants = getDescendants(selectedNode.id);
      const ids = Array.from(new Set([selectedNode.id, ...descendants.map((d) => d.id)]));
      upsertBoundary({
        id: `boundary-${selectedNode.id}`,
        title: selectedNode.name,
        nodeIds: ids,
        shape,
        padding: 16,
      });
    },
    [selectedNode, getDescendants, upsertBoundary],
  );

  const createSummaryForSelected = useCallback(
    (braceStyle: SummaryBraceStyle = 'curly') => {
      if (!selectedNode || !selectedNode.parentId) return;
      const summaryNodeId = `summary-${selectedNode.id}`;
      upsertSummary({
        id: `sumgrp-${selectedNode.id}`,
        parentId: selectedNode.parentId,
        rangeNodeIds: [selectedNode.id, selectedNode.id],
        summaryNodeId,
        braceStyle,
        label: `Ringkasan ${selectedNode.name}`,
      });
    },
    [selectedNode, upsertSummary],
  );

  const applyLeafAsGlobalDefault = useCallback(() => {
    useGraphStore.getState().setConfig(config);
  }, [config]);

  const resetLeafToDefault = useCallback(() => {
    if (leafApi) leafApi.getState().resetToDefault();
    else useGraphStore.getState().resetConfig();
  }, [leafApi]);

  return {
    scope,
    selectedNode,
    nodeCount: nodes.length,
    config,
    layoutMode,
    layoutArrangement,
    activeSkeleton,
    frontmatterProps,
    currentSubtreeOverride: selectedNode ? subtreeLayoutOverrides[selectedNode.id] : undefined,
    currentNodeStyle: selectedNode ? nodeStyleOverrides[selectedNode.id] : undefined,
    currentBranchColor: selectedNode ? branchColorOverrides[selectedNode.id] : undefined,
    boundaries,
    summaries,
    relationships,
    actions: {
      setSkeletonPreset,
      updateNodeSetting,
      updateLinkSetting,
      updateForceSetting,
      setSubtreeStructure,
      setTopicShape,
      applyTopicColor,
      resetSelectedStyle,
      updateFrontmatter,
      wrapSelectedInBoundary,
      createSummaryForSelected,
      upsertBoundary,
      removeBoundary,
      upsertSummary,
      removeSummary,
      setLayoutArrangement,
      tidyUpLayout,
      applyLeafAsGlobalDefault,
      resetLeafToDefault,
    },
  };
}
