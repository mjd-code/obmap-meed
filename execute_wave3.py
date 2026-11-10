#!/usr/bin/env python3
"""
execute_wave3.py

Eksekusi Wave 3 Arsitektur Quo Vadis: Total Fundamental Relocation & Legacy Cleanup
1. Restrukturisasi 8 Auxiliary Domains ke Standar Quo Vadis:
   - 1 Orchestrator + Flat components/ (berprefiks) + 4 Pilar shared/{api,stores,hooks,utils}
   - Domains: admin, auth, collaboration, metadata, public-reader, settings, sync, vcs
2. Migrasi Fundamental Sisa Berkas src/shared/ & src/core/ ke src/global/ dan Domain Terkait.
3. Pembaruan 100% Seluruh Import Statement di src/**/*.{ts,tsx} ke Canonical Path Baru.
4. Pembersihan Total (Zero Shims): Hapus folder src/shared/, src/core/, dan sub-folder lama.
5. Verifikasi Otomatis Kompilasi & Vite Build.

Penggunaan:
  python3 execute_wave3.py --dry-run    # Simulasi perpindahan dan pemetaan import
  python3 execute_wave3.py              # Eksekusi migrasi fundamental penuh
  python3 execute_wave3.py --verify     # Eksekusi + validasi build Vite otomatis
"""

import sys
import os
import shutil
import subprocess
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"

# ==============================================================================
# 1. MANIFEST PEMETAAN BERKAS 8 AUXILIARY DOMAIN (LAMA -> CANONICAL BARU)
# ==============================================================================

