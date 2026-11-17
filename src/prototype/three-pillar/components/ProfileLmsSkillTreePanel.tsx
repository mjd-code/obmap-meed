import React from "react";
import { Award, CheckCircle2, Lock, Sparkles } from "lucide-react";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { Progress } from "@/global/ui/progress";
import { PROTOTYPE_LMS_NODES } from "../mockData";
import type { LmsNodeStatus } from "../types";

interface ProfileLmsSkillTreePanelProps {
  lmsStatuses: Record<string, LmsNodeStatus>;
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  onSubmitQuiz: (nodeId: string, optionIndex: number) => void;
  onOpenInEditor: () => void;
}

export const ProfileLmsSkillTreePanel: React.FC<ProfileLmsSkillTreePanelProps> = ({
  lmsStatuses,
  selectedNodeId,
  onSelectNode,
  onSubmitQuiz,
  onOpenInEditor,
}) => {
  const masteredCount = PROTOTYPE_LMS_NODES.filter((n) => lmsStatuses[n.id] === "mastered").length;
  const progressPct = Math.round((masteredCount / PROTOTYPE_LMS_NODES.length) * 100);
  const activeNode = PROTOTYPE_LMS_NODES.find((n) => n.id === selectedNodeId) ?? PROTOTYPE_LMS_NODES[0];
  const activeStatus = lmsStatuses[activeNode.id] ?? "locked";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/80 bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="vk-text-base font-semibold">Kuliah Graf & Skill Tree DAG</h3>
          <p className="vk-text-xs text-muted-foreground">Selesaikan kuis simpul Available untuk membuka modul berikutnya</p>
        </div>
        <div className="min-w-[190px] space-y-1">
          <div className="flex justify-between vk-text-2xs font-medium">
            <span className="text-success">Mastery</span>
            <span>{masteredCount}/{PROTOTYPE_LMS_NODES.length} ({progressPct}%)</span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 space-y-2">
          {PROTOTYPE_LMS_NODES.map((node) => {
            const status = lmsStatuses[node.id] ?? "locked";
            const isSelected = node.id === activeNode.id;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelectNode(node.id)}
                className={cn(
                  "w-full text-left rounded-xl border p-3.5 transition-all flex items-center justify-between gap-3",
                  isSelected && "ring-2 ring-primary/40",
                  status === "mastered"
                    ? "border-success/35 bg-success/5"
                    : status === "available"
                      ? "border-primary/45 bg-primary/10"
                      : "border-border bg-surface/60 opacity-75"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      status === "mastered"
                        ? "bg-success/15 text-success"
                        : status === "available"
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {status === "mastered" ? <CheckCircle2 className="h-4 w-4" /> : status === "available" ? <Sparkles className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="vk-text-sm font-medium truncate">{node.title}</p>
                    <p className="vk-text-2xs text-muted-foreground">{node.duration}</p>
                  </div>
                </div>

                <Badge variant={status === "mastered" ? "success" : status === "available" ? "default" : "secondary"} className="vk-text-2xs shrink-0">
                  {status === "mastered" ? "Mastered" : status === "available" ? "Available" : "Locked"}
                </Badge>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-border/80 bg-card p-4 space-y-4">
          <div className="space-y-1">
            <span className="vk-text-2xs text-muted-foreground uppercase font-medium">{activeNode.role} · {activeNode.duration}</span>
            <h4 className="vk-text-base font-semibold">{activeNode.title}</h4>
            <p className="vk-text-xs text-muted-foreground leading-relaxed">{activeNode.summary}</p>
          </div>

          {activeStatus === "locked" ? (
            <div className="rounded-xl border border-dashed border-border bg-surface p-3.5 vk-text-xs text-muted-foreground flex items-center gap-2">
              <Lock className="h-4 w-4 shrink-0" />
              <span>Tuntaskan modul prasyarat untuk membuka kuis ini.</span>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-elevated/60 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="vk-text-xs font-semibold inline-flex items-center gap-1.5 text-primary">
                  <Award className="h-4 w-4" /> Check Understanding
                </span>
                {activeStatus === "mastered" && <Badge variant="success" className="vk-text-2xs">Lulus</Badge>}
              </div>
              <p className="vk-text-xs font-medium">{activeNode.quizQuestion}</p>
              <div className="space-y-1.5">
                {activeNode.quizOptions.map((option, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSubmitQuiz(activeNode.id, idx)}
                    className="w-full text-left rounded-lg border border-border bg-surface hover:border-primary/50 px-3 py-2 vk-text-xs transition-colors"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button variant="outline" size="sm" className="w-full rounded-full vk-text-xs" onClick={onOpenInEditor}>
            Fork Modul ke Editor
          </Button>
        </div>
      </div>
    </div>
  );
};
