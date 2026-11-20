import React, { useMemo } from "react";
import {
  ArrowRight, FolderGit2, GitBranch, GraduationCap, Hash, LayoutGrid,
  Link2, Network, Sparkles, Table2, Tag, Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { PROTOTYPE_EDITOR_FILES } from "../mockData";
import type {
  GraphSolverKind, HelicopterViewKind, LmsNodeStatus, PrototypeAcademyTreeNode,
  PrototypeEditorFile, ReorganizeBy, RestructureMode, SettingsHubSectionId,
  SvgPreviewKind, WorkspaceModeId,
} from "../types";
import { EditorAcademyTreePanel } from "./EditorAcademyTreePanel";
import { PrototypeSvgThumbnail } from "./PrototypeSvgThumbnails";

export interface HelicopterExplorerBindings {
  activeLensMode: WorkspaceModeId;
  onChangeActiveLensMode: (mode: WorkspaceModeId) => void;
  helicopterView: HelicopterViewKind;
  onChangeHelicopterView: (view: HelicopterViewKind) => void;
  reorganizeBy: ReorganizeBy;
  onChangeReorganizeBy: (by: ReorganizeBy) => void;
  restructureMode: RestructureMode;
  onChangeRestructureMode: (mode: RestructureMode) => void;
  graphSolver: GraphSolverKind;
  onChangeGraphSolver: (solver: GraphSolverKind) => void;
  academyNodes: PrototypeAcademyTreeNode[];
  lmsStatuses: Record<string, LmsNodeStatus>;
  selectedLmsNodeId: string;
  onSelectLmsNode: (id: string) => void;
  onAddStudentSubNode: (parentNodeId: string, title: string) => void;
  onOpenSettingsHub: (section: SettingsHubSectionId) => void;
}

const VIEW_TABS: { id: HelicopterViewKind; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "graph", label: "Graph", icon: Network },
  { id: "diagram", label: "Diagram", icon: Workflow },
  { id: "table", label: "Table", icon: Table2 },
  { id: "cards", label: "Cards", icon: LayoutGrid },
];

const REORGANIZE_OPTIONS: { id: ReorganizeBy; label: string }[] = [
  { id: "hierarchy", label: "Hierarchy" },
  { id: "properties", label: "Properties" },
  { id: "tags", label: "Tags" },
  { id: "backlinks", label: "Backlinks" },
  { id: "keywords", label: "Keywords" },
];

const DIAGRAM_SOLVERS: { id: GraphSolverKind; label: string; svg: SvgPreviewKind }[] = [
  { id: "mindmap", label: "Mindmap", svg: "mindmap" },
  { id: "fishbone", label: "Fishbone", svg: "fishbone" },
  { id: "timeline", label: "Timeline", svg: "timeline" },
  { id: "argument-map", label: "Argument Map", svg: "argument-map" },
  { id: "skill-tree", label: "Skill Tree", svg: "skill-tree" },
];

function groupKeyForFile(file: PrototypeEditorFile, by: ReorganizeBy): string {
  switch (by) {
    case "hierarchy": return file.folder;
    case "properties": return `epistemic_status: ${file.status}`;
    case "tags": return `#${file.tags[0] ?? "untagged"}`;
    case "backlinks": return `${file.backlinks.length} [[backlinks]]`;
    case "keywords": return file.keyword;
  }
}

export const EditorHelicopterPanel: React.FC<
  HelicopterExplorerBindings & { onSelectFileToEdit?: (file: PrototypeEditorFile) => void }
