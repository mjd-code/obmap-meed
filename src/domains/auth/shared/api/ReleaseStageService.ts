import { supabase } from "@/global/api/supabaseClient";
import type { Json } from "@/global/api/supabaseTypes";
import type { PartnerInvitationRecord } from "@/types/admin";
import type { AccountLifecycleStatus, ReleaseStage } from "@/types/collaboration";

const STAGE_CACHE_TTL_MS = 60_000;
const LOCAL_STAGE_OVERRIDE_KEY = "obmap_release_stage_override";

export interface StageGateResult {
  allowed: boolean;
  reason?: "pending_approval" | "suspended" | "partner_invite_required";
}

export const RELEASE_STAGE_LABELS: Record<ReleaseStage, string> = {
  stage_1_partner: "Stage 1 · Closed Partner Pilot",
  stage_2_community_beta: "Stage 2 · Curated Community Beta",
  stage_3_commercial_ga: "Stage 3 · Open Commercial GA",
};

let cachedStage: { value: ReleaseStage; fetchedAt: number } | null = null;

function isValidReleaseStage(value: unknown): value is ReleaseStage {
  return (
    value === "stage_1_partner" ||
    value === "stage_2_community_beta" ||
    value === "stage_3_commercial_ga"
  );
}

/**
 * Coordinates the 3-phase release stage gate (`stage_1_partner`, `stage_2_community_beta`,
 * `stage_3_commercial_ga`) and closed partner invitation redemption (ADR-0009, STEP-01.3).
 */
export class ReleaseStageService {
  /** Clear in-memory stage cache (primarily for tests or admin stage switches). */
  static clearCache(): void {
    cachedStage = null;
  }

  /** Pure helper determining initial `account_status` for newly registered users by stage. */
  static resolveInitialAccountStatus(
    stage: ReleaseStage,
    hasValidInvite: boolean
  ): Extract<AccountLifecycleStatus, "approved" | "pending_approval"> {
    if (stage === "stage_3_commercial_ga") {
      return "approved";
    }
    if (hasValidInvite) {
      return "approved";
    }
    return "pending_approval";
  }

  /**
   * Pure deterministic Layer-1 workspace gate evaluator (ADR-0009).
   * Blocks `pending_approval` and `suspended` accounts from `/app` and `/vaults`
   * unless the actor holds global `superadmin`.
   */
  static canAccessWorkspaceByStage(params: {
    stage: ReleaseStage;
    accountStatus?: string | null;
    isSuperadmin?: boolean;
  }): StageGateResult {
    if (params.isSuperadmin) {
      return { allowed: true };
    }

    const status = params.accountStatus ?? "approved";

    if (status === "suspended") {
      return { allowed: false, reason: "suspended" };
    }

    if (status === "pending_approval") {
      return {
        allowed: false,
        reason:
          params.stage === "stage_1_partner"
            ? "partner_invite_required"
            : "pending_approval",
      };
    }

    if (params.stage === "stage_1_partner" && status !== "approved") {
      return { allowed: false, reason: "partner_invite_required" };
    }

    return { allowed: true };
  }

  /** Reads active release stage from `platform_settings` with local override & safe default. */
  static async getActiveStage(): Promise<ReleaseStage> {
    if (typeof localStorage !== "undefined") {
      const localOverride = localStorage.getItem(LOCAL_STAGE_OVERRIDE_KEY);
      if (isValidReleaseStage(localOverride)) {
        return localOverride;
      }
    }

    if (cachedStage && Date.now() - cachedStage.fetchedAt < STAGE_CACHE_TTL_MS) {
      return cachedStage.value;
    }

    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "release_stage")
        .maybeSingle();

