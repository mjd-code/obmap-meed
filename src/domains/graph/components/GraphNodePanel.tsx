import { Input } from "@/global/ui/input";
import { Textarea } from "@/global/ui/textarea";
import { MarkdownView } from "@/domains/editor/components/EditorMarkdownView";
import { ScrollArea } from "@/global/ui/scroll-area";
import { cn } from "@/global/utils";
import { NodeMediaPreview } from "@/domains/graph/components/GraphNodeMediaPreview";
import {
  NodeBacklinksSection,
  type Backlink,
} from "@/domains/graph/components/GraphNodeBacklinksSection";
import { FolderOverviewEditor } from "@/domains/graph/components/GraphFolderOverviewEditor";
import { NodeCitationsSection } from "@/domains/graph/components/GraphNodeCitationsSection";
import { GraphNodePanelHeader } from "@/domains/graph/components/GraphNodePanelHeader";
import {
  useGraphNodePanelController,
  type GraphPanelNode,
} from "@/domains/graph/shared/hooks/useGraphNodePanelController";

type Node = GraphPanelNode;

interface NodePanelProps {
  node: Node | null;
  nodePath?: string;
  onClose: () => void;
  onUpdate: (node: Node) => void;
  onDelete: (nodeId: string) => void;
  backlinks?: Backlink[];
  onWikilinkClick?: (target: string) => void;
  onBacklinkClick?: (nodeId: string) => void;
  onTagClick?: (tag: string) => void;
  autoSaveDelay?: number;
  onBreadcrumbClick?: (target: Node) => void;
}

export const NodePanel = ({
  node,
  onClose,
  onUpdate,
  onDelete,
  backlinks = [],
  onWikilinkClick,
  onBacklinkClick,
  onTagClick,
  autoSaveDelay = 1500,
  onBreadcrumbClick,
}: NodePanelProps) => {
  const ctrl = useGraphNodePanelController({
    node,
    onClose,
    onUpdate,
    onDelete,
    autoSaveDelay,
  });

  if (!node) return null;

  return (
    <div className="w-full h-full flex flex-col bg-background">
      <GraphNodePanelHeader
        node={node}
        content={ctrl.content}
        hasChanges={ctrl.hasChanges}
        isSaving={ctrl.isSaving}
        layoutMode={ctrl.layoutMode}
        editorMode={ctrl.editorMode}
        historyStatus={ctrl.historyStatus}
        onBreadcrumbClick={onBreadcrumbClick}
        onContentRestore={ctrl.handleContentRestore}
        onToggleLayoutMode={() =>
          ctrl.setLayoutMode((prev) => (prev === "wide" ? "narrow" : "wide"))
        }
        onToggleEditorMode={() =>
          ctrl.setEditorMode((prev) => (prev === "editor" ? "reading" : "editor"))
        }
        onCopyEmbedLink={ctrl.copyEmbedLink}
        onOpenInGraph={ctrl.handleOpenInGraph}
        onSave={() => ctrl.handleSave(false)}
        onDelete={ctrl.handleDelete}
        onRefreshHistoryStatus={ctrl.refreshHistoryStatus}
      />

      <ScrollArea className="flex-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent [&>[data-radix-scroll-area-viewport]>div]:!block [&>[data-radix-scroll-area-viewport]>div]:!w-full [&>[data-radix-scroll-area-viewport]>div]:!min-w-0 [&>[data-radix-scroll-area-viewport]>div]:!max-w-full">
        <div
          className={cn(
            "mx-auto transition-all duration-200 w-full min-w-0 max-w-full overflow-hidden",
            ctrl.layoutMode === "wide"
              ? "max-w-none px-2.5 sm:px-6 py-2 sm:py-2"
              : "max-w-3xl px-3 sm:px-6 py-2 sm:py-2",
          )}
        >
          <div className="w-full min-w-0 max-w-full overflow-hidden">
            <Input
              ref={ctrl.titleInputRef}
              value={ctrl.name}
              onChange={(e) => ctrl.setName(e.target.value)}
              placeholder={node.type === "folder" ? "Untitled folder" : "Untitled"}
              className="w-full min-w-0 max-w-full text-xl sm:text-2xl md:text-3xl lg:text-[2rem] font-bold tracking-tight bg-transparent border-0 border-none shadow-none px-0 h-auto placeholder:text-muted-foreground/30 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:outline-none focus:ring-0 selection:bg-primary/20 truncate"
            />
          </div>

          <div className="h-px bg-border/40 my-2" />

          {node.type === "media" && node.dataUrl && (
            <div className="mb-8">
              <NodeMediaPreview node={node} />
            </div>
          )}

          {node.type === "file" && (
            <div className="flex-1 min-h-0 flex flex-col">
              <MarkdownView
                value={ctrl.content}
                onChange={ctrl.setContent}
                showProperties
                mode={ctrl.editorMode === "reading" ? "reading" : "live"}
                placeholder="Write '/' or start writing..."
                onWikilinkClick={onWikilinkClick}
                onTagClick={onTagClick}
                onSave={() => ctrl.handleSave(false)}
              />
            </div>
          )}

          {node.type === "folder" && (
            <FolderOverviewEditor
              folderNode={node}
              onUpdateFolder={onUpdate}
              onDeleteFolder={onDelete}
            />
          )}

          {node.type === "media" && (
            <Textarea
              value={ctrl.content}
              onChange={(e) => ctrl.setContent(e.target.value)}
              placeholder="Tambahkan catatan untuk media ini..."
              className="w-full min-h-[150px] bg-transparent border-none shadow-none resize-none text-sm leading-relaxed placeholder:text-muted-foreground/30 focus:outline-none focus-visible:ring-0 focus-visible:outline-none px-1 py-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
            />
          )}

          {(node.type === "file" || node.type === "media") && (
            <NodeCitationsSection
              content={ctrl.content || node.content || ""}
              onContentChange={ctrl.setContent}
              onChange={ctrl.setContent}
              onCitationClick={ctrl.handleCitationClick}
            />
          )}

          {(node.type === "file" || node.type === "media") && (
            <NodeBacklinksSection
              backlinks={backlinks}
              onBacklinkClick={onBacklinkClick || (() => {})}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
