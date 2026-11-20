import React, { useRef } from "react";
import { EditorPillarView } from "./components/EditorPillarView";
import type { HelicopterExplorerBindings } from "./components/EditorHelicopterPanel";
import type { PublishTabBindings } from "./components/EditorPublishStudioTab";
import type { SubFunctionBindings } from "./components/EditorQuickSubFunctionPopovers";
import { ExplorePillarView } from "./components/ExplorePillarView";
import { ExploreQuickPeekDrawer } from "./components/ExploreQuickPeekDrawer";
import { ProfilePillarView } from "./components/ProfilePillarView";
import { PrototypeNavigationShell } from "./components/PrototypeNavigationShell";
import { PrototypeSettingsHub } from "./components/PrototypeSettingsHub";
import type { WorkspaceCanvasSettingsProps } from "./components/PrototypeWorkspaceCanvas";
import { useThreePillarPrototypeController } from "./useThreePillarPrototypeController";

export default function ThreePillarPrototypePage() {
  const ctrl = useThreePillarPrototypeController();
  const exploreSearchRef = useRef<HTMLInputElement>(null);

  const handleFocusSearch = () => {
    ctrl.selectPillar("explore");
    setTimeout(() => exploreSearchRef.current?.focus(), 50);
  };

  const handleOpenEditor = () => {
    ctrl.setEditorMode(ctrl.role === "visitor" ? "sandbox" : "live");
    ctrl.selectPillar("editor");
  };

  const publishProps: PublishTabBindings = {
    role: ctrl.role,
    vaults: ctrl.publishManager.vaults,
    notes: ctrl.publishManager.notes,
    selectedVaultId: ctrl.publishManager.selectedVaultId,
    selectedVault: ctrl.publishManager.selectedVault,
    shareSubTab: ctrl.publishManager.shareSubTab,
    targetScope: ctrl.publishManager.targetScope,
    selectedTargetNodeTitle: ctrl.publishManager.selectedTargetNodeTitle,
    accessGrants: ctrl.publishManager.accessGrants,
    snapshots: ctrl.publishManager.snapshots,
    mergeRequests: ctrl.publishManager.mergeRequests,
    onChangeShareSubTab: ctrl.publishManager.setShareSubTab,
    onChangeTargetScope: ctrl.publishManager.setTargetScope,
    onChangeTargetNodeTitle: ctrl.publishManager.setSelectedTargetNodeTitle,
    onSelectVault: ctrl.publishManager.setSelectedVaultId,
    onToggleVaultPublish: ctrl.publishManager.toggleVaultPublish,
    onBulkVaultPublish: ctrl.publishManager.bulkSetVaultPublish,
    onUpdateVaultConfig: ctrl.publishManager.updateVaultConfig,
    onToggleNotePublish: ctrl.publishManager.toggleNotePublish,
    onBulkNotePublish: ctrl.publishManager.bulkSetNotePublish,
    onToggleNotePrivate: ctrl.publishManager.toggleNotePrivateLock,
    onAddAccessGrant: ctrl.publishManager.addAccessGrant,
    onRemoveAccessGrant: ctrl.publishManager.removeAccessGrant,
    onCreateSnapshot: ctrl.publishManager.createSnapshot,
    onRollbackSnapshot: ctrl.publishManager.rollbackToSnapshot,
    onMergeKmr: ctrl.publishManager.mergeKmr,
  };

  const settingsHubProps: WorkspaceCanvasSettingsProps = {
    activeSection: ctrl.settingsHubSection,
    onChangeSection: ctrl.setSettingsHubSection,
    scholarBio: ctrl.scholarBio,
    onSaveBio: ctrl.setScholarBio,
    publishProps,
    activeLensMode: ctrl.activeLensMode,
    helicopterView: ctrl.helicopterView,
    graphSolver: ctrl.graphSolver,
    reorganizeBy: ctrl.reorganizeBy,
    restructureMode: ctrl.restructureMode,
    onUpdateVaultMode: (mode, helicopter) => {
      ctrl.setActiveLensMode(mode);
      ctrl.setHelicopterView(helicopter);
      ctrl.publishManager.updateVaultConfig(ctrl.publishManager.selectedVault.id, {
        primaryMode: mode,
        defaultHelicopterView: helicopter,
      });
    },
    onChangeGraphSolver: ctrl.setGraphSolver,
    onChangeReorganizeBy: ctrl.setReorganizeBy,
    onChangeRestructureMode: ctrl.setRestructureMode,
    onOpenHelicopterExplorerTab: () => ctrl.openHelicopterWorkspaceTab(),
  };

  const helicopterProps: HelicopterExplorerBindings = {
    activeLensMode: ctrl.activeLensMode,
    onChangeActiveLensMode: ctrl.setActiveLensMode,
    helicopterView: ctrl.helicopterView,
    onChangeHelicopterView: ctrl.setHelicopterView,
    reorganizeBy: ctrl.reorganizeBy,
    onChangeReorganizeBy: ctrl.setReorganizeBy,
    restructureMode: ctrl.restructureMode,
    onChangeRestructureMode: ctrl.setRestructureMode,
    graphSolver: ctrl.graphSolver,
    onChangeGraphSolver: ctrl.setGraphSolver,
    academyNodes: ctrl.academyTree,
    lmsStatuses: ctrl.lmsStatuses,
    selectedLmsNodeId: ctrl.selectedLmsNodeId,
    onSelectLmsNode: ctrl.setSelectedLmsNodeId,
    onAddStudentSubNode: ctrl.addStudentSubNode,
    onOpenSettingsHub: (section) => ctrl.openAdaptiveSettingsHub(section),
  };

  const subFunctions: SubFunctionBindings = {
    selectedVault: ctrl.publishManager.selectedVault,
    activeNodeTitle: ctrl.publishManager.selectedTargetNodeTitle,
    helicopterView: ctrl.helicopterView,
    reorganizeBy: ctrl.reorganizeBy,
    onToggleVaultPublish: ctrl.publishManager.toggleVaultPublish,
    onUpdateVaultConfig: ctrl.publishManager.updateVaultConfig,
    onCreateQuickSnapshot: ctrl.publishManager.createSnapshot,
    onOpenHelicopterView: ctrl.openHelicopterWorkspaceTab,
    onChangeReorganizeBy: ctrl.setReorganizeBy,
    onOpenSettingsHub: ctrl.openAdaptiveSettingsHub,
  };

  return (
    <PrototypeNavigationShell
      activePillar={ctrl.activePillar}
      isAppSettingsFullPageOpen={ctrl.isAppSettingsFullPageOpen}
      onSelectPillar={ctrl.selectPillar}
      role={ctrl.role}
      onChangeRole={ctrl.handleRoleChange}
      editorMode={ctrl.editorMode}
      onChangeEditorMode={ctrl.setEditorMode}
      isAuthenticatedSim={ctrl.isAuthenticatedSim}
      onToggleAuthSim={ctrl.toggleAuthSim}
      onFocusSearch={handleFocusSearch}
      onOpenSettingsHub={(section) => ctrl.openAdaptiveSettingsHub(section)}
    >
      {ctrl.isAppSettingsFullPageOpen && ctrl.activePillar !== "editor" ? (
        <PrototypeSettingsHub
          mode="full_page"
          {...settingsHubProps}
          onBackOrClose={() => ctrl.setIsAppSettingsFullPageOpen(false)}
        />
      ) : (
        <>
          {ctrl.activePillar === "explore" && (
            <ExplorePillarView
              subTab={ctrl.exploreSubTab}
              onChangeSubTab={ctrl.setExploreSubTab}
              searchQuery={ctrl.searchQuery}
              onChangeSearch={ctrl.setSearchQuery}
              searchInputRef={exploreSearchRef}
              selectedLensFilter={ctrl.selectedLensFilter}
              onChangeLensFilter={ctrl.setSelectedLensFilter}
              selectedTopic={ctrl.selectedTopic}
              onChangeTopic={ctrl.setSelectedTopic}
              artifacts={ctrl.filteredExploreArtifacts}
              sparkedIds={ctrl.sparkedIds}
              bookmarkedIds={ctrl.bookmarkedIds}
              onToggleSpark={ctrl.toggleSpark}
              onToggleBookmark={ctrl.toggleBookmark}
              onOpenQuickPeek={ctrl.setQuickPeekArtifact}
              onJumpToProfile={() => ctrl.selectPillar("profile")}
            />
          )}

          {ctrl.activePillar === "profile" && (
            <ProfilePillarView
              role={ctrl.role}
              effectiveVisitorView={ctrl.effectiveVisitorView}
              isPreviewAsVisitor={ctrl.isPreviewAsVisitor}
              scholarBio={ctrl.scholarBio}
              onSaveBio={ctrl.setScholarBio}
              pinnedVaultIds={ctrl.pinnedVaultIds}
              onTogglePinVault={ctrl.togglePinVault}
              onTogglePreviewAsVisitor={() => ctrl.setIsPreviewAsVisitor((p) => !p)}
              subTab={ctrl.profileSubTab}
              onChangeSubTab={ctrl.setProfileSubTab}
              selectedVaultHighlight={ctrl.selectedVaultHighlight}
              onSelectVaultHighlight={ctrl.setSelectedVaultHighlight}
              academyNodes={ctrl.academyTree}
              lmsStatuses={ctrl.lmsStatuses}
              selectedLmsNodeId={ctrl.selectedLmsNodeId}
              onSelectLmsNode={ctrl.setSelectedLmsNodeId}
              onSubmitLmsQuiz={ctrl.completeLmsNodeQuiz}
              onAddStudentSubNode={ctrl.addStudentSubNode}
              profileHelicopterView={ctrl.profileHelicopterView}
              onChangeProfileHelicopterView={ctrl.setProfileHelicopterView}
              portfolioItems={ctrl.portfolioItems}
              onCyclePortfolioStage={ctrl.cyclePortfolioStage}
              onOpenArtifactPeek={ctrl.setQuickPeekArtifact}
              onOpenEditor={handleOpenEditor}
              onOpenAccountSettings={() => ctrl.openAdaptiveSettingsHub("account_app")}
            />
          )}

          {ctrl.activePillar === "editor" && (
            <EditorPillarView
              role={ctrl.role}
              editorMode={ctrl.editorMode}
              sandboxTitle={ctrl.sandboxTitle}
              sandboxMarkdown={ctrl.sandboxMarkdown}
              onChangeSandboxTitle={ctrl.setSandboxTitle}
              onChangeSandboxMarkdown={ctrl.setSandboxMarkdown}
              sandboxActiveTab={ctrl.sandboxActiveTab}
              onChangeSandboxActiveTab={ctrl.setSandboxActiveTab}
              leftSidebarPinned={ctrl.leftSidebarPinned}
              rightSidebarPinned={ctrl.rightSidebarPinned}
              onToggleLeftPin={() => ctrl.setLeftSidebarPinned((p) => !p)}
              onToggleRightPin={() => ctrl.setRightSidebarPinned((p) => !p)}
              settingsHubProps={settingsHubProps}
              helicopterProps={helicopterProps}
              subFunctions={subFunctions}
            />
          )}
        </>
      )}

      <ExploreQuickPeekDrawer
        artifact={ctrl.quickPeekArtifact}
        onClose={() => ctrl.setQuickPeekArtifact(null)}
        onRemixInEditor={ctrl.handleRemixInEditor}
        isFollowing={
          ctrl.quickPeekArtifact
            ? ctrl.followingHandles.includes(ctrl.quickPeekArtifact.authorHandle)
            : false
        }
        onToggleFollow={ctrl.toggleFollowAuthor}
      />
    </PrototypeNavigationShell>
  );
}
