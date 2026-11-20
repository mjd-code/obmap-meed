import React from "react";
import { FileText, Layers, Settings2 } from "lucide-react";
import { cn } from "@/global/utils";
import { MarkdownView } from "@/domains/editor/components/EditorMarkdownView";
import type { PrototypeEditorFile, SimulatedRole } from "../types";
import { EditorHelicopterPanel, type HelicopterExplorerBindings } from "./EditorHelicopterPanel";
import { EditorLiveWorkbench } from "./EditorLiveWorkbench";
import { QuickLensViewPopover, QuickSharePopover, type SubFunctionBindings } from "./EditorQuickSubFunctionPopovers";
import { PrototypeSettingsHub } from "./PrototypeSettingsHub";
import type { WorkspaceCanvasSettingsProps } from "./PrototypeWorkspaceCanvas";

interface EditorPillarViewProps {
  role: SimulatedRole;
  editorMode: "live" | "sandbox";
  sandboxTitle: string;
  sandboxMarkdown: string;
  onChangeSandboxTitle: (title: string) => void;
  onChangeSandboxMarkdown: (next: string) => void;
  sandboxActiveTab: "editor" | "helicopter" | "settings";
  onChangeSandboxActiveTab: (tab: "editor" | "helicopter" | "settings") => void;
  leftSidebarPinned: boolean;
  rightSidebarPinned: boolean;
  onToggleLeftPin: () => void;
  onToggleRightPin: () => void;
  settingsHubProps: WorkspaceCanvasSettingsProps;
  helicopterProps: HelicopterExplorerBindings;
  subFunctions: SubFunctionBindings;
}

export const EditorPillarView: React.FC<EditorPillarViewProps> = ({
  role,
  editorMode,
  sandboxTitle,
  sandboxMarkdown,
  onChangeSandboxTitle,
  onChangeSandboxMarkdown,
  sandboxActiveTab,
  onChangeSandboxActiveTab,
  leftSidebarPinned,
  rightSidebarPinned,
  onToggleLeftPin,
  onToggleRightPin,
  settingsHubProps,
  helicopterProps,
  subFunctions,
}) => {
  if (editorMode === "live" && role !== "visitor") {
    return (
      <EditorLiveWorkbench
        leftSidebarPinned={leftSidebarPinned}
        rightSidebarPinned={rightSidebarPinned}
        onToggleLeftPin={onToggleLeftPin}
        onToggleRightPin={onToggleRightPin}
        settingsHubProps={settingsHubProps}
        helicopterProps={helicopterProps}
        subFunctions={subFunctions}
      />
    );
  }

  const handleSelectFileToEdit = (file: PrototypeEditorFile) => {
    onChangeSandboxTitle(`${file.folder}/${file.name}`);
    onChangeSandboxMarkdown(file.content);
    onChangeSandboxActiveTab("editor");
  };

  const sandboxSubFunctions: SubFunctionBindings = {
    ...subFunctions,
    activeNodeTitle: sandboxTitle,
    onReturnToNoteEditor: () => onChangeSandboxActiveTab("editor"),
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-background">
      {/* Clean Workspace Tabs Strip (All Work rendered inside Tab Canvas) */}
      <div className="h-10 shrink-0 border-b border-border bg-muted/30 px-2 flex items-center justify-between gap-2">
        <div className="flex items-stretch h-full min-w-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => onChangeSandboxActiveTab("editor")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 h-full vk-text-xs border-r border-border transition-colors shrink-0",
              sandboxActiveTab === "editor" ? "bg-background text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="truncate max-w-[160px]">{sandboxTitle}</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeSandboxActiveTab("helicopter")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 h-full vk-text-xs border-r border-border transition-colors shrink-0",
              sandboxActiveTab === "helicopter" ? "bg-background text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="h-3.5 w-3.5 text-info" />
            <span>Helicopter & Lenses</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeSandboxActiveTab("settings")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 h-full vk-text-xs border-r border-border transition-colors shrink-0",
              sandboxActiveTab === "settings" ? "bg-background text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Settings2 className="h-3.5 w-3.5 text-primary" />
            <span>Settings Hub</span>
          </button>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <QuickSharePopover bindings={sandboxSubFunctions} />
          <QuickLensViewPopover bindings={sandboxSubFunctions} />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {sandboxActiveTab === "settings" ? (
          <PrototypeSettingsHub
            mode="workspace_tab"
            {...settingsHubProps}
            onBackOrClose={() => onChangeSandboxActiveTab("editor")}
          />
        ) : sandboxActiveTab === "helicopter" ? (
          <EditorHelicopterPanel {...helicopterProps} onSelectFileToEdit={handleSelectFileToEdit} />
        ) : (
          <div className="h-full overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto">
            <MarkdownView value={sandboxMarkdown} onChange={onChangeSandboxMarkdown} mode="live" showToolbar showProperties />
          </div>
        )}
      </div>
    </div>
  );
};
