import { describe, it, expect } from "vitest";
import { ReleaseStageService } from "@/domains/auth/shared/api/ReleaseStageService";
import {
  DEFAULT_PUBLIC_LICENSE,
  PolicyEngine,
  ensurePublicNoteLicense,
  evaluateVaultPermissions,
  isNoteExcludedFromPublic,
} from "@/domains/auth/shared/api/policyEngine";

describe("STEP-01.3: ReleaseStageService & Stage Gate", () => {
  it("resolves initial account_status correctly across all 3 release stages", () => {
    expect(ReleaseStageService.resolveInitialAccountStatus("stage_1_partner", false)).toBe(
      "pending_approval"
    );
    expect(ReleaseStageService.resolveInitialAccountStatus("stage_1_partner", true)).toBe(
      "approved"
    );
    expect(ReleaseStageService.resolveInitialAccountStatus("stage_2_community_beta", false)).toBe(
      "pending_approval"
    );
    expect(ReleaseStageService.resolveInitialAccountStatus("stage_2_community_beta", true)).toBe(
      "approved"
    );
    expect(ReleaseStageService.resolveInitialAccountStatus("stage_3_commercial_ga", false)).toBe(
      "approved"
    );
  });

  it("blocks pending_approval and suspended users from workspace routes unless superadmin", () => {
    expect(
      ReleaseStageService.canAccessWorkspaceByStage({
        stage: "stage_1_partner",
        accountStatus: "pending_approval",
        isSuperadmin: false,
      })
    ).toEqual({ allowed: false, reason: "partner_invite_required" });

    expect(
      ReleaseStageService.canAccessWorkspaceByStage({
        stage: "stage_2_community_beta",
        accountStatus: "pending_approval",
        isSuperadmin: false,
      })
    ).toEqual({ allowed: false, reason: "pending_approval" });

    expect(
      ReleaseStageService.canAccessWorkspaceByStage({
        stage: "stage_3_commercial_ga",
        accountStatus: "suspended",
        isSuperadmin: false,
      })
    ).toEqual({ allowed: false, reason: "suspended" });

    expect(
      ReleaseStageService.canAccessWorkspaceByStage({
        stage: "stage_1_partner",
        accountStatus: "approved",
        isSuperadmin: false,
      })
    ).toEqual({ allowed: true });

    expect(
      ReleaseStageService.canAccessWorkspaceByStage({
        stage: "stage_1_partner",
        accountStatus: "pending_approval",
        isSuperadmin: true,
      })
    ).toEqual({ allowed: true });
  });
});

describe("STEP-01.4: Symmetric PolicyEngine, 4-State Visibility & Licensing", () => {
  it("enforces two-layer RBAC across all roles cleanly", () => {
    const privateVault = { vaultId: "v1", ownerId: "u-owner", visibility: "private" as const };

    expect(
      PolicyEngine.can(
        { userId: "u-owner", accountStatus: "approved" },
        "vault:manage_visibility",
        privateVault
      )
    ).toBe(true);

    expect(
      PolicyEngine.can(
        { userId: "u-pending", accountStatus: "pending_approval" },
        "vault:edit",
        { ...privateVault, memberRole: "editor" }
      )
    ).toBe(false);

    const commenter = evaluateVaultPermissions({ role: "commenter" });
    expect(commenter.canComment).toBe(true);
    expect(commenter.canEdit).toBe(false);
    expect(commenter.isReadOnly).toBe(true);

    const guest = evaluateVaultPermissions({ role: "guest" });
    expect(guest.canComment).toBe(false);
    expect(guest.canEdit).toBe(false);
    expect(guest.isReadOnly).toBe(true);

    const contributor = evaluateVaultPermissions({ role: "contributor" });
    expect(contributor.canEdit).toBe(true);
    expect(contributor.canReview).toBe(false);
    expect(contributor.canPublish).toBe(false);

    const editor = evaluateVaultPermissions({ role: "editor" });
    expect(editor.canPublish).toBe(true);
    expect(editor.canManageMembers).toBe(false);
  });

  it("enforces 4-state vault visibility and per-note visibility: private exclusion", () => {
    const anon = { userId: null };

    expect(PolicyEngine.can(anon, "vault:read", { visibility: "private" })).toBe(false);
    expect(PolicyEngine.can(anon, "vault:read", { visibility: "shared" })).toBe(false);
    expect(
      PolicyEngine.can(
        anon,
        "vault:read",
        { visibility: "shared" },
        { viaValidShareLink: true, shareLinkRole: "guest" }
      )
    ).toBe(true);
    expect(PolicyEngine.can(anon, "vault:read", { visibility: "public_unlisted" })).toBe(true);
    expect(PolicyEngine.can(anon, "vault:read", { visibility: "public_listed" })).toBe(true);

    expect(
      PolicyEngine.can(anon, "note:read_public", {
        visibility: "public_listed",
        noteFrontmatter: { visibility: "private" },
      })
    ).toBe(false);

    expect(isNoteExcludedFromPublic({ visibility: "private" })).toBe(true);
    expect(isNoteExcludedFromPublic({ private: true })).toBe(true);
    expect(isNoteExcludedFromPublic({ visibility: "public" })).toBe(false);
  });

  it("attaches default CC BY-SA 4.0 license when publishing without explicit license", () => {
    expect(ensurePublicNoteLicense({ tags: ["research"] })).toEqual({
      tags: ["research"],
      license: DEFAULT_PUBLIC_LICENSE,
    });
    expect(ensurePublicNoteLicense({ license: "MIT" })).toEqual({
      license: "MIT",
    });
  });
});
