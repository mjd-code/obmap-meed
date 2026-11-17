import React from "react";
import { Cloud, FolderOpen, Rocket, Settings2 } from "lucide-react";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { MarkdownView } from "@/domains/editor/components/EditorMarkdownView";
import { getVaultManager } from "@/domains/vault/shared/api/VaultManagerSingleton";
import { useWorkspaceStore } from "@/domains/workspace/shared/stores/useWorkspaceStore";
import { useNodeStore, useVaultStore } from "@/global/stores";
import type { GraphSolverKind, SimulatedRole } from "../types";
import { EditorLiveWorkbench } from "./EditorLiveWorkbench";
import { PrototypeSvgThumbnail } from "./PrototypeSvgThumbnails";

interface EditorPillarViewProps {
  role: SimulatedRole;
  editorMode: "live" | "sandbox";
  onChangeEditorMode: (mode: "live" | "sandbox") => void;
  sandboxTitle: string;
  sandboxMarkdown: string;
  onChangeSandboxMarkdown: (next: string) => void;
  graphSolver: GraphSolverKind;
  onChangeGraphSolver: (solver: GraphSolverKind) => void;
  onOpenPublishStudio: () => void;
}

const SOLVERS: { id: GraphSolverKind; label: string }[] = [
  { id: "mindmap", label: "Mindmap" },
  { id: "argument-map", label: "Argument" },
  { id: "fishbone", label: "Fishbone" },
];

export const EditorPillarView: React.FC<EditorPillarViewProps> = ({
  role,
  editorMode,
  onChangeEditorMode,
  sandboxTitle,
  sandboxMarkdown,
  onChangeSandboxMarkdown,
  graphSolver,
  onChangeGraphSolver,
  onOpenPublishStudio,
}) => {
  const currentVaultId = useVaultStore((s) => s.currentVaultId);
  const nodes = useNodeStore((s) => s.nodes);
  const openView = useWorkspaceStore((s) => s.openView);

  const vault = currentVaultId ? getVaultManager().getVault(currentVaultId) : null;
  const fileCount = nodes.filter((n) => n.type === "file").length;

  const handleManageVaults = () => {
    onChangeEditorMode("live");
    openView({
      type: "settings",
      title: "Settings",
      settingsSection: "vaults",
    });
  };

  const svgKind =
    graphSolver === "argument-map"
      ? "argument-map"
      : graphSolver === "fishbone"
        ? "fishbone"
        : "mindmap";

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-background">
      {/* Slim Symmetrical Editor Strip */}
      <div className="h-10 shrink-0 border-b border-border/80 bg-surface/80 px-3 md:px-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {editorMode === "live" ? (
            <>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-elevated px-2.5 py-0.5 vk-text-xs min-w-0">
                {vault?.location === "folder" ? (
                  <FolderOpen className="h-3.5 w-3.5 text-warning shrink-0" />
                ) : (
                  <Cloud className="h-3.5 w-3.5 text-success shrink-0" />
                )}
                <span className="font-medium truncate max-w-[160px]">
                  {vault?.name || "Belum ada Vault"}
                </span>
                {vault && (
                  <span className="vk-text-2xs text-muted-foreground hidden sm:inline">
                    · {fileCount} file
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 vk-text-2xs gap-1 hidden sm:inline-flex"
                onClick={handleManageVaults}
              >
                <Settings2 className="h-3 w-3" />
                <span>Kelola Vault</span>
              </Button>
            </>
          ) : (
            <div className="inline-flex items-center gap-2 min-w-0">
              <Badge variant="info" className="vk-text-2xs">Sandbox · CM6</Badge>
              <span className="vk-text-xs font-mono text-muted-foreground truncate max-w-[180px]">
                {sandboxTitle}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {role !== "visitor" && (
            <div className="inline-flex rounded-full border border-border bg-elevated p-0.5">
              <button
                type="button"
                onClick={() => onChangeEditorMode("live")}
                className={cn(
                  "px-2.5 py-0.5 rounded-full vk-text-2xs font-medium transition-colors",
                  editorMode === "live" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Live App
              </button>
              <button
                type="button"
                onClick={() => onChangeEditorMode("sandbox")}
                className={cn(
                  "px-2.5 py-0.5 rounded-full vk-text-2xs font-medium transition-colors",
                  editorMode === "sandbox" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sandbox
              </button>
            </div>
          )}

          <Button size="sm" className="h-7 px-3 rounded-full vk-text-xs gap-1.5" onClick={onOpenPublishStudio}>
            <Rocket className="h-3.5 w-3.5" />
            <span>Publish</span>
          </Button>
        </div>
      </div>

      {/* Main Content: Live App Workbench OR Visitor CodeMirror 6 Sandbox */}
      {editorMode === "live" && role !== "visitor" ? (
        <EditorLiveWorkbench onSwitchToSandbox={() => onChangeEditorMode("sandbox")} />
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
                      graphSolver === s.id ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground"
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
