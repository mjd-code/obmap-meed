import React, { useState } from "react";
import { AlertTriangle, FileText, FolderTree, GitBranch, Rocket, Users } from "lucide-react";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { ScrollArea } from "@/global/ui/scroll-area";
import { Switch } from "@/global/ui/switch";
import type {
  CollaboratorRole,
  PresentationLens,
  PrototypeAccessGrant,
  PrototypeMergeRequest,
  PrototypeSnapshot,
  PublishVisibility,
  ShareStudioSubTab,
  SimulatedRole,
  TargetScopeMode,
} from "../types";
import type { PublishNoteRecord, PublishVaultRecord } from "../usePublishManagerState";
import { EditorCollaboratePanel, EditorVersionsVcsPanel } from "./EditorCollaborateVcsPanels";
import { EditorPublishNoteMatrix } from "./EditorPublishNoteMatrix";
import { EditorPublishVaultCard } from "./EditorPublishVaultCard";

export interface PublishTabBindings {
  role: SimulatedRole;
  vaults: PublishVaultRecord[];
  notes: PublishNoteRecord[];
  selectedVaultId: string;
  selectedVault: PublishVaultRecord;
  shareSubTab: ShareStudioSubTab;
  targetScope: TargetScopeMode;
  selectedTargetNodeTitle: string;
  accessGrants: PrototypeAccessGrant[];
  snapshots: PrototypeSnapshot[];
  mergeRequests: PrototypeMergeRequest[];
  onChangeShareSubTab: (tab: ShareStudioSubTab) => void;
  onChangeTargetScope: (scope: TargetScopeMode) => void;
  onChangeTargetNodeTitle: (title: string) => void;
  onSelectVault: (vaultId: string) => void;
  onToggleVaultPublish: (vaultId: string) => void;
  onBulkVaultPublish: (vaultIds: string[], publish: boolean) => void;
  onUpdateVaultConfig: (vaultId: string, patch: Partial<Pick<PublishVaultRecord, "lens" | "visibility" | "allowCitation" | "allowFork">>) => void;
  onToggleNotePublish: (noteId: string) => void;
  onBulkNotePublish: (noteIds: string[], publish: boolean) => void;
  onToggleNotePrivate: (noteId: string) => void;
  onAddAccessGrant: (handle: string, role: CollaboratorRole, scope: TargetScopeMode, crud: string[], timeWindow: string, targetName: string) => void;
  onRemoveAccessGrant: (id: string) => void;
  onCreateSnapshot: (label: string) => void;
  onRollbackSnapshot: (snap: PrototypeSnapshot) => void;
  onMergeKmr: (kmrId: string) => void;
}

type VaultPerspective = "all" | "published" | "unpublished";

export const EditorPublishStudioTab: React.FC<
  PublishTabBindings & { onCloseTab?: () => void; embedded?: boolean }
