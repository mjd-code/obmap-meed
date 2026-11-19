import React from "react";
import { Check, ChevronDown, Cloud, Compass, FolderOpen, PenTool, Settings2, ShieldAlert, User } from "lucide-react";
import { cn } from "@/global/utils";
import { Button } from "@/global/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/global/ui/popover";
import { getVaultManager } from "@/domains/vault/shared/api/VaultManagerSingleton";
import { switchVaultAction } from "@/domains/workspace/shared/api/workspaceActions";
import { useVaultStore } from "@/global/stores";
import { PROTOTYPE_VAULTS } from "../mockData";
import type { PillarId, SimulatedRole } from "../types";
import { PrototypeNavUtilities } from "./PrototypeNavUtilities";

interface PrototypeNavigationShellProps {
  activePillar: PillarId;
  onSelectPillar: (pillar: PillarId) => void;
  role: SimulatedRole;
  onChangeRole: (role: SimulatedRole) => void;
  editorMode: "live" | "sandbox";
  onChangeEditorMode: (mode: "live" | "sandbox") => void;
  onFocusSearch: () => void;
  onOpenPublishTab: () => void;
  onOpenSettingsTab: () => void;
  children: React.ReactNode;
}

const PILLAR_ITEMS: { id: PillarId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "explore", label: "Explore", icon: Compass },
  { id: "profile", label: "Profile", icon: User },
  { id: "editor", label: "Editor", icon: PenTool },
];

export const PrototypeNavigationShell: React.FC<PrototypeNavigationShellProps> = ({
  activePillar,
  onSelectPillar,
  role,
  onChangeRole,
  editorMode,
  onChangeEditorMode,
  onFocusSearch,
  onOpenPublishTab,
  onOpenSettingsTab,
  children,
}) => {
  const isEditor = activePillar === "editor";
  const currentVaultId = useVaultStore((s) => s.currentVaultId);
  const vaultManager = getVaultManager();
  const realVaults = vaultManager.getAllVaults();
  const activeRealVault = currentVaultId ? vaultManager.getVault(currentVaultId) : null;

  const displayVaultName = activeRealVault?.name || PROTOTYPE_VAULTS[0].title;
  const isFolderVault = activeRealVault?.location === "folder";

  return (
    <div className={cn("flex flex-col bg-background text-foreground", isEditor ? "h-[100dvh] overflow-hidden" : "min-h-screen")}>
      {/* Unified Header: Left = Vault Switcher (No Brand Logo), Center = 3 Pillars (Desktop), Right = Page Pill + Gear */}
      <header className="sticky top-0 z-40 h-12 shrink-0 border-b border-border/80 bg-surface/95 backdrop-blur-md px-3 md:px-5 grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center justify-start min-w-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 rounded-full gap-1.5 bg-elevated/80 border border-border/70 hover:bg-elevated min-w-0 max-w-[190px]"
                aria-label="Pilih Vault Aktif"
              >
                {isFolderVault ? (
                  <FolderOpen className="h-3.5 w-3.5 text-warning shrink-0" />
                ) : (
                  <Cloud className="h-3.5 w-3.5 text-success shrink-0" />
                )}
                <span className="vk-text-xs font-medium truncate">{displayVaultName}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-1.5 space-y-1">
              <p className="px-2 py-1 vk-text-2xs font-medium text-muted-foreground">
                {realVaults.length > 0 ? "Vault Aktif Anda" : "Vault Tersedia"}
              </p>
              {realVaults.length > 0 ? (
                realVaults.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => switchVaultAction(v.id)}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 rounded-lg vk-text-xs flex items-center justify-between gap-2 transition-colors",
                      v.id === currentVaultId ? "bg-primary/12 text-primary font-medium" : "hover:bg-elevated"
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5 truncate">
                      {v.location === "folder" ? <FolderOpen className="h-3.5 w-3.5 text-warning shrink-0" /> : <Cloud className="h-3.5 w-3.5 text-success shrink-0" />}
                      <span className="truncate">{v.name}</span>
                    </span>
                    {v.id === currentVaultId && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                ))
              ) : (
                PROTOTYPE_VAULTS.slice(0, 4).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => onSelectPillar("editor")}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg vk-text-xs flex items-center justify-between hover:bg-elevated"
                  >
                    <span className="truncate">{v.title}</span>
                    <span className="vk-text-2xs text-muted-foreground">{v.notesCount}</span>
                  </button>
                ))
              )}
              <button
                type="button"
                onClick={onOpenSettingsTab}
                className="w-full text-left px-2.5 py-1.5 rounded-lg vk-text-2xs text-muted-foreground hover:text-foreground hover:bg-elevated flex items-center gap-1.5 border-t border-border/60 mt-1 pt-2"
              >
                <Settings2 className="h-3.5 w-3.5" /> Kelola Vault di Settings
              </button>
            </PopoverContent>
          </Popover>
        </div>

        <nav
          aria-label="Navigasi 3 Pilar"
          className="hidden md:flex items-center justify-self-center gap-1 rounded-full bg-elevated/90 border border-border/80 p-1"
        >
          {PILLAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePillar === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectPillar(item.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-1 vk-text-xs font-medium transition-all",
                  isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <PrototypeNavUtilities
          activePillar={activePillar}
          onSelectPillar={onSelectPillar}
          role={role}
          onChangeRole={onChangeRole}
          editorMode={editorMode}
          onChangeEditorMode={onChangeEditorMode}
          onFocusSearch={onFocusSearch}
          onOpenPublishTab={onOpenPublishTab}
          onOpenSettingsTab={onOpenSettingsTab}
        />
      </header>

      {role === "stage2_pending" && (
        <div className="h-8 shrink-0 border-b border-warning/30 bg-warning/10 px-4 flex items-center justify-center gap-3 vk-text-xs">
          <span className="inline-flex items-center gap-1.5 text-warning truncate">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            <span><strong>Beta Pending:</strong> Local Vault aktif · Publish menunggu approval Admin</span>
          </span>
          <Button variant="ghost" size="sm" className="h-6 px-2 vk-text-2xs shrink-0" onClick={() => onChangeRole("owner")}>
            Simulasi Approved
          </Button>
        </div>
      )}

      <main className={cn("flex-1 min-h-0 flex flex-col", isEditor ? "overflow-hidden" : "pb-20 md:pb-8")}>
        {children}
      </main>

      {/* Mobile Bottom Bar ONLY outside Editor (keeps Editor strictly double-header & distraction-free) */}
      {!isEditor && (
        <nav aria-label="Navigasi Mobile" className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 border-t border-border bg-surface/95 backdrop-blur-md grid grid-cols-3">
          {PILLAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePillar === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectPillar(item.id)}
                className={cn("flex flex-col items-center justify-center gap-0.5 vk-text-2xs font-medium transition-colors", isActive ? "text-primary" : "text-muted-foreground")}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};
