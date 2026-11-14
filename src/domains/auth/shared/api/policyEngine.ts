import type {
  AccountLifecycleStatus,
  VaultMemberRole,
  VaultVisibility,
} from "@/types/collaboration";

export const DEFAULT_PUBLIC_LICENSE = "CC BY-SA 4.0";

export type PolicyAction =
  | "vault:read"
  | "vault:edit"
  | "vault:review"
  | "vault:publish"
  | "vault:comment"
  | "vault:manage_members"
  | "vault:manage_visibility"
  | "note:read_public";

export type ResourceRole = VaultMemberRole | "owner" | "superadmin" | "none";

export interface PolicyActor {
  userId?: string | null;
  accountStatus?: AccountLifecycleStatus | "active" | null;
  isSuperadmin?: boolean;
}

export interface PolicyResource {
  vaultId?: string | null;
  ownerId?: string | null;
  visibility?: VaultVisibility | null;
  noteFrontmatter?: Record<string, unknown> | null;
  memberRole?: ResourceRole | null;
}

export interface PolicyContext {
  viaValidShareLink?: boolean;
  shareLinkRole?: VaultMemberRole | null;
}

export interface EvaluatedVaultPermissions {
  role: ResourceRole;
  canEdit: boolean;
  canReview: boolean;
  canPublish: boolean;
  canComment: boolean;
  canManageMembers: boolean;
  canManageVisibility: boolean;
  isReadOnly: boolean;
}

const EDIT_ROLES: ReadonlySet<ResourceRole> = new Set([
  "contributor",
  "editor",
  "admin",
  "owner",
  "superadmin",
]);

const COMMENT_ROLES: ReadonlySet<ResourceRole> = new Set([
  "commenter",
  "contributor",
  "editor",
  "admin",
  "owner",
  "superadmin",
]);

const REVIEW_PUBLISH_ROLES: ReadonlySet<ResourceRole> = new Set([
  "editor",
  "admin",
  "owner",
  "superadmin",
]);

const MANAGE_ROLES: ReadonlySet<ResourceRole> = new Set([
  "admin",
  "owner",
  "superadmin",
]);

const ROLE_PRECEDENCE: Record<ResourceRole, number> = {
  none: 0,
  guest: 1,
  viewer: 2,
  commenter: 3,
  contributor: 4,
  editor: 5,
  admin: 6,
  owner: 7,
  superadmin: 8,
};

/** Returns `true` when note YAML frontmatter explicitly marks the note private. */
export function isNoteExcludedFromPublic(
  frontmatter?: Record<string, unknown> | null
): boolean {
  if (!frontmatter || typeof frontmatter !== "object") return false;
  if (frontmatter.private === true) return true;
  if (typeof frontmatter.visibility === "string") {
    return frontmatter.visibility.trim().toLowerCase() === "private";
  }
  return false;
}

/** Ensures published notes carry a citation-friendly license (defaults to CC BY-SA 4.0). */
export function ensurePublicNoteLicense(
  frontmatter: Record<string, unknown> = {},
  vaultDefaultLicense: string = DEFAULT_PUBLIC_LICENSE
): Record<string, unknown> {
  const current = frontmatter.license;
  if (typeof current === "string" && current.trim().length > 0) {
    return frontmatter;
  }
  return {
    ...frontmatter,
    license: vaultDefaultLicense || DEFAULT_PUBLIC_LICENSE,
  };
}

function resolveEffectiveRole(
  actor: PolicyActor,
  resource: PolicyResource,
  context?: PolicyContext
): ResourceRole {
  if (actor.isSuperadmin) return "superadmin";
  if (actor.userId && resource.ownerId && actor.userId === resource.ownerId) {
    return "owner";
  }

  let effective: ResourceRole = resource.memberRole ?? "none";

  if (context?.viaValidShareLink && context.shareLinkRole) {
    if (ROLE_PRECEDENCE[context.shareLinkRole] > ROLE_PRECEDENCE[effective]) {
      effective = context.shareLinkRole;
    }
  }

  return effective;
}

/**
 * Symmetric client-side RBAC + 4-State Visibility evaluator aligned with SQL `public.can_access_resource()`.
 */
export class PolicyEngine {
  static can(
    actor: PolicyActor,
    action: PolicyAction,
    resource: PolicyResource,
    context?: PolicyContext
  ): boolean {
    if (actor.isSuperadmin) return true;

    const accountStatus = actor.accountStatus ?? (actor.userId ? "approved" : null);
    const isBlockedAccount =
      accountStatus === "pending_approval" || accountStatus === "suspended";

    // Layer 1: pending_approval or suspended actors cannot access workspace or mutate resources.
    if (actor.userId && isBlockedAccount && action !== "note:read_public") {
      return false;
    }

    const visibility = resource.visibility ?? "private";

    if (action === "note:read_public") {
      if (isNoteExcludedFromPublic(resource.noteFrontmatter)) {
        return false;
      }
      if (visibility === "public_unlisted" || visibility === "public_listed") {
        return true;
      }
      if (visibility === "shared" && context?.viaValidShareLink) {
        return true;
      }
    }

    const effectiveRole = resolveEffectiveRole(actor, resource, context);

    if (action === "vault:read") {
      if (effectiveRole !== "none") return true;
      return (
        visibility === "public_unlisted" ||
        visibility === "public_listed" ||
        (visibility === "shared" && Boolean(context?.viaValidShareLink))
      );
    }

    if (effectiveRole === "none") return false;

    switch (action) {
      case "vault:comment":
        return COMMENT_ROLES.has(effectiveRole);
      case "vault:edit":
        return EDIT_ROLES.has(effectiveRole);
      case "vault:review":
      case "vault:publish":
        return REVIEW_PUBLISH_ROLES.has(effectiveRole);
      case "vault:manage_members":
      case "vault:manage_visibility":
        return MANAGE_ROLES.has(effectiveRole);
      default:
        return false;
    }
  }
}

/** Computes UI capability booleans for a resolved vault role via `PolicyEngine`. */
export function evaluateVaultPermissions(params: {
  role: ResourceRole;
  accountStatus?: AccountLifecycleStatus | "active" | null;
  visibility?: VaultVisibility | null;
}): EvaluatedVaultPermissions {
  const actor: PolicyActor = {
    userId: params.role === "none" ? null : "active-user",
    accountStatus: params.accountStatus ?? "approved",
    isSuperadmin: params.role === "superadmin",
  };
  const resource: PolicyResource = {
    memberRole: params.role,
    visibility: params.visibility ?? "private",
  };

  const canEdit = PolicyEngine.can(actor, "vault:edit", resource);
  const canReview = PolicyEngine.can(actor, "vault:review", resource);
  const canPublish = PolicyEngine.can(actor, "vault:publish", resource);
  const canComment = PolicyEngine.can(actor, "vault:comment", resource);
  const canManageMembers = PolicyEngine.can(actor, "vault:manage_members", resource);
  const canManageVisibility = PolicyEngine.can(actor, "vault:manage_visibility", resource);
  const isReadOnly = !canEdit;

  return {
    role: params.role,
    canEdit,
    canReview,
    canPublish,
    canComment,
    canManageMembers,
    canManageVisibility,
    isReadOnly,
  };
}
