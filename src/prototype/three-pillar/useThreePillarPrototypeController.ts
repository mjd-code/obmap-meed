import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { PROTOTYPE_EDITOR_FILES } from "./mockEditorData";
import { legacySectionToSettingsSelection, type SettingsSubId } from "./settingsCatalog";
import {
  useAccountState,
  useAppearanceState,
  useDeepExplorerState,
  useExploreState,
  useNavigationState,
  usePresetAndConfigState,
  useProfileAcademyState,
  useVaultGovernanceState,
  useVisualEngineState,
  useWorkspaceState,
} from "./state";
import type {
  AppCentralConfigJsonV2,
  DeepExplorerViewKind,
  PrototypeArtifactCard,
  SettingsHubSectionId,
  WorkspaceModeId,
} from "./types";

const LEGACY_SECTION_SET: ReadonlySet<string> = new Set([
  "vault_lenses",
  "share_access_vcs",
  "academy_sdk",
  "account_app",
]);

export function useThreePillarPrototypeController() {
  const nav = useNavigationState();
  const explore = useExploreState();
  const account = useAccountState();
  const profileAcademy = useProfileAcademyState(nav.effectiveVisitorView);
  const workspace = useWorkspaceState();
  const appearance = useAppearanceState();
  const visualEngine = useVisualEngineState();
  const deepExplorer = useDeepExplorerState();
  const vaults = useVaultGovernanceState(nav.role);

  const [activeLensMode, setActiveLensMode] = useState<WorkspaceModeId>("atlas");
  const [sandboxTitle, setSandboxTitle] = useState("sintesis-graf-pengetahuan.md");
  const [sandboxMarkdown, setSandboxMarkdown] = useState(PROTOTYPE_EDITOR_FILES[0]?.content ?? "");
  // @deprecated M1->M2/M3 compat shim ("helicopter" tab id retained until M2 migrates EditorPillarView)
  const [sandboxActiveTab, setSandboxActiveTab] = useState<"editor" | "helicopter" | "settings">("editor");

  const hydrateFromConfig = useCallback(
    (cfg: AppCentralConfigJsonV2) => {
      setActiveLensMode(cfg.mode.primary_mode);
      deepExplorer.setDefaultView(cfg.deep_explorer.default_view);
      deepExplorer.setReorganizeBy(cfg.deep_explorer.reorganize_by);
      deepExplorer.setRestructureMode(cfg.deep_explorer.restructure_mode);
      deepExplorer.setDepthFilter(cfg.deep_explorer.default_depth);
      deepExplorer.setBranchFilter(cfg.deep_explorer.branch_filter);
      appearance.hydrateFromConfig(cfg.appearance);
      visualEngine.hydrateFromConfig(cfg.visual_engine);
      vaults.replaceSelectedVaultAppConfig(cfg);
    },
    [appearance, deepExplorer, vaults, visualEngine]
  );

  const presetsConfig = usePresetAndConfigState({
    baseConfig: vaults.selectedVault.appConfig,
    appearanceState: appearance.state,
    visualEngineState: visualEngine.state,
    deepExplorerState: deepExplorer,
    onHydrateFromConfig: hydrateFromConfig,
  });

  const setScholarBio = useCallback((bio: string) => { account.updateProfile({ bio }); }, [account]);

  const saveActiveModeToVaultConfig = useCallback(() => {
    vaults.updateVaultConfig(vaults.selectedVault.id, {
      primaryMode: activeLensMode,
      defaultDeepExplorerView: deepExplorer.defaultView,
    });
    toast.success(`.app/config.json diperbarui: primary_mode="${activeLensMode}", deep_explorer="${deepExplorer.defaultView}"`);
  }, [activeLensMode, deepExplorer.defaultView, vaults]);

  const handleRemixInEditor = useCallback(
    (artifact: PrototypeArtifactCard) => {
      const targetView = artifact.appConfigPreview.deep_explorer.default_view;
      setSandboxTitle(`${artifact.vaultSlug}/${artifact.id}.md`);
      setSandboxMarkdown(artifact.markdownPreview);
      setSandboxActiveTab("editor");
      setActiveLensMode(artifact.workspaceMode);
      deepExplorer.setDefaultView(targetView);
      visualEngine.setDefaultSolver(
        artifact.svgKind === "argument-map" ? "argument-map" : artifact.svgKind === "fishbone" ? "fishbone" : artifact.svgKind === "skill-tree" ? "skill-tree" : "mindmap"
      );
      workspace.openView({ type: "markdown", nodeId: artifact.id, title: `${artifact.id}.md` }, "new-tab");
      nav.setEditorMode("sandbox");
      explore.setQuickPeekArtifact(null);
      nav.setIsAppSettingsFullPageOpen(false);
      nav.selectPillar("editor");
      toast.success(`Fork with Preset: "${artifact.title}" + .app/config.json (${artifact.workspaceMode}) dimuat ke Editor.`);
    },
    [deepExplorer, explore, nav, visualEngine, workspace]
  );

  const openAdaptiveSettingsHub = useCallback(
    (target?: SettingsSubId | SettingsHubSectionId, targetNodeTitle?: string, sectionId?: string) => {
      if (targetNodeTitle) {
        vaults.setTargetScope("node");
        vaults.setSelectedTargetNodeTitle(targetNodeTitle);
        vaults.setShareSubTab("publish");
      }
      if (target && LEGACY_SECTION_SET.has(target)) {
        const mapped = legacySectionToSettingsSelection(target as SettingsHubSectionId);
        nav.selectSettings(mapped.subSettingId, sectionId ?? mapped.sectionId);
      } else if (target) {
        nav.selectSettings(target as SettingsSubId, sectionId);
      } else if (nav.activePillar === "explore" || nav.activePillar === "profile") {
        nav.selectSettings("account_profile", sectionId);
      } else {
        nav.selectSettings("workspace_preset", sectionId);
      }
      if (nav.activePillar === "explore" || nav.activePillar === "profile") {
        nav.setIsAppSettingsFullPageOpen(true);
        return;
      }
      nav.setActiveSettingsTabOpen(true);
      if (nav.role === "visitor" || nav.editorMode === "sandbox") setSandboxActiveTab("settings");
      workspace.openSettingsHubTab();
    },
    [nav, vaults, workspace]
  );

  const openDeepExplorerWorkspaceTab = useCallback(
    (view?: DeepExplorerViewKind | "academy") => {
      if (view === "academy") setActiveLensMode("academy");
      else if (view) {
        deepExplorer.setDefaultView(view);
        if (activeLensMode === "academy") setActiveLensMode("atlas");
      }
      nav.setIsAppSettingsFullPageOpen(false);
      nav.selectPillar("editor");
      if (nav.role === "visitor" || nav.editorMode === "sandbox") setSandboxActiveTab("helicopter");
      workspace.openDeepExplorerTab(view);
    },
    [activeLensMode, deepExplorer, nav, workspace]
  );

  const appearanceSlice = useMemo(
    () => ({ state: appearance.state, updateAppearance: appearance.updateAppearance, resetAppearance: appearance.resetAppearance, rootRef: appearance.rootRef }),
    [appearance]
  );
  const visualEngineSlice = useMemo(
    () => ({ state: visualEngine.state, updateVisualEngine: visualEngine.updateVisualEngine, resetVisualEngine: visualEngine.resetVisualEngine, setDefaultSolver: visualEngine.setDefaultSolver }),
    [visualEngine]
  );

  return {
    activePillar: nav.activePillar, selectPillar: nav.selectPillar,
    isAppSettingsFullPageOpen: nav.isAppSettingsFullPageOpen, setIsAppSettingsFullPageOpen: nav.setIsAppSettingsFullPageOpen,
    role: nav.role, handleRoleChange: nav.handleRoleChange,
    editorMode: nav.editorMode, setEditorMode: nav.setEditorMode,
    isAuthenticatedSim: nav.isAuthenticatedSim, toggleAuthSim: nav.toggleAuthSim,
    activeSnapshotId: nav.activeSnapshotId, setActiveSnapshotId: nav.setActiveSnapshotId,
    settingsSelection: nav.settingsSelection, selectSettings: nav.selectSettings,
    activeSettingsTabOpen: nav.activeSettingsTabOpen, setActiveSettingsTabOpen: nav.setActiveSettingsTabOpen,
    workspace, account, appearance: appearanceSlice, visualEngine: visualEngineSlice, deepExplorer,
    presets: presetsConfig, configJson: presetsConfig, vaults, academy: profileAcademy, explore, profile: profileAcademy,
    prototypeThemeRootRef: appearance.rootRef,
    deepExplorerView: deepExplorer.defaultView, setDeepExplorerView: deepExplorer.setDefaultView,
    profileDeepExplorerView: profileAcademy.profileDeepExplorerView, setProfileDeepExplorerView: profileAcademy.setProfileDeepExplorerView,
    openDeepExplorerWorkspaceTab, openAdaptiveSettingsHub, saveActiveModeToVaultConfig, handleRemixInEditor,

    // @deprecated M1->M2/M3 compat shims (retained so untouched M2/M3 files compile cleanly)
    isPreviewAsVisitor: nav.isPreviewAsVisitor, setIsPreviewAsVisitor: nav.setIsPreviewAsVisitor, effectiveVisitorView: nav.effectiveVisitorView,
    exploreSubTab: explore.exploreSubTab, setExploreSubTab: explore.setExploreSubTab,
    searchQuery: explore.searchQuery, setSearchQuery: explore.setSearchQuery,
    selectedLensFilter: explore.selectedLensFilter, setSelectedLensFilter: explore.setSelectedLensFilter,
    selectedTopic: explore.selectedTopic, setSelectedTopic: explore.setSelectedTopic,
    filteredExploreArtifacts: explore.filteredExploreArtifacts,
    sparkedIds: explore.sparkedIds, bookmarkedIds: explore.bookmarkedIds, followingHandles: explore.followingHandles,
    toggleSpark: explore.toggleSpark, toggleBookmark: explore.toggleBookmark, toggleFollowAuthor: explore.toggleFollowAuthor,
    quickPeekArtifact: explore.quickPeekArtifact, setQuickPeekArtifact: explore.setQuickPeekArtifact,
    profileSubTab: profileAcademy.profileSubTab, setProfileSubTab: profileAcademy.setProfileSubTab,
    selectedVaultHighlight: profileAcademy.selectedVaultHighlight, setSelectedVaultHighlight: profileAcademy.setSelectedVaultHighlight,
    scholarBio: account.profile.bio, setScholarBio,
    pinnedVaultIds: profileAcademy.pinnedVaultIds, togglePinVault: profileAcademy.togglePinVault,
    academyTree: profileAcademy.academyTree, addStudentSubNode: profileAcademy.addStudentSubNode,
    lmsStatuses: profileAcademy.lmsStatuses, selectedLmsNodeId: profileAcademy.selectedLmsNodeId, setSelectedLmsNodeId: profileAcademy.setSelectedLmsNodeId,
    completeLmsNodeQuiz: profileAcademy.completeLmsNodeQuiz,
    profileHelicopterView: profileAcademy.profileDeepExplorerView, setProfileHelicopterView: profileAcademy.setProfileDeepExplorerView,
    portfolioItems: profileAcademy.portfolioItems, cyclePortfolioStage: profileAcademy.cyclePortfolioStage,
    activeLensMode, setActiveLensMode,
    helicopterView: deepExplorer.defaultView, setHelicopterView: deepExplorer.setDefaultView,
    reorganizeBy: deepExplorer.reorganizeBy, setReorganizeBy: deepExplorer.setReorganizeBy,
    restructureMode: deepExplorer.restructureMode, setRestructureMode: deepExplorer.setRestructureMode,
    leftSidebarPinned: workspace.leftSidebarPinned, setLeftSidebarPinned: workspace.setLeftSidebarPinned,
    rightSidebarPinned: workspace.rightSidebarPinned, setRightSidebarPinned: workspace.setRightSidebarPinned,
    sandboxTitle, setSandboxTitle, sandboxMarkdown, setSandboxMarkdown, sandboxActiveTab, setSandboxActiveTab,
    graphSolver: visualEngine.state.defaultSolver, setGraphSolver: visualEngine.setDefaultSolver,
    settingsHubSection: nav.settingsHubSection, setSettingsHubSection: nav.setSettingsHubSection,
    openHelicopterWorkspaceTab: openDeepExplorerWorkspaceTab, publishManager: vaults,
  };
}
