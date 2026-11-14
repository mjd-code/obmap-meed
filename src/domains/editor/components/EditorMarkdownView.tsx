// src/domains/editor/components/MarkdownView.tsx
import { cn } from "@/global/utils";
import { PropertiesPanel } from "@/domains/editor/components/EditorPropertiesPanel";
import type { EditorMode } from "@/domains/editor/shared/utils/editor.types";
import { FoldableMarkdown } from "@/domains/editor/components/EditorFoldableMarkdown";
import { FootnotePopover } from "@/domains/editor/components/EditorFootnotePopover";
import { useEditorMarkdownViewController } from "@/domains/editor/shared/hooks/useEditorMarkdownViewController";

interface MarkdownViewProps {
  value: string;
  onChange: (next: string) => void;
  mode?: EditorMode;
  placeholder?: string;
  showToolbar?: boolean;
  showProperties?: boolean;
  onWikilinkClick?: (target: string) => void;
  onTagClick?: (tag: string) => void;
  onSave?: () => void;
  className?: string;
  sideBySide?: boolean;
}

export const MarkdownView = ({
  value,
  onChange,
  mode = "live",
  placeholder,
  showProperties = false,
  onWikilinkClick,
  onTagClick,
  onSave,
  className,
}: MarkdownViewProps) => {
  const ctrl = useEditorMarkdownViewController({
    value,
    onChange,
    mode,
    placeholder,
    onWikilinkClick,
    onTagClick,
    onSave,
  });

  return (
    <div
      className={cn(
        "flex flex-col gap-2 w-full min-w-0 max-w-full overflow-hidden",
        className,
      )}
    >
      {showProperties && ctrl.toolbarSettings.showProperties && (
        <PropertiesPanel value={value} onChange={onChange} />
      )}

      {ctrl.editingPopover.isOpen && ctrl.editingPopover.virtualElement && (
        <FootnotePopover
          label={ctrl.editingPopover.label}
          initialText={ctrl.definitionsMap.get(ctrl.editingPopover.label) || ""}
          onSave={(newText) =>
            ctrl.handleSaveFootnote(ctrl.editingPopover.label, newText)
          }
          onJumpToSection={ctrl.handleJumpToCitation}
          open={ctrl.editingPopover.isOpen}
          onOpenChange={(open) =>
            ctrl.setEditingPopover((prev) => ({ ...prev, isOpen: open }))
          }
          virtualElement={ctrl.editingPopover.virtualElement}
        />
      )}

      {ctrl.isReading ? (
        <div className="prose-container min-h-[50vh] w-full min-w-0 max-w-full overflow-hidden">
          <FoldableMarkdown
            content={ctrl.cleanBody}
            definitionsMap={ctrl.definitionsMap}
            onSaveFootnote={ctrl.handleSaveFootnote}
            onWikilinkClick={onWikilinkClick}
            onTagClick={onTagClick}
          />
        </div>
      ) : (
        <div className="relative w-full min-w-0 max-w-full overflow-hidden">
          <div
            ref={ctrl.hostRef}
            className="min-h-[50vh] w-full min-w-0 max-w-full text-sm"
            onFocus={ctrl.handleFocusEditor}
          />
        </div>
      )}

      {ctrl.toolbarSettings.showWordCount && (
        <div className="px-1 text-[11px] text-muted-foreground/60">
          {ctrl.words} {ctrl.words === 1 ? "word" : "words"}
        </div>
      )}
    </div>
  );
};

export const EditorMarkdownView = MarkdownView;
