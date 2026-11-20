import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/domains/workspace/shared/stores/useWorkspaceStore";
import {
  INITIAL_PORTFOLIO_STUDY_ITEMS,
  PROTOTYPE_ACADEMY_TREE,
  PROTOTYPE_ARTIFACTS,
  PROTOTYPE_EDITOR_FILES,
  PROTOTYPE_SCHOLAR_PROFILE,
} from "./mockData";
import type {
  ExploreLensFilter,
  ExploreSubTab,
  GraphSolverKind,
  HelicopterViewKind,
  LmsNodeStatus,
  PillarId,
  PortfolioStudyStage,
  ProfileSubTab,
  PrototypeAcademyTreeNode,
  PrototypeArtifactCard,
  PrototypePortfolioStudyItem,
  ReorganizeBy,
  RestructureMode,
  SettingsHubSectionId,
  SimulatedRole,
  WorkspaceModeId,
} from "./types";
import { usePublishManagerState } from "./usePublishManagerState";

const OWNER_ONLY_TABS: ReadonlySet<ProfileSubTab> = new Set([
  "shared",
  "private_local",
  "workspace_views",
]);

const STAGE_ORDER: PortfolioStudyStage[] = [
  "seedling",
  "budding",
  "evergreen",
  "published",
  "mastered",
];

