import React from "react";
import { AlertTriangle, BookOpen, Compass, Globe, GraduationCap, Lock, Rocket, ShieldCheck } from "lucide-react";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/global/ui/sheet";
import { Textarea } from "@/global/ui/textarea";
import { getVaultManager } from "@/domains/vault/shared/api/VaultManagerSingleton";
import { useWorkspaceStore } from "@/domains/workspace/shared/stores/useWorkspaceStore";
import { useNodeStore, useVaultStore } from "@/global/stores";
import { PROTOTYPE_VAULTS } from "../mockData";
import type { PresentationLens, PublishVisibility, SimulatedRole } from "../types";

interface EditorPublishStudioDrawerProps {
  open: boolean;
  onClose: () => void;
  role: SimulatedRole;
  editorMode: "live" | "sandbox";
  sandboxTitle: string;
  scope: "vault" | "note";
  onChangeScope: (scope: "vault" | "note") => void;
  lens: PresentationLens;
  onChangeLens: (lens: PresentationLens) => void;
  visibility: PublishVisibility;
  onChangeVisibility: (v: PublishVisibility) => void;
  caption: string;
  onChangeCaption: (c: string) => void;
  onSubmitPublish: (vaultTitle?: string, vaultSlug?: string) => void;
}

const LENS_OPTIONS: { id: PresentationLens; title: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "atlas", title: "PKM Atlas", icon: Compass },
  { id: "publication", title: "CMS Series", icon: BookOpen },
  { id: "course", title: "LMS Course", icon: GraduationCap },
];

const VISIBILITY_OPTIONS: { id: PublishVisibility; label: string }[] = [
  { id: "public_listed", label: "Public Listed" },
  { id: "public_unlisted", label: "Unlisted" },
  { id: "shared", label: "Shared Tim" },
  { id: "private", label: "Private" },
];

export const EditorPublishStudioDrawer: React.FC<EditorPublishStudioDrawerProps> = ({
  open,
  onClose,
  role,
  editorMode,
  sandboxTitle,
  scope,
  onChangeScope,
  lens,
  onChangeLens,
  visibility,
  onChangeVisibility,
  caption,
  onChangeCaption,
  onSubmitPublish,
}) => {
  const currentVaultId = useVaultStore((s) => s.currentVaultId);
  const nodes = useNodeStore((s) => s.nodes);
  const activeLeaf = useWorkspaceStore((s) => s.getActiveLeaf());
  const liveVault = currentVaultId ? getVaultManager().getVault(currentVaultId) : null;

  const fallbackVault = PROTOTYPE_VAULTS[0];
  const vaultName = editorMode === "live" && liveVault ? liveVault.name : fallbackVault.title;
  const vaultSlug = vaultName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "vault";
  const fileNodes = nodes.filter((n) => n.type === "file");
  const privateNodesCount = editorMode === "live" && liveVault
    ? fileNodes.filter((n) => /^---[\s\S]*?\bvisibility:\s*private\b[\s\S]*?---/m.test(n.content)).length
    : fallbackVault.privateNotesCount;
  const publicNotesCount = editorMode === "live" && liveVault
    ? Math.max(0, fileNodes.length - privateNodesCount)
    : Math.max(1, fallbackVault.notesCount - fallbackVault.privateNotesCount);
  const activeNoteTitle = editorMode === "live" ? activeLeaf?.view.title || "Catatan Aktif" : sandboxTitle;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-background">
        <SheetHeader className="pb-4 border-b border-border space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="info" className="vk-text-2xs">Publish Studio</Badge>
            <Badge variant="success" className="vk-text-2xs">CC BY-SA 4.0</Badge>
          </div>
          <SheetTitle className="vk-text-lg flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" /> Terbitkan Karya
          </SheetTitle>
          <SheetDescription className="vk-text-xs">
            Publikasikan dari workspace ke profil /@username tanpa mengubah berkas Markdown.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-4">
          {role === "stage2_pending" && (
            <div className="rounded-xl border border-warning/35 bg-warning/10 p-3 flex items-start gap-2 vk-text-xs text-warning">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Stage 2 Pending: publikasi Cloud aktif setelah disetujui Admin.</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="vk-text-xs font-semibold">1. Lingkup</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChangeScope("vault")}
                className={cn("rounded-xl border p-2.5 text-left vk-text-xs", scope === "vault" ? "border-primary bg-primary/10" : "border-border bg-surface")}
              >
                <p className="font-semibold">Seluruh Vault</p>
                <p className="vk-text-2xs text-muted-foreground truncate">{vaultName}</p>
              </button>
              <button
                type="button"
                onClick={() => onChangeScope("note")}
                className={cn("rounded-xl border p-2.5 text-left vk-text-xs", scope === "note" ? "border-primary bg-primary/10" : "border-border bg-surface")}
              >
                <p className="font-semibold">1 Catatan</p>
                <p className="vk-text-2xs text-muted-foreground truncate">{activeNoteTitle}</p>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="vk-text-xs font-semibold">2. Lensa Pembaca</label>
            <div className="grid grid-cols-3 gap-2">
              {LENS_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeLens(opt.id)}
                    className={cn("rounded-xl border p-2.5 text-center space-y-1", lens === opt.id ? "border-primary bg-primary/10" : "border-border bg-surface")}
                  >
                    <Icon className="h-4 w-4 text-primary mx-auto" />
                    <p className="vk-text-2xs font-semibold">{opt.title}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="vk-text-xs font-semibold">3. Visibilitas</label>
            <div className="grid grid-cols-2 gap-2">
              {VISIBILITY_OPTIONS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onChangeVisibility(v.id)}
                  className={cn("rounded-xl border px-3 py-2 text-left vk-text-xs font-medium flex items-center gap-1.5", visibility === v.id ? "border-primary bg-primary/10" : "border-border bg-surface")}
                >
                  {v.id === "private" ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="vk-text-xs font-semibold">Ringkasan Explore</label>
            <Textarea value={caption} onChange={(e) => onChangeCaption(e.target.value)} rows={2} className="vk-text-xs bg-surface" />
          </div>

          <div className="rounded-xl border border-success/35 bg-success/10 p-3 space-y-1">
            <p className="vk-text-xs font-semibold text-success inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Safety Check
            </p>
            <p className="vk-text-2xs text-foreground/90">
              <strong>{scope === "vault" ? publicNotesCount : 1} catatan</strong> siap publik ·{" "}
              <strong>{privateNodesCount} catatan</strong> <code>visibility: private</code> tetap aman terlindungi.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button className="flex-1 gap-1.5" onClick={() => onSubmitPublish(vaultName, vaultSlug)}>
              <Rocket className="h-4 w-4" /> Terbitkan
            </Button>
            <Button variant="outline" onClick={onClose}>Batal</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
