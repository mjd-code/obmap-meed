import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/global/ui/collapsible";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Bookmark,
  ExternalLink,
  AlertCircle,
  Plus,
  Trash2,
  Check,
  Edit2,
} from "lucide-react";
import { useGraphNodeCitationsController } from "@/domains/graph/shared/hooks/useGraphNodeCitationsController";

export interface NodeCitationsSectionProps {
  content: string;
  onContentChange?: (updatedContent: string) => void;
  onChange?: (updatedContent: string) => void;
  onCitationClick?: (label: string) => void;
}

export const NodeCitationsSection = ({
  content,
  onContentChange,
  onChange,
  onCitationClick,
}: NodeCitationsSectionProps) => {
  const ctrl = useGraphNodeCitationsController({ content, onContentChange, onChange });

  if (ctrl.totalCount === 0 && !ctrl.isOpen) return null;

  return (
    <Collapsible
      open={ctrl.isOpen}
      onOpenChange={ctrl.setIsOpen}
      className="mt-2 pt-2 border-t border-border/30"
      id="node-citations-section"
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group">
        <div className="flex items-center gap-1.5">
          {ctrl.isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 transition-transform" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 transition-transform" />
          )}
          <Bookmark className="w-3.5 h-3.5 text-primary/70" />
          <span>Footnotes & Citations</span>
        </div>
        <div className="flex items-center gap-1.5">
          {ctrl.unresolved.length > 0 && (
            <span
              title={`${ctrl.unresolved.length} kutipan belum memiliki definisi`}
              className="flex items-center text-[10px] text-amber-500 font-normal gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              <span>{ctrl.unresolved.length} pending</span>
            </span>
          )}
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
            {ctrl.totalCount}
          </Badge>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-2 space-y-1.5">
        {ctrl.definitions.map((def) => {
          const isCurrentlyEditing = ctrl.editingLabel === def.label;

          return (
            <div
              key={def.label}
              id={`citation-def-${def.label}`}
              className="p-1.5 rounded-md bg-muted/20 hover:bg-muted/30 transition-all border border-border/20 text-xs space-y-1 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="shrink-0 px-1 py-0.2 rounded text-[10px] font-mono font-semibold bg-primary/10 text-primary border border-primary/20">
                    [^{def.label}]
                  </span>
                  {!isCurrentlyEditing && (
                    <span
                      onClick={() => onCitationClick?.(def.label)}
                      className="truncate text-[11px] text-foreground/90 cursor-pointer hover:text-primary transition-colors select-text"
                      title={def.text || "Belum ada teks"}
                    >
                      {def.text || <em className="text-muted-foreground">Belum diisi</em>}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
                  {def.url && (
                    <a
                      href={def.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted/50"
                      title={def.url}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      isCurrentlyEditing
                        ? ctrl.handleSaveEdit(def.label)
                        : ctrl.handleStartEdit(def.label, def.text)
                    }
                    className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                    title={isCurrentlyEditing ? "Simpan" : "Edit Cepat"}
                  >
                    {isCurrentlyEditing ? (
                      <Check className="w-3 h-3 text-primary" />
                    ) : (
                      <Edit2 className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => ctrl.handleDelete(def.label)}
                    className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-destructive"
                    title="Hapus"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {isCurrentlyEditing && (
                <div className="space-y-1 pt-1">
                  <textarea
                    value={ctrl.draftText}
                    onChange={(e) => ctrl.setDraftText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        ctrl.handleSaveEdit(def.label);
                      }
                    }}
                    placeholder="Tulis definisi kutipan / footnote..."
                    rows={2}
                    className="w-full text-xs p-1.5 rounded bg-background border border-border/50 outline-none focus:border-primary/60 resize-none leading-relaxed"
                  />
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => ctrl.setEditingLabel(null)}
                      className="h-5 text-[10px] px-2"
                    >
                      Batal
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => ctrl.handleSaveEdit(def.label)}
                      className="h-5 text-[10px] px-2"
                    >
                      Simpan
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {ctrl.unresolved.length > 0 && (
          <div className="pt-1 flex flex-wrap gap-1 items-center">
            <span className="text-[10px] text-muted-foreground/70 mr-1">Belum terisi:</span>
            {ctrl.unresolved.map((u) => (
              <Badge
                key={u.label}
                variant="outline"
                className="text-[10px] h-4 px-1 text-amber-500 border-amber-500/30 cursor-pointer hover:bg-amber-500/10"
                onClick={() => ctrl.handleStartEdit(u.label, "")}
              >
                [^{u.label}] +
              </Badge>
            ))}
          </div>
        )}

        <div className="pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={ctrl.handleAddNew}
            className="w-full h-6 text-[10px] text-muted-foreground hover:text-foreground justify-center gap-1 border border-dashed border-border/40"
          >
            <Plus className="w-3 h-3" />
            Tambah Kutipan [^{ctrl.nextNumber}]
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
