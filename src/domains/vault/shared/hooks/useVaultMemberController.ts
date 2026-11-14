import React, { useState, useEffect, useRef } from "react";
import { Shield, ShieldCheck, Edit3, Eye } from "lucide-react";
import { toast } from "sonner";
import { VaultMemberService, type UserSearchResult } from "@/domains/vault/shared/api/VaultMemberService";
import type { VaultMemberRole } from "@/types/collaboration";
import type { VaultMemberWithProfile } from "@/types/admin";

export interface VaultRoleDisplayConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  desc: string;
}

export const VAULT_MEMBER_ROLE_CONFIG: Record<VaultMemberRole, VaultRoleDisplayConfig> = {
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    desc: "Kelola anggota, sunting, dan hapus catatan",
  },
  editor: {
    label: "Editor",
    icon: Edit3,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    desc: "Sunting, buat, dan publikasikan catatan",
  },
  contributor: {
    label: "Contributor",
    icon: Shield,
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    desc: "Buat draft dan ajukan review catatan",
  },
  viewer: {
    label: "Viewer",
    icon: Eye,
    color: "bg-muted text-muted-foreground border-border",
    desc: "Hanya dapat membaca catatan graf",
  },
};

export interface UseVaultMemberControllerParams {
  vaultId: string;
  isCloud: boolean;
  currentUserId?: string;
}

/**
 * Headless controller for VaultMemberSection: manages collaborator fetching,
 * debounced user search suggestions, click-outside dismissal, invites, role changes, and removals.
 */
export function useVaultMemberController({
  vaultId,
  isCloud,
  currentUserId,
}: UseVaultMemberControllerParams) {
  const [members, setMembers] = useState<VaultMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(false);

  // State Input & Auto-suggestion
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<VaultMemberRole>("editor");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchBoxRef = useRef<HTMLDivElement>(null);

  const loadMembers = async () => {
    if (!isCloud || !vaultId) return;
    setLoading(true);
    try {
      const data = await VaultMemberService.getVaultMembers(vaultId);
      setMembers(data);
    } catch (err) {
      console.error("[VaultMemberSection] Gagal memuat anggota:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [vaultId, isCloud]);

  // Handle outside click untuk menutup auto-suggestion popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced auto-suggestion
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2 || selectedUser) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const existingUserIds = members.map((m) => m.user_id);
      if (currentUserId) existingUserIds.push(currentUserId);

      const results = await VaultMemberService.searchUsers(searchQuery, existingUserIds);
      setSuggestions(results);
      setShowSuggestions(true);
      setIsSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, members, currentUserId, selectedUser]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (selectedUser) setSelectedUser(null);
  };

  const handleSearchFocus = () => {
    if (suggestions.length > 0) setShowSuggestions(true);
  };

  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUser(user);
    setSearchQuery(user.email || user.display_name || user.id);
    setShowSuggestions(false);
  };

  const handleInvite = async () => {
    if (!selectedUser || !currentUserId) {
      toast.error("Pilih pengguna dari daftar saran terlebih dahulu");
      return;
    }

    setIsSubmitting(true);
    const result = await VaultMemberService.addOrUpdateMember(
      vaultId,
      selectedUser.id,
      selectedRole,
      currentUserId
    );
    setIsSubmitting(false);

    if (result.success) {
      toast.success(`${selectedUser.display_name || selectedUser.email} ditambahkan sebagai ${selectedRole}`);
      setSelectedUser(null);
      setSearchQuery("");
      loadMembers();
    } else {
      toast.error(result.error || "Gagal mengundang anggota");
    }
  };

  const handleRoleChange = async (memberUserId: string, newRole: VaultMemberRole) => {
    if (!currentUserId) return;
    const res = await VaultMemberService.addOrUpdateMember(vaultId, memberUserId, newRole, currentUserId);
    if (res.success) {
      toast.success("Peran anggota diperbarui");
      loadMembers();
    } else {
      toast.error("Gagal memperbarui peran");
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!currentUserId) return;
    const res = await VaultMemberService.removeMember(vaultId, memberUserId, currentUserId);
    if (res.success) {
      toast.success("Akses anggota dicabut");
      loadMembers();
    } else {
      toast.error("Gagal mencabut akses");
    }
  };

  return {
    members,
    loading,
    searchQuery,
    suggestions,
    isSearching,
    showSuggestions,
    selectedUser,
    selectedRole,
    setSelectedRole,
    isSubmitting,
    searchBoxRef,
    handleSearchChange,
    handleSearchFocus,
    handleSelectUser,
    handleInvite,
    handleRoleChange,
    handleRemoveMember,
  };
}
