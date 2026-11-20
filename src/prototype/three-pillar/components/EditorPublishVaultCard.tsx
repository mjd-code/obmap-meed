import React from "react";
import { CheckSquare, Copy, Globe, HardDrive, Lock, Square } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { Progress } from "@/global/ui/progress";
import type { PresentationLens } from "../types";
import type { PublishVaultRecord } from "../usePublishManagerState";

interface EditorPublishVaultCardProps {
  vault: PublishVaultRecord;
  totalNotes: number;
  publishedNotes: number;
  isSelected: boolean;
  isChecked: boolean;
  onToggleCheck: (id: string) => void;
  onSelect: (id: string) => void;
  onTogglePublish: (id: string) => void;
  onUpdateLens: (id: string, lens: PresentationLens) => void;
}

const LENS_OPTIONS: PresentationLens[] = ["atlas", "publication", "course", "template"];

export const EditorPublishVaultCard: React.FC<EditorPublishVaultCardProps> = ({
  vault,
  totalNotes,
  publishedNotes,
  isSelected,
  isChecked,
  onToggleCheck,
  onSelect,
  onTogglePublish,
  onUpdateLens,
}) => {
  const pct = totalNotes > 0 ? Math.round((publishedNotes / totalNotes) * 100) : vault.isPublished ? 100 : 0;
  const isLocal = vault.origin === "local_folder" || vault.origin === "indexed_db";

  return (
    <div
      className={cn(
        "rounded-xl border p-3.5 space-y-2.5 transition-all min-w-0 overflow-hidden",
        isSelected ? "border-primary bg-primary/5" : "border-border bg-surface/60"
      )}
    >
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onToggleCheck(vault.id)}
            className="mt-0.5 text-muted-foreground hover:text-primary shrink-0"
            aria-label={`Pilih vault ${vault.title}`}
          >
            {isChecked ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
          </button>
          <button type="button" onClick={() => onSelect(vault.id)} className="text-left min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="vk-text-sm font-semibold truncate">{vault.title}</span>
              {vault.isRealLiveVault && <Badge variant="info" className="vk-text-2xs shrink-0">Live</Badge>}
              <Badge variant="outline" className="vk-text-2xs capitalize shrink-0">{vault.primaryMode}</Badge>
            </div>
            <p className="vk-text-2xs text-muted-foreground font-mono truncate">
              /@dr.aras.wicaksono/{vault.slug}
            </p>
          </button>
        </div>

        <Badge variant={vault.isPublished ? "success" : "secondary"} className="vk-text-2xs shrink-0 gap-1">
          {vault.isPublished ? <Globe className="h-3 w-3" /> : isLocal ? <HardDrive className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
          <span>{vault.isPublished ? "Published" : "Private"}</span>
        </Badge>
      </div>

      <div className="space-y-1 min-w-0">
        <div className="flex justify-between gap-2 vk-text-2xs text-muted-foreground">
          <span className="truncate">{totalNotes > 0 ? `${publishedNotes}/${totalNotes} catatan tayang` : "Siap dipetakan"}</span>
          <span className="shrink-0">Lensa: {vault.lens.toUpperCase()}</span>
        </div>
        <Progress value={pct} className="h-1.5" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 min-w-0">
        <div className="grid grid-cols-2 sm:inline-flex gap-1 rounded-md border border-border bg-background p-0.5 w-full sm:w-auto">
          {LENS_OPTIONS.map((lens) => (
            <button
              key={lens}
              type="button"
              onClick={() => onUpdateLens(vault.id, lens)}
              className={cn(
                "px-2 py-0.5 rounded vk-text-2xs capitalize text-center",
                vault.lens === lens ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground"
              )}
            >
              {lens}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-1.5 shrink-0">
          {vault.isPublished && (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Salin URL Publik"
              onClick={() => {
                navigator.clipboard?.writeText(`/@dr.aras.wicaksono/${vault.slug}`);
                toast.success(`Tautan /@dr.aras.wicaksono/${vault.slug} disalin`);
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant={vault.isPublished ? "outline" : "default"}
            className="h-7 px-2.5 vk-text-2xs"
            onClick={() => onTogglePublish(vault.id)}
          >
            {vault.isPublished ? "Unpublish" : "Publish Vault"}
          </Button>
        </div>
      </div>
    </div>
  );
};
