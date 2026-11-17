import React from "react";
import { Cloud, FolderLock, Globe, HardDrive, Users } from "lucide-react";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import type { PrototypeVaultItem, StorageOrigin } from "../types";
import { PrototypeSvgThumbnail } from "./PrototypeSvgThumbnails";

const ORIGIN_BADGES: Record<StorageOrigin, { label: string; variant: "info" | "warning" | "success" | "secondary" }> = {
  public_listed: { label: "Public Listed", variant: "success" },
  public_unlisted: { label: "Unlisted", variant: "info" },
  shared: { label: "Shared Tim", variant: "info" },
  cloud_private: { label: "Cloud Private", variant: "secondary" },
  local_folder: { label: "Local Folder (FS API)", variant: "warning" },
  indexed_db: { label: "IndexedDB Offline", variant: "warning" },
};

interface ProfileVaultCollectionsPanelProps {
  mode: "public" | "shared" | "private_local";
  vaults: PrototypeVaultItem[];
  effectiveVisitorView: boolean;
  onOpenEditor: () => void;
}

export const ProfileVaultCollectionsPanel: React.FC<ProfileVaultCollectionsPanelProps> = ({
  mode,
  vaults,
  effectiveVisitorView,
  onOpenEditor,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {vaults.map((vault) => {
        const originMeta = ORIGIN_BADGES[vault.origin];
        return (
          <div key={vault.id} className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col justify-between gap-3">
            <div className="space-y-3">
              {mode === "public" && <PrototypeSvgThumbnail kind={vault.svgKind} compact className="rounded-xl" />}
              <div className="flex items-center justify-between gap-2">
                <Badge variant={originMeta.variant} className="vk-text-2xs gap-1">
                  {mode === "shared" && <Users className="h-3 w-3" />}
                  {vault.origin === "local_folder" && <HardDrive className="h-3 w-3" />}
                  {vault.origin === "cloud_private" && <Cloud className="h-3 w-3" />}
                  {vault.origin === "public_unlisted" && <Globe className="h-3 w-3" />}
                  {vault.origin === "indexed_db" && <FolderLock className="h-3 w-3" />}
                  {originMeta.label}
                </Badge>
                <span className="vk-text-2xs text-muted-foreground">{vault.notesCount} catatan</span>
              </div>
              <div>
                <h3 className="vk-text-base font-semibold">{vault.title}</h3>
                <p className="vk-text-xs text-muted-foreground line-clamp-2 mt-0.5">{vault.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <span className="vk-text-2xs text-muted-foreground">
                {mode === "public" ? "Lisensi CC BY-SA 4.0" : `Diperbarui ${vault.updatedAt}`}
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
