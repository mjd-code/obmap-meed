import React from "react";
import {
  ArrowRight,
  GitCommitHorizontal,
  Globe,
  GraduationCap,
  Layers,
  LayoutGrid,
  Network,
  PenTool,
  Share2,
  Table2,
  Workflow,
} from "lucide-react";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/global/ui/popover";
import { Separator } from "@/global/ui/separator";
import { Switch } from "@/global/ui/switch";
import type {
  HelicopterViewKind,
  PresentationLens,
  PublishVisibility,
  ReorganizeBy,
  SettingsHubSectionId,
} from "../types";
import type { PublishVaultRecord } from "../usePublishManagerState";

export interface SubFunctionBindings {
  selectedVault: PublishVaultRecord;
  activeNodeTitle: string;
  helicopterView: HelicopterViewKind;
  reorganizeBy: ReorganizeBy;
  onToggleVaultPublish: (vaultId: string) => void;
  onUpdateVaultConfig: (
    vaultId: string,
    patch: Partial<Pick<PublishVaultRecord, "lens" | "visibility">>
  ) => void;
  onCreateQuickSnapshot: (label: string) => void;
  onOpenHelicopterView: (view: HelicopterViewKind | "academy") => void;
  onChangeReorganizeBy: (by: ReorganizeBy) => void;
  onOpenSettingsHub: (section: SettingsHubSectionId, targetNodeTitle?: string) => void;
  onReturnToNoteEditor?: () => void;
}

const LENS_CHOICES: PresentationLens[] = ["atlas", "publication", "course", "template"];
const VISIBILITY_CHOICES: { id: PublishVisibility; label: string }[] = [
  { id: "public_listed", label: "Public Listed" },
  { id: "public_unlisted", label: "Unlisted" },
  { id: "shared", label: "Shared Tim" },
  { id: "private", label: "Private" },
];

const VIEW_CHOICES: {
  id: HelicopterViewKind | "academy";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "graph", label: "Graph", icon: Network },
  { id: "diagram", label: "Diagram", icon: Workflow },
  { id: "table", label: "Table", icon: Table2 },
  { id: "cards", label: "Cards", icon: LayoutGrid },
  { id: "academy", label: "Academy Tree", icon: GraduationCap },
];

const GROUP_OPTIONS: { id: ReorganizeBy; label: string }[] = [
  { id: "hierarchy", label: "Hierarchy" },
  { id: "properties", label: "Properties" },
  { id: "tags", label: "Tags" },
  { id: "backlinks", label: "Backlinks" },
  { id: "keywords", label: "Keywords" },
];

