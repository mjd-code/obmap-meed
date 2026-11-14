import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { UserWithRole, AccountStatus } from "@/types/admin";
import type { AppRole } from "@/types/collaboration";
import { AdminService } from "@/domains/admin/shared/api/AdminService";
import { useAuth } from "@/domains/auth/shared/hooks/useAuth";

export interface UseAdminUserManagementControllerParams {
  users: UserWithRole[];
  onRefresh: () => void;
}

/**
 * Headless controller for AdminUserManagementTab: filters users, opens detail inspection,
 * and handles optimistic updates with rollback for platform roles and suspension status.
 */
export function useAdminUserManagementController({
  users: initialUsers,
  onRefresh,
}: UseAdminUserManagementControllerParams) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [inspectUser, setInspectUser] = useState<UserWithRole | null>(null);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.email || "").toLowerCase().includes(q) ||
      (u.display_name || "").toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

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
      prev.map((u) => (u.id === targetUserId ? { ...u, status: nextStatus } : u))
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
    search,
    setSearch,
    updatingId,
    inspectUser,
    setInspectUser,
    handleRoleChange,
    handleToggleSuspension,
  };
}
