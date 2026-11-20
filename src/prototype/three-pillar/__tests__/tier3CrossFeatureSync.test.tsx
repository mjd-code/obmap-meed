import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clickByAriaLabel,
  clickByText,
  clickElement,
  findAllByText,
  findByText,
  findInputByPlaceholderOrLabel,
  mountPrototypePage,
  queryByText,
  resetPrototypeTestDom,
  setInputValue,
  setTestViewportWidth,
} from "./prototypeTestHarness";

const POPPER_SEL = "[data-radix-popper-content-wrapper], [role='menu'], [role='listbox'], [role='dialog']";
const BTN_SEL = "button, [role='menuitem'], [role='option'], [role='tab']";

function isActiveControl(el: HTMLElement): boolean {
  return (
    el.getAttribute("aria-pressed") === "true" ||
    el.getAttribute("aria-selected") === "true" ||
    el.getAttribute("aria-current") === "true" ||
    el.getAttribute("aria-current") === "page" ||
    el.getAttribute("data-active") === "true" ||
    el.getAttribute("data-state") === "active" ||
    el.getAttribute("data-state") === "on" ||
    /\b(bg-primary|border-primary|text-primary|bg-info)\b/.test(el.className)
  );
}

async function clickPopoverOption(pattern: string | RegExp): Promise<void> {
  const popper = document.body.querySelector(POPPER_SEL);
  if (popper) {
    const inPopper = queryByText(pattern, BTN_SEL, popper);
    if (inPopper) { await clickElement(inPopper); return; }
  }
  const matches = findAllByText(pattern, BTN_SEL);
  const target = matches[matches.length - 1];
  if (!target) throw new Error(`Option not found: ${String(pattern)}`);
  await clickElement(target);
}

async function openSettingsFromUserMenu(container: HTMLElement): Promise<void> {
  await clickByAriaLabel(/Menu Profil Pengguna/i, container);
  await clickByText(/Settings Hub/i);
}

async function selectSubSetting(
  category: "Account" | "Workspace" | "Vault",
  subLabel: string | RegExp,
): Promise<void> {
  const catBtn = findAllByText(/^(1\.\s*)?(Account|Workspace|Vault)$/i, "button")[0];
  if (catBtn && !new RegExp(`\\b${category}\\b`, "i").test(catBtn.textContent ?? "")) {
    await clickElement(catBtn);
    await clickPopoverOption(new RegExp(`^(?:[1-3]\\.\\s*)?${category}`, "i"));
  }
  const subMatches = findAllByText(subLabel, BTN_SEL);
  if (subMatches.length === 0) {
    const subTrigger = findAllByText(
      /(Profile Customization|Credentials & Security|Session Activity|Workspace Preset|Central \.app\/config\.json|Deep Explorer|Appearance & Accessibility|Visual Engine|Vaults Dashboard|Vaults Collaborating|VCS, Diff, Backup & History|Vaults Publish|Import & Export Vault)/i,
      "button",
    )[0];
    if (!subTrigger) throw new Error("Breadcrumb Sub-Setting trigger not found");
    await clickElement(subTrigger);
  }
  await clickPopoverOption(subLabel);
}

function readConfigJson(container: HTMLElement): Record<string, unknown> {
  const ta = container.querySelector("textarea") as HTMLTextAreaElement | null;
  if (!ta) throw new Error("Raw .app/config.json textarea not found");
  return JSON.parse(ta.value) as Record<string, unknown>;
}

function getAppearanceDomHost(container: HTMLElement): HTMLElement {
  return (
    container.querySelector<HTMLElement>("[data-prototype-theme], [data-theme], [data-density]") ??
    document.documentElement
  );
}

async function toggleSwitchNear(pattern: string | RegExp, container: HTMLElement): Promise<void> {
  const label = findByText(pattern, "label, div, section", container);
  const sw =
    label.querySelector<HTMLElement>("[role='switch'], input[type='checkbox']") ??
    label.parentElement?.querySelector<HTMLElement>("[role='switch'], input[type='checkbox']");
  if (!sw) throw new Error(`Switch not found near: ${String(pattern)}`);
  await clickElement(sw);
}

async function withMountedPrototype(fn: (container: HTMLElement) => Promise<void>): Promise<void> {
  const { container, unmount } = await mountPrototypePage();
  try { await fn(container); } finally { await unmount(); }
}

