import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  GitCommitHorizontal,
  GitMerge,
  Plus,
  RotateCcw,
  Shield,
  Trash2,
  UserPlus,
} from "lucide-react";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { Input } from "@/global/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/global/ui/select";
import { PROTOTYPE_VISUAL_DIFFS } from "../mockData";
import type {
  CollaboratorRole,
  PrototypeAccessGrant,
  PrototypeMergeRequest,
  PrototypeSnapshot,
  TargetScopeMode,
} from "../types";

const ROLE_OPTIONS: { id: CollaboratorRole; label: string }[] = [
  { id: "viewer", label: "viewer" },
  { id: "commenter", label: "commenter" },
  { id: "contributor", label: "contributor" },
  { id: "editor", label: "editor" },
  { id: "admin", label: "admin" },
  { id: "student", label: "student (Academy)" },
  { id: "teacher", label: "teacher (Academy)" },
  { id: "institution_admin", label: "institution_admin" },
];

const CRUD_PRESETS = [
  { id: "read", label: "Read Only", perms: ["Read"] },
  { id: "annotate", label: "Read + Comment", perms: ["Read", "Comment"] },
  { id: "subnode", label: "Create Sub-Node (Max 3)", perms: ["Read", "Create Sub-Node"] },
  { id: "full", label: "Full Edit (R/C/U/D)", perms: ["Read", "Create", "Update", "Delete"] },
];

interface EditorCollaboratePanelProps {
  targetScope: TargetScopeMode;
  targetName: string;
  grants: PrototypeAccessGrant[];
  onAddGrant: (
    handle: string,
    role: CollaboratorRole,
    scope: TargetScopeMode,
    crud: string[],
    timeWindow: string,
    targetName: string
  ) => void;
  onRemoveGrant: (id: string) => void;
}

