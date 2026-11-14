import { describe, it, expect, beforeEach } from "vitest";
import { resolveCascadingConfig } from "@/domains/settings/shared/api/ConfigService";
import {
  applyThemeToDOM,
  defaultTheme,
  sanitizeScopedCssSnippet,
  useThemeStore,
} from "@/domains/settings/shared/stores/useThemeStore";
import { resolveSemanticCanvasTokens } from "@/domains/graph/shared/utils/theme";

describe("STEP-01.5: 6-Layer Cascading Config & Unified Theme Engine", () => {
  beforeEach(() => {
    useThemeStore.getState().resetTheme();
  });

  it("resolves layers in strict 1.system -> 2.org_policy -> 3.vault -> 4.user -> 5.leaf -> 6.session priority", () => {
    const cascade = {
      system: "system-val",
      org_policy: "org-val",
      vault: "vault-val",
      user: "user-val",
      leaf: "leaf-val",
      session: "session-val",
    };

    expect(resolveCascadingConfig(cascade)).toEqual({
      value: "session-val",
      sourceLayer: "session",
      isLockedByAdmin: false,
    });

    expect(
      resolveCascadingConfig({
        system: "system-val",
        vault: "vault-val",
        user: "user-val",
      })
    ).toEqual({
      value: "user-val",
      sourceLayer: "user",
      isLockedByAdmin: false,
    });
  });

  it("prevents layers 3-6 from overriding org_policy when locked by Org/Superadmin", () => {
    const lockedRes = resolveCascadingConfig(
      {
        system: "sys",
        vault: "vault-override",
        user: "user-override",
        leaf: "leaf-override",
        session: "session-override",
      },
      { value: "enforced-org-policy", locked: true },
      false
    );

    expect(lockedRes).toEqual({
      value: "enforced-org-policy",
      sourceLayer: "org_policy",
      isLockedByAdmin: true,
    });

    const adminOverride = resolveCascadingConfig(
      {
        system: "sys",
        session: "admin-test-override",
      },
      { value: "enforced-org-policy", locked: true },
      true
    );

    expect(adminOverride).toEqual({
      value: "admin-test-override",
      sourceLayer: "session",
      isLockedByAdmin: true,
    });
  });

  it("sanitizes unsafe CSS snippets and scopes valid selectors under .obmap-themed-root", () => {
    const raw = `
      @import url('https://evil.test/x.css');
      .card { background-image: url(https://evil.test/track.png); }
      .note-title { color: #ff00aa; letter-spacing: 0.02em; }
      .obmap-themed-root .badge { border-radius: 6px; }
    `;

    const result = sanitizeScopedCssSnippet(raw);
    expect(result.rejectedRules.length).toBeGreaterThanOrEqual(1);
    expect(result.sanitizedCss).not.toContain("@import");
    expect(result.sanitizedCss).not.toContain("url(");
    expect(result.sanitizedCss).toContain(".obmap-themed-root .note-title");
    expect(result.sanitizedCss).toContain(".obmap-themed-root .badge");
  });

  it("projects unified --ob-* semantic tokens onto DOM root for Canvas2D consumption", () => {
    applyThemeToDOM(defaultTheme);
    const root = document.documentElement;
    expect(root.classList.contains("obmap-themed-root")).toBe(true);
    expect(root.style.getPropertyValue("--ob-bg-canvas")).toBe(
      `hsl(${defaultTheme.colors.canvasBackground})`
    );
    expect(root.style.getPropertyValue("--ob-node-folder")).toBe(
      `hsl(${defaultTheme.colors.folderNodeColor})`
    );
    expect(root.style.getPropertyValue("--ob-accent")).toBe(
      `hsl(${defaultTheme.colors.accent})`
    );

    const tokens = resolveSemanticCanvasTokens();
    expect(tokens.bgCanvas).toBeTruthy();
    expect(tokens.nodeFolder).toBeTruthy();
    expect(tokens.edgeDefault).toBeTruthy();
  });
});
