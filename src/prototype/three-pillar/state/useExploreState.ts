import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { PROTOTYPE_ARTIFACTS } from "../mockExploreData";
import type {
  ExploreLensFilter,
  ExploreSubTab,
  PrototypeArtifactCard,
} from "../types";
import type { PrototypeExploreStateSlice } from "./prototypeStateTypes";

export function useExploreState(): PrototypeExploreStateSlice {
  const [exploreSubTab, setExploreSubTab] = useState<ExploreSubTab>("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLensFilter, setSelectedLensFilter] = useState<ExploreLensFilter>("all");
  const [selectedTopic, setSelectedTopic] = useState("Semua Topik");
  const [sparkedIds, setSparkedIds] = useState<string[]>(["art-2"]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(["art-1", "art-3"]);
  const [followingHandles, setFollowingHandles] = useState<string[]>([
    "@nadia.putri",
    "@hendra.wijaya",
  ]);
  const [quickPeekArtifact, setQuickPeekArtifact] = useState<PrototypeArtifactCard | null>(null);

  const filteredExploreArtifacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PROTOTYPE_ARTIFACTS.filter((item) => {
      if (exploreSubTab === "following" && !followingHandles.includes(item.authorHandle)) {
        return false;
      }
      if (selectedLensFilter !== "all" && item.lens !== selectedLensFilter) return false;
      if (selectedTopic !== "Semua Topik" && item.topic !== selectedTopic) return false;
      if (!q) return true;
      return [item.title, item.excerpt, item.authorHandle, item.topic, item.vaultTitle].some((f) =>
        f.toLowerCase().includes(q)
      );
    });
  }, [exploreSubTab, followingHandles, searchQuery, selectedLensFilter, selectedTopic]);

  const toggleSpark = useCallback((id: string) => {
    setSparkedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarkedIds((prev) => {
      const exists = prev.includes(id);
      toast.success(exists ? "Dihapus dari Reading List" : "Disimpan ke Reading List");
      return exists ? prev.filter((x) => x !== id) : [...prev, id];
    });
  }, []);

  const toggleFollowAuthor = useCallback((handle: string) => {
    setFollowingHandles((prev) => {
      const exists = prev.includes(handle);
      toast.success(exists ? `Berhenti mengikuti ${handle}` : `Mengikuti ${handle}`);
      return exists ? prev.filter((x) => x !== handle) : [...prev, handle];
    });
  }, []);

  return {
    exploreSubTab,
    setExploreSubTab,
    searchQuery,
    setSearchQuery,
    selectedLensFilter,
    setSelectedLensFilter,
    selectedTopic,
    setSelectedTopic,
    filteredExploreArtifacts,
    sparkedIds,
    bookmarkedIds,
    followingHandles,
    toggleSpark,
    toggleBookmark,
    toggleFollowAuthor,
    quickPeekArtifact,
    setQuickPeekArtifact,
  };
}
