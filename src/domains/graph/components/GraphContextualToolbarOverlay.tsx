import { ContextualToolbar } from '@/domains/graph/components/GraphContextualToolbar';
import type { Node } from '@/global/types';
import type { LayoutMode } from '@/domains/graph/shared/utils/graph.types';

export interface GraphContextualToolbarOverlayProps {
  activeNode: Node | null;
  position: { x: number; y: number } | null;
  layoutMode: LayoutMode;
  onFocusBranch: (nodeId: string) => void;
  onSelectSubtreeLayout: (nodeId: string, layout: LayoutMode) => void;
  onClose: () => void;
  onAddSubNode?: (parentId: string, type: 'file' | 'folder') => void;
  onDeleteNode?: (nodeId: string) => void;
}

export function GraphContextualToolbarOverlay({
  activeNode,
  position,
  layoutMode,
  onFocusBranch,
  onSelectSubtreeLayout,
  onClose,
  onAddSubNode,
  onDeleteNode,
}: GraphContextualToolbarOverlayProps) {
  if (!activeNode || !position) return null;

  return (
    <div
      className="absolute pointer-events-auto z-40 transition-transform duration-75"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%) translateY(-18px)',
      }}
    >
      <ContextualToolbar
        activeNode={activeNode}
        currentLayout={layoutMode}
        onFocusBranch={() => onFocusBranch(activeNode.id)}
        onSelectSubtreeLayout={(mode) => onSelectSubtreeLayout(activeNode.id, mode)}
        onClose={onClose}
        onAddSubNode={onAddSubNode ? (type) => onAddSubNode(activeNode.id, type) : undefined}
        onDeleteNode={onDeleteNode ? () => onDeleteNode(activeNode.id) : undefined}
      />
    </div>
  );
}