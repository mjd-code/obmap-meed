import React, { useState } from "react";
import { AlertTriangle, Rocket } from "lucide-react";
import { cn } from "@/global/utils";
import { Button } from "@/global/ui/button";
import { ScrollArea } from "@/global/ui/scroll-area";
import type { PresentationLens, SimulatedRole } from "../types";
import type { PublishNoteRecord, PublishVaultRecord } from "../usePublishManagerState";
import { EditorPublishNoteMatrix } from "./EditorPublishNoteMatrix";
import { EditorPublishVaultCard } from "./EditorPublishVaultCard";

export interface PublishTabBindings {
  role: SimulatedRole;
  vaults: PublishVaultRecord[];
  notes: PublishNoteRecord[];
  selectedVaultId: string;
  selectedVault: PublishVaultRecord;
  onSelectVault: (vaultId: string) => void;
  onToggleVaultPublish: (vaultId: string) => void;
  onBulkVaultPublish: (vaultIds: string[], publish: boolean) => void;
  onUpdateVaultConfig: (
    vaultId: string,
    patch: Partial<Pick<PublishVaultRecord, "lens" | "visibility">>
  ) => void;
  onToggleNotePublish: (noteId: string) => void;
  onBulkNotePublish: (noteIds: string[], publish: boolean) => void;
  onToggleNotePrivate: (noteId: string) => void;
}

type VaultPerspective = "all" | "published" | "unpublished";

export const EditorPublishStudioTab: React.FC<
  PublishTabBindings & { onCloseTab?: () => void }
> = ({
  role,
  vaults,
  notes,
  selectedVaultId,
  selectedVault,
  onSelectVault,
  onToggleVaultPublish,
  onBulkVaultPublish,
  onUpdateVaultConfig,
  onToggleNotePublish,
  onBulkNotePublish,
  onToggleNotePrivate,
  onCloseTab,
}) => {
  const [perspective, setPerspective] = useState<VaultPerspective>("all");
  const [selectedVaultIds, setSelectedVaultIds] = useState<string[]>([]);

  const publishedVaultsCount = vaults.filter((v) => v.isPublished).length;
  const unpublishedVaultsCount = vaults.length - publishedVaultsCount;
  const liveNotesCount = notes.filter((n) => n.isPublished && !n.isYamlPrivate).length;
  const privateNotesCount = notes.filter((n) => n.isYamlPrivate).length;

  const filteredVaults = vaults.filter((v) =>
    perspective === "published" ? v.isPublished : perspective === "unpublished" ? !v.isPublished : true
  );
  const selectedVaultNotes = notes.filter((n) => n.vaultId === selectedVault.id);

  const toggleVaultCheck = (id: string) => {
    setSelectedVaultIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6 bg-card/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <Rocket className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <h1 className="truncate vk-text-base font-semibold text-foreground">Publishing Manager</h1>
            <p className="line-clamp-1 vk-text-2xs text-muted-foreground">
              Peta publikasi vault & kontrol massal catatan (CC BY-SA 4.0)
            </p>
          </div>
        </div>
        {onCloseTab && (
          <Button variant="outline" size="sm" className="h-7 vk-text-xs shrink-0" onClick={onCloseTab}>
            Tutup Tab
          </Button>
        )}
      </header>

      <ScrollArea className="flex-1 min-h-0">
        <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 pb-20 space-y-5">
          {role === "stage2_pending" && (
            <div className="rounded-xl border border-warning/35 bg-warning/10 p-3 flex items-center gap-2 vk-text-xs text-warning">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Stage 2 Pending: perubahan draft tersimpan, tayang publik menunggu approval Admin.</span>
            </div>
          )}

          {/* 1. Overview KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="vk-text-2xs text-muted-foreground">Published Vaults</p>
              <p className="vk-text-xl font-bold text-success">{publishedVaultsCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="vk-text-2xs text-muted-foreground">Not Published</p>
              <p className="vk-text-xl font-bold text-foreground">{unpublishedVaultsCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="vk-text-2xs text-muted-foreground">Catatan Tayang</p>
              <p className="vk-text-xl font-bold text-primary">{liveNotesCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="vk-text-2xs text-muted-foreground">Private Terlindungi</p>
              <p className="vk-text-xl font-bold text-warning">{privateNotesCount}</p>
            </div>
          </div>

          {/* 2. Vault Publishing Perspective Map */}
          <section className="rounded-2xl border border-border bg-card p-4 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {(
                  [
                    { id: "all", label: `Semua Vault (${vaults.length})` },
                    { id: "published", label: `Published (${publishedVaultsCount})` },
                    { id: "unpublished", label: `Not Published (${unpublishedVaultsCount})` },
                  ] as { id: VaultPerspective; label: string }[]
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPerspective(tab.id)}
                    className={cn(
                      "px-3 py-1 rounded-full vk-text-xs font-medium whitespace-nowrap border transition-colors",
                      perspective === tab.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-surface text-muted-foreground border-border hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {selectedVaultIds.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Button size="sm" className="h-7 px-2.5 vk-text-2xs" onClick={() => { onBulkVaultPublish(selectedVaultIds, true); setSelectedVaultIds([]); }}>
                    Publish Vault ({selectedVaultIds.length})
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 px-2.5 vk-text-2xs" onClick={() => { onBulkVaultPublish(selectedVaultIds, false); setSelectedVaultIds([]); }}>
                    Unpublish ({selectedVaultIds.length})
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredVaults.map((v) => {
                const vNotes = notes.filter((n) => n.vaultId === v.id);
                const vPubNotes = vNotes.filter((n) => n.isPublished && !n.isYamlPrivate).length;
                return (
                  <EditorPublishVaultCard
                    key={v.id}
                    vault={v}
                    totalNotes={vNotes.length}
                    publishedNotes={vPubNotes}
                    isSelected={v.id === selectedVaultId}
                    isChecked={selectedVaultIds.includes(v.id)}
                    onToggleCheck={toggleVaultCheck}
                    onSelect={onSelectVault}
                    onTogglePublish={onToggleVaultPublish}
                    onUpdateLens={(id, lens: PresentationLens) => onUpdateVaultConfig(id, { lens })}
                  />
                );
              })}
            </div>
          </section>

          {/* 3. Individual & Bulk Note Publishing Matrix */}
          <EditorPublishNoteMatrix
            vault={selectedVault}
            notes={selectedVaultNotes}
            onToggleNotePublish={onToggleNotePublish}
            onBulkNotePublish={onBulkNotePublish}
            onToggleNotePrivate={onToggleNotePrivate}
          />
        </div>
      </ScrollArea>
    </div>
  );
};