      if (!error && data && isValidReleaseStage(data.value)) {
        cachedStage = { value: data.value, fetchedAt: Date.now() };
        return data.value;
      }
    } catch {
      // Offline/local dev fallback below
    }

    return "stage_1_partner";
  }

  /** Persists release stage in `platform_settings` and writes audit entry. */
  static async setActiveStage(
    stage: ReleaseStage,
    actorId: string
  ): Promise<{ success: boolean; error?: string }> {
    const nowIso = new Date().toISOString();

    const { error } = await supabase.from("platform_settings").upsert(
      {
        key: "release_stage",
        value: stage as unknown as Json,
        updated_by: actorId,
        updated_at: nowIso,
      },
      { onConflict: "key" }
    );

    if (error) {
      return { success: false, error: error.message };
    }

    cachedStage = { value: stage, fetchedAt: Date.now() };
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(LOCAL_STAGE_OVERRIDE_KEY);
    }

    await supabase.from("audit_logs").insert({
      actor_id: actorId,
      action: "UPDATE_RELEASE_STAGE",
      resource_type: "platform_settings",
      resource_id: "release_stage",
      metadata: { stage, updated_at: nowIso },
    });

    return { success: true };
  }

  /** Redeems a partner invitation code and upgrades the caller's profile to `approved`. */
  static async validateAndRedeemInviteCode(
    inviteCode: string,
    userId: string,
    email?: string | null
  ): Promise<{ success: boolean; error?: string }> {
    const normalizedCode = inviteCode.trim().toUpperCase();
    if (!normalizedCode) {
      return { success: false, error: "Kode undangan wajib diisi." };
    }

    const { data: invite, error } = await supabase
      .from("partner_invitations")
      .select("*")
      .eq("invite_code", normalizedCode)
      .maybeSingle();

    if (error || !invite) {
      return { success: false, error: "Kode undangan tidak ditemukan atau sudah tidak berlaku." };
    }

    if (invite.status !== "pending") {
      return { success: false, error: "Kode undangan sudah digunakan atau dibatalkan." };
    }

    if (new Date(invite.expires_at).getTime() <= Date.now()) {
      return { success: false, error: "Kode undangan telah kedaluwarsa." };
    }

    if (
      email &&
      invite.email &&
      invite.email.trim().toLowerCase() !== email.trim().toLowerCase()
    ) {
      return {
        success: false,
        error: "Kode undangan ini ditujukan untuk alamat email lain.",
      };
    }

    const nowIso = new Date().toISOString();

    const { error: updateInviteErr } = await supabase
      .from("partner_invitations")
      .update({
        status: "accepted",
        accepted_by: userId,
        accepted_at: nowIso,
      })
      .eq("id", invite.id)
      .eq("status", "pending");

    if (updateInviteErr) {
      return { success: false, error: updateInviteErr.message };
    }

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ account_status: "approved", updated_at: nowIso })
      .eq("user_id", userId);

    if (profileErr) {
      return { success: false, error: profileErr.message };
    }

    await supabase.from("audit_logs").insert({
      actor_id: userId,
      action: "REDEEM_PARTNER_INVITE",
      resource_type: "partner_invitations",
      resource_id: invite.id,
      metadata: { invite_code: normalizedCode, accepted_at: nowIso },
    });

    return { success: true };
  }

  /** Lists partner invitations for platform administrators. */
  static async listPartnerInvitations(): Promise<PartnerInvitationRecord[]> {
    const { data, error } = await supabase
      .from("partner_invitations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) {
      return [];
    }

    return data as PartnerInvitationRecord[];
  }

  /** Creates a single-use partner invitation code for Stage 1 onboarding. */
  static async createPartnerInvitation(
    email: string,
    invitedBy: string,
    expiresInDays = 14
  ): Promise<{ success: boolean; invite?: PartnerInvitationRecord; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, error: "Masukkan alamat email mitra yang valid." };
    }

    const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
    const inviteCode = `OBMAP-${randomPart}`;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("partner_invitations")
      .insert({
        email: cleanEmail,
        invite_code: inviteCode,
        invited_by: invitedBy,
        expires_at: expiresAt,
        status: "pending",
      })
      .select("*")
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Gagal membuat kode undangan." };
    }

    await supabase.from("audit_logs").insert({
      actor_id: invitedBy,
      action: "CREATE_PARTNER_INVITE",
      resource_type: "partner_invitations",
      resource_id: data.id,
      metadata: { email: cleanEmail, expires_at: expiresAt },
    });

    return { success: true, invite: data as PartnerInvitationRecord };
  }
}
