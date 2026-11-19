import React, { useRef } from "react";
import { useThreePillarPrototypeController } from "./useThreePillarPrototypeController";
import { PrototypeNavigationShell } from "./components/PrototypeNavigationShell";
import { ExplorePillarView } from "./components/ExplorePillarView";
import { ExploreQuickPeekDrawer } from "./components/ExploreQuickPeekDrawer";
import { ProfilePillarView } from "./components/ProfilePillarView";
import { EditorPillarView } from "./components/EditorPillarView";

export default function ThreePillarPrototypePage() {
  const ctrl = useThreePillarPrototypeController();
  const exploreSearchRef = useRef<HTMLInputElement>(null);

  const handleFocusSearch = () => {
    ctrl.setActivePillar("explore");
    setTimeout(() => exploreSearchRef.current?.focus(), 50);
  };

  const handleOpenEditor = () => {
    ctrl.setEditorMode(ctrl.role === "visitor" ? "sandbox" : "live");
    ctrl.setActivePillar("editor");
  };

  const publishProps = {
    role: ctrl.role,
    vaults: ctrl.publishManager.vaults,
    notes: ctrl.publishManager.notes,
    selectedVaultId: ctrl.publishManager.selectedVaultId,
    selectedVault: ctrl.publishManager.selectedVault,
    onSelectVault: ctrl.publishManager.setSelectedVaultId,
    onToggleVaultPublish: ctrl.publishManager.toggleVaultPublish,
    onBulkVaultPublish: ctrl.publishManager.bulkSetVaultPublish,
    onUpdateVaultConfig: ctrl.publishManager.updateVaultConfig,
    onToggleNotePublish: ctrl.publishManager.toggleNotePublish,
    onBulkNotePublish: ctrl.publishManager.bulkSetNotePublish,
    onToggleNotePrivate: ctrl.publishManager.toggleNotePrivateLock,
  };

  return (
    <PrototypeNavigationShell
      activePillar={ctrl.activePillar}
      onSelectPillar={ctrl.setActivePillar}
      role={ctrl.role}
      onChangeRole={ctrl.handleRoleChange}
      editorMode={ctrl.editorMode}
      onChangeEditorMode={ctrl.setEditorMode}
      onFocusSearch={handleFocusSearch}
      onOpenPublishTab={ctrl.openPublishStudioTab}
      onOpenSettingsTab={ctrl.openSettingsWorkspaceTab}
    >
      {ctrl.activePillar === "explore" && (
        <ExplorePillarView
          subTab={ctrl.exploreSubTab}
          onChangeSubTab={ctrl.setExploreSubTab}
          searchQuery={ctrl.searchQuery}
          onChangeSearch={ctrl.setSearchQuery}
          searchInputRef={exploreSearchRef}
          selectedFormat={ctrl.selectedFormat}
          onChangeFormat={ctrl.setSelectedFormat}
          selectedTopic={ctrl.selectedTopic}
          onChangeTopic={ctrl.setSelectedTopic}
          artifacts={ctrl.filteredExploreArtifacts}
          sparkedIds={ctrl.sparkedIds}
          bookmarkedIds={ctrl.bookmarkedIds}
          onToggleSpark={ctrl.toggleSpark}
          onToggleBookmark={ctrl.toggleBookmark}
          onOpenQuickPeek={ctrl.setQuickPeekArtifact}
          onJumpToProfile={() => ctrl.setActivePillar("profile")}
        />
      )}

      {ctrl.activePillar === "profile" && (
        <ProfilePillarView
          role={ctrl.role}
          effectiveVisitorView={ctrl.effectiveVisitorView}
          isPreviewAsVisitor={ctrl.isPreviewAsVisitor}
          onTogglePreviewAsVisitor={() => ctrl.setIsPreviewAsVisitor((p) => !p)}
          subTab={ctrl.profileSubTab}
          onChangeSubTab={ctrl.setProfileSubTab}
          selectedVaultHighlight={ctrl.selectedVaultHighlight}
          onSelectVaultHighlight={ctrl.setSelectedVaultHighlight}
          lmsStatuses={ctrl.lmsStatuses}
          selectedLmsNodeId={ctrl.selectedLmsNodeId}
          onSelectLmsNode={ctrl.setSelectedLmsNodeId}
          onSubmitLmsQuiz={ctrl.completeLmsNodeQuiz}
          derivedViewMode={ctrl.derivedViewMode}
          onChangeDerivedViewMode={ctrl.setDerivedViewMode}
          kanbanTasks={ctrl.kanbanTasks}
          onCycleKanbanTask={ctrl.cycleKanbanTaskStatus}
          onOpenArtifactPeek={ctrl.setQuickPeekArtifact}
          onOpenEditor={handleOpenEditor}
        />
      )}

      {ctrl.activePillar === "editor" && (
        <EditorPillarView
          role={ctrl.role}
          editorMode={ctrl.editorMode}
          sandboxTitle={ctrl.sandboxTitle}
          sandboxMarkdown={ctrl.sandboxMarkdown}
          onChangeSandboxMarkdown={ctrl.setSandboxMarkdown}
          sandboxActiveTab={ctrl.sandboxActiveTab}
          onChangeSandboxActiveTab={ctrl.setSandboxActiveTab}
          graphSolver={ctrl.graphSolver}
          onChangeGraphSolver={ctrl.setGraphSolver}
          publishProps={publishProps}
          onOpenPublishTab={ctrl.openPublishStudioTab}
        />
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
