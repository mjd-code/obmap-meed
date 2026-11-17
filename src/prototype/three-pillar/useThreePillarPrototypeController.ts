import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  INITIAL_KANBAN_TASKS,
  PROTOTYPE_ARTIFACTS,
  PROTOTYPE_EDITOR_FILES,
  PROTOTYPE_LMS_NODES,
  PROTOTYPE_VAULTS,
} from "./mockData";
import type {
  ArtifactFormat,
  DerivedViewMode,
  ExploreSubTab,
  GraphSolverKind,
  LmsNodeStatus,
  PillarId,
  PresentationLens,
  ProfileSubTab,
  PrototypeArtifactCard,
  PrototypeKanbanTask,
  PublishVisibility,
  SimulatedRole,
} from "./types";

const OWNER_ONLY_TABS: ReadonlySet<ProfileSubTab> = new Set([
  "shared",
  "private_local",
  "workspace_views",
]);
const KANBAN_ORDER: PrototypeKanbanTask["status"][] = [
  "backlog",
  "in_progress",
  "peer_review",
  "published",
];

export function useThreePillarPrototypeController() {
  const [activePillar, setActivePillar] = useState<PillarId>("explore");
  const [role, setRole] = useState<SimulatedRole>("owner");
  const [isPreviewAsVisitor, setIsPreviewAsVisitor] = useState(false);

  const [exploreSubTab, setExploreSubTab] = useState<ExploreSubTab>("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<ArtifactFormat>("all");
  const [selectedTopic, setSelectedTopic] = useState("Semua Topik");
  const [sparkedIds, setSparkedIds] = useState<string[]>(["art-2"]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(["art-1", "art-3"]);
  const [followingHandles, setFollowingHandles] = useState<string[]>(["@nadia.putri", "@hendra.wijaya"]);
  const [quickPeekArtifact, setQuickPeekArtifact] = useState<PrototypeArtifactCard | null>(null);

  const [profileSubTab, setProfileSubTab] = useState<ProfileSubTab>("works");
  const [selectedVaultHighlight, setSelectedVaultHighlight] = useState<string | null>(null);
  const [selectedLmsNodeId, setSelectedLmsNodeId] = useState<string>("lms-3");
  const [lmsStatuses, setLmsStatuses] = useState<Record<string, LmsNodeStatus>>(() =>
    Object.fromEntries(PROTOTYPE_LMS_NODES.map((n) => [n.id, n.initialStatus]))
  );
  const [derivedViewMode, setDerivedViewMode] = useState<DerivedViewMode>("kanban");
  const [kanbanTasks, setKanbanTasks] = useState<PrototypeKanbanTask[]>(INITIAL_KANBAN_TASKS);

  const [editorMode, setEditorMode] = useState<"live" | "sandbox">("live");
  const [sandboxTitle, setSandboxTitle] = useState("sintesis-graf-pengetahuan.md");
  const [sandboxMarkdown, setSandboxMarkdown] = useState(PROTOTYPE_EDITOR_FILES[0].content);
  const [graphSolver, setGraphSolver] = useState<GraphSolverKind>("mindmap");
  const [isPublishDrawerOpen, setIsPublishDrawerOpen] = useState(false);
  const [publishScope, setPublishScope] = useState<"vault" | "note">("vault");
  const [publishLens, setPublishLens] = useState<PresentationLens>("atlas");
  const [publishVisibility, setPublishVisibility] = useState<PublishVisibility>("public_listed");
  const [publishCaption, setPublishCaption] = useState(
    "Peta sintesis kognisi berbasis graf deterministik & plaintext Markdown (CC BY-SA 4.0)."
  );

  const effectiveVisitorView = role === "visitor" || isPreviewAsVisitor;

  useEffect(() => {
    if (effectiveVisitorView && OWNER_ONLY_TABS.has(profileSubTab)) {
      setProfileSubTab("works");
    }
  }, [effectiveVisitorView, profileSubTab]);

  const handleRoleChange = useCallback((nextRole: SimulatedRole) => {
    setRole(nextRole);
    if (nextRole !== "owner") setIsPreviewAsVisitor(false);
    setEditorMode(nextRole === "visitor" ? "sandbox" : "live");
  }, []);

  const filteredExploreArtifacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PROTOTYPE_ARTIFACTS.filter((item) => {
      if (exploreSubTab === "following" && !followingHandles.includes(item.authorHandle)) return false;
      if (selectedFormat !== "all" && item.format !== selectedFormat) return false;
      if (selectedTopic !== "Semua Topik" && item.topic !== selectedTopic) return false;
      if (!q) return true;
      return [item.title, item.excerpt, item.authorHandle, item.topic, item.vaultTitle].some((f) =>
        f.toLowerCase().includes(q)
      );
    });
  }, [exploreSubTab, followingHandles, searchQuery, selectedFormat, selectedTopic]);

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

  const completeLmsNodeQuiz = useCallback((nodeId: string, optionIndex: number) => {
    const target = PROTOTYPE_LMS_NODES.find((n) => n.id === nodeId);
    if (!target) return;
    if (optionIndex !== target.correctOptionIndex) {
      toast.error("Jawaban belum tepat — coba tinjau ringkasan modul.");
      return;
    }
    setLmsStatuses((prev) => {
      const next: Record<string, LmsNodeStatus> = { ...prev, [nodeId]: "mastered" };
      for (const node of PROTOTYPE_LMS_NODES) {
        if (next[node.id] === "locked" && node.prerequisites.every((req) => next[req] === "mastered")) {
          next[node.id] = "available";
        }
      }
      return next;
    });
    toast.success("Simpul dikuasai (Mastered)! Modul lanjutan terbuka.");
  }, []);

  const cycleKanbanTaskStatus = useCallback((taskId: string) => {
    setKanbanTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const nextStatus = KANBAN_ORDER[(KANBAN_ORDER.indexOf(task.status) + 1) % KANBAN_ORDER.length];
        toast.info(`YAML \`status: ${nextStatus}\` diperbarui di ${task.noteSlug}.md`);
        return { ...task, status: nextStatus };
      })
    );
  }, []);

  const handleRemixInEditor = useCallback((artifact: PrototypeArtifactCard) => {
    setSandboxTitle(`${artifact.vaultSlug}/${artifact.id}.md`);
    setSandboxMarkdown(artifact.markdownPreview);
    setGraphSolver(artifact.svgKind === "argument-map" ? "argument-map" : artifact.svgKind === "fishbone" ? "fishbone" : "mindmap");
    setEditorMode("sandbox");
    setQuickPeekArtifact(null);
    setActivePillar("editor");
    toast.success(`"${artifact.title}" siap diedit di Sandbox (CC BY-SA 4.0).`);
  }, []);

  const handlePublishSubmit = useCallback(
    (vaultTitle?: string, vaultSlug?: string) => {
      if (role === "stage2_pending") {
        toast.warning("Akun Stage 2 menunggu persetujuan Admin untuk publikasi Cloud.");
        return;
      }
      const fallback = PROTOTYPE_VAULTS[0];
      setIsPublishDrawerOpen(false);
      toast.success(`Diterbitkan: /@dr.aras.wicaksono/${vaultSlug || fallback.slug} (${vaultTitle || fallback.title})`);
    },
    [role]
  );

  return {
    activePillar, setActivePillar, role, handleRoleChange, isPreviewAsVisitor, setIsPreviewAsVisitor, effectiveVisitorView,
    exploreSubTab, setExploreSubTab, searchQuery, setSearchQuery, selectedFormat, setSelectedFormat, selectedTopic, setSelectedTopic,
    filteredExploreArtifacts, sparkedIds, bookmarkedIds, followingHandles, toggleSpark, toggleBookmark, toggleFollowAuthor,
    quickPeekArtifact, setQuickPeekArtifact, profileSubTab, setProfileSubTab, selectedVaultHighlight, setSelectedVaultHighlight,
    lmsStatuses, selectedLmsNodeId, setSelectedLmsNodeId, completeLmsNodeQuiz, derivedViewMode, setDerivedViewMode,
    kanbanTasks, cycleKanbanTaskStatus, editorMode, setEditorMode, sandboxTitle, sandboxMarkdown, setSandboxMarkdown,
    graphSolver, setGraphSolver, isPublishDrawerOpen, setIsPublishDrawerOpen, publishScope, setPublishScope,
    publishLens, setPublishLens, publishVisibility, setPublishVisibility, publishCaption, setPublishCaption,
    handleRemixInEditor, handlePublishSubmit,
  };
}
