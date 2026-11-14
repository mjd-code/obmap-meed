import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/domains/auth/shared/hooks/useAuth";
import { useVaultStore } from "@/domains/vault/shared/stores/useVaultStore";
import { useVaultPermission } from "@/domains/auth/shared/hooks/useVaultPermission";
import { useVcsStore } from "@/domains/vcs/shared/stores/useVcsStore";
import { VcsCloudService } from "@/domains/vcs/shared/api/VcsCloudService";
import type { VcsCommit, VcsMergeRequest } from "@/domains/vcs/shared/utils/vcs.types";

/**
 * Headless controller for VcsSidebarPanel: synchronizes branches and commit history,
 * handles commit reverts, audit trail exports, and branch switching.
 */
export function useVcsSidebarController() {
  const { user } = useAuth();
  const currentVaultId = useVaultStore((s) => s.currentVaultId);
  const permissions = useVaultPermission();
  const canManage =
    permissions.role === "owner" ||
    permissions.role === "superadmin" ||
    permissions.role === "admin";

  const { branches, activeBranchId, activeBranchName, loadBranches } = useVcsStore();

  const [activeTab, setActiveTab] = useState<"branches" | "history" | "merges">("branches");
  const [commits, setCommits] = useState<VcsCommit[]>([]);
  const [mergeRequests] = useState<VcsMergeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  // Muat data cabang saat vault/user berubah
  useEffect(() => {
    if (!currentVaultId || !user) return;
    loadBranches(currentVaultId, user.id);
  }, [currentVaultId, user?.id]);

  // Muat data riwayat commit saat tab aktif berubah
  useEffect(() => {
    if (!currentVaultId || !activeBranchId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === "history") {
          const list = await VcsCloudService.listCommitHistory({
            vaultId: currentVaultId,
            branchId: activeBranchId,
            limit: 40,
          });
          setCommits(list);
        }
      } catch (err) {
        console.warn("Gagal memuat riwayat:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab, currentVaultId, activeBranchId]);

  const handleRevertCommit = async (commitId: string) => {
    if (!currentVaultId || !activeBranchId || !user) return;
    if (
      !confirm(
        "Revert commit ini? Sistem akan membuat commit baru yang mengembalikan konten ke versi tersebut."
      )
    ) {
      return;
    }

    try {
      await VcsCloudService.revertCommit({
        targetCommitId: commitId,
        vaultId: currentVaultId,
        branchId: activeBranchId,
        authorId: user.id,
      });

      toast.success("Revert berhasil dieksekusi sebagai commit baru");
      const updated = await VcsCloudService.listCommitHistory({
        vaultId: currentVaultId,
        branchId: activeBranchId,
        limit: 40,
      });
      setCommits(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal merevert commit";
      toast.error(message);
    }
  };

  const handleExportAuditTrail = () => {
    if (commits.length === 0) {
      toast.info("Belum ada riwayat commit untuk diekspor");
      return;
    }

    const jsonStr = JSON.stringify(commits, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vcs-audit-${activeBranchName}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit trail berhasil diunduh sebagai JSON");
  };

  const handleSwitchBranch = (branchId: string, branchName: string) => {
    useVcsStore.getState().setActiveBranch(branchId, branchName);
  };

  return {
    user,
    currentVaultId,
    canManage,
    branches,
    activeBranchId,
    activeBranchName,
    activeTab,
    setActiveTab,
    commits,
    mergeRequests,
    isLoading,
    isBranchModalOpen,
    setIsBranchModalOpen,
    isMergeModalOpen,
    setIsMergeModalOpen,
    handleRevertCommit,
    handleExportAuditTrail,
    handleSwitchBranch,
  };
}
