import React, { useMemo, useState } from "react";
import { ArrowRight, Hash, LayoutGrid, Link2, Network, Table2, Tag, Workflow } from "lucide-react";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { Progress } from "@/global/ui/progress";
import type { HelicopterViewKind, PortfolioStudyStage, PrototypePortfolioStudyItem } from "../types";
import { PrototypeSvgThumbnail } from "./PrototypeSvgThumbnails";

interface ProfileWorkspaceViewsPanelProps {
  viewKind: HelicopterViewKind;
  onChangeViewKind: (kind: HelicopterViewKind) => void;
  items: PrototypePortfolioStudyItem[];
  onCycleItemStage: (itemId: string) => void;
  onOpenEditor: () => void;
}

const VIEW_KINDS: {
  id: HelicopterViewKind;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "cards", label: "Cards", icon: LayoutGrid },
  { id: "table", label: "Table", icon: Table2 },
  { id: "diagram", label: "Diagram", icon: Workflow },
  { id: "graph", label: "Graph", icon: Network },
];

const STAGE_COLUMNS: { id: PortfolioStudyStage; label: string; scope: string }[] = [
  { id: "seedling", label: "Seedling", scope: "Catatan Awal" },
  { id: "budding", label: "Budding", scope: "Sintesis" },
  { id: "evergreen", label: "Evergreen", scope: "Editorial Studio" },
  { id: "published", label: "Published", scope: "Rilis Publik" },
  { id: "mastered", label: "Mastered", scope: "Academy Study" },
];

export const ProfileWorkspaceViewsPanel: React.FC<ProfileWorkspaceViewsPanelProps> = ({
  viewKind,
  onChangeViewKind,
  items,
  onCycleItemStage,
  onOpenEditor,
}) => {
  const [groupByMode, setGroupByMode] = useState<"stage" | "mode">("stage");

  const groupedByMode = useMemo(() => {
    const groups = new Map<string, PrototypePortfolioStudyItem[]>();
    for (const item of items) {
      const key = groupByMode === "mode" ? `Mode: ${item.workspaceMode}` : item.stage;
      const list = groups.get(key) ?? [];
      list.push(item);
      groups.set(key, list);
    }
    return Array.from(groups.entries());
  }, [groupByMode, items]);

  const masteredOrPublishedPct = Math.round(
    (items.filter((i) => ["evergreen", "published", "mastered"].includes(i.stage)).length /
      Math.max(1, items.length)) *
      100
  );

  return (
    <div className="space-y-4 min-w-0 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="vk-text-2xs">
            4 Polymorphic Views (Tanpa Task Board Korporat)
          </Badge>
          <div className="inline-flex rounded-full border border-border bg-surface p-0.5">
            <button type="button" onClick={() => setGroupByMode("stage")} className={cn("px-2.5 py-0.5 rounded-full vk-text-2xs", groupByMode === "stage" ? "bg-elevated text-foreground font-medium" : "text-muted-foreground")}>
              Epistemic / Study
            </button>
            <button type="button" onClick={() => setGroupByMode("mode")} className={cn("px-2.5 py-0.5 rounded-full vk-text-2xs", groupByMode === "mode" ? "bg-elevated text-foreground font-medium" : "text-muted-foreground")}>
              Workspace Mode
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:inline-flex w-full sm:w-auto max-w-full rounded-xl sm:rounded-full border border-border bg-surface p-1 gap-0.5">
          {VIEW_KINDS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeViewKind(item.id)}
                className={cn(
                  "flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 sm:py-1 px-1 sm:px-3 rounded-lg sm:rounded-full vk-text-2xs sm:vk-text-xs font-medium transition-colors min-w-0 truncate",
                  viewKind === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate max-w-full">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editorial & Study Progress Strip */}
      <div className="rounded-xl border border-border/70 bg-surface/60 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <span className="vk-text-2xs text-muted-foreground">
          Kematangan Portofolio (Evergreen / Published / Mastered): <strong className="text-foreground">{masteredOrPublishedPct}%</strong>
        </span>
        <div className="w-36"><Progress value={masteredOrPublishedPct} className="h-1.5" /></div>
      </div>

      {viewKind === "cards" && (
        <div className="space-y-4">
          {groupedByMode.map(([group, groupItems]) => {
            const meta = STAGE_COLUMNS.find((s) => s.id === group);
            return (
              <div key={group} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="vk-text-xs font-semibold capitalize">{meta ? `${meta.label} (${meta.scope})` : group}</span>
                  <Badge variant="secondary" className="vk-text-2xs">{groupItems.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupItems.map((item) => (
                    <div key={item.id} className="rounded-xl border border-border/80 bg-card p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="info" className="vk-text-2xs capitalize">{item.workspaceMode}</Badge>
                        <Badge variant={item.stage === "mastered" || item.stage === "published" ? "success" : "outline"} className="vk-text-2xs capitalize">
                          {item.stage}
                        </Badge>
                      </div>
                      <p className="vk-text-xs font-semibold leading-snug">{item.title}</p>
                      <div className="flex flex-wrap items-center gap-2 vk-text-2xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Tag className="h-3 w-3" /> #{item.tags[0]}</span>
                        <span className="inline-flex items-center gap-1"><Link2 className="h-3 w-3" /> {item.backlinksCount}</span>
                        <span className="inline-flex items-center gap-1"><Hash className="h-3 w-3" /> {item.keyword}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <span className="vk-text-2xs text-muted-foreground">{item.vaultTitle}</span>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-6 px-2 vk-text-2xs gap-1 text-primary" onClick={() => onCycleItemStage(item.id)}>
                            Tahap <ArrowRight className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="h-6 px-2 vk-text-2xs" onClick={onOpenEditor}>Editor</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewKind === "table" && (
        <div className="rounded-2xl border border-border/80 bg-card overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/70 bg-surface vk-text-2xs text-muted-foreground">
                <th className="py-2.5 px-3 font-medium">Catatan Portofolio</th>
                <th className="py-2.5 px-3 font-medium">Mode</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
                <th className="py-2.5 px-3 font-medium">Backlinks</th>
                <th className="py-2.5 px-3 font-medium">Keyword</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 vk-text-2xs">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-elevated/50">
                  <td className="py-2.5 px-3 font-medium text-foreground">{item.title}</td>
                  <td className="py-2.5 px-3 capitalize"><Badge variant="outline" className="vk-text-2xs">{item.workspaceMode}</Badge></td>
                  <td className="py-2.5 px-3">
                    <button type="button" onClick={() => onCycleItemStage(item.id)} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">
                      {item.stage} ↻
                    </button>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-info">{item.backlinksCount}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{item.keyword}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewKind === "diagram" && (
        <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="vk-text-xs font-semibold">Diagram Portofolio & Jalur Riset</span>
            <Badge variant="info" className="vk-text-2xs">Timeline Solver</Badge>
          </div>
          <PrototypeSvgThumbnail kind="timeline" className="h-56 rounded-xl" />
        </div>
      )}

      {viewKind === "graph" && (
        <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="vk-text-xs font-semibold">Konstelasi Backlink & Sitasi Portofolio</span>
            <Badge variant="info" className="vk-text-2xs">Knowledge Graph</Badge>
          </div>
          <PrototypeSvgThumbnail kind="constellation" className="h-56 rounded-xl" />
        </div>
      )}
    </div>
  );
};
