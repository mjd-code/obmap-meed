import React from "react";
import { Bookmark, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import type { PrototypeArtifactCard } from "../types";
import { PrototypeSvgThumbnail } from "./PrototypeSvgThumbnails";

interface ExploreArtifactCardProps {
  card: PrototypeArtifactCard;
  isSparked: boolean;
  isBookmarked: boolean;
  onToggleSpark: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onOpenQuickPeek: (card: PrototypeArtifactCard) => void;
}

const LENS_BADGE: Record<PrototypeArtifactCard["lens"], string> = {
  atlas: "Atlas",
  publication: "Publication · Studio",
  course: "Course · Academy",
  template: "Template Preset",
};

export const ExploreArtifactCard: React.FC<ExploreArtifactCardProps> = ({
  card,
  isSparked,
  isBookmarked,
  onToggleSpark,
  onToggleBookmark,
  onOpenQuickPeek,
}) => {
  return (
    <article className="rounded-2xl border border-border/80 bg-card hover:border-primary/45 hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden group">
      <button type="button" onClick={() => onOpenQuickPeek(card)} className="text-left flex-1 flex flex-col">
        <div className="relative p-3 pb-0">
          {card.format === "article" ? (
            <div className="rounded-xl border border-border/60 bg-elevated/75 p-4 h-40 flex items-center justify-center text-center">
              <p className="font-prose vk-text-sm text-foreground/90 leading-relaxed line-clamp-3">
                “{card.slideSummaries[0]}”
              </p>
            </div>
          ) : (
            <PrototypeSvgThumbnail kind={card.svgKind} className="h-40 rounded-xl" />
          )}

          <div className="absolute top-5 left-5 right-5 flex items-center justify-between gap-1.5">
            <Badge
              variant={card.lens === "course" ? "info" : card.lens === "template" ? "warning" : "secondary"}
              className="vk-text-2xs backdrop-blur-sm"
            >
              {card.lens === "course" && typeof card.lmsProgress === "number"
                ? `Course · ${card.lmsProgress}%`
                : LENS_BADGE[card.lens]}
            </Badge>

            <Badge
              variant={card.presetOrigin === "community_preset" ? "default" : "outline"}
              className="vk-text-2xs backdrop-blur-sm bg-background/80"
            >
              {card.presetOrigin === "community_preset" ? "Community Preset" : "Core Preset"}
            </Badge>
          </div>
        </div>

        <div className="p-4 space-y-1">
          <h3 className="vk-text-sm font-semibold tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
            {card.title}
          </h3>
          <p className="vk-text-xs text-muted-foreground line-clamp-1">{card.excerpt}</p>
        </div>
      </button>

      <div className="px-4 py-2.5 border-t border-border/50 bg-surface/40 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="vk-text-xs text-muted-foreground truncate">{card.authorHandle}</span>
          {card.verifiedScholar && <CheckCircle2 className="h-3.5 w-3.5 text-info shrink-0" />}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant={isSparked ? "secondary" : "ghost"}
            size="sm"
            className={cn("h-7 px-2 vk-text-2xs gap-1 rounded-full", isSparked && "text-primary")}
            onClick={() => onToggleSpark(card.id)}
          >
            <Sparkles className="h-3 w-3" />
            <span>{card.sparksCount + (isSparked ? 1 : 0)}</span>
          </Button>
          <Button
            variant={isBookmarked ? "secondary" : "ghost"}
            size="icon-sm"
            className={cn("rounded-full", isBookmarked && "text-warning")}
            onClick={() => onToggleBookmark(card.id)}
            aria-label="Bookmark"
          >
            <Bookmark className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
};
