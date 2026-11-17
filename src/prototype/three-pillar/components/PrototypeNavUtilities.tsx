import React from "react";
import { Bell, Search } from "lucide-react";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/global/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/global/ui/tooltip";
import { PROTOTYPE_NOTIFICATIONS } from "../mockData";
import type { SimulatedRole } from "../types";

interface PrototypeNavUtilitiesProps {
  role: SimulatedRole;
  onChangeRole: (role: SimulatedRole) => void;
  onFocusSearch: () => void;
}

const ROLE_OPTIONS: { id: SimulatedRole; label: string }[] = [
  { id: "visitor", label: "Visitor" },
  { id: "owner", label: "Owner" },
  { id: "stage2_pending", label: "Pending" },
];

export const PrototypeNavUtilities: React.FC<PrototypeNavUtilitiesProps> = ({
  role,
  onChangeRole,
  onFocusSearch,
}) => {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" onClick={onFocusSearch} aria-label="Cari">
            <Search className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Cari di Explore</TooltipContent>
      </Tooltip>

      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="relative" aria-label="Notifikasi">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Notifikasi</TooltipContent>
        </Tooltip>
        <PopoverContent align="end" className="w-72 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="vk-text-xs font-semibold">Aktivitas</span>
            <Badge variant="secondary" className="vk-text-2xs">3 baru</Badge>
          </div>
          <div className="space-y-2">
            {PROTOTYPE_NOTIFICATIONS.map((n) => (
              <div key={n.id} className="rounded-lg bg-elevated/70 px-2.5 py-2 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="vk-text-xs font-medium truncate">{n.title}</span>
                  <span className="vk-text-2xs text-muted-foreground shrink-0">{n.timeAgo}</span>
                </div>
                <p className="vk-text-2xs text-muted-foreground line-clamp-2">{n.detail}</p>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div
        className="flex items-center rounded-full border border-border bg-elevated/90 p-0.5 ml-1"
        role="group"
        aria-label="Simulasi Role"
      >
        {ROLE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChangeRole(opt.id)}
            className={cn(
              "px-2.5 py-0.5 rounded-full vk-text-2xs font-medium transition-colors whitespace-nowrap",
              role === opt.id
                ? opt.id === "stage2_pending"
                  ? "bg-warning/20 text-warning"
                  : opt.id === "visitor"
                    ? "bg-info/20 text-info"
                    : "bg-success/20 text-success"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};