> = (props) => {
  const {
    role, vaults, notes, selectedVaultId, selectedVault, shareSubTab, targetScope,
    selectedTargetNodeTitle, accessGrants, snapshots, mergeRequests, onChangeShareSubTab,
    onChangeTargetScope, onChangeTargetNodeTitle, onSelectVault, onToggleVaultPublish,
    onBulkVaultPublish, onUpdateVaultConfig, onToggleNotePublish, onBulkNotePublish,
    onToggleNotePrivate, onAddAccessGrant, onRemoveAccessGrant, onCreateSnapshot,
    onRollbackSnapshot, onMergeKmr, onCloseTab, embedded = false,
  } = props;

  const [perspective, setPerspective] = useState<VaultPerspective>("all");
  const [selectedVaultIds, setSelectedVaultIds] = useState<string[]>([]);
  const publishedVaultsCount = vaults.filter((v) => v.isPublished).length;
  const unpublishedVaultsCount = vaults.length - publishedVaultsCount;
  const liveNotesCount = notes.filter((n) => n.isPublished && !n.isYamlPrivate).length;
  const filteredVaults = vaults.filter((v) =>
    perspective === "published" ? v.isPublished : perspective === "unpublished" ? !v.isPublished : true
  );
  const selectedVaultNotes = notes.filter((n) => n.vaultId === selectedVault.id);
  const activeTargetLabel = targetScope === "vault" ? selectedVault.title : selectedTargetNodeTitle;

  const toggleVaultCheck = (id: string) =>
    setSelectedVaultIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const controlsAndContent = (
    <div className={cn("w-full space-y-4 min-w-0", !embedded && "mx-auto max-w-5xl p-4 sm:p-6 pb-20")}>
      {/* Target Scope + Mobile-Safe 3 Sub-Tabs */}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 space-y-3 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
          <div className="grid grid-cols-2 sm:inline-flex rounded-full border border-border bg-elevated p-0.5 w-full sm:w-auto">
            <button type="button" onClick={() => onChangeTargetScope("vault")} className={cn("inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full vk-text-2xs font-medium", targetScope === "vault" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              <FolderTree className="h-3 w-3 shrink-0" /> <span>Seluruh Vault</span>
            </button>
            <button type="button" onClick={() => onChangeTargetScope("node")} className={cn("inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full vk-text-2xs font-medium", targetScope === "node" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              <FileText className="h-3 w-3 shrink-0" /> <span>Node / Folder</span>
            </button>
          </div>
          {targetScope === "node" && (
            <select value={selectedTargetNodeTitle} onChange={(e) => onChangeTargetNodeTitle(e.target.value)} className="h-8 w-full sm:w-auto max-w-full rounded-lg border border-border bg-surface px-2.5 vk-text-2xs text-foreground">
              {selectedVaultNotes.map((n) => (
                <option key={n.id} value={`${n.title}.md`}>{n.folder}/{n.title}.md</option>
              ))}
            </select>
          )}
        </div>

        {/* Mobile-Safe Responsive Grid for 3 Tabs (Zero Horizontal Clipping) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 w-full min-w-0">
          {(
            [
              { id: "publish", label: "1. Publish (AS & WITH)", icon: Rocket },
              { id: "collaborate", label: `2. Collaborate (${accessGrants.length})`, icon: Users },
              { id: "versions", label: `3. Versions & Diff (${mergeRequests.filter((m) => m.status === "open").length} KMR)`, icon: GitBranch },
            ] as { id: ShareStudioSubTab; label: string; icon: React.ComponentType<{ className?: string }> }[]
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChangeShareSubTab(t.id)}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl sm:rounded-full vk-text-xs font-medium border transition-colors min-w-0",
                  shareSubTab === t.id ? "bg-primary text-primary-foreground border-primary" : "bg-surface text-muted-foreground border-border hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {role === "stage2_pending" && (
        <div className="rounded-xl border border-warning/35 bg-warning/10 p-3 flex items-center gap-2 vk-text-xs text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Stage 2 Pending: publikasi publik menunggu approval Admin (Collaborate & Snapshots tetap aktif).</span>
        </div>
      )}

      {shareSubTab === "collaborate" && (
        <EditorCollaboratePanel targetScope={targetScope} targetName={activeTargetLabel} grants={accessGrants} onAddGrant={onAddAccessGrant} onRemoveGrant={onRemoveAccessGrant} />
      )}

      {shareSubTab === "versions" && (
        <EditorVersionsVcsPanel snapshots={snapshots} mergeRequests={mergeRequests} onCreateSnapshot={onCreateSnapshot} onRollback={onRollbackSnapshot} onMergeKmr={onMergeKmr} />
      )}

      {shareSubTab === "publish" && (
        <>
          {/* Granular Publish AS & WITH (Mobile 2x2 Grid Safe) */}
          <section className="rounded-2xl border border-primary/30 bg-card p-3.5 sm:p-4 space-y-3 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
              <div className="min-w-0">
                <h2 className="vk-text-sm font-semibold truncate">Publish AS & WITH — <span className="text-primary">{activeTargetLabel}</span></h2>
                <p className="vk-text-2xs text-muted-foreground">Cakupan {targetScope === "vault" ? "Seluruh Vault" : "Node / Folder"} · Lisensi {selectedVault.license}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-1.5 vk-text-2xs">
                  <Switch checked={selectedVault.allowCitation} onCheckedChange={(c) => onUpdateVaultConfig(selectedVault.id, { allowCitation: c })} />
                  <span>Allow Citation</span>
                </label>
                <label className="inline-flex items-center gap-1.5 vk-text-2xs">
                  <Switch checked={selectedVault.allowFork} onCheckedChange={(c) => onUpdateVaultConfig(selectedVault.id, { allowFork: c })} />
                  <span>Allow Fork</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 min-w-0">
              <div className="space-y-1.5 min-w-0">
                <span className="vk-text-2xs text-muted-foreground block">AS Presentation Lens:</span>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5">
                  {(["atlas", "publication", "course", "template"] as PresentationLens[]).map((lens) => (
                    <button key={lens} type="button" onClick={() => onUpdateVaultConfig(selectedVault.id, { lens })} className={cn("px-2.5 py-1 rounded-full vk-text-2xs font-medium border capitalize text-center", selectedVault.lens === lens ? "bg-primary/15 text-primary border-primary/45" : "bg-surface text-muted-foreground border-border")}>
                      {lens}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <span className="vk-text-2xs text-muted-foreground block">WITH Visibility:</span>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5">
                  {(["public_listed", "public_unlisted", "shared", "private"] as PublishVisibility[]).map((vis) => (
                    <button key={vis} type="button" onClick={() => onUpdateVaultConfig(selectedVault.id, { visibility: vis })} className={cn("px-2 py-1 rounded-md vk-text-2xs font-mono border text-center truncate", selectedVault.visibility === vis ? "bg-info/15 text-info border-info/45" : "bg-surface text-muted-foreground border-border")}>
                      {vis}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Vault Perspective & Bulk Publish Map (Wrapped cleanly on narrow screens) */}
          <section className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 space-y-3.5 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                {(
                  [
                    { id: "all", label: `Semua (${vaults.length})` },
                    { id: "published", label: `Published (${publishedVaultsCount})` },
                    { id: "unpublished", label: `Private (${unpublishedVaultsCount})` },
                  ] as { id: VaultPerspective; label: string }[]
                ).map((tab) => (
                  <button key={tab.id} type="button" onClick={() => setPerspective(tab.id)} className={cn("px-2.5 py-1 rounded-full vk-text-2xs font-medium whitespace-nowrap border transition-colors", perspective === tab.id ? "bg-primary text-primary-foreground border-primary" : "bg-surface text-muted-foreground border-border hover:text-foreground")}>
                    {tab.label}
                  </button>
                ))}
                <Badge variant="outline" className="vk-text-2xs">{liveNotesCount} catatan tayang</Badge>
              </div>
              {selectedVaultIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button size="sm" className="h-7 px-2.5 vk-text-2xs" onClick={() => { onBulkVaultPublish(selectedVaultIds, true); setSelectedVaultIds([]); }}>Publish ({selectedVaultIds.length})</Button>
                  <Button size="sm" variant="outline" className="h-7 px-2.5 vk-text-2xs" onClick={() => { onBulkVaultPublish(selectedVaultIds, false); setSelectedVaultIds([]); }}>Unpublish ({selectedVaultIds.length})</Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
              {filteredVaults.map((v) => {
                const vNotes = notes.filter((n) => n.vaultId === v.id);
                const vPubNotes = vNotes.filter((n) => n.isPublished && !n.isYamlPrivate).length;
                return (
                  <EditorPublishVaultCard key={v.id} vault={v} totalNotes={vNotes.length} publishedNotes={vPubNotes} isSelected={v.id === selectedVaultId} isChecked={selectedVaultIds.includes(v.id)} onToggleCheck={toggleVaultCheck} onSelect={onSelectVault} onTogglePublish={onToggleVaultPublish} onUpdateLens={(id, lens) => onUpdateVaultConfig(id, { lens })} />
                );
              })}
            </div>
          </section>

          <EditorPublishNoteMatrix vault={selectedVault} notes={selectedVaultNotes} onToggleNotePublish={onToggleNotePublish} onBulkNotePublish={onBulkNotePublish} onToggleNotePrivate={onToggleNotePrivate} />
        </>
      )}
    </div>
  );

  if (embedded) return controlsAndContent;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6 bg-card/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <Rocket className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <h1 className="truncate vk-text-base font-semibold text-foreground">Share · Access · Versions</h1>
            <p className="line-clamp-1 vk-text-2xs text-muted-foreground">Publish, Collaborate (AS & WITH), & Essential VCS</p>
          </div>
        </div>
        {onCloseTab && <Button variant="outline" size="sm" className="h-7 vk-text-xs shrink-0" onClick={onCloseTab}>Tutup</Button>}
      </header>
      <ScrollArea className="flex-1 min-h-0">{controlsAndContent}</ScrollArea>
    </div>
  );
};
