import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/global/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/global/ui/tabs";
import { Button } from "@/global/ui/button";
import { Badge } from "@/global/ui/badge";
import { Input } from "@/global/ui/input";
import { TooltipProvider } from "@/global/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/global/ui/dialog";
import {
  Share2,
  Globe,
  GitCommit,
  History,
  GitBranch,
  Loader2,
} from "lucide-react";
import { VcsCoPresenceAvatars } from "@/domains/vcs/components/VcsCoPresenceAvatars";
import { TwoStageLinterModal } from "@/domains/collaboration/components/CollabTwoStageLinterModal";
import { DiffViewer } from "@/domains/collaboration/components/CollabDiffViewer";
import { ClaimUsernameModal } from "@/domains/settings/components/SettingsClaimUsernameModal";
import { CollabSharePublishTab } from "@/domains/collaboration/components/CollabSharePublishTab";
import { CollabShareHistoryTab } from "@/domains/collaboration/components/CollabShareHistoryTab";
import {
  useCollabDocumentShareController,
  type DocumentSharePopoverProps,
} from "@/domains/collaboration/shared/hooks/useCollabDocumentShareController";

export type { DocumentSharePopoverProps };

/** Declarative view for sharing, web publication, inline commits, and revision history. */
export const DocumentSharePopover: React.FC<DocumentSharePopoverProps> = ({
  noteId,
  noteTitle,
  currentContent,
  onContentRestore,
}) => {
  const controller = useCollabDocumentShareController({
    noteId,
    noteTitle,
    currentContent,
    onContentRestore,
  });

  if (!controller.isReady) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Popover>
        {/* Trigger Button: Share Button Ramping & Adaptif */}
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 sm:px-2.5 gap-1.5 text-xs font-medium rounded-md border-border/50 bg-background/50 hover:bg-accent/60 transition-colors shadow-none"
            title="Bagikan, Publikasi Web, & Version Control"
          >
            <Share2 className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Share</span>

            {/* Indikator Titik Sinkronisasi Offline */}
            {controller.pendingSyncCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            )}
          </Button>
        </PopoverTrigger>

        {/* Popover Content: Lebar Adaptif & Anti-Overflow Mobile */}
        <PopoverContent
          align="end"
          sideOffset={6}
          collisionPadding={12}
          className="w-[calc(100vw-1.5rem)] sm:w-84 max-w-[340px] p-3 shadow-xl border-border/60 bg-popover/95 backdrop-blur-md rounded-xl z-50 overflow-hidden"
        >
          {/* Header Ringkas: Co-Presence & Target Branch */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40">
            <div className="flex items-center gap-1.5 min-w-0">
              <Share2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground truncate">
                Bagikan & Versi
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <VcsCoPresenceAvatars
                vaultId={controller.currentVaultId}
                noteId={noteId}
              />
              <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                <GitBranch className="w-2.5 h-2.5 text-primary" />
                <span className="max-w-[70px] truncate">
                  {controller.activeBranchName || "main"}
                </span>
              </span>
            </div>
          </div>

          {/* Micro Segmented Tabs: 3 Pilar Utama */}
          <Tabs defaultValue="publish" className="w-full">
            <TabsList className="grid grid-cols-3 h-7.5 p-0.5 bg-muted/60 rounded-lg">
              <TabsTrigger
                value="publish"
                className="text-[11px] h-6.5 px-1 gap-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Globe className="w-3 h-3 text-primary shrink-0" />
                <span className="truncate">Publikasi</span>
              </TabsTrigger>
              <TabsTrigger
                value="commit"
                className="text-[11px] h-6.5 px-1 gap-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <GitCommit className="w-3 h-3 text-primary shrink-0" />
                <span className="truncate">Commit</span>
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="text-[11px] h-6.5 px-1 gap-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <History className="w-3 h-3 text-primary shrink-0" />
                <span className="truncate">Riwayat</span>
                {(controller.cloudCommits.length > 0 ||
                  controller.microRevisions.length > 0) && (
                  <span className="text-[9px] font-mono text-muted-foreground ml-0.5">
                    (
                    {controller.cloudCommits.length +
                      controller.microRevisions.length}
                    )
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <CollabSharePublishTab
              noteRecord={controller.noteRecord}
              isPublished={controller.isPublished}
              isInReview={controller.isInReview}
              hasDiff={controller.hasDiff}
              publicUrl={controller.publicUrl}
              isCopied={controller.isCopied}
              processing={controller.processing}
              canPublish={controller.permissions.canPublish}
              canManageVisibility={controller.permissions.canManageVisibility}
              isReadOnly={controller.permissions.isReadOnly}
              canEdit={controller.permissions.canEdit}
              vaultVisibility={controller.vaultVisibility}
              noteLicense={controller.noteLicense}
              onVaultVisibilityChange={controller.handleVaultVisibilityChange}
              onCopyLink={controller.handleCopyLink}
              onOpenPublicUrl={controller.handleOpenPublicUrl}
              onStartPublish={controller.handleStartPublish}
              onUnpublish={controller.handleUnpublish}
              onInspectPublishedDiff={controller.handleInspectPublishedDiff}
              onStartReview={controller.handleStartReview}
            />

            {/* TAB 2: INLINE QUICK COMMIT */}
            <TabsContent value="commit" className="mt-2.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/30 px-2 py-1 rounded border border-border/40">
                <span className="flex items-center gap-1">
                  <GitBranch className="w-3 h-3 text-primary" />
                  Target:
                </span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] bg-background/80 px-1.5 py-0 h-4.5"
                >
                  {controller.activeBranchName || "main"}
                </Badge>
              </div>

              <Input
                placeholder={`Pesan commit (misal: Perbarui ${noteTitle})...`}
                value={controller.commitMessage}
                onChange={(e) => controller.setCommitMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    controller.handleInlineCommit();
                  }
                }}
                className="h-7.5 text-xs font-sans placeholder:text-muted-foreground/60"
                disabled={
                  controller.permissions.isReadOnly || controller.isCommitting
                }
                autoFocus
              />

              <Button
                size="sm"
                onClick={controller.handleInlineCommit}
                disabled={
                  controller.isCommitting ||
                  controller.permissions.isReadOnly ||
                  !controller.commitMessage.trim()
                }
                className="w-full h-7.5 text-xs font-medium gap-1.5"
              >
                {controller.isCommitting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <GitCommit className="w-3 h-3" />
                )}
                <span>Simpan Commit (Enter)</span>
              </Button>

              <p className="text-[10px] text-muted-foreground text-center">
                {controller.permissions.isReadOnly
                  ? "Peran viewer hanya memiliki akses baca (read-only)."
                  : "Menyimpan snapshot perubahan dokumen ke branch aktif."}
              </p>
            </TabsContent>

            <CollabShareHistoryTab
              historyTab={controller.historyTab}
              onHistoryTabChange={controller.setHistoryTab}
              cloudCommits={controller.cloudCommits}
              microRevisions={controller.microRevisions}
              isLoadingHistory={controller.isLoadingHistory}
              onRefreshHistory={controller.loadHistory}
              onInspectCloudCommit={controller.handleInspectCloudCommit}
              onRestoreCloudCommit={controller.handleRestoreCloudCommit}
              onInspectLocalRevision={controller.handleInspectLocalRevision}
              onRestoreLocalRevision={controller.handleRestoreLocalRevision}
            />
          </Tabs>
        </PopoverContent>
      </Popover>

      {/* DIALOG DIFF VISUAL */}
      <Dialog open={controller.diffOpen} onOpenChange={controller.setDiffOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-4">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-sm font-semibold">
              {controller.diffLabel || `Tinjauan Perubahan: ${noteTitle}`}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden py-2 min-h-[300px]">
            <DiffViewer
              originalContent={
                controller.diffViewContent || controller.publishedContent
              }
              modifiedContent={currentContent}
              originalLabel="Versi Riwayat / Web"
              modifiedLabel="Versi Saat Ini di Editor"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL LINTER & CLAIM USERNAME */}
      <TwoStageLinterModal
        open={controller.linterOpen}
        onOpenChange={controller.setLinterOpen}
        vaultId={controller.currentVaultId}
        noteId={noteId}
        noteTitle={noteTitle}
        content={currentContent}
        actionType={controller.linterAction}
        onConfirmPublish={
          controller.linterAction === "publish"
            ? controller.handlePublishExecution
            : controller.handleReviewSubmission
        }
      />

      <ClaimUsernameModal
        open={controller.claimModalOpen}
        onOpenChange={controller.setClaimModalOpen}
        onSuccess={controller.handleClaimSuccess}
      />
    </TooltipProvider>
  );
};
