import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  RESERVED_SLUGS,
  normalizePublicHandle,
  isReservedSlug,
} from "@/domains/community/shared/utils/reservedSlugs";

const { mockFrom, mockRpc } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock("@/global/api/supabaseClient", () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
  },
}));

import { PublicReaderService } from "@/domains/community/shared/api/PublicReaderService";
import { ProfileService } from "@/domains/settings/shared/api/ProfileService";
import { VaultMemberService } from "@/domains/vault/shared/api/VaultMemberService";

interface MockQueryChain {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  gt: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  then: (resolve: (val: unknown) => void) => Promise<void>;
}

function createQueryChain(result: { data: unknown; error: unknown }): MockQueryChain {
  const chain = {} as MockQueryChain;
  const methods: Array<keyof Omit<MockQueryChain, "maybeSingle" | "then">> = [
    "select",
    "eq",
    "ilike",
    "in",
    "gt",
    "order",
    "limit",
  ];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  chain.maybeSingle = vi.fn(async () => result);
  chain.then = (resolve: (val: unknown) => void) => Promise.resolve(result).then(resolve);
  return chain;
}

describe("Community Routing & RESERVED_SLUGS (STEP-01.2)", () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockRpc.mockReset();
  });

  it("normalizes @handle and plain username consistently", () => {
    expect(normalizePublicHandle("@scholar")).toBe("scholar");
    expect(normalizePublicHandle("  @Einstein_01  ")).toBe("einstein_01");
    expect(normalizePublicHandle("galileo")).toBe("galileo");
    expect(normalizePublicHandle("")).toBe("");
    expect(normalizePublicHandle(null)).toBe("");
  });

  it("blocks all core system reserved slugs and allows valid scholar handles", () => {
    const coreSystemSlugs = [
      "app",
      "vaults",
      "auth",
      "admin",
      "explore",
      "install",
      "settings",
      "api",
      "assets",
      "p",
      "pricing",
      "docs",
      "help",
      "legal",
      "about",
      "login",
      "signup",
    ];

    for (const slug of coreSystemSlugs) {
      expect(RESERVED_SLUGS.has(slug)).toBe(true);
      expect(isReservedSlug(slug)).toBe(true);
      expect(isReservedSlug(`@${slug}`)).toBe(true);
    }

    expect(isReservedSlug("einstein")).toBe(false);
    expect(isReservedSlug("@galileo")).toBe(false);
    expect(isReservedSlug("ada-lovelace")).toBe(false);
  });

  it("builds canonical /:username/:vaultSlug/:noteSlug URLs without /p/ prefix", () => {
    const plain = PublicReaderService.buildPublicUrl("alice", "Quantum Notes", "Wave Function");
    const withAt = PublicReaderService.buildPublicUrl("@alice", "Quantum Notes", "Wave Function");

    expect(plain).toBe("/alice/quantum-notes/wave-function");
    expect(withAt).toBe("/alice/quantum-notes/wave-function");
    expect(plain.startsWith("/p/")).toBe(false);

    expect(PublicReaderService.buildProfileUrl("@alice")).toBe("/alice");
    expect(PublicReaderService.buildProfileUrl("alice", true)).toBe("/@alice");
  });

  it("immediately rejects /p/* and other reserved slugs without querying Supabase", async () => {
    const legacyResult = await PublicReaderService.resolvePublicRoute("p", "alice", "my-vault");
    expect(legacyResult.status).toBe("not_found");
    expect(mockFrom).not.toHaveBeenCalled();

    const reservedAtResult = await PublicReaderService.resolvePublicRoute("@admin");
    expect(reservedAtResult.status).toBe("not_found");
    expect(mockFrom).not.toHaveBeenCalled();

    const vaultsResult = await PublicReaderService.resolvePublicRoute("vaults");
    expect(vaultsResult.status).toBe("not_found");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("enforces RESERVED_SLUGS inside ProfileService.validateUsernameFormat", () => {
    expect(ProfileService.validateUsernameFormat("p").valid).toBe(false);
    expect(ProfileService.validateUsernameFormat("@vaults").valid).toBe(false);
    expect(ProfileService.validateUsernameFormat("explore").valid).toBe(false);

    const validResult = ProfileService.validateUsernameFormat("@mada-dev");
    expect(validResult.valid).toBe(true);
    expect(validResult.normalized).toBe("mada-dev");
  });

  it("routes VaultMemberService.searchUsers and lookupUserByEmail through SECURITY DEFINER RPCs", async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        { user_id: "u-1", email: "alice@example.com", display_name: "Alice", avatar_url: null },
        { user_id: "u-2", email: "alex@example.com", display_name: "Alex", avatar_url: null },
      ],
      error: null,
    });

    const searchRes = await VaultMemberService.searchUsers("  AL  ", ["u-1"]);
    expect(mockRpc).toHaveBeenCalledWith("search_collaborator_profiles", { p_query: "al" });
    expect(searchRes).toEqual([
      { id: "u-2", email: "alex@example.com", display_name: "Alex", avatar_url: null },
    ]);

    mockRpc.mockResolvedValueOnce({
      data: [{ user_id: "u-1", email: "alice@example.com", display_name: "Alice", avatar_url: null }],
      error: null,
    });

    const lookupRes = await VaultMemberService.lookupUserByEmail("  Alice@Example.com ");
    expect(mockRpc).toHaveBeenCalledWith("lookup_user_by_email", {
      p_email: "alice@example.com",
    });
    expect(lookupRes).toEqual({
      id: "u-1",
      email: "alice@example.com",
      display_name: "Alice",
      avatar_url: null,
    });
  });

  it("enforces 14-day redirect quarantine and handle resolution via RPCs", async () => {
    mockRpc
      .mockResolvedValueOnce({ data: [], error: null }) // get_public_profile_by_handle
      .mockResolvedValueOnce({
        data: [
          {
            user_id: "u-owner",
            old_username: "old_janki",
            current_username: "janki",
            expires_at: "2099-01-01T00:00:00Z",
          },
        ],
        error: null,
      });

    const blockedForOther = await ProfileService.checkUsernameAvailability("@old_janki", "u-other");
    expect(blockedForOther.available).toBe(false);
    expect(mockRpc).toHaveBeenCalledWith("get_public_profile_by_handle", {
      p_handle: "old_janki",
    });
    expect(mockRpc).toHaveBeenCalledWith("resolve_username_redirect", {
      p_handle: "old_janki",
    });

    mockRpc
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({
        data: [
          {
            user_id: "u-owner",
            old_username: "old_janki",
            current_username: "janki",
            expires_at: "2099-01-01T00:00:00Z",
          },
        ],
        error: null,
      });

    const allowedForOwner = await ProfileService.checkUsernameAvailability("old_janki", "u-owner");
    expect(allowedForOwner.available).toBe(true);

    mockRpc
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({
        data: [
          {
            user_id: "u-owner",
            old_username: "old_janki",
            current_username: "janki",
            expires_at: "2099-01-01T00:00:00Z",
          },
        ],
        error: null,
      });

    const resolution = await ProfileService.resolveUsernameOrRedirect("@old_janki");
    expect(resolution).toEqual({
      userId: "u-owner",
      currentUsername: "janki",
      isRedirect: true,
      oldUsername: "old_janki",
    });
  });

  it("resolves /@username when a vault has published notes even with legacy private visibility", async () => {
    const profileRow = {
      user_id: "u-janki",
      username: "janki",
      display_name: "Janki",
      full_name: "Janki Scholar",
      avatar_url: null,
      bio: null,
      is_public: true,
      account_status: "approved",
    };

    mockRpc.mockImplementation(async (fnName: string) => {
      if (fnName === "get_public_profile_by_handle") {
        return { data: [profileRow], error: null };
      }
      return { data: [], error: null };
    });

    const publishedNote = {
      id: "n-1",
      vault_id: "v-1",
      slug: "halo-dunia",
      title: "Halo Dunia",
      content: "# Halo",
      frontmatter: {},
      status: "published",
      version: 1,
      author_id: "u-janki",
      published_at: "2026-11-16T00:00:00Z",
      created_at: "2026-11-16T00:00:00Z",
      updated_at: "2026-11-16T00:00:00Z",
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "user_vaults") {
        return createQueryChain({
          data: [
            {
              id: "v-1",
              user_id: "u-janki",
              name: "Catatan Publik",
              description: "Koleksi catatan",
              visibility: "private",
              default_license: "CC BY-SA 4.0",
            },
          ],
          error: null,
        });
      }
      if (table === "notes") {
        return createQueryChain({ data: [publishedNote], error: null });
      }
      return createQueryChain({ data: [], error: null });
    });

    const rootResult = await PublicReaderService.resolvePublicRoute("@janki");
    expect(rootResult.status).toBe("redirect");
    expect(rootResult.redirectUrl).toBe("/janki/catatan-publik/halo-dunia");

    const explicitVaultResult = await PublicReaderService.resolvePublicRoute(
      "@janki",
      "catatan-publik",
      "halo-dunia"
    );
    expect(explicitVaultResult.status).toBe("success");
    expect(explicitVaultResult.vault?.owner.username).toBe("janki");
    expect(explicitVaultResult.activeNote?.slug).toBe("halo-dunia");
  });

  it("renders a clean empty scholar profile shell on /@username when the user has 0 cloud vaults yet", async () => {
    mockRpc.mockImplementation(async (fnName: string) => {
      if (fnName === "get_public_profile_by_handle") {
        return {
          data: [
            {
              user_id: "u-new",
              username: "newscholar",
              display_name: "New Scholar",
              full_name: "New Scholar",
              avatar_url: null,
              bio: "Peneliti baru",
              is_public: true,
              account_status: "approved",
            },
          ],
          error: null,
        };
      }
      return { data: [], error: null };
    });

    mockFrom.mockImplementation(() => createQueryChain({ data: [], error: null }));

    const result = await PublicReaderService.resolvePublicRoute("@newscholar");
    expect(result.status).toBe("success");
    expect(result.vault?.id).toBe("profile-u-new");
    expect(result.vault?.owner.username).toBe("newscholar");
    expect(result.notes).toEqual([]);
  });
});
