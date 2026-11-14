import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { UserWithRole, AccountStatus, PartnerInvitationRecord } from "@/types/admin";
import type { AppRole, ReleaseStage } from "@/types/collaboration";
import { AdminService } from "@/domains/admin/shared/api/AdminService";
import { ReleaseStageService } from "@/domains/auth/shared/api/ReleaseStageService";
import { useAuth } from "@/domains/auth/shared/hooks/useAuth";

export type UserStatusFilter = "all" | "pending_approval" | "active" | "suspended";

export interface UseAdminUserManagementControllerParams {
  users: UserWithRole[];
  onRefresh: () => void;
}

/**
 * Headless controller for AdminUserManagementTab: filters users, manages release stage &
 * partner invitations, and handles optimistic individual approvals, roles, and suspensions.
 */
export function useAdminUserManagementController({
  users: initialUsers,
  onRefresh,
}: UseAdminUserManagementControllerParams) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [inspectUser, setInspectUser] = useState<UserWithRole | null>(null);

  const [releaseStage, setReleaseStage] = useState<ReleaseStage>("stage_1_partner");
  const [stageUpdating, setStageUpdating] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [invitations, setInvitations] = useState<PartnerInvitationRecord[]>([]);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const loadReleaseControls = useCallback(async () => {
    const [stage, invites] = await Promise.all([
      ReleaseStageService.getActiveStage(),
      ReleaseStageService.listPartnerInvitations(),
    ]);
    setReleaseStage(stage);
    setInvitations(invites);
  }, []);

  useEffect(() => {
    void loadReleaseControls();
  }, [loadReleaseControls]);

  const pendingCount = users.filter((u) => u.status === "pending_approval").length;

  const filteredUsers = users.filter((u) => {
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? u.status !== "suspended" && u.status !== "pending_approval"
        : u.status === statusFilter;

    if (!matchesStatus) return false;

    const q = search.toLowerCase();
    return (
      (u.email || "").toLowerCase().includes(q) ||
      (u.display_name || "").toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const handleStageChange = async (nextStage: ReleaseStage) => {
    if (!currentUser) return;
    setStageUpdating(true);
    const res = await ReleaseStageService.setActiveStage(nextStage, currentUser.id);
    setStageUpdating(false);
    if (!res.success) {
      toast.error(res.error || "Gagal memperbarui tahap rilis platform.");
      return;
    }
    setReleaseStage(nextStage);
    toast.success(`Tahap rilis platform diubah ke ${nextStage}.`);
  };

  const handleCreateInvite = async () => {
    if (!currentUser || !inviteEmail.trim()) return;
    setCreatingInvite(true);
    const res = await ReleaseStageService.createPartnerInvitation(inviteEmail, currentUser.id);
    setCreatingInvite(false);
    if (!res.success || !res.invite) {
      toast.error(res.error || "Gagal membuat kode undangan mitra.");
      return;
    }
    setInviteEmail("");
    setInvitations((prev) => [res.invite!, ...prev]);
    toast.success(`Kode undangan dibuat: ${res.invite.invite_code}`);
  };

  // Optimistic UI untuk Persetujuan Individual User
  const handleApproveUser = async (targetUserId: string) => {
    if (!currentUser) return;
    const previousUsers = [...users];

    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetUserId
          ? { ...u, status: "active", account_status: "approved" }
          : u
      )
    );
    setUpdatingId(targetUserId);

    const res = await AdminService.approveUserAccount(targetUserId, currentUser.id);
    setUpdatingId(null);

    if (!res.success) {
      setUsers(previousUsers);
      toast.error(res.error || "Gagal menyetujui akun pengguna.");
      return;
    }

    toast.success("Akun pengguna disetujui dan diaktifkan.");
    onRefresh();
  };

  // Optimistic UI untuk Perubahan Role
  const handleRoleChange = async (targetUserId: string, newRole: AppRole) => {
    if (!currentUser) return;
    const previousUsers = [...users];

    setUsers((prev) =>
      prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
    );
    setUpdatingId(targetUserId);

    const res = await AdminService.updateUserRole(targetUserId, newRole, currentUser.id);

    setUpdatingId(null);
    if (!res.success) {
      setUsers(previousUsers);
      toast.error(res.error || "Gagal memperbarui peran pengguna.");
      return;
    }

    toast.success(`Peran berhasil diubah menjadi "${newRole}".`);
    onRefresh();
  };

  // Optimistic UI untuk Toggle Penangguhan Akun
  const handleToggleSuspension = async (
    targetUserId: string,
    currentStatus: AccountStatus = "active"
  ) => {
    if (!currentUser) return;
    const nextStatus: AccountStatus = currentStatus === "suspended" ? "active" : "suspended";
    const previousUsers = [...users];

    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetUserId
          ? {
              ...u,
              status: nextStatus,
              account_status: nextStatus === "suspended" ? "suspended" : "approved",
            }
          : u
      )
    );

    const res = await AdminService.toggleUserSuspension(targetUserId, nextStatus, currentUser.id);

    if (!res.success) {
      setUsers(previousUsers);
      toast.error(res.error || "Gagal memperbarui status akun.");
      return;
    }

    toast.success(
      nextStatus === "suspended"
        ? "Akun pengguna berhasil ditangguhkan."
        : "Akun pengguna berhasil diaktifkan kembali."
    );
    onRefresh();
  };

  return {
    currentUser,
    filteredUsers,
    pendingCount,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    updatingId,
    inspectUser,
    setInspectUser,
    releaseStage,
    stageUpdating,
    handleStageChange,
    inviteEmail,
    setInviteEmail,
    creatingInvite,
    invitations,
    handleCreateInvite,
    handleApproveUser,
    handleRoleChange,
    handleToggleSuspension,
  };
}
