import { ContextualToolbar } from '@/domains/graph/components/GraphContextualToolbar';
import type {
  BoundaryGroup,
  Node,
  MindmapLayoutMode,
  CanvasMode,
  NodeStyleOverride,
  SummaryGroup,
} from '@/domains/graph/shared/utils/graph.types';
import type { GraphConfigState } from '@/domains/graph/shared/stores/useGraphStore';

export interface GraphContextualToolbarOverlayProps {
  isVisible?: boolean;
  selectedNode: Node | null;
  toolbarCoords: { x: number; y: number } | null;
  canvasMode?: CanvasMode;
  graphConfig: GraphConfigState;
  currentNodeStyle?: NodeStyleOverride;
  currentBranchColor?: string;
  boundaries: BoundaryGroup[];
  summaries: SummaryGroup[];
  currentOverride?: MindmapLayoutMode;
  isFocused: boolean;
  onSetStructure: (layout: MindmapLayoutMode | null) => void;
  onSetNodeStyleOverride: (nodeId: string, override: NodeStyleOverride | null) => void;
  onPromoteColorToBranch: (nodeId: string, color: string) => void;
  onSetBranchColorOverride: (nodeId: string, color: string | null) => void;
  onUpsertBoundary: (boundary: BoundaryGroup) => void;
  onRemoveBoundary: (id: string) => void;
  onUpsertSummary: (summary: SummaryGroup) => void;
  onRemoveSummary: (id: string) => void;
  onAddSubNode?: (parentId: string, type: 'file' | 'folder') => void;
  onAddBoundary?: (node: Node) => void;
  onAddSummary?: (node: Node) => void;
  onUpdateNodeContent?: (node: Node, nextContent: string) => Promise<void> | void;
  onNodeDelete?: (nodeId: string) => void;
  onToggleFocus: () => void;
  onZoomToSelection: () => void;
  onClose?: () => void;
}

export function GraphContextualToolbarOverlay({
  isVisible = true,
  selectedNode,
  toolbarCoords,
  canvasMode = 'mindmap',
  graphConfig,
  currentNodeStyle,
  currentBranchColor,
  boundaries,
  summaries,
  currentOverride,
  isFocused,
  onSetStructure,
  onSetNodeStyleOverride,
  onPromoteColorToBranch,
  onSetBranchColorOverride,
  onUpsertBoundary,
  onRemoveBoundary,
  onUpsertSummary,
  onRemoveSummary,
  onAddSubNode,
  onAddBoundary,
  onAddSummary,
  onUpdateNodeContent,
  onNodeDelete,
  onToggleFocus,
  onZoomToSelection,
  onClose,
}: GraphContextualToolbarOverlayProps) {
  if (!isVisible || !selectedNode || !toolbarCoords) return null;

  return (
    <ContextualToolbar
      x={toolbarCoords.x}
      y={toolbarCoords.y}
      node={selectedNode}
      canvasMode={canvasMode}
      graphConfig={graphConfig}
      currentNodeStyle={currentNodeStyle}
      currentBranchColor={currentBranchColor}
      boundaries={boundaries}
      summaries={summaries}
      currentOverride={currentOverride}
      isFocused={isFocused}
      onSetStructure={onSetStructure}
      onSetNodeStyleOverride={onSetNodeStyleOverride}
      onPromoteColorToBranch={onPromoteColorToBranch}
      onSetBranchColorOverride={onSetBranchColorOverride}
      onUpsertBoundary={onUpsertBoundary}
      onRemoveBoundary={onRemoveBoundary}
      onUpsertSummary={onUpsertSummary}
      onRemoveSummary={onRemoveSummary}
      onAddSub={(type) => onAddSubNode?.(selectedNode.id, type)}
      onAddBoundary={onAddBoundary ? () => onAddBoundary(selectedNode) : undefined}
      onAddSummary={onAddSummary ? () => onAddSummary(selectedNode) : undefined}
      onUpdateNodeContent={onUpdateNodeContent}
      onDelete={() => onNodeDelete?.(selectedNode.id)}
      onToggleFocus={onToggleFocus}
      onZoomToSelection={onZoomToSelection}
      onClose={onClose}
    />
  );
}