import React from "react";
import { FileText, Rocket } from "lucide-react";
import { cn } from "@/global/utils";
import { MarkdownView } from "@/domains/editor/components/EditorMarkdownView";
import type { GraphSolverKind, SimulatedRole } from "../types";
import { EditorLiveWorkbench } from "./EditorLiveWorkbench";
import { EditorPublishStudioTab, type PublishTabBindings } from "./EditorPublishStudioTab";
import { PrototypeSvgThumbnail } from "./PrototypeSvgThumbnails";

interface EditorPillarViewProps {
  role: SimulatedRole;
  editorMode: "live" | "sandbox";
  sandboxTitle: string;
  sandboxMarkdown: string;
  onChangeSandboxMarkdown: (next: string) => void;
  sandboxActiveTab: "editor" | "publish";
  onChangeSandboxActiveTab: (tab: "editor" | "publish") => void;
  graphSolver: GraphSolverKind;
  onChangeGraphSolver: (solver: GraphSolverKind) => void;
  publishProps: PublishTabBindings;
  onOpenPublishTab: () => void;
}

const SOLVERS: { id: GraphSolverKind; label: string }[] = [
  { id: "mindmap", label: "Mindmap" },
  { id: "argument-map", label: "Argument" },
  { id: "fishbone", label: "Fishbone" },
];

export const EditorPillarView: React.FC<EditorPillarViewProps> = ({
  role,
  editorMode,
  sandboxTitle,
  sandboxMarkdown,
  onChangeSandboxMarkdown,
  sandboxActiveTab,
  onChangeSandboxActiveTab,
  graphSolver,
  onChangeGraphSolver,
  publishProps,
  onOpenPublishTab,
}) => {
  if (editorMode === "live" && role !== "visitor") {
    return (
      <EditorLiveWorkbench
        publishProps={publishProps}
        onOpenPublishTab={onOpenPublishTab}
      />
    );
  }

  const svgKind =
    graphSolver === "argument-map"
      ? "argument-map"
      : graphSolver === "fishbone"
        ? "fishbone"
        : "mindmap";

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-background">
      <div className="h-10 shrink-0 border-b border-border bg-muted/30 px-2 flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChangeSandboxActiveTab("editor")}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 h-full vk-text-xs border-r border-border transition-colors",
            sandboxActiveTab === "editor"
              ? "bg-background text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="h-3.5 w-3.5" />
          <span className="truncate max-w-[160px]">{sandboxTitle}</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeSandboxActiveTab("publish")}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 h-full vk-text-xs border-r border-border transition-colors",
            sandboxActiveTab === "publish"
              ? "bg-background text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Rocket className="h-3.5 w-3.5 text-primary" />
          <span>Publish Studio</span>
        </button>
      </div>

      {sandboxActiveTab === "publish" ? (
        <EditorPublishStudioTab
          {...publishProps}
          onCloseTab={() => onChangeSandboxActiveTab("editor")}
        />
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          <div className="md:col-span-7 border-b md:border-b-0 md:border-r border-border overflow-y-auto p-4 md:p-6">
            <MarkdownView
              value={sandboxMarkdown}
              onChange={onChangeSandboxMarkdown}
              mode="live"
              showToolbar
              showProperties
            />
          </div>

          <div className="md:col-span-5 bg-surface/40 p-4 md:p-6 flex flex-col gap-3 overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <span className="vk-text-xs font-semibold">Deterministic Preview</span>
              <div className="inline-flex rounded-full border border-border bg-elevated p-0.5">
                {SOLVERS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onChangeGraphSolver(s.id)}
                    className={cn(
                      "px-2.5 py-0.5 rounded-full vk-text-2xs transition-colors",
                      graphSolver === s.id
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <PrototypeSvgThumbnail kind={svgKind} className="flex-1 min-h-[260px] rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};
