import React, { useState } from "react";
import {
  Bell,
  Check,
  ChevronDown,
  Compass,
  PenTool,
  Rocket,
  Search,
  Settings2,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/global/ui/popover";
import { Separator } from "@/global/ui/separator";
import { PROTOTYPE_NOTIFICATIONS } from "../mockData";
import type { PillarId, SimulatedRole } from "../types";

interface PrototypeNavUtilitiesProps {
  activePillar: PillarId;
  onSelectPillar: (pillar: PillarId) => void;
  role: SimulatedRole;
  onChangeRole: (role: SimulatedRole) => void;
  editorMode: "live" | "sandbox";
  onChangeEditorMode: (mode: "live" | "sandbox") => void;
  onFocusSearch: () => void;
  onOpenPublishTab: () => void;
  onOpenSettingsTab: () => void;
}

const PILLAR_META: Record<
  PillarId,
  { label: string; desc: string; icon: React.ComponentType<{ className?: string }> }
> = {
  explore: { label: "Explore", desc: "Temukan atlas & karya publik", icon: Compass },
  profile: { label: "Profile", desc: "Identitas, LMS & brankas", icon: User },
  editor: { label: "Editor", desc: "Workspace & graf aktif", icon: PenTool },
};

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
  onFocusSearch,
  onOpenPublishTab,
  onOpenSettingsTab,
}) => {
  const [pageMenuOpen, setPageMenuOpen] = useState(false);
  const [gearMenuOpen, setGearMenuOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  const ActiveIcon = PILLAR_META[activePillar].icon;

  return (
    <div className="flex items-center justify-end gap-1.5">
      {/* Simple Elegant Active Page Switcher (Mobile-only; hidden on tablet & laptop) */}
      <div className="md:hidden">
        <Popover open={pageMenuOpen} onOpenChange={setPageMenuOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 rounded-full gap-1.5 vk-text-xs bg-elevated/80 border-border/80"
              aria-label="Pilih halaman aktif"
            >
              <ActiveIcon className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">{PILLAR_META[activePillar].label}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-1.5 space-y-0.5">
            <p className="px-2 py-1 vk-text-2xs font-medium text-muted-foreground">
              Halaman Aktif · Pindah ke
            </p>
            {(["explore", "profile", "editor"] as PillarId[]).map((id) => {
              const meta = PILLAR_META[id];
              const Icon = meta.icon;
              const current = activePillar === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onSelectPillar(id);
                    setPageMenuOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-2 transition-colors",
                    current ? "bg-primary/12 text-primary" : "hover:bg-elevated text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="vk-text-xs font-semibold leading-tight">{meta.label}</p>
                      <p className="vk-text-2xs text-muted-foreground truncate">{meta.desc}</p>
                    </div>
                  </div>
                  {current && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </PopoverContent>
        </Popover>
      </div>

      {/* Consolidated Gear Menu Wrapping All Options */}
      <Popover open={gearMenuOpen} onOpenChange={setGearMenuOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative h-8 w-8 rounded-full border border-border/70 bg-elevated/70 hover:bg-elevated"
            aria-label="Opsi & Pengaturan"
          >
            <Settings2 className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-3 space-y-3">
          {/* Primary Tab Shortcuts */}
          <div className="space-y-1">
            <button type="button" onClick={() => { onOpenPublishTab(); setGearMenuOpen(false); }} className="w-full rounded-lg px-2.5 py-2 flex items-center justify-between bg-primary/12 hover:bg-primary/20 text-primary transition-colors">
              <span className="inline-flex items-center gap-2 vk-text-xs font-semibold"><Rocket className="h-4 w-4" /> Publish Studio</span>
              <Badge variant="info" className="vk-text-2xs">Tab</Badge>
            </button>
            <button type="button" onClick={() => { onOpenSettingsTab(); setGearMenuOpen(false); }} className="w-full rounded-lg px-2.5 py-2 flex items-center justify-between hover:bg-elevated text-foreground transition-colors">
              <span className="inline-flex items-center gap-2 vk-text-xs font-medium"><SlidersHorizontal className="h-4 w-4 text-muted-foreground" /> Settings Workspace</span>
              <Badge variant="outline" className="vk-text-2xs">Tab</Badge>
            </button>
          </div>

          <Separator />

          {/* Role Simulator */}
          <div className="space-y-1.5">
            <p className="vk-text-2xs font-medium text-muted-foreground">Simulasi Role RBAC</p>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-elevated p-0.5 border border-border/60">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeRole(opt.id)}
                  className={cn(
                    "py-1 rounded-md vk-text-2xs font-medium transition-colors",
                    role === opt.id ? (opt.id === "stage2_pending" ? "bg-warning/20 text-warning" : opt.id === "visitor" ? "bg-info/20 text-info" : "bg-success/20 text-success") : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Editor Mode (Owner / Pending) */}
          {role !== "visitor" && (
            <div className="space-y-1.5">
              <p className="vk-text-2xs font-medium text-muted-foreground">Mode Tampilan Editor</p>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-elevated p-0.5 border border-border/60">
                {(["live", "sandbox"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => { onChangeEditorMode(m); onSelectPillar("editor"); }} className={cn("py-1 rounded-md vk-text-2xs font-medium transition-colors", editorMode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                    {m === "live" ? "Live App" : "Sandbox"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Quick Search & Notifications */}
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="flex-1 h-8 vk-text-2xs gap-1.5" onClick={() => { onFocusSearch(); setGearMenuOpen(false); }}>
              <Search className="h-3.5 w-3.5" /> Cari
            </Button>
            <Button variant={showNotifs ? "secondary" : "outline"} size="sm" className="flex-1 h-8 vk-text-2xs gap-1.5" onClick={() => setShowNotifs((s) => !s)}>
              <Bell className="h-3.5 w-3.5" /> Notif (3)
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
