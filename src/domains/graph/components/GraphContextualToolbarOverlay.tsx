import { ContextualToolbar } from '@/domains/graph/components/GraphContextualToolbar';
import type { Node, MindmapLayoutMode, CanvasMode } from '@/domains/graph/shared/utils/graph.types';

export interface GraphContextualToolbarOverlayProps {
  isVisible?: boolean;
  selectedNode: Node | null;
  toolbarCoords: { x: number; y: number } | null;
  canvasMode?: CanvasMode;
  currentOverride?: MindmapLayoutMode;
  isFocused: boolean;
  onSetStructure: (layout: MindmapLayoutMode | null) => void;
  onAddSubNode?: (parentId: string, type: 'file' | 'folder') => void;
  onAddBoundary?: (node: Node) => void;
  onAddSummary?: (node: Node) => void;
  onToggleTask?: (nodeId: string) => void;
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
  currentOverride,
  isFocused,
  onSetStructure,
  onAddSubNode,
  onAddBoundary,
  onAddSummary,
  onToggleTask,
  onNodeDelete,
  onToggleFocus,
  onZoomToSelection,
  onClose,
}: GraphContextualToolbarOverlayProps) {
  if (!isVisible || !selectedNode || !toolbarCoords) return null;
  const isTask = Boolean(selectedNode.attachments?.markers?.some((m) => m.kind === 'checkbox'));

  return (
    <ContextualToolbar
      x={toolbarCoords.x}
      y={toolbarCoords.y}
      nodeId={selectedNode.id}
      nodeName={selectedNode.name}
      isFolder={selectedNode.type === 'folder'}
      isTask={isTask}
      canvasMode={canvasMode}
      currentOverride={currentOverride}
      isFocused={isFocused}
      onSetStructure={onSetStructure}
      onAddSub={(type) => onAddSubNode?.(selectedNode.id, type)}
      onAddBoundary={onAddBoundary ? () => onAddBoundary(selectedNode) : undefined}
      onAddSummary={onAddSummary ? () => onAddSummary(selectedNode) : undefined}
      onToggleTask={onToggleTask ? () => onToggleTask(selectedNode.id) : undefined}
      onDelete={() => onNodeDelete?.(selectedNode.id)}
      onToggleFocus={onToggleFocus}
      onZoomToSelection={onZoomToSelection}
      onClose={onClose}
    />
  );
}