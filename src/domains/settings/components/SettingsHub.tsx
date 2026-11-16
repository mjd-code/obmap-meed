/**
 * Unified Settings Hub — Self-Contained 2-Column Settings Experience (UI-STEP-02, <= 200 lines).
 * Eliminates the stranded-tab bottleneck by embedding an internal category rail + search filter
 * synchronized with WorkspaceSettingsLeaf.
 */

import { useMemo, useRef, useState, useEffect } from "react";
import { ScrollArea } from "@/global/ui/scroll-area";
import { Input } from "@/global/ui/input";
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
  SETTINGS_GROUPS,
  SETTINGS_SECTIONS,
  type SettingsSectionId,
} from "@/domains/settings/shared/utils/settingsNavigation";
import { cn } from "@/global/utils";
import { Search, X } from "lucide-react";

export interface SettingsHubProps {
  active?: SettingsSectionId;
  onSectionChange?: (section: SettingsSectionId) => void;
}

export function SettingsHub({
  active = "account",
  onSectionChange,
}: SettingsHubProps) {
  const [localActive, setLocalActive] = useState<SettingsSectionId>(active);
  const [searchQuery, setSearchQuery] = useState("");
  const prevActiveRef = useRef<SettingsSectionId>(active);

  useEffect(() => {
    if (prevActiveRef.current !== active) {
      prevActiveRef.current = active;
      setLocalActive(active);
    }
  }, [active]);

  const effectiveActive = onSectionChange ? active : localActive;
  const resolvedActive = effectiveActive === "roles" ? "account" : effectiveActive;

  const section =
    SETTINGS_SECTIONS.find((s) => s.id === resolvedActive) ?? SETTINGS_SECTIONS[0];
  const ActiveIcon = section.icon;

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredSections = useMemo(() => {
    if (!normalizedQuery) return null;
    return SETTINGS_SECTIONS.filter(
      (s) =>
        s.label.toLowerCase().includes(normalizedQuery) ||
        s.description.toLowerCase().includes(normalizedQuery) ||
        s.group.toLowerCase().includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  const handleSelectSection = (nextSection: SettingsSectionId) => {
    setLocalActive(nextSection);
    onSectionChange?.(nextSection);
  };

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
      </header>

      {/* Mobile Compact Section Bar (< md) */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto border-b border-border px-3 py-2 bg-card/30 shrink-0 no-scrollbar">
        {SETTINGS_SECTIONS.map((item) => {
          const isSelected = resolvedActive === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectSection(item.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md vk-text-xs whitespace-nowrap transition-colors shrink-0",
                isSelected
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2-Column Body: Internal Category Rail + Content */}
      <div className="flex min-h-0 flex-1">
        <aside
          aria-label="Settings categories"
          className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-card/25 min-h-0"
        >
          <div className="p-2.5 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pengaturan..."
                aria-label="Cari pengaturan"
                className="h-8 pl-8 pr-7 vk-text-xs bg-background/70"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Bersihkan pencarian"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <nav className="p-2 space-y-4">
              {filteredSections ? (
                <div className="space-y-1">
                  <p className="px-2 vk-text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Hasil ({filteredSections.length})
                  </p>
                  {filteredSections.length === 0 ? (
                    <p className="px-2 py-4 vk-text-xs text-muted-foreground text-center">
                      Tidak ditemukan.
                    </p>
                  ) : (
                    filteredSections.map((item) => {
                      const isSelected = resolvedActive === item.id;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectSection(item.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md vk-text-xs text-left transition-colors",
                            isSelected
                              ? "bg-primary/15 text-primary font-medium"
                              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              ) : (
                SETTINGS_GROUPS.map((group) => {
                  const groupItems = SETTINGS_SECTIONS.filter((s) => s.group === group);
                  if (groupItems.length === 0) return null;
                  return (
                    <div key={group} className="space-y-1">
                      <h2 className="px-2.5 vk-text-2xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
                        {group}
                      </h2>
                      <div className="space-y-0.5">
                        {groupItems.map((item) => {
                          const isSelected = resolvedActive === item.id;
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectSection(item.id)}
                              className={cn(
                                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md vk-text-xs text-left transition-colors",
                                isSelected
                                  ? "bg-primary/15 text-primary font-medium"
                                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                              )}
                            >
                              <Icon className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </nav>
          </ScrollArea>
        </aside>

        <div className="flex min-h-0 flex-1 flex-col min-w-0">
          {resolvedActive === "editor" ? (
            <EditorSettingsContent />
          ) : (
            <ScrollArea className="flex-1 min-h-0">
              <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
                {(resolvedActive === "account" || effectiveActive === "roles") && (
                  <AccountSettings
                    initialTab={effectiveActive === "roles" ? "roles" : "profile"}
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
    </div>
  );
}
