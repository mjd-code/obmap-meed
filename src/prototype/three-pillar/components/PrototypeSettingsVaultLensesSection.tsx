import React from "react";
import { BookOpen, Check, Compass, FileCode2, GraduationCap, Layers, PenTool, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import type {
  GraphSolverKind,
  HelicopterViewKind,
  ReorganizeBy,
  RestructureMode,
  WorkspaceModeId,
} from "../types";
import type { PublishVaultRecord } from "../usePublishManagerState";

interface PrototypeSettingsVaultLensesSectionProps {
  vaults: PublishVaultRecord[];
  activeVault: PublishVaultRecord;
  onSelectVault: (id: string) => void;
  activeLensMode: WorkspaceModeId;
  helicopterView: HelicopterViewKind;
  graphSolver: GraphSolverKind;
  reorganizeBy: ReorganizeBy;
  restructureMode: RestructureMode;
  onUpdateVaultMode: (mode: WorkspaceModeId, helicopter: HelicopterViewKind) => void;
  onChangeGraphSolver: (solver: GraphSolverKind) => void;
  onChangeReorganizeBy: (by: ReorganizeBy) => void;
  onChangeRestructureMode: (mode: RestructureMode) => void;
  onOpenHelicopterExplorerTab: () => void;
}

const MODES: { id: WorkspaceModeId; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "freeform", label: "Freeform", desc: "Kanvas bebas tanpa skema kaku", icon: Sparkles },
  { id: "atlas", label: "Atlas", desc: "Peta konsep & argument map", icon: Compass },
  { id: "studio", label: "Studio", desc: "Penulisan esai & publikasi panjang", icon: PenTool },
  { id: "academy", label: "Academy", desc: "Kurikulum & Skill Tree pembelajar", icon: GraduationCap },
];

const HELICOPTERS: HelicopterViewKind[] = ["graph", "diagram", "table", "cards"];
const SOLVERS: GraphSolverKind[] = ["mindmap", "fishbone", "timeline", "argument-map", "skill-tree"];
const REORG_OPTS: ReorganizeBy[] = ["hierarchy", "properties", "tags", "backlinks", "keywords"];

