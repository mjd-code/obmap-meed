import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/global/api/supabaseClient";
import { useAuth } from "@/domains/auth/shared/hooks/useAuth";
import { useVaultStore } from "@/domains/vault/shared/stores/useVaultStore";
import { useVaultPermission } from "@/domains/auth/shared/hooks/useVaultPermission";
import { useVcsStore } from "@/domains/vcs/shared/stores/useVcsStore";
import { NoteService } from "@/domains/vault/shared/api/NoteService";
import { PublicReaderService } from "@/domains/community/shared/api/PublicReaderService";
import { DEFAULT_PUBLIC_LICENSE } from "@/domains/auth/shared/api/policyEngine";
import type { NoteRecord, VaultVisibility } from "@/types/collaboration";
import { getPublicNoteUrl } from "@/domains/collaboration/shared/utils/publicUrlHelper";
import { VcsCloudService } from "@/domains/vcs/shared/api/VcsCloudService";
import { VcsMicroRevisionService } from "@/domains/vcs/shared/api/VcsMicroRevisionService";
import { VcsSyncQueueService } from "@/domains/vcs/shared/api/VcsSyncQueueService";
import type {
  VcsCommit,
  LocalMicroRevision,
} from "@/domains/vcs/shared/utils/vcs.types";

export interface DocumentSharePopoverProps {
  noteId: string;
  noteTitle: string;
  currentContent: string;
  onContentRestore: (newContent: string) => void;
}