describe("Tier 3 — Cross-Feature Sync E2E (stage-02-three-pillar-v2)", () => {
  beforeEach(async () => {
    resetPrototypeTestDom();
    await setTestViewportWidth(1280);
  });

  afterEach(() => {
    resetPrototypeTestDom();
  });

  it("1. Preset Impact Diff Apply -> .app/config.json & Deep Explorer Sync (F9, F10, F11)", () =>
    withMountedPrototype(async (container) => {
      await openSettingsFromUserMenu(container);
      await selectSubSetting("Workspace", /Workspace Preset/i);

      await clickByText(/^Studio$/i, BTN_SEL, container);
      findByText(/What Will Change/i, "*", container);
      findByText(/mode\.primary_mode/i, "*", container);
      await clickByText(/Validate & Apply Preset/i, "button", container);

      await selectSubSetting("Workspace", /Central \.app\/config\.json/i);
      findByText(/Valid \(\.app\/config\.json Schema v2\)/i, "*", container);
      const cfg = readConfigJson(container);
      expect((cfg.mode as Record<string, unknown>).primary_mode).toBe("studio");
      expect((cfg.deep_explorer as Record<string, unknown>).default_view).toBe("table");
      expect((cfg.deep_explorer as Record<string, unknown>).reorganize_by).toBe("properties");

      await selectSubSetting("Workspace", /^Deep Explorer$/i);
      expect(findAllByText(/^Table$/i, BTN_SEL, container).some(isActiveControl)).toBe(true);
      expect(findAllByText(/^Properties$/i, BTN_SEL, container).some(isActiveControl)).toBe(true);

      await clickByText(/Buka Deep Explorer sebagai Tab Workspace Mandiri/i, "button", container);
      expect(findAllByText(/^Table$/i, BTN_SEL, container).some(isActiveControl)).toBe(true);
    }));

  it("2. Raw .app/config.json Edit -> Preset, Deep Explorer & Visual Engine Sync (F10, F11, F13)", () =>
    withMountedPrototype(async (container) => {
      await openSettingsFromUserMenu(container);
      await selectSubSetting("Workspace", /Central \.app\/config\.json/i);

      const ta = container.querySelector("textarea") as HTMLTextAreaElement;
      const cfg = JSON.parse(ta.value) as {
        mode: { primary_mode: string };
        deep_explorer: { default_view: string };
        visual_engine: {
          graph_mode: { repulsion_force: number };
          deterministic_solvers: { default_solver: string; connector_style: string };
        };
      };
      cfg.mode.primary_mode = "academy";
      cfg.deep_explorer.default_view = "cards";
      cfg.visual_engine.graph_mode.repulsion_force = 360;
      cfg.visual_engine.deterministic_solvers.default_solver = "fishbone";
      cfg.visual_engine.deterministic_solvers.connector_style = "straight";

      await setInputValue(ta, JSON.stringify(cfg, null, 2));
      findByText(/Valid \(\.app\/config\.json Schema v2\)/i, "*", container);
      await clickByText(/Apply|Terapkan|Simpan/i, "button", container);

      await selectSubSetting("Workspace", /Workspace Preset/i);
      findByText(/academy/i, "*", container);

      await selectSubSetting("Workspace", /^Deep Explorer$/i);
      expect(findAllByText(/^Cards$/i, BTN_SEL, container).some(isActiveControl)).toBe(true);

      await selectSubSetting("Workspace", /^Visual Engine$/i);
      expect(findAllByText(/Fishbone/i, BTN_SEL, container).some(isActiveControl)).toBe(true);
      expect(findAllByText(/Straight/i, BTN_SEL, container).some(isActiveControl)).toBe(true);
      expect(container.textContent).toContain("360");
    }));

  it("3. Bidirectional Sync: Right Sidebar <-> Breadcrumb Bar <-> Settings Hub (F7, F4)", () =>
    withMountedPrototype(async (container) => {
      await clickByText(/^Editor$/i, "button", container);
      await openSettingsFromUserMenu(container);

      if (!container.querySelector("aside[aria-label='Right Drawer']")) {
        await clickByAriaLabel(/Toggle Right Drawer|Right Sidebar/i, container);
      }
      const rightDrawer = container.querySelector("aside[aria-label='Right Drawer']") as HTMLElement;
      expect(rightDrawer).toBeTruthy();

      await clickByText(/Credentials & Security/i, BTN_SEL, rightDrawer);
      findByText(/Reset Email/i, "*", container);
      expect(findAllByText(/^Account$/i, "button", container).length).toBeGreaterThan(0);

      const quickSearch = findInputByPlaceholderOrLabel(/cari|search|jump|pengaturan/i, container);
      await setInputValue(quickSearch, "Visual Engine");
      await clickPopoverOption(/Visual Engine/i);

      findByText(/Graph Mode D3 Physics/i, "*", container);
      expect(findAllByText(/Visual Engine/i, BTN_SEL, rightDrawer).some(isActiveControl)).toBe(true);

      const sectionTrigger = findAllByText(/#graph-mode-d3|Graph Mode D3 Physics/i, "button", container)[0];
      await clickElement(sectionTrigger);
      await clickPopoverOption(/Deterministic Solvers|#deterministic-solvers/i);
      expect(container.querySelector("#deterministic-solvers") ?? queryByText(/Deterministic Solvers/i, "*", container)).toBeTruthy();
    }));

  it("4. Vault Switch/Create/Delete -> Cross-Vault Panel Sync (F14)", () =>
    withMountedPrototype(async (container) => {
      await openSettingsFromUserMenu(container);
      await selectSubSetting("Vault", /Vaults Dashboard/i);

      await clickByText(/Kuliah Graf & DAG/i, BTN_SEL, container);
      for (const sub of [/^Vaults Collaborating$/i, /^VCS, Diff, Backup & History$/i, /^Vaults Publish$/i, /^Import & Export Vault$/i]) {
        await selectSubSetting("Vault", sub);
        expect(container.textContent).toContain("Kuliah Graf & DAG");
      }

      await selectSubSetting("Vault", /Vaults Dashboard/i);
      const newVaultInput = findInputByPlaceholderOrLabel(/nama vault|vault baru|new vault/i, container);
      await setInputValue(newVaultInput, "Vault Epistemologi Baru");
      await clickByText(/Buat Vault|Create Vault|Tambah Vault/i, "button", container);
      findByText(/Vault Epistemologi Baru/i, "*", container);

      const switchBtn = queryByText(/Vault Epistemologi Baru/i, BTN_SEL, container);
      if (switchBtn) await clickElement(switchBtn);
      for (const sub of [/^Vaults Collaborating$/i, /^VCS, Diff, Backup & History$/i, /^Vaults Publish$/i, /^Import & Export Vault$/i]) {
        await selectSubSetting("Vault", sub);
        expect(container.textContent).toContain("Vault Epistemologi Baru");
      }

      await selectSubSetting("Vault", /Vaults Dashboard/i);
      const createdCard = findByText(/Vault Epistemologi Baru/i, "div, li, article", container).closest("div, li, article") ?? container;
      const delBtn = queryByText(/Hapus|Delete/i, "button", createdCard) ?? findByText(/Hapus|Delete/i, "button", container);
      await clickElement(delBtn);
      expect(queryByText(/Vault Epistemologi Baru/i, "*", container)).toBeNull();

      await selectSubSetting("Vault", /^Vaults Publish$/i);
      expect(container.textContent).not.toContain("Vault Epistemologi Baru");
    }));

  it("5. Full-Page vs Workspace-Tab Settings Hub & Appearance DOM Tokens (F6, F12)", () =>
    withMountedPrototype(async (container) => {
      await openSettingsFromUserMenu(container);

      findByText(/Full Page Mode/i, "*", container);
      expect(queryByText(/^Vault & Lenses$/i, "*", container)).toBeNull();
      expect(queryByText(/^Account & App$/i, "*", container)).toBeNull();

      await selectSubSetting("Workspace", /Appearance & Accessibility/i);
      await clickByText(/Calm Daylight/i, BTN_SEL, container);
      await clickByText(/Compact/i, BTN_SEL, container);
      await toggleSwitchNear(/Reduced Motion/i, container);

      const host = getAppearanceDomHost(container);
      expect(host.getAttribute("data-prototype-theme") ?? host.getAttribute("data-theme")).toBe("calm_daylight");
      expect(host.getAttribute("data-density")).toBe("compact");
      expect(host.getAttribute("data-reduced-motion") ?? host.getAttribute("data-motion")).toMatch(/true|reduced/i);
      expect(host.style.getPropertyValue("--vk-motion-scale")).toBe("0");
      expect(host.style.getPropertyValue("--vk-bg-base")).not.toBe("");

      await selectSubSetting("Workspace", /Central \.app\/config\.json/i);
      const appearanceCfg = readConfigJson(container).appearance as {
        theme: string;
        explore_card_density: string;
        accessibility: { reduced_motion: boolean };
      };
      expect(appearanceCfg.theme).toBe("calm_daylight");
      expect(appearanceCfg.explore_card_density).toBe("compact");
      expect(appearanceCfg.accessibility.reduced_motion).toBe(true);

      await clickByText(/Kembali/i, "button", container);
      await clickByText(/^Editor$/i, "button", container);
      await openSettingsFromUserMenu(container);

      findByText(/Workspace Tab/i, "*", container);
      expect(queryByText(/^Vault & Lenses$/i, "*", container)).toBeNull();
      await selectSubSetting("Workspace", /Appearance & Accessibility/i);
      expect(findAllByText(/Calm Daylight/i, BTN_SEL, container).some(isActiveControl)).toBe(true);

      await clickByText(/High-Contrast Scholar/i, BTN_SEL, container);
      expect(host.getAttribute("data-prototype-theme") ?? host.getAttribute("data-theme")).toBe("high_contrast_scholar");
      await clickByText(/^Profile$/i, "button", container);
      await openSettingsFromUserMenu(container);
      expect(host.getAttribute("data-prototype-theme") ?? host.getAttribute("data-theme")).toBe("high_contrast_scholar");
    }));
});
