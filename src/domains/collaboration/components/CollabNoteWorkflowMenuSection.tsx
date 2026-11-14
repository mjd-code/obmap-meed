import React from "react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/global/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/global/ui/dialog";
import { Badge } from "@/global/ui/badge";
import { TwoStageLinterModal } from "@/domains/collaboration/components/CollabTwoStageLinterModal";
import { DiffViewer } from "@/domains/collaboration/components/CollabDiffViewer";
import { ClaimUsernameModal } from "@/domains/settings/components/SettingsClaimUsernameModal";
import {
  Globe,
  Send,
  Eye,
  CheckCircle,
  Clock,
  BookOpen,
} from "lucide-react";
import {
  useCollabNoteWorkflowController,
  type NoteWorkflowMenuSectionProps,
} from "@/domains/collaboration/shared/hooks/useCollabNoteWorkflowController";

export type { NoteWorkflowMenuSectionProps };

/** Declarative dropdown menu section displaying publication status and workflow actions. */
export const NoteWorkflowMenuSection: React.FC<NoteWorkflowMenuSectionProps> = ({
  nodeId,
  nodeTitle,
  currentContent,
}) => {
  const controller = useCollabNoteWorkflowController({
    nodeId,
    nodeTitle,
    currentContent,
  });

  if (!controller.isReady || !controller.noteRecord) return null;

  const { noteRecord, permissions } = controller;

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1">
        Publikasi Web
      </DropdownMenuLabel>

      {/* Baris Status Publikasi */}
      <div className="flex items-center justify-between px-2 py-1.5 text-xs">
        <span className="text-muted-foreground">Status</span>
        {controller.isPublished ? (
          <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10px] px-1.5 py-0 font-medium gap-1">
            <CheckCircle className="w-2.5 h-2.5" />
            Terbit v{noteRecord.version}
          </Badge>
        ) : noteRecord.status === "in_review" ? (
          <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[10px] px-1.5 py-0 font-medium gap-1">
            <Clock className="w-2.5 h-2.5" />
            In Review
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 text-muted-foreground"
          >
            Draf Lokal
          </Badge>
        )}
      </div>

      {/* Aksi Diff jika konten telah berubah dari versi terbit */}
      {controller.hasDiff && (
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            controller.setDiffOpen(true);
          }}
          className="text-xs"
        >
          <Eye className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
          Bandingkan Perubahan (Diff)
        </DropdownMenuItem>
      )}

      {/* Aksi Publish bagi yang memiliki izin */}
      {permissions.canPublish && (
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            controller.handleOpenPublishLinter();
          }}
          disabled={controller.processing}
          className="text-xs font-medium text-primary focus:text-primary"
        >
          <Globe className="w-3.5 h-3.5 mr-2" />
          {controller.isPublished ? "Perbarui di Web..." : "Publikasikan ke Web..."}
        </DropdownMenuItem>
      )}

      {/* Aksi Ajukan Review bagi Contributor */}
      {!permissions.isReadOnly &&
        !permissions.canPublish &&
        permissions.canEdit &&
        noteRecord.status !== "in_review" && (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              controller.handleOpenReviewLinter();
            }}
            disabled={controller.processing}
            className="text-xs"
          >
            <Send className="w-3.5 h-3.5 mr-2 text-amber-500" />
            Ajukan Review...
          </DropdownMenuItem>
        )}

      {/* Aksi Buka Halaman Publik jika sudah terbit */}
      {controller.isPublished && (
        <DropdownMenuItem onSelect={controller.handleOpenPublicPage} className="text-xs">
          <BookOpen className="h-3.5 w-3.5 mr-2 text-primary" />
          Buka Halaman Web
        </DropdownMenuItem>
      )}

      {/* Modal Linter */}
      <TwoStageLinterModal
        open={controller.linterOpen}
        onOpenChange={controller.setLinterOpen}
        vaultId={controller.currentVaultId}
        noteId={noteRecord.id}
        noteTitle={noteRecord.title}
        content={currentContent}
        actionType={controller.linterAction}
        onConfirmPublish={
          controller.linterAction === "publish"
            ? controller.handlePublishExecution
            : controller.handleReviewSubmission
        }
      />

      {/* Modal Diff Viewer Terbungkus Dialog */}
      <Dialog open={controller.diffOpen} onOpenChange={controller.setDiffOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Tinjauan Perubahan: {noteRecord.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden py-2">
            <DiffViewer
              originalContent={controller.publishedContent}
              modifiedContent={currentContent}
            />
          </div>
        </DialogContent>
      </Dialog>

      <ClaimUsernameModal
        open={controller.claimModalOpen}
        onOpenChange={controller.setClaimModalOpen}
        onSuccess={controller.handleClaimSuccess}
      />
    </>
  );
};