export const QuickSharePopover: React.FC<{ bindings: SubFunctionBindings; compact?: boolean }> = ({
  bindings,
  compact = false,
}) => {
  const v = bindings.selectedVault;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={compact ? "icon-sm" : "sm"}
          className={cn("h-7 text-muted-foreground hover:text-primary", !compact && "px-2 gap-1 vk-text-2xs")}
          title="Quick Share & Publish"
          aria-label="Quick Share & Publish"
        >
          <Share2 className="h-3.5 w-3.5" />
          {!compact && <span className="hidden xl:inline">Share</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="vk-text-xs font-semibold truncate">{bindings.activeNodeTitle}</p>
            <p className="vk-text-2xs text-muted-foreground truncate">Vault: {v.title}</p>
          </div>
          <Badge variant={v.isPublished ? "success" : "secondary"} className="vk-text-2xs shrink-0">
            {v.isPublished ? "Published" : "Private"}
          </Badge>
        </div>

        <label className="flex items-center justify-between rounded-lg border border-border/70 bg-surface px-2.5 py-1.5 cursor-pointer">
          <span className="vk-text-xs inline-flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-primary" /> Publish ke /@username
          </span>
          <Switch checked={v.isPublished} onCheckedChange={() => bindings.onToggleVaultPublish(v.id)} />
        </label>

        <div className="space-y-1.5">
          <span className="vk-text-2xs font-medium text-muted-foreground">AS Presentation Lens</span>
          <div className="grid grid-cols-2 gap-1">
            {LENS_CHOICES.map((lens) => (
              <button
                key={lens}
                type="button"
                onClick={() => bindings.onUpdateVaultConfig(v.id, { lens })}
                className={cn(
                  "py-1 px-2 rounded-md border vk-text-2xs capitalize font-medium",
                  v.lens === lens ? "bg-primary/15 text-primary border-primary/40" : "bg-surface text-muted-foreground border-border"
                )}
              >
                {lens}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="vk-text-2xs font-medium text-muted-foreground">WITH Visibility</span>
          <div className="grid grid-cols-2 gap-1">
            {VISIBILITY_CHOICES.map((vis) => (
              <button
                key={vis.id}
                type="button"
                onClick={() => bindings.onUpdateVaultConfig(v.id, { visibility: vis.id })}
                className={cn(
                  "py-1 px-2 rounded-md border vk-text-2xs font-medium",
                  v.visibility === vis.id ? "bg-info/15 text-info border-info/40" : "bg-surface text-muted-foreground border-border"
                )}
              >
                {vis.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full h-7 vk-text-2xs gap-1.5"
          onClick={() => bindings.onCreateQuickSnapshot(`quick-${bindings.activeNodeTitle.replace(/\.md$/i, "")}`)}
        >
          <GitCommitHorizontal className="h-3.5 w-3.5" /> Buat Snapshot Cepat
        </Button>

        <Separator />

        <button
          type="button"
          onClick={() => bindings.onOpenSettingsHub("share_access_vcs", bindings.activeNodeTitle)}
          className="w-full flex items-center justify-between vk-text-2xs font-semibold text-primary hover:underline"
        >
          <span>Kelola Lengkap di Settings Hub</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </PopoverContent>
    </Popover>
  );
};

export const QuickLensViewPopover: React.FC<{ bindings: SubFunctionBindings; compact?: boolean }> = ({
  bindings,
  compact = false,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={compact ? "icon-sm" : "sm"}
          className={cn("h-7 text-muted-foreground hover:text-primary", !compact && "px-2 gap-1 vk-text-2xs")}
          title="Quick View Lens"
          aria-label="Quick View Lens"
        >
          <Layers className="h-3.5 w-3.5" />
          {!compact && <span className="hidden xl:inline">Lens</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3 space-y-3">
        <p className="vk-text-xs font-semibold">Switch View Lens</p>
        <div className="grid grid-cols-2 gap-1.5">
          {bindings.onReturnToNoteEditor && (
            <button
              type="button"
              onClick={bindings.onReturnToNoteEditor}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface hover:border-primary/45 px-2.5 py-1.5 vk-text-2xs font-medium"
            >
              <PenTool className="h-3.5 w-3.5 text-primary" /> Editor (.md)
            </button>
          )}
          {VIEW_CHOICES.map((c) => {
            const Icon = c.icon;
            const active = bindings.helicopterView === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => bindings.onOpenHelicopterView(c.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 vk-text-2xs font-medium",
                  active ? "border-primary bg-primary/12 text-primary" : "border-border bg-surface hover:border-primary/40"
                )}
              >
                <Icon className="h-3.5 w-3.5" /> {c.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5">
          <span className="vk-text-2xs font-medium text-muted-foreground">Group / Reorganize By</span>
          <div className="flex flex-wrap gap-1">
            {GROUP_OPTIONS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => bindings.onChangeReorganizeBy(g.id)}
                className={cn(
                  "px-2 py-0.5 rounded-full border vk-text-2xs",
                  bindings.reorganizeBy === g.id ? "bg-info/15 text-info border-info/40 font-medium" : "bg-surface text-muted-foreground border-border"
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <button
          type="button"
          onClick={() => bindings.onOpenSettingsHub("vault_lenses")}
          className="w-full flex items-center justify-between vk-text-2xs font-semibold text-primary hover:underline"
        >
          <span>Atur Default Lensa di Vault Management</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </PopoverContent>
    </Popover>
  );
};
