import React, { useState } from "react";
import {
  Clock,
  FileCode2,
  FolderTree,
  GraduationCap,
  Lock,
  Plus,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { Input } from "@/global/ui/input";
import type { LmsNodeStatus, PrototypeAcademyTreeNode } from "../types";

interface EditorAcademyTreePanelProps {
  nodes: PrototypeAcademyTreeNode[];
  statuses: Record<string, LmsNodeStatus>;
  selectedNodeId: string;
  onSelectNode: (id: string) => void;
  onAddStudentSubNode: (parentNodeId: string, title: string) => void;
  onOpenAcademySettings: () => void;
}

const LEVEL_INDENT: Record<PrototypeAcademyTreeNode["level"], string> = {
  falsafah: "pl-0",
  kurikulum: "pl-3 sm:pl-4",
  silabus: "pl-6 sm:pl-8",
  rps: "pl-8 sm:pl-12",
  instruksi: "pl-10 sm:pl-16",
};

export const EditorAcademyTreePanel: React.FC<EditorAcademyTreePanelProps> = ({
  nodes,
  statuses,
  selectedNodeId,
  onSelectNode,
  onAddStudentSubNode,
  onOpenAcademySettings,
}) => {
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const activeNode = nodes.find((n) => n.id === selectedNodeId) ?? nodes[0];

  const handleGrowSubNode = (e: React.FormEvent) => {
    e.preventDefault();
    onAddStudentSubNode(activeNode.id, newNoteTitle || `catatan-${activeNode.level}.md`);
    setNewNoteTitle("");
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-surface/50 overflow-y-auto p-3 sm:p-4 space-y-3">
      <div className="rounded-xl border border-primary/30 bg-primary/8 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <GraduationCap className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="vk-text-xs font-semibold text-foreground truncate">
              Academy Living Pedagogical Tree (.app/config.json)
            </p>
            <p className="vk-text-2xs text-muted-foreground truncate">
              Falsafah → Kurikulum → Silabus → RPS → Instruksi · Sub-node pelajar tumbuh di bawah modul
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="h-6 px-2.5 vk-text-2xs" onClick={onOpenAcademySettings}>
          Aturan Academy
        </Button>
      </div>

      {/* Hierarchical Folder-Node & File-Node Tree + Student Sub-Nodes */}
      <div className="space-y-2">
        {nodes.map((node) => {
          const status = statuses[node.id] ?? node.initialStatus;
          const isSelected = node.id === activeNode.id;
          return (
            <div key={node.id} className={cn("space-y-1.5", LEVEL_INDENT[node.level])}>
              <button
                type="button"
                onClick={() => onSelectNode(node.id)}
                className={cn(
                  "w-full text-left rounded-xl border p-2.5 transition-all space-y-1.5",
                  isSelected ? "border-primary bg-primary/10 ring-1 ring-primary/40" : "border-border/80 bg-card hover:border-primary/40"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="vk-text-2xs font-mono text-primary inline-flex items-center gap-1">
                    <FolderTree className="h-3 w-3" /> {node.code}
                  </span>
                  <div className="flex items-center gap-1">
                    {node.rules.zenMode && <Badge variant="info" className="vk-text-2xs">Zen Focus</Badge>}
                    <Badge
                      variant={status === "mastered" ? "success" : status === "available" ? "default" : "secondary"}
                      className="vk-text-2xs"
                    >
                      {status === "locked" && <Lock className="h-2.5 w-2.5 mr-1" />}
                      {status}
                    </Badge>
                  </div>
                </div>

                <p className="vk-text-xs font-semibold text-foreground">{node.title}</p>

                <div className="flex flex-wrap items-center gap-2 vk-text-2xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><FileCode2 className="h-3 w-3" /> {node.rules.template}</span>
                  <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> {node.rules.crud}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {node.rules.timeWindow}</span>
                </div>
              </button>

              {/* Living Student Sub-Nodes Growing Under Module */}
              {node.studentSubNodes.length > 0 && (
                <div className="ml-4 pl-3 border-l-2 border-primary/30 space-y-1">
                  {node.studentSubNodes.map((sub) => (
                    <div key={sub.id} className="rounded-lg border border-border/60 bg-elevated/70 px-2.5 py-1.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="vk-text-2xs font-medium truncate inline-flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3 text-info shrink-0" />
                          <span className="truncate">{sub.title}</span>
                        </p>
                        <p className="vk-text-2xs text-muted-foreground inline-flex items-center gap-1 ml-1">
                          <UserCheck className="h-3 w-3" /> {sub.studentHandle} · {sub.updatedAt}
                        </p>
                      </div>
                      <Badge variant={sub.status === "mastered" ? "success" : sub.status === "submitted" ? "info" : "secondary"} className="vk-text-2xs shrink-0">
                        {sub.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Node Rules Inspector + Grow Student Sub-Node Action */}
      <div className="rounded-xl border border-border bg-card p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="vk-text-xs font-semibold">Pedagogical Constraints: {activeNode.code}</span>
          <Badge variant="outline" className="vk-text-2xs">Maks {activeNode.rules.maxFiles} berkas</Badge>
        </div>
        <div className="flex flex-wrap gap-1">
          {activeNode.rules.requiredYaml.map((key) => (
            <code key={key} className="px-1.5 py-0.5 rounded bg-surface border border-border vk-text-2xs font-mono text-primary">
              yaml:{key}
            </code>
          ))}
        </div>
        <form onSubmit={handleGrowSubNode} className="flex items-center gap-2 pt-1">
          <Input
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder={`Tumbuhkan sub-node pelajar di ${activeNode.code}...`}
            className="h-8 vk-text-xs bg-surface flex-1"
          />
          <Button type="submit" size="sm" className="h-8 px-2.5 vk-text-2xs gap-1 shrink-0">
            <Plus className="h-3.5 w-3.5" /> Sub-Node
          </Button>
        </form>
      </div>
    </div>
  );
};
