import React from "react";
import { ArrowUpRight, Compass, Search, Sparkles, Users } from "lucide-react";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { Input } from "@/global/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/global/ui/select";
import { CURATED_LEARNING_PATHS, EXPLORE_TOPICS, PROTOTYPE_ARTIFACTS } from "../mockData";
import type {
  ArtifactFormat,
  ExploreSubTab,
  PrototypeArtifactCard,
  PrototypeLearningPath,
} from "../types";
import { ExploreArtifactCard } from "./ExploreArtifactCard";

interface ExplorePillarViewProps {
  subTab: ExploreSubTab;
  onChangeSubTab: (tab: ExploreSubTab) => void;
  searchQuery: string;
  onChangeSearch: (q: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  selectedFormat: ArtifactFormat;
  onChangeFormat: (fmt: ArtifactFormat) => void;
  selectedTopic: string;
  onChangeTopic: (topic: string) => void;
  artifacts: PrototypeArtifactCard[];
  sparkedIds: string[];
  bookmarkedIds: string[];
  onToggleSpark: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onOpenQuickPeek: (artifact: PrototypeArtifactCard) => void;
  onJumpToProfile: () => void;
}

const FORMAT_CHIPS: { id: ArtifactFormat; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "mindmap", label: "Mindmap" },
  { id: "course", label: "Course LMS" },
  { id: "argument-map", label: "Argument Map" },
  { id: "article", label: "Article" },
  { id: "template", label: "Template" },
];

export const ExplorePillarView: React.FC<ExplorePillarViewProps> = ({
  subTab,
  onChangeSubTab,
  searchQuery,
  onChangeSearch,
  searchInputRef,
  selectedFormat,
  onChangeFormat,
  selectedTopic,
  onChangeTopic,
  artifacts,
  sparkedIds,
  bookmarkedIds,
  onToggleSpark,
  onToggleBookmark,
  onOpenQuickPeek,
  onJumpToProfile,
}) => {
  const handleOpenPath = (path: PrototypeLearningPath) => {
    const target =
      PROTOTYPE_ARTIFACTS.find((a) => a.id === path.targetArtifactId) ?? PROTOTYPE_ARTIFACTS[0];
    onOpenQuickPeek(target);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Symmetrical 3-Zone Control Row */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-3">
        <div className="inline-flex rounded-full border border-border bg-surface p-1 justify-self-start">
          <button
            type="button"
            onClick={() => onChangeSubTab("discover")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full vk-text-xs font-medium transition-colors",
              subTab === "discover" ? "bg-elevated text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Compass className="h-3.5 w-3.5" /> Discover
          </button>
          <button
            type="button"
            onClick={() => onChangeSubTab("following")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full vk-text-xs font-medium transition-colors",
              subTab === "following" ? "bg-elevated text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="h-3.5 w-3.5" /> Following
          </button>
        </div>

        <div className="relative w-full max-w-md mx-auto">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Cari @scholar, topik, atau konsep..."
            className="pl-9 h-9 rounded-full bg-surface border-border vk-text-xs"
          />
        </div>

        <div className="flex items-center gap-2 justify-self-end">
          <Select value={selectedTopic} onValueChange={onChangeTopic}>
            <SelectTrigger className="h-8 w-44 rounded-full vk-text-xs bg-surface">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPLORE_TOPICS.map((t) => (
                <SelectItem key={t} value={t} className="vk-text-xs">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="h-8 rounded-full vk-text-xs gap-1" onClick={onJumpToProfile}>
            <span>@dr.aras</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Centered Single-Row Format Chips */}
      <div className="flex items-center justify-start md:justify-center gap-1.5 overflow-x-auto no-scrollbar">
        {FORMAT_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => onChangeFormat(chip.id)}
            className={cn(
              "px-3.5 py-1 rounded-full vk-text-xs font-medium border transition-colors whitespace-nowrap",
              selectedFormat === chip.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-surface/70 text-muted-foreground border-border/80 hover:text-foreground"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Compact Curated Learning Paths Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CURATED_LEARNING_PATHS.map((path) => (
          <button
            key={path.id}
            type="button"
            onClick={() => handleOpenPath(path)}
            className="text-left rounded-xl border border-border/70 bg-surface/75 hover:bg-elevated hover:border-primary/40 transition-all px-3.5 py-3 flex items-center justify-between gap-3 group"
          >
            <div className="min-w-0 space-y-0.5">
              <span className="vk-text-2xs text-primary font-medium inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> {path.badge}
              </span>
              <p className="vk-text-xs font-semibold truncate group-hover:text-primary transition-colors">
                {path.title}
              </p>
            </div>
            <Badge variant="outline" className="vk-text-2xs shrink-0">
              {path.duration}
            </Badge>
          </button>
        ))}
      </section>

      {/* Main Symmetrical Bento Grid */}
      {artifacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-10 text-center space-y-2">
          <p className="vk-text-sm font-medium">Tidak ada karya yang cocok.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onChangeSearch("");
              onChangeFormat("all");
              onChangeTopic("Semua Topik");
              onChangeSubTab("discover");
            }}
          >
            Reset Filter
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {artifacts.map((card) => (
            <ExploreArtifactCard
              key={card.id}
              card={card}
              isSparked={sparkedIds.includes(card.id)}
              isBookmarked={bookmarkedIds.includes(card.id)}
              onToggleSpark={onToggleSpark}
              onToggleBookmark={onToggleBookmark}
              onOpenQuickPeek={onOpenQuickPeek}
            />
          ))}
        </div>
      )}
    </div>
  );
};