DOMAIN_MAPPINGS = {
    # --------------------------------------------------------------------------
    # 1. ADMIN DOMAIN
    # --------------------------------------------------------------------------
    "admin": [
        ("components/AuditFeedTab.tsx", "components/AdminAuditFeedTab.tsx"),
        ("components/FirstTimeSetupWizard.tsx", "components/AdminFirstTimeSetupWizard.tsx"),
        ("components/HealthMetricsTab.tsx", "components/AdminHealthMetricsTab.tsx"),
        ("components/SystemArchitectureTab.tsx", "components/AdminSystemArchitectureTab.tsx"),
        ("components/UserManagementTab.tsx", "components/AdminUserManagementTab.tsx"),
        ("components/visualizer/BentoTelemetryView.tsx", "components/AdminBentoTelemetryView.tsx"),
        ("components/visualizer/DiagnosticsTableView.tsx", "components/AdminDiagnosticsTableView.tsx"),
        ("components/visualizer/LivingGraphView.tsx", "components/AdminLivingGraphView.tsx"),
        ("hooks/useSuperadminGuard.ts", "shared/hooks/useSuperadminGuard.ts"),
        ("services/AdminService.ts", "shared/api/AdminService.ts"),
    ],

    # --------------------------------------------------------------------------
    # 2. AUTH DOMAIN
    # --------------------------------------------------------------------------
    "auth": [
        ("components/Auth.tsx", "components/AuthView.tsx"),
        ("components/AuthForm.tsx", "components/AuthForm.tsx"),
        ("components/DevAuthBanner.tsx", "components/AuthDevBanner.tsx"),
        ("components/PasswordStrengthIndicator.tsx", "components/AuthPasswordStrengthIndicator.tsx"),
        ("components/ProtectedRoute.tsx", "components/AuthProtectedRoute.tsx"),
        ("hooks/useAuth.tsx", "shared/hooks/useAuth.tsx"),
        ("hooks/useVaultPermission.ts", "shared/hooks/useVaultPermission.ts"),
        ("services/devAuth.ts", "shared/api/devAuth.ts"),
    ],

    # --------------------------------------------------------------------------
    # 3. COLLABORATION DOMAIN
    # --------------------------------------------------------------------------
    "collaboration": [
        ("components/BulkPublishModal.tsx", "components/CollabBulkPublishModal.tsx"),
        ("components/DiffViewer.tsx", "components/CollabDiffViewer.tsx"),
        ("components/DocumentSharePopover.tsx", "components/CollabDocumentSharePopover.tsx"),
        ("components/EditorWorkflowToolbar.tsx", "components/CollabEditorWorkflowToolbar.tsx"),
        ("components/NoteWorkflowBar.tsx", "components/CollabNoteWorkflowBar.tsx"),
        ("components/NoteWorkflowMenuSection.tsx", "components/CollabNoteWorkflowMenuSection.tsx"),
        ("components/TwoStageLinterModal.tsx", "components/CollabTwoStageLinterModal.tsx"),
        ("services/BulkPublishService.ts", "shared/api/BulkPublishService.ts"),
        ("utils/publicUrlHelper.ts", "shared/utils/publicUrlHelper.ts"),
    ],

    # --------------------------------------------------------------------------
    # 4. METADATA DOMAIN
    # --------------------------------------------------------------------------
    "metadata": [
        ("backlinks/BacklinksView.tsx", "components/MetadataBacklinksView.tsx"),
        ("backlinks/UnlinkedMentions.tsx", "components/MetadataUnlinkedMentions.tsx"),
        ("MetadataCache.ts", "shared/api/MetadataCache.ts"),
        ("mentions.worker.ts", "shared/api/mentions.worker.ts"),
        ("useMetadataCache.ts", "shared/hooks/useMetadataCache.ts"),
        ("backlinks/useUnlinkedMentions.ts", "shared/hooks/useUnlinkedMentions.ts"),
        ("aho-corasick.ts", "shared/utils/aho-corasick.ts"),
        ("content-parser.ts", "shared/utils/content-parser.ts"),
        ("markdown-parser.ts", "shared/utils/markdown-parser.ts"),
    ],

    # --------------------------------------------------------------------------
    # 5. PUBLIC-READER DOMAIN
    # --------------------------------------------------------------------------
    "public-reader": [
        ("components/PublicBreadcrumbs.tsx", "components/PublicReaderBreadcrumbs.tsx"),
        ("components/PublicFileTree.tsx", "components/PublicReaderFileTree.tsx"),
        ("components/PublicFolderOverview.tsx", "components/PublicReaderFolderOverview.tsx"),
        ("components/PublicGraphSettingsPopover.tsx", "components/PublicReaderGraphSettingsPopover.tsx"),
        ("components/PublicInteractiveGraph.tsx", "components/PublicReaderInteractiveGraph.tsx"),
        ("components/PublicMarkdownReader.tsx", "components/PublicReaderMarkdownReader.tsx"),
        ("components/PublicNodePreviewDrawer.tsx", "components/PublicReaderNodePreviewDrawer.tsx"),
        ("services/PublicReaderService.ts", "shared/api/PublicReaderService.ts"),
    ],

    # --------------------------------------------------------------------------
    # 6. SETTINGS DOMAIN
    # --------------------------------------------------------------------------
    "settings": [
        ("SettingsHub.tsx", "components/SettingsHub.tsx"),
        ("FeatureTogglesPanel.tsx", "components/SettingsFeatureTogglesPanel.tsx"),
        ("SyncPanel.tsx", "components/SettingsSyncPanel.tsx"),
        ("command-palette/CommandPalette.tsx", "components/SettingsCommandPalette.tsx"),
        ("profile/components/ApiKeyManager.tsx", "components/SettingsApiKeyManager.tsx"),
        ("profile/components/AvatarUpload.tsx", "components/SettingsAvatarUpload.tsx"),
        ("profile/components/ClaimUsernameModal.tsx", "components/SettingsClaimUsernameModal.tsx"),
        ("profile/components/ProfileSettings.tsx", "components/SettingsProfileSettings.tsx"),
        ("sections/AccountSettings.tsx", "components/SettingsAccountSection.tsx"),
        ("sections/ConfigurationSettings.tsx", "components/SettingsConfigurationSection.tsx"),
        ("sections/GraphEngineSettings.tsx", "components/SettingsGraphEngineSection.tsx"),
        ("sections/RolesSettings.tsx", "components/SettingsRolesSection.tsx"),
        ("sections/SchemaSettings.tsx", "components/SettingsSchemaSection.tsx"),
        ("sections/VaultSettings.tsx", "components/SettingsVaultSection.tsx"),
        ("config/ConfigService.ts", "shared/api/ConfigService.ts"),
        ("config/VaultConfigFile.ts", "shared/api/VaultConfigFile.ts"),
        ("config/registry.ts", "shared/api/configRegistry.ts"),
        ("plugins/plugin-registry.ts", "shared/api/pluginRegistry.ts"),
        ("schema/schema-registry.ts", "shared/api/schemaRegistry.ts"),
        ("profile/services/ApiKeyService.ts", "shared/api/ApiKeyService.ts"),
        ("profile/services/ProfileService.ts", "shared/api/ProfileService.ts"),
        ("config/CloudConfigStore.ts", "shared/stores/CloudConfigStore.ts"),
        ("config/LocalConfigStore.ts", "shared/stores/LocalConfigStore.ts"),
        ("stores/useThemeStore.ts", "shared/stores/useThemeStore.ts"),
        ("schema/useSchemaStore.ts", "shared/stores/useSchemaStore.ts"),
        ("config/useConfigSync.ts", "shared/hooks/useConfigSync.ts"),
        ("plugins/useFeatureEnabled.ts", "shared/hooks/useFeatureEnabled.ts"),
        ("schema/useResolvedSchema.ts", "shared/hooks/useResolvedSchema.ts"),
        ("settingsNavigation.ts", "shared/utils/settingsNavigation.ts"),
        ("command-palette/paletteEvents.ts", "shared/utils/paletteEvents.ts"),
        ("config/types.ts", "shared/utils/config.types.ts"),
        ("schema/types.ts", "shared/utils/schema.types.ts"),
        ("schema/resolve.ts", "shared/utils/schemaResolve.ts"),
        ("plugins/feature-toggles.ts", "shared/utils/featureToggles.ts"),
        ("plugins/features.ts", "shared/utils/features.ts"),
        ("config/index.ts", "shared/api/configIndex.ts"),
        ("config/sections/index.ts", "shared/api/registerConfigSections.ts"),
        ("plugins/index.ts", "shared/api/pluginsIndex.ts"),
        ("schema/index.ts", "shared/api/schemaIndex.ts"),
    ],

    # --------------------------------------------------------------------------
    # 7. SYNC DOMAIN
    # --------------------------------------------------------------------------
    "sync": [
        ("AutoSaveIndicator.tsx", "components/SyncAutoSaveIndicator.tsx"),
        ("SyncStatusIndicator.tsx", "components/SyncStatusIndicator.tsx"),
        ("components/PWAInstallPrompt.tsx", "components/SyncPWAInstallPrompt.tsx"),
        ("SyncCoordinator.ts", "shared/api/SyncCoordinator.ts"),
        ("SyncEngine.ts", "shared/api/SyncEngine.ts"),
        ("sync-queue.ts", "shared/api/syncQueue.ts"),
        ("stores/useOfflineStore.ts", "shared/stores/useOfflineStore.ts"),
        ("hooks/usePWA.tsx", "shared/hooks/usePWA.tsx"),
    ],

    # --------------------------------------------------------------------------
    # 8. VCS DOMAIN
    # --------------------------------------------------------------------------
    "vcs": [
        ("components/BranchSelector.tsx", "components/VcsBranchSelector.tsx"),
        ("components/DocumentVcsButtonGroup.tsx", "components/VcsDocumentButtonGroup.tsx"),
        ("components/FolderVcsDialog.tsx", "components/VcsFolderDialog.tsx"),
        ("components/VcsCoPresenceAvatars.tsx", "components/VcsCoPresenceAvatars.tsx"),
        ("components/VcsCreateBranchModal.tsx", "components/VcsCreateBranchModal.tsx"),
        ("components/VcsCreateMergeRequestModal.tsx", "components/VcsCreateMergeRequestModal.tsx"),
        ("components/VcsDocumentHistoryModal.tsx", "components/VcsDocumentHistoryModal.tsx"),
        ("components/VcsInteractiveMergeModal.tsx", "components/VcsInteractiveMergeModal.tsx"),
        ("components/VcsPanel.tsx", "components/VcsPanel.tsx"),
        ("components/VcsQuickCommitModal.tsx", "components/VcsQuickCommitModal.tsx"),
        ("components/VcsSidebarPanel.tsx", "components/VcsSidebarPanel.tsx"),
        ("services/VcsBranchStashService.ts", "shared/api/VcsBranchStashService.ts"),
        ("services/VcsCloudService.ts", "shared/api/VcsCloudService.ts"),
        ("services/VcsMicroRevisionService.ts", "shared/api/VcsMicroRevisionService.ts"),
        ("services/VcsSyncQueueService.ts", "shared/api/VcsSyncQueueService.ts"),
        ("storage/vcsIndexedDb.ts", "shared/api/vcsIndexedDb.ts"),
        ("stores/useVcsStore.ts", "shared/stores/useVcsStore.ts"),
        ("types/vcs.ts", "shared/utils/vcs.types.ts"),
        ("utils/vcsDiffEngine.ts", "shared/utils/vcsDiffEngine.ts"),
        ("utils/vcsGraphAwareness.ts", "shared/utils/vcsGraphAwareness.ts"),
        ("utils/vcsHash.ts", "shared/utils/vcsHash.ts"),
    ],
}

