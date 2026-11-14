import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { NoteService } from "@/domains/vault/shared/api/NoteService";
import type { NoteRecord } from "@/types/collaboration";
import { useVaultStore } from "@/domains/vault/shared/stores/useVaultStore";
import { useVaultPermission } from "@/domains/auth/shared/hooks/useVaultPermission";
import { useAuth } from "@/domains/auth/shared/hooks/useAuth";
import { getPublicNoteUrl } from "@/domains/collaboration/shared/utils/publicUrlHelper";

export interface NoteWorkflowMenuSectionProps {
  nodeId: string;
  nodeTitle: string;
  currentContent: string;
}

function buildWorkflowDraftNote(
  nodeId: string,
  vaultId: string,
  nodeTitle: string,
  currentContent: string,
): NoteRecord {
  const nowIso = new Date().toISOString();
  return {
    id: nodeId,
    vault_id: vaultId,
    author_id: "",
    title: nodeTitle || "Untitled",
    slug: NoteService.slugify(nodeTitle || nodeId) || "untitled",
    content: currentContent,
    frontmatter: { local_node_id: nodeId },
    status: "draft",
    version: 1,
    published_at: null,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

/**
 * Headless controller for CollabNoteWorkflowMenuSection.
 * Loads note publication status/diffs and coordinates publish/review submissions.
 */
export function useCollabNoteWorkflowController({
  nodeId,
  nodeTitle,
  currentContent,
}: NoteWorkflowMenuSectionProps) {
  const currentVaultId = useVaultStore((s) => s.currentVaultId);
  const permissions = useVaultPermission();
  const { profile } = useAuth();

  const [noteRecord, setNoteRecord] = useState<NoteRecord | null>(null);
  const [publishedContent, setPublishedContent] = useState<string>("");
  const [linterOpen, setLinterOpen] = useState(false);
  const [linterAction, setLinterAction] = useState<"publish" | "review">("publish");
  const [diffOpen, setDiffOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);

  useEffect(() => {
    if (!currentVaultId || !nodeId) return;

    let isMounted = true;
    const loadNoteData = async () => {
      try {
        const existing = await NoteService.findNoteInVault(
          currentVaultId,
          nodeId,
          nodeTitle,
        );
        if (!isMounted) return;

        if (existing) {
          setNoteRecord(existing);
          if (existing.published_at) {
            const revisions = await NoteService.getRevisions(existing.id);
            const pubTime = new Date(existing.published_at).getTime();
            const lastPub =
              revisions.find((r) => new Date(r.created_at).getTime() <= pubTime) ??
              revisions[0];
            if (lastPub && isMounted) {
              setPublishedContent(lastPub.content);
            }
          }
        } else {
          setNoteRecord(
            buildWorkflowDraftNote(nodeId, currentVaultId, nodeTitle, currentContent),
          );
          setPublishedContent("");
        }
      } catch {
        if (isMounted) {
          setNoteRecord(
            buildWorkflowDraftNote(nodeId, currentVaultId, nodeTitle, currentContent),
          );
        }
      }
    };

    loadNoteData();
    return () => {
      isMounted = false;
    };
  }, [nodeId, currentVaultId, nodeTitle, currentContent]);

  const isPublished = noteRecord?.status === "published";
  const hasDiff =
    Boolean(publishedContent) &&
    publishedContent.trim() !== currentContent.trim();

  const handleStartPublish = useCallback(() => {
    // Jika akun belum punya username, minta klaim terlebih dahulu
    if (!profile?.username) {
      setClaimModalOpen(true);
      return;
    }
    setLinterAction("publish");
    setLinterOpen(true);
  }, [profile?.username]);

  const handleOpenPublishLinter = useCallback(() => {
    setLinterAction("publish");
    setLinterOpen(true);
  }, []);

  const handleOpenReviewLinter = useCallback(() => {
    setLinterAction("review");
    setLinterOpen(true);
  }, []);

  const handlePublishExecution = useCallback(
    async (bundledContent: string) => {
      if (!currentVaultId || !noteRecord) return;
      setProcessing(true);
      try {
        const updated = await NoteService.publishOrUpdateNote({
          vaultId: currentVaultId,
          nodeId: noteRecord.id,
          title: noteRecord.title,
          content: bundledContent,
          status: "published",
          frontmatter: noteRecord.frontmatter as Record<string, unknown>,
        });

        setNoteRecord(updated);
        setPublishedContent(updated.content);
        toast.success(`Catatan "${updated.title}" berhasil dipublikasikan ke Web!`, {
          action: {
            label: "Buka Pembaca",
            onClick: async () => {
              const url = await getPublicNoteUrl(currentVaultId, updated.slug);
              window.open(url, "_blank");
            },
          },
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Gagal mempublikasikan catatan.";
        toast.error(message);
        throw err;
      } finally {
        setProcessing(false);
      }
    },
    [currentVaultId, noteRecord],
  );

  const handleReviewSubmission = useCallback(
    async (bundledContent: string) => {
      if (!currentVaultId || !noteRecord) return;
      setProcessing(true);
      try {
        const updated = await NoteService.publishOrUpdateNote({
          vaultId: currentVaultId,
          nodeId: noteRecord.id,
          title: noteRecord.title,
          content: bundledContent,
          status: "in_review",
          frontmatter: noteRecord.frontmatter as Record<string, unknown>,
        });

        setNoteRecord(updated);
        toast.success("Catatan berhasil diajukan untuk ditinjau editor.");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Gagal mengajukan review.";
        toast.error(message);
        throw err;
      } finally {
        setProcessing(false);
      }
    },
    [currentVaultId, noteRecord],
  );

  const handleOpenPublicPage = useCallback(async () => {
    if (!currentVaultId || !noteRecord) return;
    const url = await getPublicNoteUrl(currentVaultId, noteRecord.slug);
    window.open(url, "_blank");
  }, [currentVaultId, noteRecord]);

  const handleClaimSuccess = useCallback(() => {
    // Setelah username berhasil diklaim, langsung lanjutkan alur linter/publish
    setLinterAction("publish");
    setLinterOpen(true);
  }, []);

  return {
    isReady: Boolean(currentVaultId && noteRecord),
    currentVaultId: currentVaultId || "",
    permissions,
    noteRecord,
    publishedContent,
    linterOpen,
    setLinterOpen,
    linterAction,
    diffOpen,
    setDiffOpen,
    processing,
    claimModalOpen,
    setClaimModalOpen,
    isPublished,
    hasDiff,
    handleStartPublish,
    handleOpenPublishLinter,
    handleOpenReviewLinter,
    handlePublishExecution,
    handleReviewSubmission,
    handleOpenPublicPage,
    handleClaimSuccess,
  };
}
