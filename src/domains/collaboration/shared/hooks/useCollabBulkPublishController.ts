import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/global/api/supabaseClient";
import {
  BulkPublishService,
  type BulkPublishItemState,
  type BulkPublishProgress,
} from "@/domains/collaboration/shared/api/BulkPublishService";
import { getPublicNoteUrl } from "@/domains/collaboration/shared/utils/publicUrlHelper";
import { useAuth } from "@/domains/auth/shared/hooks/useAuth";
import type { ExplorerNode } from "@/domains/workspace/components/WorkspaceFileExplorerTree";

export interface BulkPublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderNode: ExplorerNode | null;
  allNodes: ExplorerNode[];
  currentVaultId: string | null;
  selectedNodeIds?: string[];
}

/**
 * Headless controller for CollabBulkPublishModal.
 * Manages recursive item collection, batch publish progress, retries, and username verification.
 */
export function useCollabBulkPublishController({
  open,
  onOpenChange,
  folderNode,
  allNodes,
  currentVaultId,
  selectedNodeIds,
}: BulkPublishModalProps) {
  const { user } = useAuth();

  const [items, setItems] = useState<BulkPublishItemState[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<BulkPublishProgress>({
    total: 0,
    completed: 0,
    succeeded: 0,
    failed: 0,
    percent: 0,
  });

  // Guard: Klaim Username jika pengguna lama belum memilikinya
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [publicReaderUrl, setPublicReaderUrl] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open && folderNode) {
      let targetNodes: ExplorerNode[] = [];

      if (selectedNodeIds && selectedNodeIds.length > 0) {
        const selectedSet = new Set(selectedNodeIds);
        targetNodes = allNodes.filter((n) => selectedSet.has(n.id));
      } else {
        targetNodes = BulkPublishService.collectDescendantsRecursive(
          folderNode.id,
          allNodes,
          true,
        ) as ExplorerNode[];
      }

      const initial = BulkPublishService.initializeItems(targetNodes);
      setItems(initial);
      setCheckedIds(new Set(initial.map((i) => i.nodeId)));
      setProgress({
        total: initial.length,
        completed: 0,
        succeeded: 0,
        failed: 0,
        percent: 0,
      });
      setIsRunning(false);
      setPublicReaderUrl(null);
    }
  }, [open, folderNode, allNodes, selectedNodeIds]);

  const hasFailures = useMemo(
    () => items.some((i) => i.status === "failed"),
    [items],
  );
  const hasSuccesses = useMemo(
    () => items.some((i) => i.status === "success"),
    [items],
  );
  const allCompleted =
    items.length > 0 && items.every((i) => i.status === "success");

  // Periksa apakah pengguna sudah memiliki username sebelum mempublikasikan
  const verifyUsernameBeforeAction = useCallback(async (): Promise<boolean> => {
    if (!user) {
      toast.error("Anda harus masuk (login) terlebih dahulu.");
      return false;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile?.username) {
      setShowClaimModal(true);
      return false;
    }

    return true;
  }, [user]);

  // Jalankan Publikasi Massal
  const handleStartPublish = useCallback(async () => {
    const activeItems = items.filter((i) => checkedIds.has(i.nodeId));
    if (activeItems.length === 0) {
      toast.warning("Pilih minimal satu berkas atau folder untuk dipublikasikan.");
      return;
    }

    const canProceed = await verifyUsernameBeforeAction();
    if (!canProceed) return;

    setIsRunning(true);
    abortControllerRef.current = new AbortController();

    try {
      const finalItems = await BulkPublishService.runBulkPublish(
        currentVaultId as string,
        items,
        (prog, currentList) => {
          setProgress(prog);
          setItems([...currentList]);
        },
        abortControllerRef.current.signal,
      );

      // Ambil tautan publik catatan pertama yang berhasil terbit
      const firstSuccess = finalItems.find(
        (i) => i.status === "success" && i.publishedSlug,
      );
      if (firstSuccess && firstSuccess.publishedSlug && currentVaultId) {
        const url = await getPublicNoteUrl(
          currentVaultId,
          firstSuccess.publishedSlug,
        );
        setPublicReaderUrl(url);
      }

      if (finalItems.every((i) => i.status === "success")) {
        toast.success(
          `Berhasil mempublikasikan ${finalItems.length} catatan dalam subfolder!`,
        );
      } else {
        const failedCount = finalItems.filter((i) => i.status === "failed").length;
        toast.warning(
          `${failedCount} catatan mengalami kendala. Anda dapat mencoba lagi.`,
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memproses publikasi massal.";
      toast.error(message);
    } finally {
      setIsRunning(false);
    }
  }, [checkedIds, currentVaultId, items, verifyUsernameBeforeAction]);

  // Retry Satu Catatan Spesifik (Inline Retry)
  const handleRetrySingle = useCallback(
    async (nodeId: string) => {
      if (!currentVaultId || isRunning) return;

      const itemIndex = items.findIndex((i) => i.nodeId === nodeId);
      if (itemIndex === -1) return;

      const targetItem = items[itemIndex];

      const updated = await BulkPublishService.publishSingleNote(
        currentVaultId,
        targetItem,
        (state) => {
          setItems((prev) => {
            const next = [...prev];
            next[itemIndex] = state;
            return next;
          });
        },
      );

      setItems((prev) => {
        const next = [...prev];
        next[itemIndex] = updated;

        const completed = next.filter(
          (r) => r.status === "success" || r.status === "failed",
        ).length;
        const succeeded = next.filter((r) => r.status === "success").length;
        const failed = next.filter((r) => r.status === "failed").length;
        setProgress({
          total: next.length,
          completed,
          succeeded,
          failed,
          percent: Math.round((completed / next.length) * 100),
        });

        return next;
      });

      if (updated.status === "success") {
        toast.success(`"${updated.title}" berhasil diterbitkan.`);
        if (!publicReaderUrl && updated.publishedSlug) {
          getPublicNoteUrl(currentVaultId, updated.publishedSlug).then(
            setPublicReaderUrl,
          );
        }
      }
    },
    [currentVaultId, isRunning, items, publicReaderUrl],
  );

  // Retry Seluruh Catatan yang Gagal
  const handleRetryAllFailed = useCallback(async () => {
    if (!currentVaultId || isRunning) return;

    setIsRunning(true);
    abortControllerRef.current = new AbortController();

    const failedIndexes = items
      .map((it, idx) => (it.status === "failed" ? idx : -1))
      .filter((idx) => idx !== -1);

    for (const idx of failedIndexes) {
      if (abortControllerRef.current.signal.aborted) break;

      const item = items[idx];
      const updated = await BulkPublishService.publishSingleNote(
        currentVaultId,
        item,
        (state) => {
          setItems((prev) => {
            const next = [...prev];
            next[idx] = state;
            return next;
          });
        },
      );

      setItems((prev) => {
        const next = [...prev];
        next[idx] = updated;
        return next;
      });
    }

    setIsRunning(false);
  }, [currentVaultId, isRunning, items]);

  const handleDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!isRunning) {
        onOpenChange(nextOpen);
      }
    },
    [isRunning, onOpenChange],
  );

  const handleClaimSuccess = useCallback(() => {
    setShowClaimModal(false);
    toast.success("Username berhasil dibuat! Silakan lanjutkan publikasi.");
  }, []);

  return {
    items,
    isRunning,
    progress,
    showClaimModal,
    setShowClaimModal,
    publicReaderUrl,
    hasFailures,
    hasSuccesses,
    allCompleted,
    handleStartPublish,
    handleRetrySingle,
    handleRetryAllFailed,
    handleDialogOpenChange,
    handleClaimSuccess,
  };
}
