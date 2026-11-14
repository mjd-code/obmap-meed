import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  RESERVED_SLUGS,
  normalizePublicHandle,
  isReservedSlug,
} from "@/domains/community/shared/utils/reservedSlugs";

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock("@/global/api/supabaseClient", () => ({
  supabase: {
    from: mockFrom,
  },
}));

import { PublicReaderService } from "@/domains/community/shared/api/PublicReaderService";
import { ProfileService } from "@/domains/settings/shared/api/ProfileService";

describe("Community Routing & RESERVED_SLUGS (STEP-01.2)", () => {
  beforeEach(() => {
    mockFrom.mockReset();
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
});