export function useThreePillarPrototypeController() {
  const [activePillar, setActivePillar] = useState<PillarId>("explore");
  const [role, setRole] = useState<SimulatedRole>("owner");
  const [isPreviewAsVisitor, setIsPreviewAsVisitor] = useState(false);
  const [isAuthenticatedSim, setIsAuthenticatedSim] = useState(true);

  // Pillar 3: Explore
  const [exploreSubTab, setExploreSubTab] = useState<ExploreSubTab>("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLensFilter, setSelectedLensFilter] = useState<ExploreLensFilter>("all");
  const [selectedTopic, setSelectedTopic] = useState("Semua Topik");
  const [sparkedIds, setSparkedIds] = useState<string[]>(["art-2"]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(["art-1", "art-3"]);
  const [followingHandles, setFollowingHandles] = useState<string[]>(["@nadia.putri", "@hendra.wijaya"]);
  const [quickPeekArtifact, setQuickPeekArtifact] = useState<PrototypeArtifactCard | null>(null);

  // Pillar 2: Profile & Academy Tree
  const [profileSubTab, setProfileSubTab] = useState<ProfileSubTab>("works");
  const [selectedVaultHighlight, setSelectedVaultHighlight] = useState<string | null>(null);
  const [scholarBio, setScholarBio] = useState(PROTOTYPE_SCHOLAR_PROFILE.bio);
  const [pinnedVaultIds, setPinnedVaultIds] = useState<string[]>(["v-atlas", "v-lms"]);
  const [academyTree, setAcademyTree] = useState<PrototypeAcademyTreeNode[]>(PROTOTYPE_ACADEMY_TREE);
  const [selectedLmsNodeId, setSelectedLmsNodeId] = useState<string>("aca-4");
  const [lmsStatuses, setLmsStatuses] = useState<Record<string, LmsNodeStatus>>(() =>
    Object.fromEntries(PROTOTYPE_ACADEMY_TREE.map((n) => [n.id, n.initialStatus]))
  );
  const [profileHelicopterView, setProfileHelicopterView] = useState<HelicopterViewKind>("cards");
  const [portfolioItems, setPortfolioItems] = useState<PrototypePortfolioStudyItem[]>(INITIAL_PORTFOLIO_STUDY_ITEMS);

  // Pillar 1: Pure Editor, Workspace Modes, Sidebars & Single Adaptive SettingsHub
  const [editorMode, setEditorMode] = useState<"live" | "sandbox">("live");
  const [activeLensMode, setActiveLensMode] = useState<WorkspaceModeId>("atlas");
  const [helicopterView, setHelicopterView] = useState<HelicopterViewKind>("graph");
  const [reorganizeBy, setReorganizeBy] = useState<ReorganizeBy>("hierarchy");
  const [restructureMode, setRestructureMode] = useState<RestructureMode>("virtual_grouping");
  const [leftSidebarPinned, setLeftSidebarPinned] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );
  const [rightSidebarPinned, setRightSidebarPinned] = useState(false);

  const [sandboxTitle, setSandboxTitle] = useState("sintesis-graf-pengetahuan.md");
  const [sandboxMarkdown, setSandboxMarkdown] = useState(PROTOTYPE_EDITOR_FILES[0].content);
  const [sandboxActiveTab, setSandboxActiveTab] = useState<"editor" | "helicopter" | "settings">("editor");
  const [graphSolver, setGraphSolver] = useState<GraphSolverKind>("mindmap");

  const [isAppSettingsFullPageOpen, setIsAppSettingsFullPageOpen] = useState(false);
  const [settingsHubSection, setSettingsHubSection] = useState<SettingsHubSectionId>("vault_lenses");

  const publishManager = usePublishManagerState(role);
  const effectiveVisitorView = role === "visitor" || isPreviewAsVisitor;

  useEffect(() => {
    if (effectiveVisitorView && OWNER_ONLY_TABS.has(profileSubTab)) {
      setProfileSubTab("works");
    }
  }, [effectiveVisitorView, profileSubTab]);

  const selectPillar = useCallback((pillar: PillarId) => {
    setIsAppSettingsFullPageOpen(false);
    setActivePillar(pillar);
  }, []);

  const handleRoleChange = useCallback((nextRole: SimulatedRole) => {
    setRole(nextRole);
    if (nextRole !== "owner") setIsPreviewAsVisitor(false);
    setEditorMode(nextRole === "visitor" ? "sandbox" : "live");
  }, []);

  const toggleAuthSim = useCallback(() => {
    setIsAuthenticatedSim((prev) => {
      const next = !prev;
      toast.info(next ? "Signed in sebagai @dr.aras.wicaksono" : "Signed out — mode tamu lokal aktif");
      return next;
    });
  }, []);

  const filteredExploreArtifacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PROTOTYPE_ARTIFACTS.filter((item) => {
      if (exploreSubTab === "following" && !followingHandles.includes(item.authorHandle)) return false;
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

  const togglePinVault = useCallback((vaultId: string) => {
    setPinnedVaultIds((prev) => {
      const exists = prev.includes(vaultId);
      toast.success(exists ? "Vault dilepas dari pin profil" : "Vault disematkan di profil publik");
      return exists ? prev.filter((id) => id !== vaultId) : [...prev, vaultId];
    });
  }, []);

  const completeLmsNodeQuiz = useCallback((nodeId: string, optionIndex: number) => {
    const target = academyTree.find((n) => n.id === nodeId);
    if (!target) return;
    if (optionIndex !== target.correctOptionIndex) {
      toast.error("Jawaban belum tepat — tinjau kembali ringkasan modul.");
      return;
    }
    setLmsStatuses((prev) => {
      const next: Record<string, LmsNodeStatus> = { ...prev, [nodeId]: "mastered" };
      for (const node of academyTree) {
        if (next[node.id] === "locked" && node.prerequisites.every((req) => next[req] === "mastered")) {
          next[node.id] = "available";
        }
      }
      return next;
    });
    toast.success("Simpul dikuasai (Mastered)! Simpul lanjutan terbuka.");
  }, [academyTree]);

  const addStudentSubNode = useCallback((parentNodeId: string, noteTitle: string) => {
    const cleanTitle = noteTitle.trim() || "refleksi-pembelajar.md";
    setAcademyTree((prev) =>
      prev.map((node) =>
        node.id === parentNodeId
          ? {
              ...node,
              studentSubNodes: [
                ...node.studentSubNodes,
                {
                  id: `sub-${Date.now()}`,
                  studentName: "Anda (Pembelajar)",
                  studentHandle: "@pelajar.sidra",
                  title: cleanTitle.endsWith(".md") ? cleanTitle : `${cleanTitle}.md`,
                  status: "submitted",
                  updatedAt: "Baru saja",
                },
              ],
            }
          : node
      )
    );
    toast.success(`Sub-node pelajar tumbuh di bawah "${parentNodeId.toUpperCase()}".`);
  }, []);

  const cyclePortfolioStage = useCallback((itemId: string) => {
    setPortfolioItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const nextStage = STAGE_ORDER[(STAGE_ORDER.indexOf(item.stage) + 1) % STAGE_ORDER.length];
        toast.info(`YAML epistemic_status: "${nextStage}" diperbarui di ${item.noteSlug}.md`);
        return { ...item, stage: nextStage };
      })
    );
  }, []);

  const saveActiveModeToVaultConfig = useCallback(() => {
    publishManager.updateVaultConfig(publishManager.selectedVault.id, {
      primaryMode: activeLensMode,
      defaultHelicopterView: helicopterView,
    });
    toast.success(`.app/config.json diperbarui: primary_mode="${activeLensMode}", helicopter="${helicopterView}"`);
  }, [activeLensMode, helicopterView, publishManager]);

  const handleRemixInEditor = useCallback((artifact: PrototypeArtifactCard) => {
    setSandboxTitle(`${artifact.vaultSlug}/${artifact.id}.md`);
    setSandboxMarkdown(artifact.markdownPreview);
    setSandboxActiveTab("editor");
    setActiveLensMode(artifact.workspaceMode);
    setHelicopterView(artifact.appConfigPreview.mode.default_helicopter_view);
    setGraphSolver(artifact.svgKind === "argument-map" ? "argument-map" : artifact.svgKind === "fishbone" ? "fishbone" : artifact.svgKind === "skill-tree" ? "skill-tree" : "mindmap");
    setEditorMode("sandbox");
    setQuickPeekArtifact(null);
    setIsAppSettingsFullPageOpen(false);
    setActivePillar("editor");
    toast.success(`Fork with Preset: "${artifact.title}" + .app/config.json (${artifact.workspaceMode}) dimuat ke Editor.`);
  }, []);

  const openAdaptiveSettingsHub = useCallback((section?: SettingsHubSectionId, targetNodeTitle?: string) => {
    if (targetNodeTitle) {
      publishManager.setTargetScope("node");
      publishManager.setSelectedTargetNodeTitle(targetNodeTitle);
      publishManager.setShareSubTab("publish");
    }
    if (activePillar === "explore" || activePillar === "profile") {
      setSettingsHubSection(section ?? "account_app");
      setIsAppSettingsFullPageOpen(true);
      return;
    }
    setSettingsHubSection(section ?? "vault_lenses");
    if (role === "visitor" || editorMode === "sandbox") {
      setSandboxActiveTab("settings");
      return;
    }
    useWorkspaceStore.getState().openView({ type: "empty", nodeId: "__settings_hub__", title: "Settings Hub" });
  }, [activePillar, editorMode, publishManager, role]);

  const openHelicopterWorkspaceTab = useCallback((view?: HelicopterViewKind | "academy") => {
    if (view === "academy") setActiveLensMode("academy");
    else if (view) {
      setHelicopterView(view);
      if (activeLensMode === "academy") setActiveLensMode("atlas");
    }
    setIsAppSettingsFullPageOpen(false);
    setActivePillar("editor");
    if (role === "visitor" || editorMode === "sandbox") {
      setSandboxActiveTab("helicopter");
      return;
    }
    useWorkspaceStore.getState().openView({ type: "empty", nodeId: "__helicopter_explorer__", title: "Helicopter & Lenses" });
  }, [activeLensMode, editorMode, role]);

  return {
    activePillar, selectPillar, role, handleRoleChange, isPreviewAsVisitor, setIsPreviewAsVisitor, effectiveVisitorView,
    isAuthenticatedSim, toggleAuthSim,
    exploreSubTab, setExploreSubTab, searchQuery, setSearchQuery, selectedLensFilter, setSelectedLensFilter,
    selectedTopic, setSelectedTopic, filteredExploreArtifacts, sparkedIds, bookmarkedIds, followingHandles,
    toggleSpark, toggleBookmark, toggleFollowAuthor, quickPeekArtifact, setQuickPeekArtifact,
    profileSubTab, setProfileSubTab, selectedVaultHighlight, setSelectedVaultHighlight,
    scholarBio, setScholarBio, pinnedVaultIds, togglePinVault, academyTree, addStudentSubNode,
    lmsStatuses, selectedLmsNodeId, setSelectedLmsNodeId, completeLmsNodeQuiz,
    profileHelicopterView, setProfileHelicopterView, portfolioItems, cyclePortfolioStage,
    editorMode, setEditorMode, activeLensMode, setActiveLensMode, helicopterView, setHelicopterView,
    reorganizeBy, setReorganizeBy, restructureMode, setRestructureMode,
    leftSidebarPinned, setLeftSidebarPinned, rightSidebarPinned, setRightSidebarPinned,
    saveActiveModeToVaultConfig, sandboxTitle, setSandboxTitle, sandboxMarkdown, setSandboxMarkdown,
    sandboxActiveTab, setSandboxActiveTab, graphSolver, setGraphSolver,
    isAppSettingsFullPageOpen, setIsAppSettingsFullPageOpen, settingsHubSection, setSettingsHubSection,
    openAdaptiveSettingsHub, openHelicopterWorkspaceTab, publishManager, handleRemixInEditor,
  };
}
