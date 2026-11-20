import React, { useState } from "react";
import { Check, ChevronDown, Compass, PenTool, ShieldAlert, User } from "lucide-react";
import { cn } from "@/global/utils";
import { Button } from "@/global/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/global/ui/popover";
import type { PillarId, SettingsHubSectionId, SimulatedRole } from "../types";
import { PrototypeNavUtilities } from "./PrototypeNavUtilities";

interface PrototypeNavigationShellProps {
  activePillar: PillarId;
  isAppSettingsFullPageOpen: boolean;
  onSelectPillar: (pillar: PillarId) => void;
  role: SimulatedRole;
  onChangeRole: (role: SimulatedRole) => void;
  editorMode: "live" | "sandbox";
  onChangeEditorMode: (mode: "live" | "sandbox") => void;
  isAuthenticatedSim: boolean;
  onToggleAuthSim: () => void;
  onFocusSearch: () => void;
  onOpenSettingsHub: (section?: SettingsHubSectionId) => void;
  children: React.ReactNode;
}

const PILLAR_ITEMS: {
  id: PillarId;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "explore", label: "Explore", desc: "Temukan atlas & preset", icon: Compass },
  { id: "profile", label: "Profile", desc: "Identitas, Academy & vault", icon: User },
  { id: "editor", label: "Editor", desc: "Workspace & graf aktif", icon: PenTool },
];

export const PrototypeNavigationShell: React.FC<PrototypeNavigationShellProps> = ({
  activePillar,
  isAppSettingsFullPageOpen,
  onSelectPillar,
  role,
  onChangeRole,
  editorMode,
  onChangeEditorMode,
  isAuthenticatedSim,
  onToggleAuthSim,
  onFocusSearch,
  onOpenSettingsHub,
  children,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isEditor = activePillar === "editor";
  const activeMeta = PILLAR_ITEMS.find((p) => p.id === activePillar) ?? PILLAR_ITEMS[0];
  const ActiveIcon = activeMeta.icon;

  return (
    <div
      className={cn(
        "flex flex-col bg-background text-foreground",
        isEditor ? "h-[100dvh] overflow-hidden" : "min-h-screen"
      )}
    >
      {/* Instagram-Style 3-Zone Header: Left = Page Navigation, Center = Brand Sidra, Right = Profile Button */}
      <header className="sticky top-0 z-40 h-12 shrink-0 border-b border-border/80 bg-surface/95 backdrop-blur-md px-3 md:px-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* Left Zone: Desktop Segmented Pills / Mobile Compact Dropdown */}
        <div className="flex items-center justify-start min-w-0">
          <nav
            aria-label="Navigasi 3 Pilar"
            className="hidden md:inline-flex items-center gap-1 rounded-full bg-elevated/90 border border-border/80 p-0.5"
          >
            {PILLAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePillar === item.id && !isAppSettingsFullPageOpen;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectPillar(item.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1 vk-text-xs font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="md:hidden">
            <Popover open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 rounded-full gap-1.5 vk-text-xs bg-elevated/80 border-border/80"
                  aria-label="Pilih Halaman Aktif"
                >
                  <ActiveIcon className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">{activeMeta.label}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56 p-1.5 space-y-0.5">
                {PILLAR_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePillar === item.id && !isAppSettingsFullPageOpen;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectPillar(item.id);
                        setMobileNavOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-2 transition-colors",
                        isActive ? "bg-primary/12 text-primary" : "hover:bg-elevated text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="h-4 w-4 shrink-0" />
                        <div className="min-w-0">
                          <p className="vk-text-xs font-semibold leading-tight">{item.label}</p>
                          <p className="vk-text-2xs text-muted-foreground truncate">{item.desc}</p>
                        </div>
                      </div>
                      {isActive && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Center Zone: Clean Iconic Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectPillar("explore")}
          className="justify-self-center inline-flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-elevated/60 transition-colors"
        >
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="vk-text-sm font-bold tracking-tight text-foreground">Sidra</span>
        </button>

        {/* Right Zone: Single Profile Button & User Menu Popover */}
        <PrototypeNavUtilities
          activePillar={activePillar}
          onSelectPillar={onSelectPillar}
          role={role}
          onChangeRole={onChangeRole}
          editorMode={editorMode}
          onChangeEditorMode={onChangeEditorMode}
          isAuthenticatedSim={isAuthenticatedSim}
          onToggleAuthSim={onToggleAuthSim}
          onFocusSearch={onFocusSearch}
          onOpenSettingsHub={onOpenSettingsHub}
        />
      </header>

      {role === "stage2_pending" && (
        <div className="h-8 shrink-0 border-b border-warning/30 bg-warning/10 px-4 flex items-center justify-center gap-3 vk-text-xs">
          <span className="inline-flex items-center gap-1.5 text-warning truncate">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            <span>
              <strong>Beta Pending:</strong> Local Vault aktif · Publish menunggu approval Admin
            </span>
          </span>
          <Button variant="ghost" size="sm" className="h-6 px-2 vk-text-2xs shrink-0" onClick={() => onChangeRole("owner")}>
            Simulasi Approved
          </Button>
        </div>
      )}

      <main className={cn("flex-1 min-h-0 flex flex-col", isEditor ? "overflow-hidden" : "pb-20 md:pb-8")}>
        {children}
      </main>

      {!isEditor && !isAppSettingsFullPageOpen && (
        <nav
          aria-label="Navigasi Mobile"
          className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 border-t border-border bg-surface/95 backdrop-blur-md grid grid-cols-3"
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
                  "flex flex-col items-center justify-center gap-0.5 vk-text-2xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
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
