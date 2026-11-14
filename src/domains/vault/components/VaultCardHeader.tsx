import {
  HardDrive,
  Cloud,
  Pencil,
  Check,
  X,
  History,
  Download,
  Trash2,
  MoreVertical,
  FolderPlus,
  LogOut,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Globe,
} from "lucide-react";
import { Button } from "@/global/ui/button";
import { Badge } from "@/global/ui/badge";
import { Input } from "@/global/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/global/ui/dropdown-menu";
import type { VaultLocation } from "@/domains/vault/shared/utils/vault.types";
import { VaultLocationBadge } from "@/domains/vault/components/VaultStorageControls";
import type { VaultRenameValidationState } from "@/domains/vault/shared/hooks/useVaultCardController";
import type { VaultMemberRole } from "@/types/collaboration";

export interface VaultCardHeaderProps {
  name: string;
  location: VaultLocation;
  cloudSync: boolean;
  isActive: boolean;
  isAuthenticated: boolean;
  userRole: VaultMemberRole | "owner" | "superadmin" | "none";
  isOwner: boolean;
  isOwnerOrAdmin: boolean;
  isCollaborator: boolean;
  isRenaming: boolean;
  newName: string;
  onNewNameChange: (value: string) => void;
  validationState: VaultRenameValidationState;
  canSave: boolean;
  onStartRenaming: () => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  onSelect: () => void;
  onDelete: () => void;
  onLeaveVault?: () => void;
  onRename?: (newName: string) => void;
  onCloudSyncChange?: (enabled: boolean) => void;
  onAttachFolder?: () => void;
  onOpenBackups?: () => void;
  onExportToFileSystem?: () => void;
  backupCount: number;
}

/**
 * Header strip for VaultCard containing vault icon, inline rename editor,
 * role/active badges, Open button, and context menu actions.
 */
export const VaultCardHeader = ({
  name,
  location,
  cloudSync,
  isActive,
  isAuthenticated,
  userRole,
  isOwner,
  isOwnerOrAdmin,
  isCollaborator,
  isRenaming,
  newName,
  onNewNameChange,
  validationState,
  canSave,
  onStartRenaming,
  onSaveRename,
  onCancelRename,
  onSelect,
  onDelete,
  onLeaveVault,
  onRename,
  onCloudSyncChange,
  onAttachFolder,
  onOpenBackups,
  onExportToFileSystem,
  backupCount,
}: VaultCardHeaderProps) => {
  return (
    <div className="flex items-start justify-between gap-2.5">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div
          className={`p-2 rounded-lg shrink-0 ${
            location === "folder" ? "bg-primary/10 text-primary" : "bg-blue-500/10 text-blue-400"
          }`}
        >
          {location === "folder" ? (
            <HardDrive className="w-4 h-4" />
          ) : (
            <Cloud className="w-4 h-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {isRenaming ? (
            <div className="flex flex-col gap-1 w-full max-w-sm">
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Input
                    value={newName}
                    onChange={(e) => onNewNameChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canSave) onSaveRename();
                      if (e.key === "Escape") onCancelRename();
                    }}
                    className={`h-7 pr-7 text-xs font-medium transition-colors ${
                      validationState.status === "valid"
                        ? "border-emerald-500/80 focus-visible:ring-emerald-500/30"
                        : validationState.status === "duplicate" ||
                            validationState.status === "invalid"
                          ? "border-destructive focus-visible:ring-destructive/30"
                          : ""
                    }`}
                    placeholder="Nama vault..."
                    autoFocus
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                    {validationState.status === "checking" && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    )}
                    {validationState.status === "valid" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    {(validationState.status === "duplicate" ||
                      validationState.status === "invalid") && (
                      <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                    )}
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-emerald-500 hover:text-emerald-400 disabled:opacity-40"
                  onClick={onSaveRename}
                  disabled={!canSave}
                  title={canSave ? "Simpan nama baru" : "Nama belum valid atau duplikat"}
                >
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={onCancelRename}
                  title="Batal"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>

              {validationState.message && (
                <div
                  className={`text-[11px] flex items-center gap-1 leading-tight ${
                    validationState.status === "valid"
                      ? "text-emerald-500 font-medium"
                      : "text-destructive font-medium"
                  }`}
                >
                  {validationState.status === "valid" ? (
                    <Globe className="w-3 h-3 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3 h-3 shrink-0" />
                  )}
                  <span className="truncate">{validationState.message}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-xs sm:text-sm text-foreground truncate" title={name}>
                {name}
              </h3>
              {isActive && (
                <Badge variant="default" className="text-[10px] h-4.5 px-1.5 font-medium shrink-0">
                  Aktif
                </Badge>
              )}
              {isCollaborator && (
                <Badge
                  variant="secondary"
                  className="text-[10px] h-4.5 px-1.5 font-medium shrink-0 capitalize"
                >
                  {userRole}
                </Badge>
              )}
            </div>
          )}

          {!isRenaming && (
            <div className="flex items-center gap-2 mt-1">
              <VaultLocationBadge location={location} cloudSync={cloudSync} />
            </div>
          )}
        </div>
      </div>

      {/* Action Header Buttons: Open + Context Menu (···) */}
      <div className="flex items-center gap-1 shrink-0">
        {!isActive && (
          <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" onClick={onSelect}>
            Buka
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 text-xs">
            {isOwnerOrAdmin && onRename && (
              <DropdownMenuItem onClick={onStartRenaming} className="gap-2 cursor-pointer">
                <Pencil className="w-3.5 h-3.5" /> Ubah Nama
              </DropdownMenuItem>
            )}
            {onOpenBackups && (
              <DropdownMenuItem onClick={onOpenBackups} className="gap-2 cursor-pointer">
                <History className="w-3.5 h-3.5" /> Cadangan ({backupCount})
              </DropdownMenuItem>
            )}
            {onExportToFileSystem && (
              <DropdownMenuItem onClick={onExportToFileSystem} className="gap-2 cursor-pointer">
                <Download className="w-3.5 h-3.5" /> Ekspor Berkas
              </DropdownMenuItem>
            )}
            {isOwner && onCloudSyncChange && isAuthenticated && (
              <DropdownMenuItem
                onClick={() => onCloudSyncChange(!cloudSync)}
                className="gap-2 cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5" />
                {cloudSync ? "Matikan Cloud Sync" : "Aktifkan Cloud Sync"}
              </DropdownMenuItem>
            )}
            {isOwner && onAttachFolder && (
              <DropdownMenuItem onClick={onAttachFolder} className="gap-2 cursor-pointer">
                <FolderPlus className="w-3.5 h-3.5" /> Tautkan Folder Lokal
              </DropdownMenuItem>
            )}

            {isCollaborator && onLeaveVault && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onLeaveVault}
                  className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Tinggalkan Vault
                </DropdownMenuItem>
              </>
            )}

            {isOwner && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Vault
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