export const EditorCollaboratePanel: React.FC<EditorCollaboratePanelProps> = ({
  targetScope,
  targetName,
  grants,
  onAddGrant,
  onRemoveGrant,
}) => {
  const [handleInput, setHandleInput] = useState("@siti.aisyah");
  const [role, setRole] = useState<CollaboratorRole>("contributor");
  const [crudPresetId, setCrudPresetId] = useState("subnode");
  const [timeWindow, setTimeWindow] = useState("08:00–22:00 WIB");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleInput.trim()) return;
    const preset = CRUD_PRESETS.find((c) => c.id === crudPresetId) ?? CRUD_PRESETS[0];
    onAddGrant(handleInput.trim(), role, targetScope, preset.perms, timeWindow, targetName);
    setHandleInput("");
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="vk-text-sm font-semibold flex items-center gap-1.5">
              <UserPlus className="h-4 w-4 text-primary" /> Give Access AS & WITH
            </h2>
            <p className="vk-text-2xs text-muted-foreground">
              Terapkan izin pada cakupan <strong className="text-foreground uppercase">{targetScope}</strong>: {targetName}
            </p>
          </div>
          <Badge variant="info" className="vk-text-2xs">Tersimpan di .app/config.json</Badge>
        </div>

        <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          <Input value={handleInput} onChange={(e) => setHandleInput(e.target.value)} placeholder="@username" className="h-8 vk-text-xs bg-surface" />

          <Select value={role} onValueChange={(v) => setRole(v as CollaboratorRole)}>
            <SelectTrigger className="h-8 vk-text-xs bg-surface">
              <SelectValue placeholder="AS Role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r.id} value={r.id} className="vk-text-xs">AS {r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={crudPresetId} onValueChange={setCrudPresetId}>
            <SelectTrigger className="h-8 vk-text-xs bg-surface">
              <SelectValue placeholder="WITH CRUD" />
            </SelectTrigger>
            <SelectContent>
              {CRUD_PRESETS.map((c) => (
                <SelectItem key={c.id} value={c.id} className="vk-text-xs">WITH {c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeWindow} onValueChange={setTimeWindow}>
            <SelectTrigger className="h-8 vk-text-xs bg-surface">
              <SelectValue placeholder="Time Window" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tanpa batas waktu" className="vk-text-xs">Tanpa batas</SelectItem>
              <SelectItem value="08:00–22:00 WIB" className="vk-text-xs">08:00–22:00 WIB</SelectItem>
              <SelectItem value="Sem. Ganjil 2026" className="vk-text-xs">Sem. Ganjil 2026</SelectItem>
            </SelectContent>
          </Select>

          <Button type="submit" size="sm" className="h-8 vk-text-xs gap-1">
            <Plus className="h-3.5 w-3.5" /> Beri Akses
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
        <h3 className="vk-text-xs font-semibold text-muted-foreground">Daftar Izin Aktif ({grants.length})</h3>
        <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-surface/50">
          {grants.map((g) => (
            <div key={g.id} className="p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="vk-text-xs font-semibold text-foreground">{g.subjectHandle}</span>
                  <Badge variant="default" className="vk-text-2xs">AS {g.role}</Badge>
                  <Badge variant="outline" className="vk-text-2xs uppercase">{g.scope}: {g.targetName}</Badge>
                </div>
                <p className="vk-text-2xs text-muted-foreground inline-flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1"><Shield className="h-3 w-3 text-success" /> {g.crudPermissions.join(", ")}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3 text-info" /> {g.timeWindow}</span>
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => onRemoveGrant(g.id)} aria-label="Cabut akses">
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-danger" />
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

interface EditorVersionsVcsPanelProps {
  snapshots: PrototypeSnapshot[];
  mergeRequests: PrototypeMergeRequest[];
  onCreateSnapshot: (label: string) => void;
  onRollback: (snap: PrototypeSnapshot) => void;
  onMergeKmr: (kmrId: string) => void;
}

export const EditorVersionsVcsPanel: React.FC<EditorVersionsVcsPanelProps> = ({
  snapshots,
  mergeRequests,
  onCreateSnapshot,
  onRollback,
  onMergeKmr,
}) => {
  const [snapLabel, setSnapLabel] = useState("");
  const activeDiff = PROTOTYPE_VISUAL_DIFFS[0];

  return (
    <div className="space-y-4">
      {/* 1. Snapshots & Rollback */}
      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="vk-text-sm font-semibold flex items-center gap-1.5">
              <GitCommitHorizontal className="h-4 w-4 text-primary" /> Essential VCS: Snapshots & Rollback
            </h2>
            <p className="vk-text-2xs text-muted-foreground">Simpan titik pulih ringan di atas berkas .md tanpa kompleksitas Git CLI</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Input value={snapLabel} onChange={(e) => setSnapLabel(e.target.value)} placeholder="Label snapshot..." className="h-7 w-40 vk-text-2xs bg-surface" />
            <Button size="sm" className="h-7 px-2.5 vk-text-2xs" onClick={() => { onCreateSnapshot(snapLabel); setSnapLabel(""); }}>
              + Snapshot
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {snapshots.map((s) => (
            <div key={s.id} className="rounded-xl border border-border/70 bg-surface/60 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="vk-text-xs font-semibold font-mono text-foreground">{s.label} <span className="font-sans font-normal text-muted-foreground">· {s.timestamp}</span></p>
                <p className="vk-text-2xs text-muted-foreground truncate">{s.summary} ({s.changedNodesCount} node)</p>
              </div>
              <Button size="sm" variant="outline" className="h-7 px-2.5 vk-text-2xs gap-1" onClick={() => onRollback(s)}>
                <RotateCcw className="h-3 w-3" /> Rollback
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Visual Diff (Markdown + YAML + Structure) */}
      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="vk-text-sm font-semibold">Visual Diff: <span className="font-mono text-primary">{activeDiff.nodeTitle}</span></h3>
          <Badge variant="info" className="vk-text-2xs">{activeDiff.structureDelta}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 vk-text-2xs font-mono">
          <div className="rounded-xl border border-danger/30 bg-danger/5 p-3 space-y-1">
            <span className="font-semibold text-danger">Sebelum (Snapshot v2.0)</span>
            <pre className="whitespace-pre-wrap text-foreground/85">{activeDiff.markdownBefore}</pre>
          </div>
          <div className="rounded-xl border border-success/30 bg-success/5 p-3 space-y-1">
            <span className="font-semibold text-success">Sesudah (Draft Saat Ini)</span>
            <pre className="whitespace-pre-wrap text-foreground/95">{activeDiff.markdownAfter}</pre>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeDiff.yamlChanges.map((y) => (
            <div key={y.key} className="rounded-lg border border-border bg-surface px-2.5 py-1 vk-text-2xs font-mono">
              <span className="text-muted-foreground">{y.key}: </span>
              <span className="line-through text-danger mr-1">{y.before}</span>
              <span className="text-success font-semibold">{y.after}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Knowledge Merge Requests (KMR) */}
      <section className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
        <h3 className="vk-text-sm font-semibold flex items-center gap-1.5">
          <GitMerge className="h-4 w-4 text-primary" /> Antrean Knowledge Merge Request (KMR)
        </h3>
        {mergeRequests.map((kmr) => (
          <div key={kmr.id} className={cn("rounded-xl border p-3 flex flex-wrap items-center justify-between gap-2", kmr.status === "merged" ? "border-success/35 bg-success/5" : "border-border bg-surface/60")}>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="vk-text-xs font-semibold">{kmr.title}</span>
                <Badge variant={kmr.status === "merged" ? "success" : "warning"} className="vk-text-2xs uppercase">{kmr.status}</Badge>
              </div>
              <p className="vk-text-2xs text-muted-foreground">
                {kmr.authorHandle} · <span className="font-mono">{kmr.sourceBranch} → {kmr.targetVault}</span> · {kmr.diffSummary}
              </p>
            </div>
            {kmr.status === "open" ? (
              <Button size="sm" className="h-7 px-3 vk-text-2xs gap-1" onClick={() => onMergeKmr(kmr.id)}>
                <GitMerge className="h-3.5 w-3.5" /> Review & Merge
              </Button>
            ) : (
              <Badge variant="success" className="vk-text-2xs gap-1"><CheckCircle2 className="h-3 w-3" /> Merged</Badge>
            )}
          </div>
        ))}
      </section>
    </div>
  );
};