function buildFallbackDraftNote(
  noteId: string,
  vaultId: string,
  authorId: string,
  noteTitle: string,
  currentContent: string,
): NoteRecord {
  const nowIso = new Date().toISOString();
  return {
    id: noteId,
    vault_id: vaultId,
    author_id: authorId,
    title: noteTitle || "Untitled",
    slug: NoteService.slugify(noteTitle || noteId) || "untitled",
    content: currentContent,
    frontmatter: { local_node_id: noteId },
    status: "draft",
    version: 1,
    published_at: null,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

/**
 * Headless controller for CollabDocumentSharePopover.
 * Coordinates note publication state, inline VCS commits, cloud/local history, and diff inspection.
 */
export function useCollabDocumentShareController({
  noteId,
  noteTitle,
  currentContent,
  onContentRestore,
}: DocumentSharePopoverProps) {
  const { user, profile } = useAuth();
  const currentVaultId = useVaultStore((state) => state.currentVaultId);
  const permissions = useVaultPermission();
  const { pendingSyncCount, activeBranchId, activeBranchName } = useVcsStore();

  // State Kontrol Publikasi
  const [noteRecord, setNoteRecord] = useState<NoteRecord | null>(null);
  const [publishedContent, setPublishedContent] = useState<string>("");
  const [publicUrl, setPublicUrl] = useState<string>("");
  const [vaultVisibility, setVaultVisibility] = useState<VaultVisibility>(
    permissions.vaultVisibility
  );
  const [noteLicense, setNoteLicense] = useState<string>(DEFAULT_PUBLIC_LICENSE);
  const [isCopied, setIsCopied] = useState(false);
  const [processing, setProcessing] = useState(false);

  // State Inline Commit
  const [commitMessage, setCommitMessage] = useState("");
  const [isCommitting, setIsCommitting] = useState(false);

  // State Inline Riwayat
  const [historyTab, setHistoryTab] = useState<"cloud" | "local">("cloud");
  const [cloudCommits, setCloudCommits] = useState<VcsCommit[]>([]);
  const [microRevisions, setMicroRevisions] = useState<LocalMicroRevision[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // State Modal (Khusus Diff Visual & Linter Publikasi)
  const [linterOpen, setLinterOpen] = useState(false);
  const [linterAction, setLinterAction] = useState<"publish" | "review">("publish");
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffViewContent, setDiffViewContent] = useState<string | null>(null);
  const [diffLabel, setDiffLabel] = useState<string>("");
  const [claimModalOpen, setClaimModalOpen] = useState(false);

  // Muat data publikasi dan slug
  const loadNoteData = useCallback(async () => {
    if (!currentVaultId || !noteId) return;
    try {
      const [existing, visMeta] = await Promise.all([
        NoteService.findNoteInVault(currentVaultId, noteId, noteTitle),
        PublicReaderService.getVaultVisibility(currentVaultId),
      ]);
      setVaultVisibility(visMeta.visibility);

      if (existing) {
        setNoteRecord(existing);
        const existingLicense = (existing.frontmatter as Record<string, unknown> | undefined)
          ?.license;
        setNoteLicense(
          typeof existingLicense === "string" && existingLicense.trim()
            ? existingLicense
            : visMeta.defaultLicense
        );
        if (existing.published_at) {
          const revisions = await NoteService.getRevisions(existing.id);
          const pubTime = new Date(existing.published_at).getTime();
          const lastPub =
            revisions.find((r) => new Date(r.created_at).getTime() <= pubTime) ??
            revisions[0];
          if (lastPub) {
            setPublishedContent(lastPub.content);
          }
        } else {
          setPublishedContent("");
        }
        const generatedUrl = await getPublicNoteUrl(currentVaultId, existing.slug);
        setPublicUrl(generatedUrl);
      } else {
        setNoteRecord(
          buildFallbackDraftNote(
            noteId,
            currentVaultId,
            user?.id || "",
            noteTitle,
            currentContent,
          ),
        );
        setPublishedContent("");
      }
    } catch {
      // Fallback draft lokal
      setNoteRecord(
        buildFallbackDraftNote(
          noteId,
          currentVaultId,
          user?.id || "",
          noteTitle,
          currentContent,
        ),
      );
      setPublishedContent("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVaultId, noteId, noteTitle, user?.id]);

  // Muat riwayat commit cloud & snapshot lokal secara inline
  const loadHistory = useCallback(async () => {
    if (!currentVaultId || !noteId) return;
    setIsLoadingHistory(true);
    try {
      const localRevs = await VcsMicroRevisionService.getNoteRevisions(
        currentVaultId,
        noteId,
      );
      setMicroRevisions(localRevs);

      if (activeBranchId && navigator.onLine) {
        const commits = await VcsCloudService.listCommitHistory({
          vaultId: currentVaultId,
          branchId: activeBranchId,
          scope: "file",
          targetPath: `${noteTitle}.md`,
          limit: 20,
        });
        setCloudCommits(commits);
      }
    } catch (err) {
      console.warn("Gagal memuat riwayat dokumen:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [activeBranchId, currentVaultId, noteId, noteTitle]);

  useEffect(() => {
    loadNoteData();
    loadHistory();
  }, [loadNoteData, loadHistory]);

  const isPublished = noteRecord?.status === "published";
  const isInReview = noteRecord?.status === "in_review";
  const hasDiff =
    Boolean(publishedContent) && publishedContent.trim() !== currentContent.trim();

  // Handler Salin Tautan
  const handleCopyLink = async () => {
    if (!publicUrl) return;
    const fullUrl = `${window.location.origin}${publicUrl}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setIsCopied(true);
      toast.success("Tautan publik berhasil disalin ke clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin tautan.");
    }
  };

  // Handler Mulai Publikasi
  const handleStartPublish = () => {
    if (!profile?.username) {
      setClaimModalOpen(true);
      return;
    }
    setLinterAction("publish");
    setLinterOpen(true);
  };

  const handleStartReview = () => {
    setLinterAction("review");
    setLinterOpen(true);
  };

  // Eksekusi Publish / Update ke Web
  const handlePublishExecution = async (bundledContent: string) => {
    if (!noteRecord || !currentVaultId) return;
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
      const updatedLicense = (updated.frontmatter as Record<string, unknown> | undefined)?.license;
      if (typeof updatedLicense === "string" && updatedLicense.trim()) {
        setNoteLicense(updatedLicense);
      }
      if (vaultVisibility === "private") {
        await PublicReaderService.updateVaultVisibility(
          currentVaultId,
          "public_unlisted",
          noteLicense
        );
        setVaultVisibility("public_unlisted");
      }
      const newUrl = await getPublicNoteUrl(currentVaultId, updated.slug);
      setPublicUrl(newUrl);

      toast.success(`Catatan "${updated.title}" berhasil dipublikasikan!`, {
        action: {
          label: "Buka",
          onClick: () => window.open(newUrl, "_blank"),
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
  };

  // Eksekusi Unpublish (Tarik dari publikasi web)
  const handleUnpublish = async () => {
    if (!noteRecord || !currentVaultId) return;
    setProcessing(true);
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("notes")
        .update({
          status: "draft",
          published_at: null,
          updated_at: nowIso,
        })
        .eq("id", noteRecord.id)
        .select()
        .single();

      if (error) throw error;

      const updated = data as NoteRecord;
      setNoteRecord(updated);
      setPublishedContent("");
      toast.success(
        `Catatan "${noteRecord.title}" ditarik dari web (kembali ke draf privat).`,
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal membatalkan publikasi catatan.";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  // Eksekusi Review Submission
  const handleReviewSubmission = async (bundledContent: string) => {
    if (!noteRecord || !currentVaultId) return;
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
  };

  // Eksekusi Inline Commit Dokumen
  const handleInlineCommit = async () => {
    if (!currentVaultId || !user) return;
    if (!commitMessage.trim()) {
      toast.error("Pesan commit wajib diisi");
      return;
    }
    if (!activeBranchId) {
      toast.error("Pilih branch aktif terlebih dahulu");
      return;
    }

    setIsCommitting(true);
    try {
      if (navigator.onLine) {
        await VcsCloudService.createExplicitCommit({
          vaultId: currentVaultId,
          branchId: activeBranchId,
          message: commitMessage.trim(),
          authorId: user.id,
          scope: "file",
          targetPath: `${noteTitle}.md`,
          items: [
            {
              path: `${noteTitle}.md`,
              title: noteTitle,
              content: currentContent,
              itemType: "markdown",
              changeType: "modified",
            },
          ],
        });

        await VcsMicroRevisionService.squashRevisionsForNote(currentVaultId, noteId);
        toast.success(
          `Commit berhasil disimpan ke branch "${activeBranchName || "main"}"`,
        );
      } else {
        await VcsSyncQueueService.enqueue({
          vaultId: currentVaultId,
          branchId: activeBranchId,
          commitData: {
            id: "",
            vaultId: currentVaultId,
            branchId: activeBranchId,
            commitHash: "",
            parentCommitId: null,
            message: commitMessage.trim(),
            scope: "file",
            targetPath: `${noteTitle}.md`,
            authorId: user.id,
            isRevert: false,
            revertedCommitId: null,
            createdAt: new Date().toISOString(),
          },
          items: [
            {
              id: "",
              commitId: "",
              path: `${noteTitle}.md`,
              blobHash: "",
              itemType: "markdown",
              title: noteTitle,
              changeType: "modified",
              sizeBytes: currentContent.length,
            },
          ],
          blobs: [
            {
              blobHash: "",
              contentText: currentContent,
              mimeType: "text/markdown",
              sizeBytes: currentContent.length,
            },
          ],
        });

        toast.info("Tersimpan di antrean offline. Akan disinkronkan saat online.");
      }

      setCommitMessage("");
      await loadHistory();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal menyimpan commit";
      toast.error(message);
    } finally {
      setIsCommitting(false);
    }
  };

  // Pulihkan Versi dari Cloud Commit
  const handleRestoreCloudCommit = async (commit: VcsCommit) => {
    try {
      const items = await VcsCloudService.getCommitItems(commit.id);
      const target = items.find((i) => i.path === `${noteTitle}.md`) || items[0];
      if (target) {
        const text = (await VcsCloudService.getBlobContent(target.blobHash)) || "";
        onContentRestore(text);
        toast.success(`Konten dipulihkan ke commit: "${commit.message}"`);
      } else {
        toast.error("Konten catatan tidak ditemukan dalam commit ini.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal memulihkan versi catatan.";
      toast.error(message);
    }
  };

  // Pratinjau Diff Commit Cloud
  const handleInspectCloudCommit = async (commit: VcsCommit) => {
    try {
      const items = await VcsCloudService.getCommitItems(commit.id);
      const target = items.find((i) => i.path === `${noteTitle}.md`) || items[0];
      if (target) {
        const text = (await VcsCloudService.getBlobContent(target.blobHash)) || "";
        setDiffViewContent(text);
        setDiffLabel(
          `Commit: ${commit.message} (${commit.commitHash.substring(0, 7)})`,
        );
        setDiffOpen(true);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal memuat perbandingan.";
      toast.error(message);
    }
  };

  const handleInspectPublishedDiff = () => {
    setDiffViewContent(publishedContent);
    setDiffLabel("Perbedaan: Versi Terbit Web vs Editan Saat Ini");
    setDiffOpen(true);
  };

  const handleInspectLocalRevision = (rev: LocalMicroRevision) => {
    setDiffViewContent(rev.content);
    setDiffLabel(`Snapshot: ${new Date(rev.timestamp).toLocaleString()}`);
    setDiffOpen(true);
  };

  const handleRestoreLocalRevision = (rev: LocalMicroRevision) => {
    onContentRestore(rev.content);
    toast.success("Catatan dipulihkan dari snapshot lokal.");
  };

  const handleOpenPublicUrl = () => {
    if (publicUrl) {
      window.open(publicUrl, "_blank");
    }
  };

  const handleClaimSuccess = () => {
    setLinterAction("publish");
    setLinterOpen(true);
  };

  const handleVaultVisibilityChange = async (nextVisibility: VaultVisibility) => {
    if (!currentVaultId) return;
    setProcessing(true);
    const ok = await PublicReaderService.updateVaultVisibility(
      currentVaultId,
      nextVisibility,
      noteLicense
    );
    setProcessing(false);
    if (!ok) {
      toast.error("Gagal memperbarui visibilitas vault.");
      return;
    }
    setVaultVisibility(nextVisibility);
    toast.success(`Visibilitas vault diubah ke ${nextVisibility}.`);
  };

  return {
    isReady: Boolean(currentVaultId && user),
    currentVaultId: currentVaultId || "",
    permissions,
    vaultVisibility,
    noteLicense,
    pendingSyncCount,
    activeBranchName,
    noteRecord,
    publishedContent,
    publicUrl,
    isCopied,
    processing,
    commitMessage,
    setCommitMessage,
    isCommitting,
    historyTab,
    setHistoryTab,
    cloudCommits,
    microRevisions,
    isLoadingHistory,
    linterOpen,
    setLinterOpen,
    linterAction,
    diffOpen,
    setDiffOpen,
    diffViewContent,
    diffLabel,
    claimModalOpen,
    setClaimModalOpen,
    isPublished,
    isInReview,
    hasDiff,
    loadHistory,
    handleCopyLink,
    handleStartPublish,
    handleStartReview,
    handlePublishExecution,
    handleUnpublish,
    handleReviewSubmission,
    handleInlineCommit,
    handleRestoreCloudCommit,
    handleInspectCloudCommit,
    handleInspectPublishedDiff,
    handleInspectLocalRevision,
    handleRestoreLocalRevision,
    handleOpenPublicUrl,
    handleClaimSuccess,
    handleVaultVisibilityChange,
  };
}
