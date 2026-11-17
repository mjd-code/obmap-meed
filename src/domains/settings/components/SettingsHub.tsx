/**
 * Unified Settings Hub — Clean Content View Controlled by Workspace Right Sidebar.
 */

import { ScrollArea } from "@/global/ui/scroll-area";
import { Button } from "@/global/ui/button";
import { EditorSettingsContent } from "@/domains/editor/components/EditorSettingsPanel";
import { FeatureTogglesPanel } from "@/domains/settings/components/SettingsFeatureTogglesPanel";
import { SyncPanel } from "@/domains/settings/components/SettingsSyncPanel";
import { SchemaSettings } from "@/domains/settings/components/SettingsSchemaSection";
import { AccountSettings } from "@/domains/settings/components/SettingsAccountSection";
import { VaultSettings } from "@/domains/settings/components/SettingsVaultSection";
import { ConfigurationSettings } from "@/domains/settings/components/SettingsConfigurationSection";
import { SettingsAppearanceSection } from "@/domains/settings/components/SettingsAppearanceSection";
import { GraphEngineSettings } from "@/domains/settings/components/SettingsGraphEngineSection";
import {
  SETTINGS_SECTIONS,
  type SettingsSectionId,
} from "@/domains/settings/shared/utils/settingsNavigation";
import { useUIStore } from "@/domains/workspace/shared/stores/useUIStore";
import { PanelRight } from "lucide-react";

export interface SettingsHubProps {
  active?: SettingsSectionId;
  onSectionChange?: (section: SettingsSectionId) => void;
}

export function SettingsHub({
  active = "account",
}: SettingsHubProps) {
  const rightSidebarOpen = useUIStore((s) => s.rightSidebarOpen);
  const toggleRightSidebar = useUIStore((s) => s.toggleRightSidebar);

  const resolvedActive = active === "roles" ? "account" : active;

  const section =
    SETTINGS_SECTIONS.find((s) => s.id === resolvedActive) ?? SETTINGS_SECTIONS[0];
  const ActiveIcon = section.icon;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Header Dinamis Ringkas */}
      <header className="flex flex-shrink-0 items-center gap-3 border-b border-border px-4 py-3 sm:px-6 bg-card/40 backdrop-blur-xs">
        <ActiveIcon className="h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate vk-text-base font-semibold text-foreground">
            {section.label}
          </h1>
          <p className="mt-0.5 line-clamp-1 vk-text-xs text-muted-foreground">
            {section.description}
          </p>
        </div>
        <Button
          type="button"
          variant={rightSidebarOpen ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={toggleRightSidebar}
          aria-label="Toggle Settings Categories Sidebar"
          title="Toggle Settings Sidebar"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <PanelRight className="h-4 w-4" />
        </Button>
      </header>

      {/* Full-Width Section Content (navigasi dikelola oleh Right Sidebar) */}
      <div className="flex min-h-0 flex-1 flex-col min-w-0">
        {resolvedActive === "editor" ? (
          <EditorSettingsContent />
        ) : (
          <ScrollArea className="flex-1 min-h-0">
            <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 pb-28 md:pb-10">
              {(resolvedActive === "account" || active === "roles") && (
                <AccountSettings
                  initialTab={active === "roles" ? "roles" : "profile"}
                />
              )}
              {resolvedActive === "appearance" && <SettingsAppearanceSection />}
              {resolvedActive === "vaults" && <VaultSettings />}
              {resolvedActive === "system" && <SyncPanel />}
              {resolvedActive === "features" && <FeatureTogglesPanel />}
              {resolvedActive === "graph-engine" && <GraphEngineSettings />}
              {resolvedActive === "schema" && <SchemaSettings />}
              {resolvedActive === "configuration" && <ConfigurationSettings />}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
