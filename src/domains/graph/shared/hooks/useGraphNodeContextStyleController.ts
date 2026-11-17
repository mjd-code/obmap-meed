import { useCallback, useMemo, useState } from 'react';
import type {
  BoundaryGroup,
  BoundaryShape,
  MindmapLayoutMode,
  Node,
  NodeStyleOverride,
  SummaryBraceStyle,
  SummaryGroup,
  TopicShape,
} from '@/domains/graph/shared/utils/graph.types';
import type { GraphConfigState } from '@/domains/graph/shared/stores/useGraphStore';
import { resolveSkeletonPreset } from '@/domains/graph/shared/utils/cascadingStyleResolver';
import {
  readNodeFrontmatterMindmapProps,
  upsertNodeFrontmatterMindmapProps,
  type NodeFrontmatterMindmapPatch,
} from '@/domains/graph/shared/utils/frontmatterMindmapSync';

export interface UseGraphNodeContextStyleControllerParams {
  node: Node;
  graphConfig: GraphConfigState;
  currentNodeStyle?: NodeStyleOverride;
  currentBranchColor?: string;
  currentOverride?: MindmapLayoutMode;
  boundaries: BoundaryGroup[];
  summaries: SummaryGroup[];
  onSetStructure: (layout: MindmapLayoutMode | null) => void;
  onSetNodeStyleOverride: (nodeId: string, override: NodeStyleOverride | null) => void;
  onPromoteColorToBranch: (nodeId: string, color: string) => void;
  onSetBranchColorOverride: (nodeId: string, color: string | null) => void;
  onUpsertBoundary: (boundary: BoundaryGroup) => void;
  onRemoveBoundary: (id: string) => void;
  onUpsertSummary: (summary: SummaryGroup) => void;
  onRemoveSummary: (id: string) => void;
  onAddBoundary?: (node: Node) => void;
  onAddSummary?: (node: Node) => void;
  onUpdateNodeContent?: (node: Node, nextContent: string) => Promise<void> | void;
}

/**
 * Headless controller for per-node Style & Format customization inside the node Context Menu.
 */
export function useGraphNodeContextStyleController({
  node,
  graphConfig,
  currentNodeStyle,
  currentBranchColor,
  currentOverride,
  boundaries,
  summaries,
  onSetStructure,
  onSetNodeStyleOverride,
  onPromoteColorToBranch,
  onSetBranchColorOverride,
  onUpsertBoundary,
  onRemoveBoundary,
  onUpsertSummary,
  onRemoveSummary,
  onAddBoundary,
  onAddSummary,
  onUpdateNodeContent,
}: UseGraphNodeContextStyleControllerParams) {
  const [colorScope, setColorScope] = useState<'branch' | 'node'>('branch');

  const activeSkeleton = useMemo(
    () => resolveSkeletonPreset(graphConfig.hierarchy?.skeletonPreset),
    [graphConfig.hierarchy?.skeletonPreset],
  );

  const frontmatterProps = useMemo(
    () => (node.type === 'file' ? readNodeFrontmatterMindmapProps(node.content ?? '') : {}),
    [node.type, node.content],
  );

  const activeShape = currentNodeStyle?.topicShape ?? frontmatterProps.topicShape;
  const activeColor =
    currentNodeStyle?.fillColor ?? currentBranchColor ?? frontmatterProps.branchColor;

  const nodeBoundary = useMemo(
    () =>
      boundaries.find((b) => b.id === `boundary-${node.id}`) ??
      boundaries.find((b) => b.nodeIds.includes(node.id)) ??
      null,
    [boundaries, node.id],
  );

  const nodeSummary = useMemo(
    () => summaries.find((s) => s.id === `sumgrp-${node.id}`) ?? null,
    [summaries, node.id],
  );

  const updateFrontmatter = useCallback(
    (patch: NodeFrontmatterMindmapPatch) => {
      if (node.type !== 'file' || !onUpdateNodeContent) return;
      const nextContent = upsertNodeFrontmatterMindmapProps(node.content ?? '', patch);
      void onUpdateNodeContent(node, nextContent);
    },
    [node, onUpdateNodeContent],
  );

  const setTopicShape = useCallback(
    (topicShape: TopicShape | null) => {
      const prev = currentNodeStyle ?? {};
      const next = { ...prev };
      if (!topicShape) delete next.topicShape;
      else next.topicShape = topicShape;
      onSetNodeStyleOverride(node.id, Object.keys(next).length > 0 ? next : null);
      if (node.type === 'file') {
        updateFrontmatter({ topic_shape: topicShape });
      }
    },
    [currentNodeStyle, node.id, node.type, onSetNodeStyleOverride, updateFrontmatter],
  );

  const applyColor = useCallback(
    (color: string, forceNodeOnly = false) => {
      const applyToBranch = !forceNodeOnly && colorScope === 'branch';
      if (applyToBranch) {
        onPromoteColorToBranch(node.id, color);
        if (node.type === 'file') {
          updateFrontmatter({ branch_color: color });
        }
      } else {
        const prev = currentNodeStyle ?? {};
        onSetNodeStyleOverride(node.id, { ...prev, fillColor: color });
      }
    },
    [
      colorScope,
      currentNodeStyle,
      node.id,
      node.type,
      onPromoteColorToBranch,
      onSetNodeStyleOverride,
      updateFrontmatter,
    ],
  );

  const resetStyle = useCallback(() => {
    onSetNodeStyleOverride(node.id, null);
    onSetBranchColorOverride(node.id, null);
    onSetStructure(null);
    if (node.type === 'file') {
      updateFrontmatter({ topic_shape: null, branch_color: null, structure_class: null });
    }
  }, [
    node.id,
    node.type,
    onSetBranchColorOverride,
    onSetNodeStyleOverride,
    onSetStructure,
    updateFrontmatter,
  ]);

  const updateBoundaryShape = useCallback(
    (shape: BoundaryShape) => {
      if (!nodeBoundary) return;
      onUpsertBoundary({ ...nodeBoundary, shape });
    },
    [nodeBoundary, onUpsertBoundary],
  );

  const updateSummaryStyle = useCallback(
    (braceStyle: SummaryBraceStyle) => {
      if (!nodeSummary) return;
      onUpsertSummary({ ...nodeSummary, braceStyle });
    },
    [nodeSummary, onUpsertSummary],
  );

  return {
    colorScope,
    setColorScope,
    activeSkeleton,
    frontmatterProps,
    activeShape,
    activeColor,
    currentOverride,
    nodeBoundary,
    nodeSummary,
    setTopicShape,
    applyColor,
    resetStyle,
    updateFrontmatter,
    updateBoundaryShape,
    removeBoundary: () => nodeBoundary && onRemoveBoundary(nodeBoundary.id),
    updateSummaryStyle,
    removeSummary: () => nodeSummary && onRemoveSummary(nodeSummary.id),
    wrapBoundary: () => onAddBoundary?.(node),
    createSummary: () => onAddSummary?.(node),
  };
}