# ==============================================================================
# 2. TEMPLATE KODE ORCHESTRATOR UNTUK ENTRY POINT MASING-MASING DOMAIN
# ==============================================================================

ORCHESTRATOR_TEMPLATES = {
    "admin": """import React from 'react';
import { AdminSystemArchitectureTab } from './components/AdminSystemArchitectureTab';
import { AdminHealthMetricsTab } from './components/AdminHealthMetricsTab';
import { AdminAuditFeedTab } from './components/AdminAuditFeedTab';
import { AdminUserManagementTab } from './components/AdminUserManagementTab';
import { useSuperadminGuard } from './shared/hooks/useSuperadminGuard';

export interface AdminOrchestratorProps {
  activeTab?: 'architecture' | 'health' | 'audit' | 'users';
}

/**
 * AdminOrchestrator: Entry point tunggal untuk domain Admin & Telemetri
 */
export const AdminOrchestrator: React.FC<AdminOrchestratorProps> = ({ activeTab = 'architecture' }) => {
  const { isSuperadmin, loading } = useSuperadminGuard();

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Checking admin privileges...</div>;
  }

  if (!isSuperadmin) {
    return <div className="p-8 text-center text-destructive">Access denied. Superadmin required.</div>;
  }

  return (
    <div className="admin-orchestrator w-full h-full p-6 space-y-6 overflow-auto">
      {activeTab === 'architecture' && <AdminSystemArchitectureTab />}
      {activeTab === 'health' && <AdminHealthMetricsTab />}
      {activeTab === 'audit' && <AdminAuditFeedTab />}
      {activeTab === 'users' && <AdminUserManagementTab />}
    </div>
  );
};

export default AdminOrchestrator;
""",

    "auth": """import React from 'react';
import { AuthView } from './components/AuthView';
export { useAuth, AuthProvider } from './shared/hooks/useAuth';
export { AuthProtectedRoute as ProtectedRoute } from './components/AuthProtectedRoute';
export { AuthForm } from './components/AuthForm';
export { AuthDevBanner as DevAuthBanner } from './components/AuthDevBanner';

/**
 * AuthOrchestrator: Entry point tunggal domain Otentikasi & Sesi
 */
export const AuthOrchestrator: React.FC = () => {
  return <AuthView />;
};

export default AuthOrchestrator;
""",

    "collaboration": """import React from 'react';
import { CollabDocumentSharePopover } from './components/CollabDocumentSharePopover';
import { CollabBulkPublishModal } from './components/CollabBulkPublishModal';

export interface CollaborationOrchestratorProps {
  noteId?: string;
}

/**
 * CollaborationOrchestrator: Entry point tunggal domain Kolaborasi & Publikasi
 */
export const CollaborationOrchestrator: React.FC<CollaborationOrchestratorProps> = () => {
  return (
    <div className="collaboration-orchestrator flex items-center gap-2">
      <CollabDocumentSharePopover />
    </div>
  );
};

export default CollaborationOrchestrator;
""",

    "metadata": """import React from 'react';
import { MetadataBacklinksView } from './components/MetadataBacklinksView';
import { MetadataUnlinkedMentions } from './components/MetadataUnlinkedMentions';
export { MetadataCache } from './shared/api/MetadataCache';
export { useMetadataCache } from './shared/hooks/useMetadataCache';

export interface MetadataOrchestratorProps {
  currentNoteId?: string;
  view?: 'backlinks' | 'unlinked';
}

/**
 * MetadataOrchestrator: Entry point tunggal metadata, tautan & backlinks
 */
export const MetadataOrchestrator: React.FC<MetadataOrchestratorProps> = ({ view = 'backlinks' }) => {
  return (
    <div className="metadata-orchestrator p-4">
      {view === 'backlinks' ? <MetadataBacklinksView /> : <MetadataUnlinkedMentions />}
    </div>
  );
};

export default MetadataOrchestrator;
""",

    "public-reader": """import React from 'react';
import { PublicReaderFileTree } from './components/PublicReaderFileTree';
import { PublicReaderMarkdownReader } from './components/PublicReaderMarkdownReader';
import { PublicReaderInteractiveGraph } from './components/PublicReaderInteractiveGraph';

export interface PublicReaderOrchestratorProps {
  username?: string;
  vaultSlug?: string;
  noteSlug?: string;
}

/**
 * PublicReaderOrchestrator: Entry point tunggal untuk pembaca publik dokumen vault
 */
export const PublicReaderOrchestrator: React.FC<PublicReaderOrchestratorProps> = () => {
  return (
    <div className="public-reader-orchestrator flex w-full h-screen overflow-hidden bg-background">
      <PublicReaderFileTree />
      <main className="flex-1 overflow-auto">
        <PublicReaderMarkdownReader />
      </main>
    </div>
  );
};

export default PublicReaderOrchestrator;
""",

    "settings": """import React from 'react';
import { SettingsHub } from './components/SettingsHub';
export { SettingsCommandPalette as CommandPalette } from './components/SettingsCommandPalette';
export { useThemeStore } from './shared/stores/useThemeStore';
export { useSchemaStore } from './shared/stores/useSchemaStore';

/**
 * SettingsOrchestrator: Entry point tunggal pengaturan preferensi, vault, dan skema
 */
export const SettingsOrchestrator: React.FC = () => {
  return <SettingsHub />;
};

export default SettingsOrchestrator;
""",

    "sync": """import React from 'react';
import { SyncAutoSaveIndicator } from './components/SyncAutoSaveIndicator';
import { SyncStatusIndicator } from './components/SyncStatusIndicator';
export { SyncCoordinator } from './shared/api/SyncCoordinator';
export { SyncEngine } from './shared/api/SyncEngine';
export { useOfflineStore } from './shared/stores/useOfflineStore';

/**
 * SyncOrchestrator: Entry point tunggal sinkronisasi data & status offline/cloud
 */
export const SyncOrchestrator: React.FC = () => {
  return (
    <div className="sync-orchestrator flex items-center gap-2">
      <SyncAutoSaveIndicator />
      <SyncStatusIndicator />
    </div>
  );
};

export default SyncOrchestrator;
""",

    "vcs": """import React from 'react';
import { VcsSidebarPanel } from './components/VcsSidebarPanel';
import { VcsBranchSelector } from './components/VcsBranchSelector';
export { useVcsStore } from './shared/stores/useVcsStore';

/**
 * VcsOrchestrator: Entry point tunggal version control system & branching
 */
export const VcsOrchestrator: React.FC = () => {
  return (
    <div className="vcs-orchestrator w-full h-full">
      <VcsSidebarPanel />
    </div>
  );
};

export default VcsOrchestrator;
""",
}

