import { Clock, Network, Link2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { VaultLocation } from "@/domains/vault/shared/utils/vault.types";
import { VaultCardHeader } from "@/domains/vault/components/VaultCardHeader";
import { VaultCardStatsDrawer } from "@/domains/vault/components/VaultCardStatsDrawer";
import { useVaultCardController } from "@/domains/vault/shared/hooks/useVaultCardController";
import type { VaultMemberRole } from "@/types/collaboration";

export interface VaultCardProps {
  id: string;
  name: string;
  location: VaultLocation;
  cloudSync: boolean;
  nodeCount: number;
  linkCount: number;
  lastModified: number;
  isActive: boolean;
  isAuthenticated?: boolean;
  currentUserId?: string;
  userRole?: VaultMemberRole | "owner" | "superadmin" | "none";
  onSelect: () => void;
  onDelete: () => void;
  onLeaveVault?: () => void;
  onRename?: (newName: string) => void;
  onCloudSyncChange?: (enabled: boolean) => void;
  onAttachFolder?: () => void;
  onOpenBackups?: () => void;
  onExportToFileSystem?: () => void;
  backupCount?: number;
  stats?: {
    fileCount: number;
    folderCount: number;
    tagCount: number;
    orphanedNodes: number;
    avgConnections: number;
  };
}

/**
 * Pure declarative card view displaying vault identity, inline rename input,
 * actions menu, summary metrics, and collapsible stats/collaborators drawers.
 */
export const VaultCard = ({
  id,
  name,
  location,
  cloudSync,
  nodeCount,
  linkCount,
  lastModified,
  isActive,
  isAuthenticated = false,
  currentUserId,
  userRole = "owner",
  onSelect,
  onDelete,
  onLeaveVault,
  onRename,
  onCloudSyncChange,
  onAttachFolder,
  onOpenBackups,
  onExportToFileSystem,
  backupCount = 0,
  stats,
}: VaultCardProps) => {
  const {
    isStatsExpanded,
    toggleStatsExpanded,
    isMembersExpanded,
    toggleMembersExpanded,
    isRenaming,
    startRenaming,
    newName,
    setNewName,
    validationState,
    isOwner,
    isOwnerOrAdmin,
    isCollaborator,
    canSave,
    handleRename,
    handleCancelRename,
  } = useVaultCardController({
    id,
    name,
    currentUserId,
    userRole,
    onRename,
  });

  return (
    <div
      className={`
        group relative flex flex-col overflow-hidden rounded-xl border bg-card/60 backdrop-blur-xs
        transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5
        ${isActive ? "border-primary/70 ring-1 ring-primary/40 bg-card" : "border-border/80"}
      `}
    >
      {/* Active Top Accent Line */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary" />
      )}

      {/* Main Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <VaultCardHeader
          name={name}
          location={location}
          cloudSync={cloudSync}
          isActive={isActive}
          isAuthenticated={isAuthenticated}
          userRole={userRole}
          isOwner={isOwner}
          isOwnerOrAdmin={isOwnerOrAdmin}
          isCollaborator={isCollaborator}
          isRenaming={isRenaming}
          newName={newName}
          onNewNameChange={setNewName}
          validationState={validationState}
          canSave={canSave}
          onStartRenaming={startRenaming}
          onSaveRename={handleRename}
          onCancelRename={handleCancelRename}
          onSelect={onSelect}
          onDelete={onDelete}
          onLeaveVault={onLeaveVault}
          onRename={onRename}
          onCloudSyncChange={onCloudSyncChange}
          onAttachFolder={onAttachFolder}
          onOpenBackups={onOpenBackups}
          onExportToFileSystem={onExportToFileSystem}
          backupCount={backupCount}
        />

        {/* Minimal Summary Metrics Row */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Network className="w-3 h-3 text-primary" /> {nodeCount}{" "}
              <span className="font-normal text-muted-foreground">catatan</span>
            </span>
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Link2 className="w-3 h-3 text-primary" /> {linkCount}{" "}
              <span className="font-normal text-muted-foreground">tautan</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDistanceToNow(lastModified, { addSuffix: true })}</span>
          </div>
        </div>

        <VaultCardStatsDrawer
          vaultId={id}
          vaultName={name}
          location={location}
          cloudSync={cloudSync}
          currentUserId={currentUserId}
          isOwnerOrAdmin={isOwnerOrAdmin}
          isStatsExpanded={isStatsExpanded}
          onToggleStats={toggleStatsExpanded}
          isMembersExpanded={isMembersExpanded}
          onToggleMembers={toggleMembersExpanded}
          onCloudSyncChange={onCloudSyncChange}
          stats={stats}
        />
      </div>
    </div>
  );
};
