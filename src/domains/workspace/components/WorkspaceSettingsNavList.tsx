import { cn } from "@/global/utils";
import { Button } from "@/global/ui/button";
import { Input } from "@/global/ui/input";
import { ScrollArea } from "@/global/ui/scroll-area";
import { Search, X } from "lucide-react";
import {
  SETTINGS_GROUPS,
  SETTINGS_SECTIONS,
  type SettingsSectionConfig,
  type SettingsSectionId,
} from "@/domains/settings/shared/utils/settingsNavigation";

interface WorkspaceSettingsNavListProps {
  settingsSearch: string;
  onSettingsSearchChange: (value: string) => void;
  activeSettingsSection: SettingsSectionId;
  filteredSections: SettingsSectionConfig[] | null;
  onSelectSection: (section: SettingsSectionId, label: string) => void;
}

/** Declarative navigation list and search filter for workspace settings sidebar tool. */
export function WorkspaceSettingsNavList({
  settingsSearch,
  onSettingsSearchChange,
  activeSettingsSection,
  filteredSections,
  onSelectSection,
}: WorkspaceSettingsNavListProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Search Box Pengaturan */}
      <div className="p-2 border-b border-sidebar-border shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={settingsSearch}
            onChange={(e) => onSettingsSearchChange(e.target.value)}
            placeholder="Cari pengaturan..."
            className="h-8 pl-8 pr-7 text-xs bg-sidebar-accent/40 border-sidebar-border focus-visible:ring-1"
          />
          {settingsSearch && (
            <button
              type="button"
              onClick={() => onSettingsSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-sm"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* List Menu Pengaturan */}
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-4" aria-label="Settings navigation">
          {filteredSections ? (
            <div className="space-y-1">
              <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Hasil Pencarian ({filteredSections.length})
              </p>
              {filteredSections.length === 0 ? (
                <p className="px-2 py-4 text-xs text-muted-foreground text-center">
                  Tidak ada pengaturan yang cocok.
                </p>
              ) : (
                filteredSections.map((section) => {
                  const isActive = activeSettingsSection === section.id;
                  const Icon = section.icon;
                  return (
                    <Button
                      key={section.id}
                      type="button"
                      variant="ghost"
                      onClick={() => onSelectSection(section.id, section.label)}
                      className={cn(
                        "h-8 w-full justify-start gap-2.5 px-2 text-xs font-normal transition-colors rounded-md",
                        isActive
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <div className="min-w-0 flex-1 text-left flex items-center justify-between gap-1">
                        <span className="truncate">{section.label}</span>
                        <span className="text-[10px] text-muted-foreground/60 shrink-0">
                          {section.group}
                        </span>
                      </div>
                    </Button>
                  );
                })
              )}
            </div>
          ) : (
            SETTINGS_GROUPS.map((group) => {
              const sections = SETTINGS_SECTIONS.filter(
                (section) => section.group === group,
              );
              if (sections.length === 0) return null;

              return (
                <div key={group} className="space-y-1">
                  <h3 className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 select-none">
                    {group}
                  </h3>
                  <div className="space-y-0.5">
                    {sections.map((section) => {
                      const isActive = activeSettingsSection === section.id;
                      const Icon = section.icon;

                      return (
                        <Button
                          key={section.id}
                          type="button"
                          variant="ghost"
                          onClick={() => onSelectSection(section.id, section.label)}
                          className={cn(
                            "h-8 w-full justify-start gap-2.5 px-2 text-xs font-normal transition-colors rounded-md",
                            isActive
                              ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                              : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-3.5 w-3.5 shrink-0",
                              isActive ? "text-primary" : "text-muted-foreground",
                            )}
                          />
                          <span className="truncate">{section.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </nav>
      </ScrollArea>
    </div>
  );
}