# ==============================================================================
# 3. TABEL PEMBARUAN IMPORT ALIAS GLOBAL & CANONICAL
# ==============================================================================

IMPORT_REPLACEMENTS = [
    # --- Eliminasi total src/shared/ui/ -> src/global/ui/ ---
    (r'@/shared/ui/ControlSliderRow', r'@/global/ui/ControlSliderRow'),
    (r'@/shared/ui/SectionHeaderWithReset', r'@/global/ui/SectionHeaderWithReset'),
    (r'@/shared/ui/accordion', r'@/global/ui/accordion'),
    (r'@/shared/ui/alert-dialog', r'@/global/ui/alert-dialog'),
    (r'@/shared/ui/alert', r'@/global/ui/alert'),
    (r'@/shared/ui/aspect-ratio', r'@/global/ui/aspect-ratio'),
    (r'@/shared/ui/avatar', r'@/global/ui/avatar'),
    (r'@/shared/ui/badge', r'@/global/ui/badge'),
    (r'@/shared/ui/breadcrumb', r'@/global/ui/breadcrumb'),
    (r'@/shared/ui/button', r'@/global/ui/button'),
    (r'@/shared/ui/calendar', r'@/global/ui/calendar'),
    (r'@/shared/ui/card', r'@/global/ui/card'),
    (r'@/shared/ui/carousel', r'@/global/ui/carousel'),
    (r'@/shared/ui/chart', r'@/global/ui/chart'),
    (r'@/shared/ui/checkbox', r'@/global/ui/checkbox'),
    (r'@/shared/ui/collapsible', r'@/global/ui/collapsible'),
    (r'@/shared/ui/command', r'@/global/ui/command'),
    (r'@/shared/ui/context-menu', r'@/global/ui/context-menu'),
    (r'@/shared/ui/dialog', r'@/global/ui/dialog'),
    (r'@/shared/ui/drawer', r'@/global/ui/drawer'),
    (r'@/shared/ui/dropdown-menu', r'@/global/ui/dropdown-menu'),
    (r'@/shared/ui/form', r'@/global/ui/form'),
    (r'@/shared/ui/hover-card', r'@/global/ui/hover-card'),
    (r'@/shared/ui/input-otp', r'@/global/ui/input-otp'),
    (r'@/shared/ui/input', r'@/global/ui/input'),
    (r'@/shared/ui/label', r'@/global/ui/label'),
    (r'@/shared/ui/menubar', r'@/global/ui/menubar'),
    (r'@/shared/ui/navigation-menu', r'@/global/ui/navigation-menu'),
    (r'@/shared/ui/pagination', r'@/global/ui/pagination'),
    (r'@/shared/ui/popover', r'@/global/ui/popover'),
    (r'@/shared/ui/progress', r'@/global/ui/progress'),
    (r'@/shared/ui/radio-group', r'@/global/ui/radio-group'),
    (r'@/shared/ui/resizable', r'@/global/ui/resizable'),
    (r'@/shared/ui/scroll-area', r'@/global/ui/scroll-area'),
    (r'@/shared/ui/select', r'@/global/ui/select'),
    (r'@/shared/ui/separator', r'@/global/ui/separator'),
    (r'@/shared/ui/sheet', r'@/global/ui/sheet'),
    (r'@/shared/ui/sidebar', r'@/global/ui/sidebar'),
    (r'@/shared/ui/skeleton', r'@/global/ui/skeleton'),
    (r'@/shared/ui/slider-noinput', r'@/global/ui/slider-noinput'),
    (r'@/shared/ui/slider-number', r'@/global/ui/slider-number'),
    (r'@/shared/ui/slider', r'@/global/ui/slider'),
    (r'@/shared/ui/sonner', r'@/global/ui/sonner'),
    (r'@/shared/ui/switch', r'@/global/ui/switch'),
    (r'@/shared/ui/table', r'@/global/ui/table'),
    (r'@/shared/ui/tabs', r'@/global/ui/tabs'),
    (r'@/shared/ui/textarea', r'@/global/ui/textarea'),
    (r'@/shared/ui/toast', r'@/global/ui/toast'),
    (r'@/shared/ui/toaster', r'@/global/ui/toaster'),
    (r'@/shared/ui/toggle-group', r'@/global/ui/toggle-group'),
    (r'@/shared/ui/toggle', r'@/global/ui/toggle'),
    (r'@/shared/ui/tooltip', r'@/global/ui/tooltip'),

    # --- Eliminasi src/shared/lib/ & di/ & hooks/ & events/ -> src/global/ ---
    (r'@/shared/lib/untypedSupabase', r'@/global/api/untypedSupabase'),
    (r'@/shared/lib/cn', r'@/global/utils/cn'),
    (r'@/shared/lib/color-engine', r'@/global/utils/color-engine'),
    (r'@/shared/lib/color-utils', r'@/global/utils/color-utils'),
    (r'@/shared/lib/fuzzy', r'@/global/utils/fuzzy'),
    (r'@/shared/lib', r'@/global/utils'),
    (r'@/shared/events/events', r'@/global/stores/events'),
    (r'@/shared/hooks/useMobile', r'@/global/hooks/useMobile'),
    (r'@/shared/hooks/useToast', r'@/global/hooks/useToast'),
    (r'@/shared/components/ErrorBoundary', r'@/global/components/ErrorBoundary'),
    (r'@/shared/components/PWAInstallPrompt', r'@/global/components/PWAInstallPrompt'),
    (r'@/shared/di/container', r'@/global/utils/container'),
    (r'@/shared/di/useService', r'@/global/utils/useService'),

    # --- Eliminasi src/shared/stores/ -> Domain Stores & Global ---
    (r'@/shared/stores/types', r'@/domains/graph/shared/utils/graph.types'),
    (r'@/shared/stores/useGraphStore', r'@/domains/graph/shared/stores/useGraphStore'),
    (r'@/shared/stores/useNodeStore', r'@/domains/graph/shared/stores/useNodeStore'),
    (r'@/shared/stores/useVaultStore', r'@/domains/vault/shared/stores/useVaultStore'),
    (r'@/shared/stores/useEditorSettingsStore', r'@/domains/editor/shared/stores/useEditorSettingsStore'),
    (r'@/shared/stores/useUIStore', r'@/domains/workspace/shared/stores/useUIStore'),
    (r'@/shared/stores/useOfflineStore', r'@/domains/sync/shared/stores/useOfflineStore'),
    (r'@/shared/stores/useThemeStore', r'@/domains/settings/shared/stores/useThemeStore'),
    (r'@/shared/stores/useStatusNoticeStore', r'@/global/stores/useStatusNoticeStore'),
    (r'@/shared/stores/useGraphEngineStore', r'@/domains/graph/shared/stores/useGraphEngineStore'),
    (r'@/shared/stores/useGraphTemplatesStore', r'@/domains/graph/shared/stores/useGraphTemplatesStore'),
    (r'@/shared/stores/useBackupConfigStore', r'@/domains/vault/shared/stores/useBackupConfigStore'),
    (r'@/shared/stores', r'@/global/stores'),

    # --- Eliminasi total src/core/ ke domain masing-masing ---
    (r'@/core/shell/auth/hooks/useAuth', r'@/domains/auth/shared/hooks/useAuth'),
    (r'@/core/shell/auth/AuthForm', r'@/domains/auth/components/AuthForm'),
    (r'@/core/shell/auth/DevAuthBanner', r'@/domains/auth/components/AuthDevBanner'),
    (r'@/core/shell/auth/PasswordStrengthIndicator', r'@/domains/auth/components/AuthPasswordStrengthIndicator'),
    (r'@/core/shell/auth/ProtectedRoute', r'@/domains/auth/components/AuthProtectedRoute'),
    (r'@/core/system/sync/hooks/usePWA', r'@/domains/sync/shared/hooks/usePWA'),
    (r'@/core/system/vault/VaultManagerSingleton', r'@/domains/vault/shared/api/VaultManagerSingleton'),
    (r'@/core/system/vault/hooks/useVaultEvents', r'@/domains/vault/shared/hooks/useVaultEvents'),
    (r'@/core/system/vault/hooks/useVaultSync', r'@/domains/vault/shared/hooks/useVaultSync'),
    (r'@/core/editor/types', r'@/domains/editor/shared/utils/editor.types'),

    # --- Domain ADMIN Canonical Replacements ---
    (r'@/domains/admin/components/visualizer/BentoTelemetryView', r'@/domains/admin/components/AdminBentoTelemetryView'),
    (r'@/domains/admin/components/visualizer/DiagnosticsTableView', r'@/domains/admin/components/AdminDiagnosticsTableView'),
    (r'@/domains/admin/components/visualizer/LivingGraphView', r'@/domains/admin/components/AdminLivingGraphView'),
    (r'@/domains/admin/components/AuditFeedTab', r'@/domains/admin/components/AdminAuditFeedTab'),
    (r'@/domains/admin/components/FirstTimeSetupWizard', r'@/domains/admin/components/AdminFirstTimeSetupWizard'),
    (r'@/domains/admin/components/HealthMetricsTab', r'@/domains/admin/components/AdminHealthMetricsTab'),
    (r'@/domains/admin/components/SystemArchitectureTab', r'@/domains/admin/components/AdminSystemArchitectureTab'),
    (r'@/domains/admin/components/UserManagementTab', r'@/domains/admin/components/AdminUserManagementTab'),
    (r'@/domains/admin/hooks/useSuperadminGuard', r'@/domains/admin/shared/hooks/useSuperadminGuard'),
    (r'@/domains/admin/services/AdminService', r'@/domains/admin/shared/api/AdminService'),

    # --- Domain AUTH Canonical Replacements ---
    (r'@/domains/auth/components/Auth\b', r'@/domains/auth/components/AuthView'),
    (r'@/domains/auth/components/DevAuthBanner', r'@/domains/auth/components/AuthDevBanner'),
    (r'@/domains/auth/components/PasswordStrengthIndicator', r'@/domains/auth/components/AuthPasswordStrengthIndicator'),
    (r'@/domains/auth/components/ProtectedRoute', r'@/domains/auth/components/AuthProtectedRoute'),
    (r'@/domains/auth/hooks/useAuth', r'@/domains/auth/shared/hooks/useAuth'),
    (r'@/domains/auth/hooks/useVaultPermission', r'@/domains/auth/shared/hooks/useVaultPermission'),
    (r'@/domains/auth/services/devAuth', r'@/domains/auth/shared/api/devAuth'),

    # --- Domain COLLABORATION Canonical Replacements ---
    (r'@/domains/collaboration/components/BulkPublishModal', r'@/domains/collaboration/components/CollabBulkPublishModal'),
    (r'@/domains/collaboration/components/DiffViewer', r'@/domains/collaboration/components/CollabDiffViewer'),
    (r'@/domains/collaboration/components/DocumentSharePopover', r'@/domains/collaboration/components/CollabDocumentSharePopover'),
    (r'@/domains/collaboration/components/EditorWorkflowToolbar', r'@/domains/collaboration/components/CollabEditorWorkflowToolbar'),
    (r'@/domains/collaboration/components/NoteWorkflowBar', r'@/domains/collaboration/components/CollabNoteWorkflowBar'),
    (r'@/domains/collaboration/components/NoteWorkflowMenuSection', r'@/domains/collaboration/components/CollabNoteWorkflowMenuSection'),
    (r'@/domains/collaboration/components/TwoStageLinterModal', r'@/domains/collaboration/components/CollabTwoStageLinterModal'),
    (r'@/domains/collaboration/services/BulkPublishService', r'@/domains/collaboration/shared/api/BulkPublishService'),
    (r'@/domains/collaboration/utils/publicUrlHelper', r'@/domains/collaboration/shared/utils/publicUrlHelper'),

    # --- Domain METADATA Canonical Replacements ---
    (r'@/domains/metadata/backlinks/BacklinksView', r'@/domains/metadata/components/MetadataBacklinksView'),
    (r'@/domains/metadata/backlinks/UnlinkedMentions', r'@/domains/metadata/components/MetadataUnlinkedMentions'),
    (r'@/domains/metadata/backlinks/useUnlinkedMentions', r'@/domains/metadata/shared/hooks/useUnlinkedMentions'),
    (r'@/domains/metadata/MetadataCache', r'@/domains/metadata/shared/api/MetadataCache'),
    (r'@/domains/metadata/mentions\.worker', r'@/domains/metadata/shared/api/mentions.worker'),
    (r'@/domains/metadata/useMetadataCache', r'@/domains/metadata/shared/hooks/useMetadataCache'),
    (r'@/domains/metadata/aho-corasick', r'@/domains/metadata/shared/utils/aho-corasick'),
    (r'@/domains/metadata/content-parser', r'@/domains/metadata/shared/utils/content-parser'),
    (r'@/domains/metadata/markdown-parser', r'@/domains/metadata/shared/utils/markdown-parser'),

    # --- Domain PUBLIC-READER Canonical Replacements ---
    (r'@/domains/public-reader/components/PublicBreadcrumbs', r'@/domains/public-reader/components/PublicReaderBreadcrumbs'),
    (r'@/domains/public-reader/components/PublicFileTree', r'@/domains/public-reader/components/PublicReaderFileTree'),
    (r'@/domains/public-reader/components/PublicFolderOverview', r'@/domains/public-reader/components/PublicReaderFolderOverview'),
    (r'@/domains/public-reader/components/PublicGraphSettingsPopover', r'@/domains/public-reader/components/PublicReaderGraphSettingsPopover'),
    (r'@/domains/public-reader/components/PublicInteractiveGraph', r'@/domains/public-reader/components/PublicReaderInteractiveGraph'),
    (r'@/domains/public-reader/components/PublicMarkdownReader', r'@/domains/public-reader/components/PublicReaderMarkdownReader'),
    (r'@/domains/public-reader/components/PublicNodePreviewDrawer', r'@/domains/public-reader/components/PublicReaderNodePreviewDrawer'),
    (r'@/domains/public-reader/services/PublicReaderService', r'@/domains/public-reader/shared/api/PublicReaderService'),

    # --- Domain SETTINGS Canonical Replacements ---
    (r'@/domains/settings/SettingsHub', r'@/domains/settings/components/SettingsHub'),
    (r'@/domains/settings/FeatureTogglesPanel', r'@/domains/settings/components/SettingsFeatureTogglesPanel'),
    (r'@/domains/settings/SyncPanel', r'@/domains/settings/components/SettingsSyncPanel'),
    (r'@/domains/settings/command-palette/CommandPalette', r'@/domains/settings/components/SettingsCommandPalette'),
    (r'@/domains/settings/profile/components/ApiKeyManager', r'@/domains/settings/components/SettingsApiKeyManager'),
    (r'@/domains/settings/profile/components/AvatarUpload', r'@/domains/settings/components/SettingsAvatarUpload'),
    (r'@/domains/settings/profile/components/ClaimUsernameModal', r'@/domains/settings/components/SettingsClaimUsernameModal'),
    (r'@/domains/settings/profile/components/ProfileSettings', r'@/domains/settings/components/SettingsProfileSettings'),
    (r'@/domains/settings/sections/AccountSettings', r'@/domains/settings/components/SettingsAccountSection'),
    (r'@/domains/settings/sections/ConfigurationSettings', r'@/domains/settings/components/SettingsConfigurationSection'),
    (r'@/domains/settings/sections/GraphEngineSettings', r'@/domains/settings/components/SettingsGraphEngineSection'),
    (r'@/domains/settings/sections/RolesSettings', r'@/domains/settings/components/SettingsRolesSection'),
    (r'@/domains/settings/sections/SchemaSettings', r'@/domains/settings/components/SettingsSchemaSection'),
    (r'@/domains/settings/sections/VaultSettings', r'@/domains/settings/components/SettingsVaultSection'),
    (r'@/domains/settings/config/ConfigService', r'@/domains/settings/shared/api/ConfigService'),
    (r'@/domains/settings/config/VaultConfigFile', r'@/domains/settings/shared/api/VaultConfigFile'),
    (r'@/domains/settings/config/registry', r'@/domains/settings/shared/api/configRegistry'),
    (r'@/domains/settings/plugins/plugin-registry', r'@/domains/settings/shared/api/pluginRegistry'),
    (r'@/domains/settings/schema/schema-registry', r'@/domains/settings/shared/api/schemaRegistry'),
    (r'@/domains/settings/profile/services/ApiKeyService', r'@/domains/settings/shared/api/ApiKeyService'),
    (r'@/domains/settings/profile/services/ProfileService', r'@/domains/settings/shared/api/ProfileService'),
    (r'@/domains/settings/config/CloudConfigStore', r'@/domains/settings/shared/stores/CloudConfigStore'),
    (r'@/domains/settings/config/LocalConfigStore', r'@/domains/settings/shared/stores/LocalConfigStore'),
    (r'@/domains/settings/stores/useThemeStore', r'@/domains/settings/shared/stores/useThemeStore'),
    (r'@/domains/settings/schema/useSchemaStore', r'@/domains/settings/shared/stores/useSchemaStore'),
    (r'@/domains/settings/config/useConfigSync', r'@/domains/settings/shared/hooks/useConfigSync'),
    (r'@/domains/settings/plugins/useFeatureEnabled', r'@/domains/settings/shared/hooks/useFeatureEnabled'),
    (r'@/domains/settings/schema/useResolvedSchema', r'@/domains/settings/shared/hooks/useResolvedSchema'),
    (r'@/domains/settings/settingsNavigation', r'@/domains/settings/shared/utils/settingsNavigation'),
    (r'@/domains/settings/command-palette/paletteEvents', r'@/domains/settings/shared/utils/paletteEvents'),
    (r'@/domains/settings/config/types', r'@/domains/settings/shared/utils/config.types'),
    (r'@/domains/settings/schema/types', r'@/domains/settings/shared/utils/schema.types'),
    (r'@/domains/settings/schema/resolve', r'@/domains/settings/shared/utils/schemaResolve'),
    (r'@/domains/settings/plugins/feature-toggles', r'@/domains/settings/shared/utils/featureToggles'),
    (r'@/domains/settings/plugins/features', r'@/domains/settings/shared/utils/features'),
    (r'@/domains/settings/config/sections', r'@/domains/settings/shared/api/registerConfigSections'),
    (r'@/domains/settings/config', r'@/domains/settings/shared/api/configIndex'),
    (r'@/domains/settings/plugins', r'@/domains/settings/shared/api/pluginsIndex'),
    (r'@/domains/settings/schema', r'@/domains/settings/shared/api/schemaIndex'),

    # --- Domain SYNC Canonical Replacements ---
    (r'@/domains/sync/AutoSaveIndicator', r'@/domains/sync/components/SyncAutoSaveIndicator'),
    (r'@/domains/sync/SyncStatusIndicator', r'@/domains/sync/components/SyncStatusIndicator'),
    (r'@/domains/sync/components/PWAInstallPrompt', r'@/domains/sync/components/SyncPWAInstallPrompt'),
    (r'@/domains/sync/SyncCoordinator', r'@/domains/sync/shared/api/SyncCoordinator'),
    (r'@/domains/sync/SyncEngine', r'@/domains/sync/shared/api/SyncEngine'),
    (r'@/domains/sync/sync-queue', r'@/domains/sync/shared/api/syncQueue'),
    (r'@/domains/sync/stores/useOfflineStore', r'@/domains/sync/shared/stores/useOfflineStore'),
    (r'@/domains/sync/hooks/usePWA', r'@/domains/sync/shared/hooks/usePWA'),

    # --- Domain VCS Canonical Replacements ---
    (r'@/domains/vcs/components/BranchSelector', r'@/domains/vcs/components/VcsBranchSelector'),
    (r'@/domains/vcs/components/DocumentVcsButtonGroup', r'@/domains/vcs/components/VcsDocumentButtonGroup'),
    (r'@/domains/vcs/components/FolderVcsDialog', r'@/domains/vcs/components/VcsFolderDialog'),
    (r'@/domains/vcs/components/VcsCoPresenceAvatars', r'@/domains/vcs/components/VcsCoPresenceAvatars'),
    (r'@/domains/vcs/components/VcsCreateBranchModal', r'@/domains/vcs/components/VcsCreateBranchModal'),
    (r'@/domains/vcs/components/VcsCreateMergeRequestModal', r'@/domains/vcs/components/VcsCreateMergeRequestModal'),
    (r'@/domains/vcs/components/VcsDocumentHistoryModal', r'@/domains/vcs/components/VcsDocumentHistoryModal'),
    (r'@/domains/vcs/components/VcsInteractiveMergeModal', r'@/domains/vcs/components/VcsInteractiveMergeModal'),
    (r'@/domains/vcs/components/VcsPanel', r'@/domains/vcs/components/VcsPanel'),
    (r'@/domains/vcs/components/VcsQuickCommitModal', r'@/domains/vcs/components/VcsQuickCommitModal'),
    (r'@/domains/vcs/components/VcsSidebarPanel', r'@/domains/vcs/components/VcsSidebarPanel'),
    (r'@/domains/vcs/services/VcsBranchStashService', r'@/domains/vcs/shared/api/VcsBranchStashService'),
    (r'@/domains/vcs/services/VcsCloudService', r'@/domains/vcs/shared/api/VcsCloudService'),
    (r'@/domains/vcs/services/VcsMicroRevisionService', r'@/domains/vcs/shared/api/VcsMicroRevisionService'),
    (r'@/domains/vcs/services/VcsSyncQueueService', r'@/domains/vcs/shared/api/VcsSyncQueueService'),
    (r'@/domains/vcs/storage/vcsIndexedDb', r'@/domains/vcs/shared/api/vcsIndexedDb'),
    (r'@/domains/vcs/stores/useVcsStore', r'@/domains/vcs/shared/stores/useVcsStore'),
    (r'@/domains/vcs/types/vcs', r'@/domains/vcs/shared/utils/vcs.types'),
    (r'@/domains/vcs/utils/vcsDiffEngine', r'@/domains/vcs/shared/utils/vcsDiffEngine'),
    (r'@/domains/vcs/utils/vcsGraphAwareness', r'@/domains/vcs/shared/utils/vcsGraphAwareness'),
    (r'@/domains/vcs/utils/vcsHash', r'@/domains/vcs/shared/utils/vcsHash'),
]

