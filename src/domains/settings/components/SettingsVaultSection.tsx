/**
 * Vault Management section of the Unified Settings Hub.
 */

import { Database, History, FileArchive } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/global/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/global/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/global/ui/tabs";
import { VaultModeSelector } from "@/domains/vault/components/VaultModeSelector";
import { VaultBackupPanel } from "@/domains/vault/components/VaultBackupPanel";
import { VaultBackupSettingsContent } from "@/domains/vault/components/VaultBackupSettings";
import { ImportExportPanel } from "@/domains/workspace/components/WorkspaceImportExportPanel";
import { SettingsVaultListTab } from "@/domains/settings/components/SettingsVaultListTab";
import { useSettingsVaultController } from "@/domains/settings/shared/hooks/useSettingsVaultController";

/** Declarative view for vault management, backup snapshots, and import/export tabs. */
export function VaultSettings() {
  const controller = useSettingsVaultController();

  if (!controller.isInitialized) {
    return (
      <p className="py-12 text-sm text-muted-foreground text-center">
        Memuat ruang kerja vault…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs
        value={controller.activeTab}
        onValueChange={controller.setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 h-10 p-1 bg-muted/60">
          <TabsTrigger
            value="vaults"
            className="text-xs sm:text-sm font-medium gap-1.5"
          >
            <Database className="w-3.5 h-3.5" />
            Daftar Vault
          </TabsTrigger>
          <TabsTrigger
            value="backups"
            className="text-xs sm:text-sm font-medium gap-1.5"
          >
            <History className="w-3.5 h-3.5" />
            Backup & Riwayat
          </TabsTrigger>
          <TabsTrigger
            value="import-export"
            className="text-xs sm:text-sm font-medium gap-1.5"
          >
            <FileArchive className="w-3.5 h-3.5" />
            Impor & Ekspor
          </TabsTrigger>
        </TabsList>

        <SettingsVaultListTab
          activeVault={controller.activeVault}
          activeVaultId={controller.activeVaultId}
          filteredVaults={controller.filteredVaults}
          vaultFilter={controller.vaultFilter}
          onVaultFilterChange={controller.setVaultFilter}
          vaultRoles={controller.vaultRoles}
          backups={controller.backups}
          isAuthenticated={controller.isAuthenticated}
          currentUserId={controller.userId}
          getVaultNodes={controller.getVaultNodes}
          onOpenNewVaultSelector={() => controller.setIsSelectorOpen(true)}
          onSelectVault={controller.handleSelectVault}
          onDeleteVault={controller.handleDeleteVault}
          onLeaveVault={controller.handleLeaveVault}
          onRenameVault={controller.handleRenameVault}
          onCloudSyncChange={controller.handleCloudSyncChange}
          onAttachFolder={controller.handleAttachFolder}
          onOpenBackups={controller.setBackupVaultId}
        />

        {/* TAB 2: BACKUP & RIWAYAT */}
        <TabsContent value="backups" className="mt-4 space-y-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="w-4 h-4 text-primary" /> Riwayat Cadangan
                Snapshot
              </CardTitle>
              <CardDescription className="text-xs">
                {controller.activeVault
                  ? `Mengelola cadangan otomatis dan pemulihan snapshot untuk "${controller.activeVault.name}".`
                  : "Pilih vault di tab Daftar Vault terlebih dahulu."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {controller.activeVaultId ? (
                <VaultBackupPanel
                  vaultId={controller.activeVaultId}
                  backups={controller.backups[controller.activeVaultId] || []}
                  onRestore={(backupId) =>
                    controller.handleRestoreBackup(
                      controller.activeVaultId!,
                      backupId,
                      "Cadangan berhasil dipulihkan",
                      "Pemulihan cadangan gagal",
                    )
                  }
                  onDelete={controller.handleDeleteBackup}
                  onManualBackup={() =>
                    controller.handleCreateManualBackup(
                      controller.activeVaultId!,
                      true,
                    )
                  }
                  onOpenSettings={() =>
                    controller.setSettingsVaultId(controller.activeVaultId)
                  }
                />
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Tidak ada vault yang sedang aktif. Buka salah satu vault di
                  tab Daftar Vault.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: IMPOR & EKSPOR */}
        <TabsContent value="import-export" className="mt-4 space-y-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileArchive className="w-4 h-4 text-primary" /> Impor & Ekspor
                Berkas Markdown
              </CardTitle>
              <CardDescription className="text-xs">
                {controller.activeVault
                  ? `Ekspor atau impor berkas .md dan struktur graf ke dalam vault aktif "${controller.activeVault.name}".`
                  : "Pilih vault terlebih dahulu."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ImportExportPanel
                nodes={
                  (controller.activeVaultId
                    ? controller.getVaultNodes(controller.activeVaultId)
                    : []) as never[]
                }
                onImportComplete={controller.handleImportComplete}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <VaultModeSelector
        open={controller.isSelectorOpen}
        onOpenChange={controller.setIsSelectorOpen}
        onCreateFolderVault={controller.handleCreateFolderVault}
        onOpenFolderVault={controller.handleOpenFolderVault}
        onCreateCloudVault={controller.handleCreateCloudVault}
        onVaultCreated={controller.handleSelectVault}
        isAuthenticated={controller.isAuthenticated}
      />

      {/* Dialog Cadangan */}
      <Dialog
        open={!!controller.backupVaultId}
        onOpenChange={() => controller.setBackupVaultId(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <History className="w-4 h-4 text-primary" /> Cadangan Vault
            </DialogTitle>
          </DialogHeader>
          {controller.backupVaultId && (
            <VaultBackupPanel
              vaultId={controller.backupVaultId}
              backups={controller.backups[controller.backupVaultId] || []}
              onRestore={(backupId) =>
                controller.handleRestoreBackup(
                  controller.backupVaultId!,
                  backupId,
                  "Cadangan dipulihkan",
                  "Gagal memulihkan cadangan",
                )
              }
              onDelete={controller.handleDeleteBackup}
              onManualBackup={() =>
                controller.handleCreateManualBackup(
                  controller.backupVaultId!,
                  false,
                )
              }
              onOpenSettings={() => {
                controller.setSettingsVaultId(controller.backupVaultId);
                controller.setBackupVaultId(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Pengaturan Backup Otomatis */}
      <Dialog
        open={!!controller.settingsVaultId}
        onOpenChange={() => controller.setSettingsVaultId(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              Pengaturan Cadangan Otomatis
            </DialogTitle>
          </DialogHeader>
          {controller.settingsVaultId && (
            <VaultBackupSettingsContent
              config={
                controller.backupConfigs[controller.settingsVaultId] || {
                  timeIntervalMinutes: 10,
                  changeThreshold: 5,
                  maxSnapshots: 20,
                }
              }
              onSave={(newConfig) =>
                controller.handleSaveBackupConfig(
                  controller.settingsVaultId!,
                  newConfig,
                )
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
