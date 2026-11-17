import React from "react";
import { ArrowRight, BarChart3, CalendarDays, FolderTree, Kanban, LayoutGrid } from "lucide-react";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { Progress } from "@/global/ui/progress";
import type { DerivedViewMode, PrototypeKanbanTask } from "../types";

interface ProfileWorkspaceViewsPanelProps {
  mode: DerivedViewMode;
  onChangeMode: (mode: DerivedViewMode) => void;
  tasks: PrototypeKanbanTask[];
  onCycleTaskStatus: (taskId: string) => void;
  onOpenEditor: () => void;
}

const VIEW_MODES: { id: DerivedViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "grid", label: "Grid", icon: LayoutGrid },
  { id: "tree", label: "Tree", icon: FolderTree },
  { id: "kanban", label: "Kanban", icon: Kanban },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

const KANBAN_COLUMNS: { id: PrototypeKanbanTask["status"]; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "in_progress", label: "In Progress" },
  { id: "peer_review", label: "Peer Review" },
  { id: "published", label: "Published" },
];

export const ProfileWorkspaceViewsPanel: React.FC<ProfileWorkspaceViewsPanelProps> = ({
  mode,
  onChangeMode,
  tasks,
  onCycleTaskStatus,
  onOpenEditor,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="vk-text-xs text-muted-foreground">
          Derived Views langsung dari YAML frontmatter (tanpa format proprietary)
        </span>
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1 self-start sm:self-auto">
          {VIEW_MODES.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeMode(item.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full vk-text-xs font-medium transition-colors",
                  mode === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {mode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="rounded-2xl border border-border/80 bg-surface/70 p-3 space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="vk-text-xs font-semibold">{col.label}</span>
                  <Badge variant="secondary" className="vk-text-2xs">{colTasks.length}</Badge>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <div key={task.id} className="rounded-xl border border-border/70 bg-card p-3 space-y-2">
                      <p className="vk-text-xs font-medium leading-snug">{task.title}</p>
                      <div className="flex items-center justify-between vk-text-2xs text-muted-foreground">
                        <span>{task.vaultTitle}</span>
                        <Button variant="ghost" size="sm" className="h-6 px-2 vk-text-2xs gap-1 text-primary" onClick={() => onCycleTaskStatus(task.id)}>
                          Geser <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="info" className="vk-text-2xs">{task.vaultTitle}</Badge>
                <Badge variant="secondary" className="vk-text-2xs">{task.status}</Badge>
              </div>
              <p className="vk-text-sm font-semibold">{task.title}</p>
              <Button variant="outline" size="sm" className="h-7 rounded-full vk-text-2xs" onClick={onOpenEditor}>
                Sunting di Editor
              </Button>
            </div>
          ))}
        </div>
      )}

      {mode === "tree" && (
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-2 font-mono vk-text-xs">
          <p className="text-muted-foreground">/atlas-kognisi</p>
          <div className="pl-5 space-y-1.5 border-l border-border ml-2">
            <p>├── sintesis-graf.md <span className="text-success">[evergreen]</span></p>
            <p>├── alignment-ai.md <span className="text-info">[peer_reviewed]</span></p>
            <p>└── catatan-hibah-internal.md <span className="text-warning">[private]</span></p>
          </div>
        </div>
      )}

      {mode === "calendar" && (
        <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
          {tasks.slice().sort((a, b) => a.due.localeCompare(b.due)).map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3.5 py-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <Badge variant="outline" className="font-mono vk-text-2xs shrink-0">{task.due}</Badge>
                <span className="vk-text-xs font-medium truncate">{task.title}</span>
              </div>
              <Badge variant="secondary" className="vk-text-2xs shrink-0">{task.status}</Badge>
            </div>
          ))}
        </div>
      )}

      {mode === "analytics" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
            <span className="vk-text-xs text-muted-foreground">Evergreen Ratio</span>
            <p className="vk-text-xl font-bold text-success">68%</p>
            <Progress value={68} className="h-1.5" />
          </div>
          <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
            <span className="vk-text-xs text-muted-foreground">Sitasi Bulan Ini</span>
            <p className="vk-text-xl font-bold text-primary">+29 Sitasi</p>
            <Progress value={82} className="h-1.5" />
          </div>
          <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
            <span className="vk-text-xs text-muted-foreground">LMS Mastery</span>
            <p className="vk-text-xl font-bold text-info">86%</p>
            <Progress value={86} className="h-1.5" />
          </div>
        </div>
      )}
    </div>
  );
};