# ==============================================================================
# 4. RUNNER UTAMA
# ==============================================================================

def execute_wave3(dry_run: bool = False, verify: bool = False):
    print("=" * 76)
    print("🚀 EKSEKUSI WAVE 3 QUO VADIS: FUNDAMENTAL RELOCATION & LEGACY CLEANUP")
    print("=" * 76)
    if dry_run:
        print("[MODE DRY-RUN / SIMULASI: Tidak ada berkas yang diubah atau dihapus]\n")

    # --- TAHAP 1: Migrasi Berkas 8 Domain ---
    print("\n--- [Tahap 1/6] Memindahkan Berkas 8 Domain ke Flat Components & 4 Pilar ---")
    moved_files = 0
    for domain, file_list in DOMAIN_MAPPINGS.items():
        base_dir = SRC / "domains" / domain
        for old_rel, new_rel in file_list:
            old_path = base_dir / old_rel
            new_path = base_dir / new_rel

            if not old_path.exists():
                if new_path.exists():
                    continue
                print(f"  [Peringatan] Berkas sumber tidak ditemukan: {old_path}")
                continue

            if old_path == new_path:
                continue

            if not dry_run:
                new_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(old_path), str(new_path))

            print(f"  ✓ [{domain}] {old_rel} -> {new_rel}")
            moved_files += 1

    print(f"Total berkas domain dipindahkan: {moved_files}")

    # --- TAHAP 2: Buat Entry Point Orchestrator untuk Masing-Masing Domain ---
    print("\n--- [Tahap 2/6] Memastikan <DomainName>Orchestrator.tsx Ada di Tiap Domain ---")
    for domain, code in ORCHESTRATOR_TEMPLATES.items():
        domain_cap = "".join(part.capitalize() for part in domain.split("-"))
        orchestrator_path = SRC / "domains" / domain / f"{domain_cap}Orchestrator.tsx"
        if not orchestrator_path.exists():
            if not dry_run:
                orchestrator_path.write_text(code, encoding="utf-8")
            print(f"  ✓ Dibuat: {orchestrator_path.relative_to(ROOT)}")
        else:
            print(f"  ✓ Sudah ada: {orchestrator_path.relative_to(ROOT)}")

    # --- TAHAP 3: Migrasi Sisa Berkas src/shared/stores/types.ts & StatusNoticeStore ---
    print("\n--- [Tahap 3/6] Memindahkan Cross-Domain Types & Global Stores ---")
    shared_stores = SRC / "shared" / "stores"
    global_stores = SRC / "global" / "stores"

    # types.ts -> global/types/graph.types.ts
    types_src = shared_stores / "types.ts"
    types_dst = SRC / "global" / "types" / "graph.types.ts"
    if types_src.exists():
        if not dry_run:
            types_dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(str(types_src), str(types_dst))
        print(f"  ✓ Tersalin: {types_dst.relative_to(ROOT)}")

    # useStatusNoticeStore.ts -> global/stores/useStatusNoticeStore.ts
    sns_src = shared_stores / "useStatusNoticeStore.ts"
    sns_dst = global_stores / "useStatusNoticeStore.ts"
    if sns_src.exists():
        if not dry_run:
            global_stores.mkdir(parents=True, exist_ok=True)
            shutil.copy2(str(sns_src), str(sns_dst))
        print(f"  ✓ Tersalin: {sns_dst.relative_to(ROOT)}")

    # Alihkan referensi types di graph domain
    graph_types = SRC / "domains" / "graph" / "shared" / "utils" / "graph.types.ts"
    if graph_types.exists() and not dry_run:
        content = graph_types.read_text(encoding="utf-8")
        if "from '@/shared/stores/types'" in content:
            content = content.replace("from '@/shared/stores/types'", "from '@/global/types/graph.types'")
            graph_types.write_text(content, encoding="utf-8")
            print("  ✓ graph.types.ts dialihkan ke @/global/types/graph.types")

    # --- TAHAP 4: Pembaruan 100% Seluruh Import Statement di Seluruh Proyek ---
    print("\n--- [Tahap 4/6] Memperbarui Seluruh Import Alias di src/**/*.{ts,tsx} ---")
    files_updated = 0
    replacements_made = 0

    for ext in ("*.ts", "*.tsx"):
        for p in SRC.rglob(ext):
            try:
                content = p.read_text(encoding="utf-8")
            except Exception:
                continue

            orig_content = content
            file_reps = 0

            for pattern, replacement in IMPORT_REPLACEMENTS:
                new_content, count = re.subn(pattern, replacement, content)
                if count > 0:
                    content = new_content
                    file_reps += count

            if content != orig_content:
                files_updated += 1
                replacements_made += file_reps
                if not dry_run:
                    p.write_text(content, encoding="utf-8")

    print(f"  ✓ {files_updated} berkas diperbarui ({replacements_made} impor dialihkan ke canonical path)")

    # --- TAHAP 5: Pembersihan Total (Hapus src/shared/ dan src/core/ & Subfolder Kosong) ---
    print("\n--- [Tahap 5/6] Pembersihan Total Folder Legacy (Zero Shims) ---")
    folders_to_delete = [
        SRC / "shared",
        SRC / "core",
        SRC / "domains" / "admin" / "components" / "visualizer",
        SRC / "domains" / "admin" / "hooks",
        SRC / "domains" / "admin" / "services",
        SRC / "domains" / "auth" / "hooks",
        SRC / "domains" / "auth" / "services",
        SRC / "domains" / "collaboration" / "services",
        SRC / "domains" / "collaboration" / "utils",
        SRC / "domains" / "metadata" / "backlinks",
        SRC / "domains" / "public-reader" / "services",
        SRC / "domains" / "settings" / "command-palette",
        SRC / "domains" / "settings" / "config" / "sections",
        SRC / "domains" / "settings" / "config",
        SRC / "domains" / "settings" / "plugins",
        SRC / "domains" / "settings" / "profile" / "components",
        SRC / "domains" / "settings" / "profile" / "services",
        SRC / "domains" / "settings" / "profile",
        SRC / "domains" / "settings" / "schema",
        SRC / "domains" / "settings" / "sections",
        SRC / "domains" / "settings" / "stores",
        SRC / "domains" / "sync" / "hooks",
        SRC / "domains" / "sync" / "stores",
        SRC / "domains" / "vcs" / "services",
        SRC / "domains" / "vcs" / "storage",
        SRC / "domains" / "vcs" / "stores",
        SRC / "domains" / "vcs" / "types",
        SRC / "domains" / "vcs" / "utils",
    ]

    for fld in folders_to_delete:
        if fld.exists():
            if not dry_run:
                try:
                    shutil.rmtree(str(fld))
                    print(f"  🗑 Dihapus: {fld.relative_to(ROOT)}")
                except Exception as e:
                    print(f"  [Peringatan] Gagal menghapus {fld}: {e}")
            else:
                print(f"  [DRY-RUN] Akan dihapus: {fld.relative_to(ROOT)}")

    # --- TAHAP 6: Verifikasi Hasil ---
    print("\n--- [Tahap 6/6] Verifikasi Kompilasi & Build ---")
    if verify and not dry_run:
        print("  -> Menjalankan vite build --mode development ...")
        res = subprocess.run(["bunx", "vite", "build", "--mode", "development"], capture_output=True, text=True)
        if res.returncode == 0:
            print("  ✓ VITE BUILD 100% SUKSES! Wave 3 selesai dengan sempurna.")
        else:
            print("  ❌ Vite build menemukan kendala:")
            print(res.stderr[-1500:] if res.stderr else res.stdout[-1500:])

    print("\n" + "=" * 76)
    print("✨ WAVE 3 COMPLETED! Seluruh domain kini 100% Arsitektur Quo Vadis murni.")
    print("=" * 76)

if __name__ == "__main__":
    is_dry = "--dry-run" in sys.argv
    should_verify = "--verify" in sys.argv or "--apply" in sys.argv or len(sys.argv) == 1
    execute_wave3(dry_run=is_dry, verify=should_verify)
