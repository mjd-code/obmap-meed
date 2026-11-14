import { useEffect, useState } from "react";
import { supabase } from "@/global/api/supabaseClient";
import { useAuth } from "@/domains/auth/shared/hooks/useAuth";
import { useVaultStore } from "@/domains/vault/shared/stores/useVaultStore";
import {
  evaluateVaultPermissions,
  type ResourceRole,
} from "@/domains/auth/shared/api/policyEngine";
import type { VaultMemberRole, VaultVisibility } from "@/types/collaboration";

export interface VaultPermissions {
  role: ResourceRole;
  vaultVisibility: VaultVisibility;
  canEdit: boolean;
  canReview: boolean;
  canPublish: boolean;
  canComment: boolean;
  canManageMembers: boolean;
  canManageVisibility: boolean;
  isReadOnly: boolean;
  loading: boolean;
}

export function useVaultPermission(): VaultPermissions {
  const { user, profile } = useAuth();
  const currentVaultId = useVaultStore((s) => s.currentVaultId);
  const [role, setRole] = useState<ResourceRole>("none");
  const [vaultVisibility, setVaultVisibility] = useState<VaultVisibility>("private");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function evaluatePermissions() {
      if (!user) {
        if (isMounted) {
          setRole("none");
          setVaultVisibility("private");
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      // 1. Cek apakah Superadmin global
      const { data: superadminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "superadmin")
        .maybeSingle();

      if (superadminRole) {
        if (isMounted) {
          setRole("superadmin");
          setLoading(false);
        }
        return;
      }

      if (!currentVaultId) {
        if (isMounted) {
          setRole("none");
          setLoading(false);
        }
        return;
      }

      // 2. Cek metadata vault (owner + 4-state visibility)
      const { data: vaultRow } = await supabase
        .from("user_vaults")
        .select("user_id, visibility")
        .eq("id", currentVaultId)
        .maybeSingle();

      const resolvedVisibility =
        (vaultRow?.visibility as VaultVisibility | undefined) ?? "private";

      // 3. Cek apakah pengguna adalah anggota kolaborator di vault_members
      const { data: memberRow } = await supabase
        .from("vault_members")
        .select("role")
        .eq("vault_id", currentVaultId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberRow) {
        if (isMounted) {
          setVaultVisibility(resolvedVisibility);
          setRole(memberRow.role as VaultMemberRole);
          setLoading(false);
        }
        return;
      }

      if (vaultRow) {
        if (isMounted) {
          setVaultVisibility(resolvedVisibility);
          setRole(vaultRow.user_id === user.id ? "owner" : "none");
          setLoading(false);
        }
        return;
      }

      // 4. Jika vault tidak ditemukan di cloud dan user bukan siapa-siapa, STRICT NONE.
      if (isMounted) {
        setRole("none");
        setVaultVisibility("private");
        setLoading(false);
      }
    }

    evaluatePermissions();

    return () => {
      isMounted = false;
    };
  }, [user, currentVaultId]);

  const evaluated = evaluateVaultPermissions({
    role,
    accountStatus: profile?.account_status ?? "approved",
    visibility: vaultVisibility,
  });

  return {
    ...evaluated,
    vaultVisibility,
    loading,
  };
}