> = (props) => {
  const {
    activeLensMode, onChangeActiveLensMode, helicopterView, onChangeHelicopterView,
    reorganizeBy, onChangeReorganizeBy, restructureMode, onChangeRestructureMode,
    graphSolver, onChangeGraphSolver, academyNodes, lmsStatuses, selectedLmsNodeId,
    onSelectLmsNode, onAddStudentSubNode, onOpenSettingsHub, onSelectFileToEdit,
  } = props;

  const isAcademyTree = activeLensMode === "academy";
  const groupedFiles = useMemo(() => {
    const map = new Map<string, PrototypeEditorFile[]>();
    for (const file of PROTOTYPE_EDITOR_FILES) {
      const key = groupKeyForFile(file, reorganizeBy);
      const bucket = map.get(key) ?? [];
      bucket.push(file);
      map.set(key, bucket);
    }
    return Array.from(map.entries());
  }, [reorganizeBy]);

  const activeSolverMeta = DIAGRAM_SOLVERS.find((s) => s.id === graphSolver) ?? DIAGRAM_SOLVERS[0];

  const handleApplyRestructure = () => {
    if (restructureMode === "virtual_grouping") {
      toast.info(`Virtual Grouping (${reorganizeBy}) aktif — folder fisik tetap utuh.`);
      return;
    }
    toast.success(`Structural Refactoring: ${PROTOTYPE_EDITOR_FILES.length} berkas .md & YAML disinkronkan via "${reorganizeBy}".`);
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-background overflow-hidden">
      <div className="shrink-0 border-b border-border/70 px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 bg-surface/60">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {VIEW_TABS.map((v) => {
            const Icon = v.icon;
            const active = !isAcademyTree && helicopterView === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => { if (isAcademyTree) onChangeActiveLensMode("atlas"); onChangeHelicopterView(v.id); }}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full vk-text-2xs font-medium border transition-colors",
                  active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:text-foreground"
                )}
              >
                <Icon className="h-3 w-3" /> {v.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onChangeActiveLensMode("academy")}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full vk-text-2xs font-medium border transition-colors",
              isAcademyTree ? "bg-info/20 text-info border-info/45" : "bg-card text-muted-foreground border-border hover:text-foreground"
            )}
          >
            <GraduationCap className="h-3 w-3" /> Academy Tree
          </button>
        </div>

        <button type="button" onClick={() => onOpenSettingsHub("vault_lenses")} className="inline-flex items-center gap-1 vk-text-2xs font-semibold text-primary hover:underline">
          <span>Atur Default Lensa di Vault Management</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {isAcademyTree ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <EditorAcademyTreePanel
            nodes={academyNodes}
            statuses={lmsStatuses}
            selectedNodeId={selectedLmsNodeId}
            onSelectNode={onSelectLmsNode}
            onAddStudentSubNode={onAddStudentSubNode}
            onOpenAcademySettings={() => onOpenSettingsHub("academy_sdk")}
          />
        </div>
      ) : (
        <>
          <div className="shrink-0 border-b border-border/60 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 bg-card/40">
            <div className="flex flex-wrap items-center gap-1">
              <span className="vk-text-2xs text-muted-foreground mr-1">Group By:</span>
              {REORGANIZE_OPTIONS.map((opt) => (
                <button key={opt.id} type="button" onClick={() => onChangeReorganizeBy(opt.id)} className={cn("px-2 py-0.5 rounded-md vk-text-2xs font-medium border", reorganizeBy === opt.id ? "bg-primary/15 text-primary border-primary/40" : "bg-surface text-muted-foreground border-border/70")}>
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="inline-flex rounded-lg border border-border/70 bg-elevated p-0.5">
                <button type="button" onClick={() => onChangeRestructureMode("virtual_grouping")} className={cn("px-2 py-0.5 rounded-md vk-text-2xs", restructureMode === "virtual_grouping" ? "bg-card text-foreground font-medium" : "text-muted-foreground")}>Virtual</button>
                <button type="button" onClick={() => onChangeRestructureMode("physical_sync")} className={cn("px-2 py-0.5 rounded-md vk-text-2xs", restructureMode === "physical_sync" ? "bg-warning/20 text-warning font-medium" : "text-muted-foreground")}>Sync .md</button>
              </div>
              <Button size="sm" variant="outline" className="h-6 px-2 vk-text-2xs" onClick={handleApplyRestructure}>Terapkan</Button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
            {helicopterView === "graph" && (
              <div className="space-y-3">
                <PrototypeSvgThumbnail kind="constellation" className="h-48 rounded-xl" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {groupedFiles.map(([group, files]) => (
                    <div key={group} className="rounded-xl border border-border/70 bg-card p-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="vk-text-xs font-semibold inline-flex items-center gap-1.5 text-primary truncate"><GitBranch className="h-3.5 w-3.5 shrink-0" /> {group}</span>
                        <Badge variant="secondary" className="vk-text-2xs">{files.length} node</Badge>
                      </div>
                      {files.map((f) => (
                        <button key={f.id} type="button" onClick={() => onSelectFileToEdit?.(f)} className="w-full text-left vk-text-2xs text-muted-foreground hover:text-foreground truncate block">
                          • {f.name} <span className="text-info">({f.backlinks[0] ?? "standalone"})</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {helicopterView === "diagram" && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {DIAGRAM_SOLVERS.map((s) => (
                    <button key={s.id} type="button" onClick={() => onChangeGraphSolver(s.id)} className={cn("px-2.5 py-1 rounded-full vk-text-2xs font-medium border", graphSolver === s.id ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border")}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <PrototypeSvgThumbnail kind={activeSolverMeta.svg} className="h-56 rounded-xl" />
                <p className="vk-text-2xs text-muted-foreground flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary shrink-0" /> Solver deterministik <strong className="text-foreground">{activeSolverMeta.label}</strong>.</p>
              </div>
            )}

            {helicopterView === "table" && (
              <div className="rounded-xl border border-border/70 bg-card overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/70 bg-surface/80 vk-text-2xs text-muted-foreground">
                      <th className="py-2 px-3 font-medium">File-Node (.md)</th>
                      <th className="py-2 px-3 font-medium">Grup ({reorganizeBy})</th>
                      <th className="py-2 px-3 font-medium">YAML</th>
                      <th className="py-2 px-3 font-medium">Backlinks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 vk-text-2xs">
                    {PROTOTYPE_EDITOR_FILES.map((f) => (
                      <tr key={f.id} onClick={() => onSelectFileToEdit?.(f)} className="hover:bg-elevated/60 cursor-pointer">
                        <td className="py-2 px-3 font-medium text-foreground">{f.name}</td>
                        <td className="py-2 px-3 text-muted-foreground">{groupKeyForFile(f, reorganizeBy)}</td>
                        <td className="py-2 px-3"><Badge variant={f.status === "evergreen" ? "success" : "secondary"} className="vk-text-2xs">{f.status}</Badge></td>
                        <td className="py-2 px-3 font-mono text-info">{f.backlinks.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {helicopterView === "cards" && (
              <div className="space-y-3">
                {groupedFiles.map(([group, files]) => (
                  <div key={group} className="space-y-1.5">
                    <p className="vk-text-2xs font-semibold text-muted-foreground flex items-center gap-1.5"><FolderGit2 className="h-3.5 w-3.5 text-primary" /> {group}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {files.map((f) => (
                        <button key={f.id} type="button" onClick={() => onSelectFileToEdit?.(f)} className="text-left rounded-xl border border-border/70 bg-card hover:border-primary/45 p-3 space-y-2 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <span className="vk-text-xs font-semibold truncate">{f.name}</span>
                            <Badge variant={f.visibility === "private" ? "warning" : "success"} className="vk-text-2xs shrink-0">{f.status}</Badge>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap vk-text-2xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><Tag className="h-3 w-3" /> #{f.tags[0]}</span>
                            <span className="inline-flex items-center gap-1"><Hash className="h-3 w-3" /> {f.keyword}</span>
                            <span className="inline-flex items-center gap-1"><Link2 className="h-3 w-3" /> {f.backlinks.length}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
