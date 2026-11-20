import React, { useState } from "react";
import { Award, CheckCircle2, Clock, Lock, Plus, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { Input } from "@/global/ui/input";
import { Progress } from "@/global/ui/progress";
import type { LmsNodeStatus, PrototypeAcademyTreeNode } from "../types";

interface ProfileLmsSkillTreePanelProps {
  academyNodes: PrototypeAcademyTreeNode[];
  lmsStatuses: Record<string, LmsNodeStatus>;
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  onSubmitQuiz: (nodeId: string, optionIndex: number) => void;
  onAddStudentSubNode: (parentNodeId: string, noteTitle: string) => void;
  onOpenInEditor: () => void;
}

export const ProfileLmsSkillTreePanel: React.FC<ProfileLmsSkillTreePanelProps> = ({
  academyNodes,
  lmsStatuses,
  selectedNodeId,
  onSelectNode,
  onSubmitQuiz,
  onAddStudentSubNode,
  onOpenInEditor,
}) => {
  const [subNodeTitle, setSubNodeTitle] = useState("");
  const masteredCount = academyNodes.filter((n) => lmsStatuses[n.id] === "mastered").length;
  const progressPct = Math.round((masteredCount / Math.max(1, academyNodes.length)) * 100);
  const activeNode = academyNodes.find((n) => n.id === selectedNodeId) ?? academyNodes[0];
  const activeStatus = lmsStatuses[activeNode.id] ?? "locked";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/80 bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="vk-text-base font-semibold">Academy Living Pedagogical Tree</h3>
          <p className="vk-text-xs text-muted-foreground">
            Falsafah → Kurikulum → Silabus → RPS → Instruksi/Tugas · Sub-node pelajar tumbuh langsung di bawah modul
          </p>
        </div>
        <div className="min-w-[190px] space-y-1">
          <div className="flex justify-between vk-text-2xs font-medium">
            <span className="text-success">Mastery</span>
            <span>{masteredCount}/{academyNodes.length} ({progressPct}%)</span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 space-y-2.5">
          {academyNodes.map((node) => {
            const status = lmsStatuses[node.id] ?? "locked";
            const isSelected = node.id === activeNode.id;
            return (
              <div key={node.id} className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => onSelectNode(node.id)}
                  className={cn(
                    "w-full text-left rounded-xl border p-3.5 transition-all flex items-center justify-between gap-3",
                    isSelected && "ring-2 ring-primary/40",
                    status === "mastered"
                      ? "border-success/35 bg-success/5"
                      : status === "available"
                        ? "border-primary/45 bg-primary/10"
                        : "border-border bg-surface/60 opacity-80"
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="vk-text-2xs font-mono">{node.code}</Badge>
                        {node.rules.zenMode && <Badge variant="info" className="vk-text-2xs">Zen Focus</Badge>}
                      </div>
                      <p className="vk-text-sm font-medium truncate mt-0.5">{node.title}</p>
                      <p className="vk-text-2xs text-muted-foreground">{node.duration} · {node.studentSubNodes.length} sub-node pelajar</p>
                    </div>
                  </div>

                  <Badge variant={status === "mastered" ? "success" : status === "available" ? "default" : "secondary"} className="vk-text-2xs shrink-0 capitalize">
                    {status}
                  </Badge>
                </button>

                {node.studentSubNodes.length > 0 && (
                  <div className="ml-5 pl-3 border-l-2 border-primary/25 space-y-1">
                    {node.studentSubNodes.map((sub) => (
                      <div key={sub.id} className="rounded-lg bg-elevated/60 border border-border/60 px-3 py-1.5 flex items-center justify-between gap-2 vk-text-2xs">
                        <span className="truncate inline-flex items-center gap-1.5">
                          <UserCheck className="h-3 w-3 text-info shrink-0" />
                          <span className="font-medium text-foreground truncate">{sub.title}</span>
                          <span className="text-muted-foreground">({sub.studentHandle})</span>
                        </span>
                        <Badge variant={sub.status === "mastered" ? "success" : "secondary"} className="vk-text-2xs shrink-0">{sub.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-border/80 bg-card p-4 space-y-4">
          <div className="space-y-1">
            <span className="vk-text-2xs text-primary font-mono font-medium">{activeNode.code} · {activeNode.duration}</span>
            <h4 className="vk-text-base font-semibold">{activeNode.title}</h4>
            <p className="vk-text-xs text-muted-foreground leading-relaxed">{activeNode.summary}</p>
          </div>

          {/* Teacher Pedagogical Constraints (.app/config.json) */}
          <div className="rounded-xl border border-border/70 bg-surface p-3 space-y-1.5 vk-text-2xs">
            <p className="font-semibold text-foreground inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-info" /> Pedagogical Constraints (.app/config.json)
            </p>
            <p className="text-muted-foreground">CRUD: <span className="text-foreground">{activeNode.rules.crud}</span> · Maks {activeNode.rules.maxFiles} berkas</p>
            <p className="text-muted-foreground inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {activeNode.rules.timeWindow}</p>
          </div>

          {activeStatus === "locked" ? (
            <div className="rounded-xl border border-dashed border-border bg-surface p-3.5 vk-text-xs text-muted-foreground flex items-center gap-2">
              <Lock className="h-4 w-4 shrink-0" />
              <span>Tuntaskan simpul prasyarat untuk membuka kuis & sub-node ini.</span>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-elevated/60 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="vk-text-xs font-semibold inline-flex items-center gap-1.5 text-primary"><Award className="h-4 w-4" /> Check Understanding</span>
                {activeStatus === "mastered" && <Badge variant="success" className="vk-text-2xs">Lulus</Badge>}
              </div>
              <p className="vk-text-xs font-medium">{activeNode.quizQuestion}</p>
              <div className="space-y-1.5">
                {activeNode.quizOptions.map((option, idx) => (
                  <button key={idx} type="button" onClick={() => onSubmitQuiz(activeNode.id, idx)} className="w-full text-left rounded-lg border border-border bg-surface hover:border-primary/50 px-3 py-2 vk-text-xs transition-colors">
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); onAddStudentSubNode(activeNode.id, subNodeTitle); setSubNodeTitle(""); }} className="flex items-center gap-1.5">
            <Input value={subNodeTitle} onChange={(e) => setSubNodeTitle(e.target.value)} placeholder="Catatan belajar Anda (.md)..." className="h-8 vk-text-xs bg-surface flex-1" />
            <Button type="submit" size="sm" variant="secondary" className="h-8 px-2.5 vk-text-2xs gap-1 shrink-0"><Plus className="h-3.5 w-3.5" /> Sub-Node</Button>
          </form>

          <Button variant="outline" size="sm" className="w-full rounded-full vk-text-xs" onClick={onOpenInEditor}>
            Buka Mode Academy di Editor
          </Button>
        </div>
      </div>
    </div>
  );
};
