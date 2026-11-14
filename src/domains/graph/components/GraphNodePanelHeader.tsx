import { Button } from "@/global/ui/button";
import {
  Trash2,
  Save,
  BookOpen,
  Link2,
  MoreHorizontal,
  Maximize,
  Minimize,
  PenLine,
  Network,
  Undo2,
  Redo2,
} from "lucide-react";
import { cn } from "@/global/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/global/ui/dropdown-menu";
import { NodeBreadcrumbBar } from "@/domains/graph/components/GraphNodeBreadcrumbBar";
import { DocumentSharePopover } from "@/domains/collaboration/components/CollabDocumentSharePopover";
import { undoActiveEditor, redoActiveEditor } from "@/domains/editor/shared/api/activeEditor";
import type { GraphPanelNode } from "@/domains/graph/shared/hooks/useGraphNodePanelController";

interface GraphNodePanelHeaderProps {
  node: GraphPanelNode;
  content: string;
  hasChanges: boolean;
  isSaving: boolean;
  layoutMode: "wide" | "narrow";
  editorMode: "editor" | "reading";
  historyStatus: { canUndo: boolean; canRedo: boolean };
  onBreadcrumbClick?: (target: GraphPanelNode) => void;
  onContentRestore: (restoredContent: string) => void;
  onToggleLayoutMode: () => void;
  onToggleEditorMode: () => void;
  onCopyEmbedLink: () => void;
  onOpenInGraph: () => void;
  onSave: () => void;
  onDelete: () => void;
  onRefreshHistoryStatus: () => void;
}

export function GraphNodePanelHeader({
  node,
  content,
  hasChanges,
  isSaving,
  layoutMode,
  editorMode,
  historyStatus,
  onBreadcrumbClick,
  onContentRestore,
  onToggleLayoutMode,
  onToggleEditorMode,
  onCopyEmbedLink,
  onOpenInGraph,
  onSave,
  onDelete,
  onRefreshHistoryStatus,
}: GraphNodePanelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border/40 bg-muted/10 gap-2 shrink-0">
      <NodeBreadcrumbBar
        node={node}
        hasChanges={hasChanges}
        isSaving={isSaving}
        onBreadcrumbClick={onBreadcrumbClick}
      />

      <div className="flex items-center gap-1.5 shrink-0">
        {node.type === "file" && (
          <DocumentSharePopover
            noteId={node.id}
            noteTitle={node.name}
            currentContent={content}
            onContentRestore={onContentRestore}
          />
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground rounded transition-colors"
              title="Pengaturan Tampilan & Berkas"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 shadow-lg">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1">
              Tampilan & Format
            </DropdownMenuLabel>

            <DropdownMenuItem onClick={onToggleLayoutMode} className="text-xs">
              {layoutMode === "wide" ? (
                <>
                  <Minimize className="w-3.5 h-3.5 mr-2" />
                  <span>Narrow</span>
                </>
              ) : (
                <>
                  <Maximize className="w-3.5 h-3.5 mr-2" />
                  <span>Full Width</span>
                </>
              )}
            </DropdownMenuItem>

            {node.type === "file" && (
              <DropdownMenuItem onClick={onToggleEditorMode} className="text-xs">
                {editorMode === "editor" ? (
                  <>
                    <BookOpen className="w-3.5 h-3.5 mr-2 text-primary" />
                    <span>Reading</span>
                  </>
                ) : (
                  <>
                    <PenLine className="w-3.5 h-3.5 mr-2 text-primary" />
                    <span>Editing</span>
                  </>
                )}
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1">
              Aksi Dokumen
            </DropdownMenuLabel>

            {node.type === "media" && (
              <DropdownMenuItem onClick={onCopyEmbedLink} className="text-xs">
                <Link2 className="w-3.5 h-3.5 mr-2" />
                Salin Tautan Embed
              </DropdownMenuItem>
            )}

            <DropdownMenuItem onClick={onOpenInGraph} className="text-xs cursor-pointer">
              <Network className="w-3.5 h-3.5 mr-2 text-primary" />
              <span>Buka di Tab Graph</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onSave} disabled={!hasChanges} className="text-xs">
              <Save className="w-3.5 h-3.5 mr-2" />
              Simpan Perubahan
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={onDelete}
              className="text-xs text-destructive focus:text-destructive cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Hapus Dokumen
            </DropdownMenuItem>

            {node.type === "file" && (
              <>
                <DropdownMenuSeparator />
                <div className="p-1 pt-0.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        undoActiveEditor();
                        onRefreshHistoryStatus();
                      }}
                      disabled={!historyStatus.canUndo || editorMode === "reading"}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 p-1 rounded text-xs select-none transition-all",
                        historyStatus.canUndo && editorMode !== "reading"
                          ? "text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer active:scale-95"
                          : "text-muted-foreground/35 cursor-not-allowed opacity-50",
                      )}
                      title="Batal perubahan (Ctrl+Z)"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span className="font-medium">Undo</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        redoActiveEditor();
                        onRefreshHistoryStatus();
                      }}
                      disabled={!historyStatus.canRedo || editorMode === "reading"}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 p-1 rounded text-xs select-none transition-all",
                        historyStatus.canRedo && editorMode !== "reading"
                          ? "text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer active:scale-95"
                          : "text-muted-foreground/35 cursor-not-allowed opacity-50",
                      )}
                      title="Ulang perubahan (Ctrl+Y)"
                    >
                      <span className="font-medium">Redo</span>
                      <Redo2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
