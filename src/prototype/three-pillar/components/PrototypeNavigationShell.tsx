import React from "react";
import { Link } from "react-router-dom";
import { Compass, Network, PenTool, ShieldAlert, User } from "lucide-react";
import { cn } from "@/global/utils";
import { useBrandConfig } from "@/global/config/brand.config";
import { Button } from "@/global/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/global/ui/tooltip";
import type { PillarId, SimulatedRole } from "../types";
import { PrototypeNavUtilities } from "./PrototypeNavUtilities";

interface PrototypeNavigationShellProps {
  activePillar: PillarId;
  onSelectPillar: (pillar: PillarId) => void;
  role: SimulatedRole;
  onChangeRole: (role: SimulatedRole) => void;
  onFocusSearch: () => void;
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
  onFocusSearch,
  children,
}) => {
  const brand = useBrandConfig();
  const isEditor = activePillar === "editor";

  return (
    <div
      className={cn(
        "flex flex-col bg-background text-foreground",
        isEditor ? "h-[100dvh] overflow-hidden" : "min-h-screen"
      )}
    >
      {/* Symmetrical 3-Column Top Bar */}
      <header className="sticky top-0 z-40 h-12 shrink-0 border-b border-border/80 bg-surface/95 backdrop-blur-md px-4 md:px-6 grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center justify-start min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-elevated transition-colors"
                aria-label="Kembali ke beranda"
              >
                <div className="h-7 w-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                  <Network className="h-4 w-4" />
                </div>
                <span className="font-semibold vk-text-sm tracking-tight">{brand.name}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Beranda Utama (/)</TooltipContent>
          </Tooltip>
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

        <PrototypeNavUtilities role={role} onChangeRole={onChangeRole} onFocusSearch={onFocusSearch} />
      </header>

      {role === "stage2_pending" && (
        <div className="h-8 shrink-0 border-b border-warning/30 bg-warning/10 px-4 flex items-center justify-center gap-3 vk-text-xs">
          <span className="inline-flex items-center gap-1.5 text-warning truncate">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            <span>
              <strong>Beta Pending:</strong> Local Vault & Explore aktif penuh · Publish publik menunggu approval Admin
            </span>
          </span>
          <Button variant="ghost" size="sm" className="h-6 px-2 vk-text-2xs shrink-0" onClick={() => onChangeRole("owner")}>
            Simulasi Approved
          </Button>
        </div>
      )}

      <main
        className={cn(
          "flex-1 min-h-0 flex flex-col",
          isEditor ? "overflow-hidden pb-14 md:pb-0" : "pb-20 md:pb-8"
        )}
      >
        {children}
      </main>

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
    </div>
  );
};
