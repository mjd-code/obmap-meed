import React, { useRef } from "react";
import { useThreePillarPrototypeController } from "./useThreePillarPrototypeController";
import { PrototypeNavigationShell } from "./components/PrototypeNavigationShell";
import { ExplorePillarView } from "./components/ExplorePillarView";
import { ExploreQuickPeekDrawer } from "./components/ExploreQuickPeekDrawer";
import { ProfilePillarView } from "./components/ProfilePillarView";
import { EditorPillarView } from "./components/EditorPillarView";
import { EditorPublishStudioDrawer } from "./components/EditorPublishStudioDrawer";

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

  return (
    <PrototypeNavigationShell
      activePillar={ctrl.activePillar}
      onSelectPillar={ctrl.setActivePillar}
      role={ctrl.role}
      onChangeRole={ctrl.handleRoleChange}
      onFocusSearch={handleFocusSearch}
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
          onChangeEditorMode={ctrl.setEditorMode}
          sandboxTitle={ctrl.sandboxTitle}
          sandboxMarkdown={ctrl.sandboxMarkdown}
          onChangeSandboxMarkdown={ctrl.setSandboxMarkdown}
          graphSolver={ctrl.graphSolver}
          onChangeGraphSolver={ctrl.setGraphSolver}
          onOpenPublishStudio={() => ctrl.setIsPublishDrawerOpen(true)}
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

      <EditorPublishStudioDrawer
        open={ctrl.isPublishDrawerOpen}
        onClose={() => ctrl.setIsPublishDrawerOpen(false)}
        role={ctrl.role}
        editorMode={ctrl.editorMode}
        sandboxTitle={ctrl.sandboxTitle}
        scope={ctrl.publishScope}
        onChangeScope={ctrl.setPublishScope}
        lens={ctrl.publishLens}
        onChangeLens={ctrl.setPublishLens}
        visibility={ctrl.publishVisibility}
        onChangeVisibility={ctrl.setPublishVisibility}
        caption={ctrl.publishCaption}
        onChangeCaption={ctrl.setPublishCaption}
        onSubmitPublish={ctrl.handlePublishSubmit}
      />
    </PrototypeNavigationShell>
  );
}
