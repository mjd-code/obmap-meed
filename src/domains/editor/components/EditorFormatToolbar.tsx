import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Undo2,
  Redo2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code2,
  Link2,
  FileText,
  Minus,
  Table,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/global/ui/button";
import { cn } from "@/global/utils";
import type { EditorApi } from "@/domains/editor/shared/utils/editor.types";
import type { EditorToolbarConfig } from "@/domains/editor/shared/stores/useEditorSettingsStore";

interface EditorFormatToolbarProps {
  api: EditorApi | null;
  groups: EditorToolbarConfig["groups"];
  className?: string;
}

interface ToolbarAction {
  id: string;
  label: string;
  icon: LucideIcon;
  run: (api: EditorApi) => void;
}

const TOOLBAR_GROUPS: Array<{
  key: keyof EditorToolbarConfig["groups"];
  label: string;
  actions: ToolbarAction[];
}> = [
  {
    key: "format",
    label: "Format Teks",
    actions: [
      { id: "bold", label: "Tebal (Bold)", icon: Bold, run: (api) => api.toggleWrap("**") },
      { id: "italic", label: "Miring (Italic)", icon: Italic, run: (api) => api.toggleWrap("*") },
      { id: "strike", label: "Coret (Strikethrough)", icon: Strikethrough, run: (api) => api.toggleWrap("~~") },
      { id: "code", label: "Kode Inline", icon: Code, run: (api) => api.toggleWrap("`") },
      { id: "undo", label: "Undo (Ctrl+Z)", icon: Undo2, run: (api) => api.undo?.() },
      { id: "redo", label: "Redo (Ctrl+Y)", icon: Redo2, run: (api) => api.redo?.() },
    ],
  },
  {
    key: "headings",
    label: "Judul (Headings)",
    actions: [
      { id: "h1", label: "Heading 1", icon: Heading1, run: (api) => api.toggleLinePrefix("# ") },
      { id: "h2", label: "Heading 2", icon: Heading2, run: (api) => api.toggleLinePrefix("## ") },
      { id: "h3", label: "Heading 3", icon: Heading3, run: (api) => api.toggleLinePrefix("### ") },
    ],
  },
  {
    key: "blocks",
    label: "Blok & Daftar",
    actions: [
      { id: "ul", label: "Daftar Poin", icon: List, run: (api) => api.toggleLinePrefix("- ") },
      { id: "ol", label: "Daftar Bernomor", icon: ListOrdered, run: (api) => api.toggleLinePrefix("1. ") },
      { id: "task", label: "Daftar Tugas", icon: CheckSquare, run: (api) => api.toggleLinePrefix("- [ ] ") },
      { id: "quote", label: "Kutipan (Blockquote)", icon: Quote, run: (api) => api.toggleLinePrefix("> ") },
      { id: "codeblock", label: "Blok Kode", icon: Code2, run: (api) => api.insertBlock("```\n\n```") },
    ],
  },
  {
    key: "insert",
    label: "Sisipkan",
    actions: [
      { id: "wikilink", label: "Sisipkan Wikilink [[...]]", icon: FileText, run: (api) => api.toggleWrap("[[", "]]") },
      { id: "link", label: "Sisipkan Tautan [teks](url)", icon: Link2, run: (api) => api.toggleWrap("[", "](url)") },
      {
        id: "table",
        label: "Sisipkan Tabel Markdown",
        icon: Table,
        run: (api) => api.insertBlock("| Kolom 1 | Kolom 2 |\n| --- | --- |\n| Data | Data |"),
      },
      { id: "hr", label: "Garis Pemisah", icon: Minus, run: (api) => api.insertBlock("---") },
    ],
  },
];

export function EditorFormatToolbar({
  api,
  groups,
  className,
}: EditorFormatToolbarProps) {
  const visibleGroups = TOOLBAR_GROUPS.filter((group) => groups[group.key]);

  if (visibleGroups.length === 0) return null;

  return (
    <div
      role="toolbar"
      aria-label="Toolbar Format Markdown"
      className={cn(
        "flex items-center gap-1 overflow-x-auto no-scrollbar rounded-lg border border-border/60 bg-card/70 px-1.5 py-1 backdrop-blur-sm",
        "motion-reduce:transition-none",
        className,
      )}
    >
      {visibleGroups.map((group, groupIndex) => (
        <div
          key={group.key}
          role="group"
          aria-label={group.label}
          className={cn(
            "flex items-center gap-0.5 shrink-0",
            groupIndex > 0 && "pl-1.5 ml-0.5 border-l border-border/50",
          )}
        >
          {group.actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!api}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (api) action.run(api);
                }}
                aria-label={action.label}
                title={action.label}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md"
              >
                <Icon className="w-3.5 h-3.5" />
              </Button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