export const PrototypeSettingsVaultLensesSection: React.FC<PrototypeSettingsVaultLensesSectionProps> = ({
  vaults,
  activeVault,
  onSelectVault,
  activeLensMode,
  helicopterView,
  graphSolver,
  reorganizeBy,
  restructureMode,
  onUpdateVaultMode,
  onChangeGraphSolver,
  onChangeReorganizeBy,
  onChangeRestructureMode,
  onOpenHelicopterExplorerTab,
}) => {
  return (
    <div className="space-y-4 min-w-0">
      {/* 1. Vault Switcher & Overview */}
      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="vk-text-sm font-semibold inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-primary" /> Vault Switcher & Overview
            </h2>
            <p className="vk-text-2xs text-muted-foreground">Pilih vault aktif untuk menyunting `.app/config.json`</p>
          </div>
          <Badge variant="outline" className="vk-text-2xs">{vaults.length} Vaults</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {vaults.slice(0, 6).map((v) => {
            const active = v.id === activeVault.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelectVault(v.id)}
                className={cn(
                  "text-left rounded-xl border p-2.5 transition-colors flex items-center justify-between gap-2 min-w-0",
                  active ? "border-primary bg-primary/10" : "border-border bg-surface hover:border-primary/40"
                )}
              >
                <div className="min-w-0">
                  <p className="vk-text-xs font-semibold truncate">{v.title}</p>
                  <p className="vk-text-2xs text-muted-foreground capitalize truncate">{v.primaryMode} · {v.defaultHelicopterView}</p>
                </div>
                {active && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Workspace Mode / Lens Preset */}
      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="vk-text-sm font-semibold">Workspace Mode / Lens Preset (`primary_mode`)</h2>
            <p className="vk-text-2xs text-muted-foreground">Menetapkan intensi default Vault (Scholar Mode roadmap v2.2)</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 vk-text-2xs gap-1 border-success/40 text-success"
            onClick={() => {
              onUpdateVaultMode(activeLensMode, helicopterView);
              toast.success(`.app/config.json disimpan: primary_mode="${activeLensMode}"`);
            }}
          >
            <Save className="h-3 w-3" /> Simpan ke .app/config.json
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            const selected = activeVault.primaryMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onUpdateVaultMode(m.id, activeVault.defaultHelicopterView)}
                className={cn(
                  "text-left rounded-xl border p-3 space-y-1 transition-colors",
                  selected ? "border-primary bg-primary/12" : "border-border bg-surface hover:border-primary/40"
                )}
              >
                <div className="flex items-center gap-1.5 vk-text-xs font-semibold">
                  <Icon className="h-3.5 w-3.5 text-primary" /> {m.label}
                </div>
                <p className="vk-text-2xs text-muted-foreground">{m.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Helicopter View & Reorganize Configuration */}
      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="vk-text-sm font-semibold">Helicopter View & Restructure Defaults</h2>
            <p className="vk-text-2xs text-muted-foreground">Tersedia di seluruh mode: Graph, Diagram, Table, Cards</p>
          </div>
          <Button size="sm" className="h-7 px-3 vk-text-2xs gap-1.5" onClick={onOpenHelicopterExplorerTab}>
            <Layers className="h-3.5 w-3.5" /> Buka Helicopter Explorer di Tab Workspace
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <span className="vk-text-2xs text-muted-foreground block">Default Helicopter View</span>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5">
              {HELICOPTERS.map((h) => (
                <button key={h} type="button" onClick={() => onUpdateVaultMode(activeVault.primaryMode, h)} className={cn("px-2.5 py-1 rounded-full border vk-text-2xs capitalize font-medium", activeVault.defaultHelicopterView === h ? "bg-info/20 text-info border-info/45" : "bg-surface text-muted-foreground border-border")}>
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="vk-text-2xs text-muted-foreground block">Default Diagram Solver</span>
            <div className="flex flex-wrap gap-1">
              {SOLVERS.map((s) => (
                <button key={s} type="button" onClick={() => onChangeGraphSolver(s)} className={cn("px-2.5 py-1 rounded-full border vk-text-2xs capitalize", graphSolver === s ? "bg-primary/15 text-primary border-primary/40 font-medium" : "bg-surface text-muted-foreground border-border")}>
                  {s.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="vk-text-2xs text-muted-foreground block">Default Reorganize / Group By</span>
            <div className="flex flex-wrap gap-1">
              {REORG_OPTS.map((r) => (
                <button key={r} type="button" onClick={() => onChangeReorganizeBy(r)} className={cn("px-2.5 py-0.5 rounded-md border vk-text-2xs capitalize", reorganizeBy === r ? "bg-primary/15 text-primary border-primary/40 font-medium" : "bg-surface text-muted-foreground border-border")}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="vk-text-2xs text-muted-foreground block">Restructure Mode</span>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: "virtual_grouping", label: "Virtual Grouping (Aman)" },
                  { id: "physical_sync", label: "Sync to Files (Fisik)" },
                ] as { id: RestructureMode; label: string }[]
              ).map((rm) => (
                <button key={rm.id} type="button" onClick={() => onChangeRestructureMode(rm.id)} className={cn("px-2.5 py-1 rounded-lg border vk-text-2xs font-medium", restructureMode === rm.id ? "bg-card text-foreground border-primary" : "bg-surface text-muted-foreground border-border")}>
                  {rm.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Central .app/config.json Inspector */}
      <section className="rounded-2xl border border-border bg-surface p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="vk-text-xs font-semibold font-mono text-primary inline-flex items-center gap-1.5">
            <FileCode2 className="h-3.5 w-3.5" /> Central Inspector: .app/config.json
          </span>
          <Badge variant="outline" className="vk-text-2xs">7 Kanonik Blok · @app/sdk</Badge>
        </div>
        <pre className="max-h-60 overflow-auto rounded-xl border border-border/70 bg-background p-3 vk-text-2xs font-mono text-foreground/90 leading-relaxed">
          {JSON.stringify(activeVault.appConfig, null, 2)}
        </pre>
      </section>
    </div>
  );
};
