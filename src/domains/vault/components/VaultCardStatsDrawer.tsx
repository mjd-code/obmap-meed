import {
  Network,
  FileText,
  FolderOpen,
  Tag,
  ChevronDown,
  ChevronUp,
  Users,
} from "lucide-react";
import { VaultMemberSection } from "@/domains/vault/components/VaultMemberSection";
import type { VaultLocation } from "@/domains/vault/shared/utils/vault.types";

export interface VaultCardStatsDrawerProps {
  vaultId: string;
  vaultName: string;
  location: VaultLocation;
  cloudSync: boolean;
  currentUserId?: string;
  isOwnerOrAdmin: boolean;
  isStatsExpanded: boolean;
  onToggleStats: () => void;
  isMembersExpanded: boolean;
  onToggleMembers: () => void;
  onCloudSyncChange?: (enabled: boolean) => void;
  stats?: {
    fileCount: number;
    folderCount: number;
    tagCount: number;
    orphanedNodes: number;
    avgConnections: number;
  };
}

/**
 * Collapsible drawers at the bottom of VaultCard for detailed vault statistics
 * and RBAC collaborator access controls.
 */
export const VaultCardStatsDrawer = ({
  vaultId,
  vaultName,
  location,
  cloudSync,
  currentUserId,
  isOwnerOrAdmin,
  isStatsExpanded,
  onToggleStats,
  isMembersExpanded,
  onToggleMembers,
  onCloudSyncChange,
  stats,
}: VaultCardStatsDrawerProps) => {
  return (
    <>
      {/* Accordion 1: Detail Statistik */}
      {stats && (
        <div className="pt-1 border-t border-border/40">
          <button
            type="button"
            onClick={onToggleStats}
            className="flex items-center justify-between w-full py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>
              {isStatsExpanded ? "Sembunyikan Statistik Rinci" : "Detail Statistik Vault"}
            </span>
            {isStatsExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {isStatsExpanded && (
            <div className="grid grid-cols-4 gap-1.5 pt-2 text-[10px] animate-in fade-in duration-150">
              <div className="flex flex-col items-center p-1.5 rounded-md bg-secondary/40 border border-border/40">
                <FileText className="w-3 h-3 text-muted-foreground mb-0.5" />
                <span className="font-semibold text-foreground">{stats.fileCount}</span>
                <span className="text-[9px] text-muted-foreground">Berkas</span>
              </div>
              <div className="flex flex-col items-center p-1.5 rounded-md bg-secondary/40 border border-border/40">
                <FolderOpen className="w-3 h-3 text-muted-foreground mb-0.5" />
                <span className="font-semibold text-foreground">{stats.folderCount}</span>
                <span className="text-[9px] text-muted-foreground">Folder</span>
              </div>
              <div className="flex flex-col items-center p-1.5 rounded-md bg-secondary/40 border border-border/40">
                <Tag className="w-3 h-3 text-muted-foreground mb-0.5" />
                <span className="font-semibold text-foreground">{stats.tagCount}</span>
                <span className="text-[9px] text-muted-foreground">Tag</span>
              </div>
              <div className="flex flex-col items-center p-1.5 rounded-md bg-secondary/40 border border-border/40">
                <Network className="w-3 h-3 text-muted-foreground mb-0.5" />
                <span className="font-semibold text-foreground">
                  {stats.avgConnections.toFixed(1)}
                </span>
                <span className="text-[9px] text-muted-foreground">Rata Tautan</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Accordion 2: Akses & Kolaborator Vault (RBAC Per-Vault) */}
      <div className="pt-1 border-t border-border/40">
        <button
          type="button"
          onClick={onToggleMembers}
          className="flex items-center justify-between w-full py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <Users className="w-3 h-3 text-primary" />
            {isMembersExpanded ? "Tutup Akses & Kolaborator" : "Akses & Kolaborator Vault"}
          </span>
          {isMembersExpanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>

        {isMembersExpanded && (
          <div className="pt-1 animate-in fade-in duration-150">
            <VaultMemberSection
              vaultId={vaultId}
              vaultName={vaultName}
              isCloud={location === "cloud" || cloudSync}
              currentUserId={currentUserId}
              isOwnerOrAdmin={isOwnerOrAdmin}
              onCloudSyncEnable={() => onCloudSyncChange?.(true)}
            />
          </div>
        )}
      </div>
    </>
  );
};
