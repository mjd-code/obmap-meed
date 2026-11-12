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
      nodeId={selectedNode.id}
      nodeName={selectedNode.name}
      isFolder={selectedNode.type === 'folder'}
      canvasMode={canvasMode}
      currentOverride={currentOverride}
      isFocused={isFocused}
      onSetStructure={onSetStructure}
      onAddSub={(type) => onAddSubNode?.(selectedNode.id, type)}
      onDelete={() => onNodeDelete?.(selectedNode.id)}
      onToggleFocus={onToggleFocus}
      onZoomToSelection={onZoomToSelection}
      onClose={onClose}
    />
  );
}