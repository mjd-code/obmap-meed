import React, { useState } from "react";
import {
  Bell,
  ChevronDown,
  LogIn,
  LogOut,
  Search,
  Settings2,
} from "lucide-react";
import { cn } from "@/global/utils";
import { Avatar, AvatarFallback } from "@/global/ui/avatar";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/global/ui/popover";
import { Separator } from "@/global/ui/separator";
import { PROTOTYPE_NOTIFICATIONS, PROTOTYPE_SCHOLAR_PROFILE } from "../mockData";
import type { PillarId, SettingsHubSectionId, SimulatedRole } from "../types";

interface PrototypeNavUtilitiesProps {
  activePillar: PillarId;
  onSelectPillar: (pillar: PillarId) => void;
  role: SimulatedRole;
  onChangeRole: (role: SimulatedRole) => void;
  editorMode: "live" | "sandbox";
  onChangeEditorMode: (mode: "live" | "sandbox") => void;
  isAuthenticatedSim: boolean;
  onToggleAuthSim: () => void;
  onFocusSearch: () => void;
  onOpenSettingsHub: (section?: SettingsHubSectionId) => void;
}

const ROLE_OPTIONS: { id: SimulatedRole; label: string }[] = [
  { id: "visitor", label: "Visitor" },
  { id: "owner", label: "Owner" },
  { id: "stage2_pending", label: "Pending" },
];

export const PrototypeNavUtilities: React.FC<PrototypeNavUtilitiesProps> = ({
  activePillar,
  onSelectPillar,
  role,
  onChangeRole,
  editorMode,
  onChangeEditorMode,
  isAuthenticatedSim,
  onToggleAuthSim,
  onFocusSearch,
  onOpenSettingsHub,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const scholar = PROTOTYPE_SCHOLAR_PROFILE;
  const isEditorScope = activePillar === "editor";

  return (
    <div className="flex items-center justify-end">
      <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-1.5 sm:px-2.5 rounded-full border border-border/70 bg-elevated/75 hover:bg-elevated gap-1.5"
            aria-label="Menu Profil Pengguna"
          >
            <Avatar className="h-6 w-6 border border-primary/40">
              <AvatarFallback className="bg-primary/15 text-primary vk-text-2xs font-bold">
                {scholar.initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline vk-text-xs font-medium text-foreground max-w-[140px] truncate">
              {isAuthenticatedSim ? scholar.handle : "Mode Tamu"}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-72 p-3 space-y-3">
          {/* Identity Summary Header */}
          <div className="flex items-center gap-2.5">
            <Avatar className="h-9 w-9 border border-primary/40 shrink-0">
              <AvatarFallback className="bg-primary/15 text-primary vk-text-xs font-bold">
                {scholar.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="vk-text-xs font-semibold truncate">{isAuthenticatedSim ? scholar.name : "Tamu Lokal"}</p>
              <p className="vk-text-2xs font-mono text-primary truncate">{isAuthenticatedSim ? scholar.handle : "Offline Storage"}</p>
            </div>
            <Badge variant={role === "owner" ? "success" : role === "visitor" ? "info" : "warning"} className="vk-text-2xs shrink-0 capitalize">
              {role === "stage2_pending" ? "Pending" : role}
            </Badge>
          </div>

          <Separator />

          {/* Primary Single Settings Hub Trigger */}
          <button
            type="button"
            onClick={() => {
              onOpenSettingsHub(isEditorScope ? "vault_lenses" : "account_app");
              setUserMenuOpen(false);
            }}
            className="w-full rounded-xl px-3 py-2 flex items-center justify-between bg-primary/12 hover:bg-primary/20 text-primary transition-colors"
          >
            <span className="inline-flex items-center gap-2 vk-text-xs font-semibold">
              <Settings2 className="h-4 w-4" /> Settings Hub
            </span>
            <Badge variant="info" className="vk-text-2xs">
              {isEditorScope ? "Workspace Tab" : "Full Page"}
            </Badge>
          </button>

          {/* Compact Role & Editor Mode Simulation */}
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="vk-text-2xs font-medium text-muted-foreground">Simulasi Role RBAC</p>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-elevated p-0.5 border border-border/60">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeRole(opt.id)}
                    className={cn(
                      "py-1 rounded-md vk-text-2xs font-medium transition-colors",
                      role === opt.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {role !== "visitor" && (
              <div className="space-y-1">
                <p className="vk-text-2xs font-medium text-muted-foreground">Mode Editor</p>
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-elevated p-0.5 border border-border/60">
                  {(["live", "sandbox"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        onChangeEditorMode(m);
                        onSelectPillar("editor");
                      }}
                      className={cn(
                        "py-1 rounded-md vk-text-2xs font-medium transition-colors",
                        editorMode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {m === "live" ? "Live App" : "Sandbox"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Utilities + Sign In / Log Out */}
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="flex-1 h-8 vk-text-2xs gap-1" onClick={() => { onFocusSearch(); setUserMenuOpen(false); }}>
              <Search className="h-3.5 w-3.5" /> Cari
            </Button>
            <Button variant={showNotifs ? "secondary" : "outline"} size="sm" className="flex-1 h-8 vk-text-2xs gap-1" onClick={() => setShowNotifs((s) => !s)}>
              <Bell className="h-3.5 w-3.5" /> Notif (3)
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2.5 vk-text-2xs gap-1 text-muted-foreground hover:text-foreground" onClick={onToggleAuthSim}>
              {isAuthenticatedSim ? <LogOut className="h-3.5 w-3.5" /> : <LogIn className="h-3.5 w-3.5" />}
              <span>{isAuthenticatedSim ? "Keluar" : "Masuk"}</span>
            </Button>
          </div>

          {showNotifs && (
            <div className="space-y-1.5 pt-1">
              {PROTOTYPE_NOTIFICATIONS.map((n) => (
                <div key={n.id} className="rounded-lg bg-elevated/70 px-2.5 py-2 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="vk-text-2xs font-medium truncate">{n.title}</span>
                    <span className="vk-text-2xs text-muted-foreground shrink-0">{n.timeAgo}</span>
                  </div>
                  <p className="vk-text-2xs text-muted-foreground line-clamp-1">{n.detail}</p>
                </div>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
