import { Plus, Database, Users, FolderHeart } from "lucide-react";
import { Button } from "@/global/ui/button";
import { Badge } from "@/global/ui/badge";
import { Card, CardContent } from "@/global/ui/card";
import { TabsContent } from "@/global/ui/tabs";
import { VaultCard } from "@/domains/vault/components/VaultCard";
import { ExportToFileSystem } from "@/domains/vault/components/VaultExportToFileSystem";
import {
  LOCATION_META,
  type BackupSnapshot,
  type VaultEntry,
} from "@/domains/settings/shared/hooks/useSettingsVaultController";
import type { VaultMemberRole } from "@/types/collaboration";

interface SettingsVaultListTabProps {
  activeVault: VaultEntry | null;
  activeVaultId: string | null;
  filteredVaults: VaultEntry[];
  vaultFilter: "mine" | "shared";
  onVaultFilterChange: (filter: "mine" | "shared") => void;
  vaultRoles: Record<string, VaultMemberRole | "owner" | "none">;
  backups: Record<string, BackupSnapshot[]>;
  isAuthenticated: boolean;
  currentUserId?: string;
  getVaultNodes: (vaultId: string) => unknown[];
  onOpenNewVaultSelector: () => void;
  onSelectVault: (vaultId: string) => void;
  onDeleteVault: (vaultId: string) => void;
  onLeaveVault: (vaultId: string) => void;
  onRenameVault: (vaultId: string, newName: string) => void;
  onCloudSyncChange: (vaultId: string, enabled: boolean) => void;
  onAttachFolder: (vaultId: string) => void;
  onOpenBackups: (vaultId: string) => void;
}

/** Declarative view for the Vault List tab inside SettingsVaultSection. */
export function SettingsVaultListTab({
  activeVault,
  activeVaultId,
  filteredVaults,
  vaultFilter,
  onVaultFilterChange,
  vaultRoles,
  backups,
  isAuthenticated,
  currentUserId,
  getVaultNodes,
  onOpenNewVaultSelector,
  onSelectVault,
  onDeleteVault,
  onLeaveVault,
  onRenameVault,
  onCloudSyncChange,
  onAttachFolder,
  onOpenBackups,
}: SettingsVaultListTabProps) {
  const StrategyIcon = activeVault
    ? LOCATION_META[activeVault.location]?.icon || Database
    : Database;

  return (
    <TabsContent value="vaults" className="mt-4 space-y-4">
      {/* Active Vault Summary Pill */}
      <Card className="border-border shadow-xs bg-muted/10">
        <CardContent className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
              <StrategyIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Vault Aktif Saat Ini</p>
              <p className="text-sm font-semibold text-foreground truncate">
                {activeVault ? activeVault.name : "Belum ada vault aktif"}
              </p>
            </div>
          </div>

          {activeVault && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[11px] h-5 px-2">
                {LOCATION_META[activeVault.location]?.label || "Vault"}
              </Badge>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {activeVault.nodeCount} catatan · {activeVault.linkCount} tautan
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Header + Tombol Tambah + Sub-Toggle Filter */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Semua Vault</h2>
            <p className="text-xs text-muted-foreground">
              Pilih ruang kerja, kelola cadangan, atau undang kolaborator.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex h-8 items-center p-0.5 rounded-lg border border-border bg-muted/40">
              <button
                type="button"
                onClick={() => onVaultFilterChange("mine")}
                className={`h-full flex items-center gap-1.5 px-3 text-xs rounded-md font-medium transition-colors ${
                  vaultFilter === "mine"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FolderHeart className="w-3.5 h-3.5" />
                <span>Personal</span>
              </button>
              <button
                type="button"
                onClick={() => onVaultFilterChange("shared")}
                className={`h-full flex items-center gap-1.5 px-3 text-xs rounded-md font-medium transition-colors ${
                  vaultFilter === "shared"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Shared</span>
              </button>
            </div>

            <Button
              size="sm"
              className="gap-1.5 h-8 px-3 text-xs font-medium shrink-0"
              onClick={onOpenNewVaultSelector}
            >
              <Plus className="w-3.5 h-3.5" />
              Vault Baru
            </Button>
          </div>
        </div>

        {filteredVaults.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center bg-muted/10">
            <Database className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-xs sm:text-sm text-foreground font-medium">
              {vaultFilter === "mine"
                ? "Belum ada vault personal milik Anda."
                : "Belum ada vault yang dibagikan (shared) kepada Anda."}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {vaultFilter === "mine"
                ? "Klik 'Vault Baru' di atas untuk membuat ruang kerja pertama Anda."
                : "Minta rekan Anda mengundang Anda menggunakan User ID atau Gmail Anda."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {filteredVaults.map((vault) => {
              const role = vaultRoles[vault.id] || "owner";
              return (
                <div key={vault.id}>
                  <VaultCard
                    id={vault.id}
                    name={vault.name}
                    location={vault.location}
                    cloudSync={vault.cloudSync}
                    nodeCount={vault.nodeCount}
                    linkCount={vault.linkCount}
                    lastModified={vault.lastModified}
                    isActive={vault.id === activeVaultId}
                    isAuthenticated={isAuthenticated}
                    currentUserId={currentUserId}
                    userRole={role}
                    stats={vault.stats}
                    backupCount={backups[vault.id]?.length || 0}
                    onSelect={() => onSelectVault(vault.id)}
                    onDelete={() => onDeleteVault(vault.id)}
                    onLeaveVault={() => onLeaveVault(vault.id)}
                    onRename={(newName) => onRenameVault(vault.id, newName)}
                    onCloudSyncChange={(enabled) =>
                      onCloudSyncChange(vault.id, enabled)
                    }
                    onAttachFolder={
                      vault.location === "cloud"
                        ? () => onAttachFolder(vault.id)
                        : undefined
                    }
                    onOpenBackups={() => onOpenBackups(vault.id)}
                    onExportToFileSystem={() =>
                      document.getElementById(`hub-export-${vault.id}`)?.click()
                    }
                  />
                  <div className="hidden">
                    <ExportToFileSystem
                      vaultName={vault.name}
                      nodes={getVaultNodes(vault.id) as never[]}
                      trigger={<button id={`hub-export-${vault.id}`} />}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TabsContent>
  );
}
