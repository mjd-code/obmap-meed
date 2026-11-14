import type React from "react";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/domains/auth/shared/hooks/useAuth";
import { useVaultStore } from "@/domains/vault/shared/stores/useVaultStore";
import { VaultMemberService } from "@/domains/vault/shared/api/VaultMemberService";
import { AdminService } from "@/domains/admin/shared/api/AdminService";
import { useVaultPermission } from "@/domains/auth/shared/hooks/useVaultPermission";
import type { VaultMemberRole } from "@/types/collaboration";
import type { VaultMemberWithProfile } from "@/types/admin";

export const ROLE_DEFINITIONS = [
  {
    name: "Admin",
    role: "admin",
    desc: "Kontrol penuh: kelola anggota vault, skema, dan publikasi web.",
  },
  {
    name: "Editor",
    role: "editor",
    desc: "Meninjau draf kontributor, menyetujui perubahan, & menerbitkan catatan.",
  },
  {
    name: "Contributor",
    role: "contributor",
    desc: "Dapat membuat & mengedit draf lokal; mengajukan review ke Editor.",
  },
  {
    name: "Viewer",
    role: "viewer",
    desc: "Hanya dapat membaca catatan; tidak dapat mengubah isi atau menerbitkan.",
  },
];

/**
 * Headless controller for SettingsRolesSection.
 * Handles active vault member listing, role updates, email invitations, and superadmin access check.
 */
export function useSettingsRolesController() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentVaultId = useVaultStore((s) => s.currentVaultId);
  const permissions = useVaultPermission();

  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [members, setMembers] = useState<VaultMemberWithProfile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] =
    useState<VaultMemberRole>("contributor");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    AdminService.isCurrentUserSuperadmin().then(setIsSuperadmin);
  }, []);

  const loadMembers = useCallback(async () => {
    if (!currentVaultId) return;
    setLoadingMembers(true);
    const data = await VaultMemberService.getVaultMembers(currentVaultId);
    setMembers(data);
    setLoadingMembers(false);
  }, [currentVaultId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleInviteMember = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !currentVaultId || !inviteEmail.trim()) return;

      setInviting(true);
      const targetUser = await VaultMemberService.lookupUserByEmail(
        inviteEmail.trim(),
      );

      if (!targetUser) {
        setInviting(false);
        toast.error(
          `Pengguna dengan email "${inviteEmail}" tidak ditemukan di sistem.`,
        );
        return;
      }

      if (targetUser.id === user.id) {
        setInviting(false);
        toast.error("Anda adalah pemilik atau anggota aktif di vault ini.");
        return;
      }

      const res = await VaultMemberService.addOrUpdateMember(
        currentVaultId,
        targetUser.id,
        selectedRole,
        user.id,
      );

      setInviting(false);
      if (!res.success) {
        toast.error(res.error || "Gagal menambahkan anggota.");
        return;
      }

      toast.success(
        `Pengguna "${targetUser.email}" berhasil ditambahkan sebagai ${selectedRole}.`,
      );
      setInviteEmail("");
      loadMembers();
    },
    [currentVaultId, inviteEmail, loadMembers, selectedRole, user],
  );

  const handleRoleChange = useCallback(
    async (targetUserId: string, newRole: VaultMemberRole) => {
      if (!user || !currentVaultId) return;

      const res = await VaultMemberService.addOrUpdateMember(
        currentVaultId,
        targetUserId,
        newRole,
        user.id,
      );

      if (!res.success) {
        toast.error(res.error || "Gagal memperbarui peran anggota.");
        return;
      }

      toast.success("Peran anggota berhasil diperbarui.");
      loadMembers();
    },
    [currentVaultId, loadMembers, user],
  );

  const handleRemoveMember = useCallback(
    async (targetUserId: string) => {
      if (!user || !currentVaultId) return;

      const res = await VaultMemberService.removeMember(
        currentVaultId,
        targetUserId,
        user.id,
      );

      if (!res.success) {
        toast.error(res.error || "Gagal menghapus anggota.");
        return;
      }

      toast.success("Anggota berhasil dihapus dari vault ini.");
      loadMembers();
    },
    [currentVaultId, loadMembers, user],
  );

  const openAdminCockpit = useCallback(() => {
    navigate("/admin");
  }, [navigate]);

  return {
    userId: user?.id,
    currentVaultId,
    permissions,
    isSuperadmin,
    members,
    loadingMembers,
    inviteEmail,
    setInviteEmail,
    selectedRole,
    setSelectedRole,
    inviting,
    handleInviteMember,
    handleRoleChange,
    handleRemoveMember,
    openAdminCockpit,
  };
}
