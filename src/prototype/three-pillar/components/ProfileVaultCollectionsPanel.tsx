import React from "react";
import { Cloud, FolderLock, Globe, HardDrive, Pin, Users } from "lucide-react";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import type { PresentationLens, PrototypeVaultItem, StorageOrigin } from "../types";
import { PrototypeSvgThumbnail } from "./PrototypeSvgThumbnails";

const ORIGIN_BADGES: Record<StorageOrigin, { label: string; variant: "info" | "warning" | "success" | "secondary" }> = {
  public_listed: { label: "Public Listed", variant: "success" },
  public_unlisted: { label: "Unlisted", variant: "info" },
  shared: { label: "Shared Tim", variant: "info" },
  cloud_private: { label: "Cloud Private", variant: "secondary" },
  local_folder: { label: "Local Folder (FS API)", variant: "warning" },
  indexed_db: { label: "IndexedDB Offline", variant: "warning" },
};

const LENS_LABELS: Record<PresentationLens, string> = {
  atlas: "Lens: Atlas",
  publication: "Lens: Publication",
  course: "Lens: Course",
  template: "Lens: Template",
};

interface ProfileVaultCollectionsPanelProps {
  mode: "public" | "shared" | "private_local";
  vaults: PrototypeVaultItem[];
  effectiveVisitorView: boolean;
  pinnedVaultIds: string[];
  onTogglePinVault: (vaultId: string) => void;
  onOpenEditor: () => void;
}

export const ProfileVaultCollectionsPanel: React.FC<ProfileVaultCollectionsPanelProps> = ({
  mode,
  vaults,
  effectiveVisitorView,
  pinnedVaultIds,
  onTogglePinVault,
  onOpenEditor,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {vaults.map((vault) => {
        const originMeta = ORIGIN_BADGES[vault.origin];
        const isPinned = pinnedVaultIds.includes(vault.id);
        return (
          <div key={vault.id} className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col justify-between gap-3">
            <div className="space-y-3">
              {mode === "public" && <PrototypeSvgThumbnail kind={vault.svgKind} compact className="rounded-xl" />}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant={originMeta.variant} className="vk-text-2xs gap-1">
                    {mode === "shared" && <Users className="h-3 w-3" />}
                    {vault.origin === "local_folder" && <HardDrive className="h-3 w-3" />}
                    {vault.origin === "cloud_private" && <Cloud className="h-3 w-3" />}
                    {vault.origin === "public_unlisted" && <Globe className="h-3 w-3" />}
                    {vault.origin === "indexed_db" && <FolderLock className="h-3 w-3" />}
                    {originMeta.label}
                  </Badge>
                  <Badge variant="outline" className="vk-text-2xs">{LENS_LABELS[vault.lens]}</Badge>
                  <Badge variant="secondary" className="vk-text-2xs capitalize">Mode: {vault.primaryMode}</Badge>
                </div>

                {!effectiveVisitorView && (
                  <button
                    type="button"
                    onClick={() => onTogglePinVault(vault.id)}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border vk-text-2xs transition-colors",
                      isPinned ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                    )}
                    title="Sematkan ke Sorotan Profil"
                  >
                    <Pin className="h-3 w-3" /> {isPinned ? "Pinned" : "Pin"}
                  </button>
                )}
              </div>
              <div>
                <h3 className="vk-text-base font-semibold">{vault.title}</h3>
                <p className="vk-text-xs text-muted-foreground line-clamp-2 mt-0.5">{vault.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <span className="vk-text-2xs text-muted-foreground">
                {vault.notesCount} catatan · {mode === "public" ? "Lisensi CC BY-SA 4.0" : `Diperbarui ${vault.updatedAt}`}
              </span>
              {!effectiveVisitorView && (
                <Button size="sm" variant="outline" className="h-7 rounded-full vk-text-xs" onClick={onOpenEditor}>
                  Buka di Editor
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
