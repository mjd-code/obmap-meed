import { useState, useEffect, useRef } from "react";
import { VaultValidationService } from "@/domains/vault/shared/api/VaultValidationService";
import type { VaultMemberRole } from "@/types/collaboration";

export interface VaultRenameValidationState {
  status: "idle" | "checking" | "valid" | "duplicate" | "invalid";
  message?: string;
  slug?: string;
}

export interface UseVaultCardControllerParams {
  id: string;
  name: string;
  currentUserId?: string;
  userRole: VaultMemberRole | "owner" | "superadmin" | "none";
  onRename?: (newName: string) => void;
}

/**
 * Headless controller for VaultCard: manages rename validation debounce,
 * accordion expansion toggles, and role-derived permission flags.
 */
export function useVaultCardController({
  id,
  name,
  currentUserId,
  userRole,
  onRename,
}: UseVaultCardControllerParams) {
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [isMembersExpanded, setIsMembersExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(name);
  const [validationState, setValidationState] = useState<VaultRenameValidationState>({
    status: "idle",
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isOwner = userRole === "owner" || userRole === "superadmin";
  const isOwnerOrAdmin = isOwner || userRole === "admin";
  const isCollaborator = !isOwner && userRole !== "none";

  // Reset input jika prop name dari luar berubah
  useEffect(() => {
    setNewName(name);
  }, [name]);

  // Real-Time Inline Checker dengan debounce 300ms
  useEffect(() => {
    if (!isRenaming) {
      setValidationState({ status: "idle" });
      return;
    }

    const trimmed = newName.trim();
    if (trimmed === name.trim()) {
      setValidationState({ status: "idle" });
      return;
    }

    if (!trimmed) {
      setValidationState({
        status: "invalid",
        message: "Nama tidak boleh kosong.",
      });
      return;
    }

    setValidationState({ status: "checking" });

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      const res = await VaultValidationService.checkAvailability({
        name: trimmed,
        excludeVaultId: id,
        currentUserId,
      });

      if (res.available) {
        setValidationState({
          status: "valid",
          slug: res.slug,
          message: `Tersedia: /p/.../${res.slug}`,
        });
      } else {
        setValidationState({
          status: "duplicate",
          slug: res.slug,
          message: res.reason || "Nama atau slug vault sudah digunakan.",
        });
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [newName, isRenaming, name, id, currentUserId]);

  const canSave = newName.trim() !== name && validationState.status === "valid";

  const handleRename = () => {
    if (!canSave) return;
    if (onRename) {
      onRename(newName.trim());
    }
    setIsRenaming(false);
  };

  const handleCancelRename = () => {
    setNewName(name);
    setValidationState({ status: "idle" });
    setIsRenaming(false);
  };

  return {
    isStatsExpanded,
    toggleStatsExpanded: () => setIsStatsExpanded((prev) => !prev),
    isMembersExpanded,
    toggleMembersExpanded: () => setIsMembersExpanded((prev) => !prev),
    isRenaming,
    startRenaming: () => setIsRenaming(true),
    newName,
    setNewName,
    validationState,
    isOwner,
    isOwnerOrAdmin,
    isCollaborator,
    canSave,
    handleRename,
    handleCancelRename,
  };
}
