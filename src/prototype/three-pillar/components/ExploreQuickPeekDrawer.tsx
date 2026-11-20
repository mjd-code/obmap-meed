import React, { useState } from "react";
import { CheckCircle2, Copy, FileCode2, GitFork, Link2, PenTool, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/global/ui/sheet";
import type { PrototypeArtifactCard } from "../types";
import { PrototypeSvgThumbnail } from "./PrototypeSvgThumbnails";

interface ExploreQuickPeekDrawerProps {
  artifact: PrototypeArtifactCard | null;
  onClose: () => void;
  onRemixInEditor: (artifact: PrototypeArtifactCard) => void;
  isFollowing: boolean;
  onToggleFollow: (handle: string) => void;
}

export const ExploreQuickPeekDrawer: React.FC<ExploreQuickPeekDrawerProps> = ({
  artifact,
  onClose,
  onRemixInEditor,
  isFollowing,
  onToggleFollow,
}) => {
  const [zoomed, setZoomed] = useState(false);

  if (!artifact) return null;

  const wikilink = `[[${artifact.authorHandle}/${artifact.vaultSlug}/${artifact.id}]]`;
  const apaCitation = `${artifact.authorName} (2026). ${artifact.title}. ${artifact.vaultTitle}. ${artifact.license}.`;
  const cfg = artifact.appConfigPreview;

  const copyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(`${label} disalin`);
  };

  return (
    <Sheet open={Boolean(artifact)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-background">
        <SheetHeader className="space-y-2 pb-4 border-b border-border">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="info" className="vk-text-2xs capitalize">Lens: {artifact.lens}</Badge>
            <Badge variant={artifact.presetOrigin === "community_preset" ? "warning" : "outline"} className="vk-text-2xs">
              {artifact.presetOrigin === "community_preset" ? "Community Preset" : "Core Preset"}
            </Badge>
            <Badge variant="success" className="vk-text-2xs">{artifact.license}</Badge>
          </div>
          <SheetTitle className="vk-text-lg leading-snug">{artifact.title}</SheetTitle>
          <SheetDescription className="vk-text-xs">{artifact.excerpt}</SheetDescription>

          <div className="flex items-center justify-between pt-2">
            <span className="inline-flex items-center gap-1.5 vk-text-xs font-medium">
              {artifact.authorName}
              {artifact.verifiedScholar && <CheckCircle2 className="h-3.5 w-3.5 text-info" />}
            </span>
            <Button
              size="sm"
              variant={isFollowing ? "secondary" : "outline"}
              className="h-7 rounded-full vk-text-xs"
              onClick={() => onToggleFollow(artifact.authorHandle)}
            >
              {isFollowing ? "Following" : "+ Follow"}
            </Button>
          </div>
        </SheetHeader>

        <div className="py-4 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="vk-text-xs font-semibold">Mini-Graph Preview</span>
              <Button variant="ghost" size="sm" className="h-7 vk-text-2xs gap-1" onClick={() => setZoomed((z) => !z)}>
                {zoomed ? <ZoomOut className="h-3.5 w-3.5" /> : <ZoomIn className="h-3.5 w-3.5" />}
                {zoomed ? "Reset" : "Zoom"}
              </Button>
            </div>
            <div className={zoomed ? "scale-105 transition-transform" : "transition-transform"}>
              <PrototypeSvgThumbnail kind={artifact.svgKind} className="h-44" />
            </div>
          </div>

          {/* .app/config.json Preset & Lens Inspector */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="vk-text-xs font-semibold inline-flex items-center gap-1.5 text-primary">
                <FileCode2 className="h-3.5 w-3.5" /> .app/config.json Preset
              </span>
              <Badge variant="outline" className="vk-text-2xs font-mono">{cfg.meta.sdk}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 vk-text-2xs font-mono">
              <div className="rounded-lg bg-background/80 border border-border px-2.5 py-1.5">
                <span className="text-muted-foreground block">primary_mode</span>
                <strong className="text-foreground capitalize">{cfg.mode.primary_mode}</strong>
              </div>
              <div className="rounded-lg bg-background/80 border border-border px-2.5 py-1.5">
                <span className="text-muted-foreground block">helicopter</span>
                <strong className="text-foreground capitalize">{cfg.mode.default_helicopter_view}</strong>
              </div>
              <div className="rounded-lg bg-background/80 border border-border px-2.5 py-1.5 col-span-2">
                <span className="text-muted-foreground block">schema.default_template</span>
                <strong className="text-foreground">{cfg.schema.default_template}</strong>
              </div>
            </div>
            <p className="vk-text-2xs text-muted-foreground">
              Menyalin berkas <code>.md</code> sekaligus cara kerja/presetnya langsung ke Vault Anda (&lt; 90 detik).
            </p>
          </div>

          <div className="space-y-2">
            <span className="vk-text-xs font-semibold">Ringkasan Kunci</span>
            <div className="space-y-1.5">
              {artifact.slideSummaries.map((slide, idx) => (
                <div key={idx} className="rounded-lg bg-surface px-3 py-2 vk-text-xs text-foreground/90 border border-border/60">
                  {slide}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-elevated/50 p-3 space-y-2">
            <div className="flex items-center justify-between vk-text-2xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Link2 className="h-3 w-3" /> {artifact.citationsCount} Sitasi</span>
              <span className="inline-flex items-center gap-1"><GitFork className="h-3 w-3" /> {artifact.forksCount} Forks</span>
            </div>
            <code className="block rounded-md bg-background border border-border px-2.5 py-1.5 vk-text-2xs font-mono text-primary truncate">
              {wikilink}
            </code>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 flex-1 vk-text-2xs gap-1" onClick={() => copyText(wikilink, "Wikilink")}>
                <Copy className="h-3 w-3" /> Wikilink
              </Button>
              <Button variant="outline" size="sm" className="h-7 flex-1 vk-text-2xs gap-1" onClick={() => copyText(apaCitation, "Sitasi APA")}>
                <Copy className="h-3 w-3" /> APA
              </Button>
            </div>
          </div>

          <Button className="w-full gap-2" onClick={() => onRemixInEditor(artifact)}>
            <PenTool className="h-4 w-4" />
            Fork to My Vault (with .app/config.json)
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
