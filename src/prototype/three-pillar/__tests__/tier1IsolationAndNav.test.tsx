import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import {
  mountPrototypePage,
  resetPrototypeTestDom,
  installPrototypeTestPolyfills,
  setTestViewportWidth,
  clickElement,
  clickByText,
  clickByAriaLabel,
  findAllByText,
  findByText,
  queryByText,
  setInputValue,
  findInputByPlaceholderOrLabel,
} from "./prototypeTestHarness";

const THIRTEEN_SUB_SETTINGS = [
  "Profile Customization",
  "Credentials & Security",
  "Session Activity",
  "Workspace Preset",
  "Central .app/config.json",
  "Deep Explorer",
  "Appearance & Accessibility",
  "Visual Engine",
  "Vaults Dashboard",
  "Vaults Collaborating",
  "VCS, Diff, Backup & History",
  "Vaults Publish",
  "Import & Export Vault",
] as const;

let activeUnmount: (() => Promise<void>) | null = null;

async function mountClean(): Promise<HTMLDivElement> {
  const mounted = await mountPrototypePage("/prototype");
  activeUnmount = mounted.unmount;
  return mounted.container;
}

async function openUserMenuAndClickSettings(): Promise<void> {
  await clickByAriaLabel(/Menu Profil Pengguna/i);
  await clickByText(/Settings Hub/i);
}

describe("Tier 1: Zero-Backend Isolation, Snapshot Catalog, Clean Tab Bar & Dual Navigation", () => {
  beforeAll(() => {
    installPrototypeTestPolyfills();
  });

  beforeEach(async () => {
    resetPrototypeTestDom();
    await setTestViewportWidth(1280);
  });

  afterEach(async () => {
    if (activeUnmount) {
      await activeUnmount();
      activeUnmount = null;
    }
    vi.restoreAllMocks();
  });

  it("1. Snapshot Catalog & Banner (R1.3, F2): displays stage-02-three-pillar-v2 and lists catalog stages", async () => {
    await mountClean();
    expect(document.body.textContent).toContain("stage-02-three-pillar-v2");
    expect(document.body.textContent).toContain(
      "Active Dynamic Mockup — Ready for 1:1 Main-App Migration & Snapshot Freeze",
    );
    const switcher =
      queryByText(/stage-02-three-pillar-v2/i, "button, [role='button'], [aria-haspopup]") ??
      findByText(/Stage 02/i, "button, [role='button']");
    await clickElement(switcher);
    expect(document.body.textContent).toContain("stage-01-three-pillar-v1");
    expect(document.body.textContent).toContain("stage-02-three-pillar-v2");
  });

  it("2. Zero-Backend Runtime Isolation Across 3 Pillars (R1.1, R1.2, F1, F4)", async () => {
    const container = await mountClean();

    await clickByAriaLabel(/Menu Profil Pengguna/i);
    await clickByText(/^Keluar$/i);
    expect(document.body.textContent).toMatch(/Tamu Lokal|Mode Tamu/i);
    await clickByText(/^Masuk$/i);
    expect(document.body.textContent).toContain("@dr.aras.wicaksono");

    await clickByText(/^Pending$/i);
    expect(document.body.textContent).toMatch(/Beta Pending/i);
    await clickByText(/^Visitor$/i);
    await clickByText(/^Owner$/i);

    await clickByText(/^Profile$/i, "nav button");
    await clickByText(/Academy Tree/i);
    expect(document.body.textContent).toContain("Academy Living Pedagogical Tree");
    await clickByText(/RPS Pekan 3/i);
    await clickByText(/Mengukur bounding-box subtree lalu menyusun tanpa tumpang tindih/i);
    const l5Card = findByText(/Instruksi & Tugas/i).closest("button");
    expect(l5Card?.textContent).toMatch(/available/i);

    const subNodeInput = findInputByPlaceholderOrLabel(/Catatan belajar Anda/i);
    await setInputValue(subNodeInput, "catatan-e2e-dag");
    await clickByText(/^Sub-Node$/i, "button[type='submit']");
    expect(document.body.textContent).toContain("catatan-e2e-dag.md");

    await clickByText(/^Editor$/i, "nav button");
    expect(document.body.textContent).not.toContain("Memuat Workspace...");

    const addFileSelector =
      "button[aria-label*='Add File' i], button[title*='Add File' i], button[aria-label*='New File' i], button[title*='Tambah File' i]";
    let addFileBtn = container.querySelector<HTMLElement>(addFileSelector);
    if (!addFileBtn) {
      await clickByAriaLabel(/File Explorer/i);
      addFileBtn = container.querySelector<HTMLElement>(addFileSelector);
    }
    expect(addFileBtn).not.toBeNull();
    if (!addFileBtn) throw new Error("Add File button not found in File Explorer");
    await clickElement(addFileBtn);

    const mdTextarea = container.querySelector<HTMLTextAreaElement>("textarea");
    expect(mdTextarea).not.toBeNull();
    if (!mdTextarea) throw new Error("Markdown textarea not found in Editor");
    await setInputValue(mdTextarea, "# Catatan Lokal In-Memory\n\nKonten E2E terisolasi.");
    expect(mdTextarea.value).toContain("Konten E2E terisolasi.");

    const leftDrawer = container.querySelector<HTMLElement>("aside[aria-label='Left Drawer']") ?? container;
    const secondFile = queryByText(/debat-alignment-ai\.md/i, "button, [role='button'], [role='treeitem'], div", leftDrawer);
    expect(secondFile).not.toBeNull();
    if (!secondFile) throw new Error("Second file debat-alignment-ai.md not found in File Explorer");
    await clickElement(secondFile);

    const hasSecondFileContent =
      Array.from(container.querySelectorAll("textarea")).some((ta) => ta.value.includes("Debat Alignment AI")) ||
      (container.textContent ?? "").includes("Debat Alignment AI");
    expect(hasSecondFileContent).toBe(true);
  });

  it("3. Clean Editor Tab Bar (R2.1, F3): pure workspace actions present, Share & Lens popovers absent", async () => {
    const container = await mountClean();
    await clickByText(/^Editor$/i, "nav button");

    const newTabBtn = await clickByAriaLabel(/New tab/i, container);
    const tabBar = newTabBtn.closest("div.h-10") ?? newTabBtn.parentElement?.parentElement ?? newTabBtn.parentElement;
    expect(tabBar).not.toBeNull();
    expect(tabBar?.querySelector("textarea")).toBeNull();

    const splitRightBtn = container.querySelector<HTMLElement>("[aria-label='Split right']");
    const splitDownBtn = container.querySelector<HTMLElement>("[aria-label='Split down']");
    expect(splitRightBtn).not.toBeNull();
    expect(splitDownBtn).not.toBeNull();

    const forbiddenInTabBar = Array.from(tabBar?.querySelectorAll("button") ?? []).filter((btn) =>
      /\bShare\b|\bLens\b|QuickShare|QuickLens/i.test(`${btn.textContent ?? ""} ${btn.getAttribute("aria-label") ?? ""}`),
    );
    expect(forbiddenInTabBar).toHaveLength(0);

    if (!splitRightBtn || !splitDownBtn) throw new Error("Split buttons missing");
    await clickElement(splitRightBtn);
    expect(container.querySelectorAll("[aria-label='Split right']").length).toBeGreaterThanOrEqual(2);
    await clickElement(splitDownBtn);
    expect(container.querySelectorAll("[aria-label='Split down']").length).toBeGreaterThanOrEqual(3);
  });

  it("4. Full-Width <PrototypeSettingsHub /> & PrototypeSettingsBreadcrumbBar (R3.1, R3.2, F6, F7)", async () => {
    const container = await mountClean();

    await openUserMenuAndClickSettings();
    expect(container.querySelectorAll("aside")).toHaveLength(0);
    expect(document.body.textContent).toContain("Settings Hub");

    await clickByText(/^Editor$/i, "nav button");
    await openUserMenuAndClickSettings();
    const innerHubAsides = Array.from(container.querySelectorAll("aside")).filter(
      (a) => !/Left Drawer|Right Drawer/i.test(a.getAttribute("aria-label") ?? ""),
    );
    expect(innerHubAsides).toHaveLength(0);

    const searchInput = findInputByPlaceholderOrLabel(/Cari|Quick search|Search settings/i);
    const breadcrumbBar =
      container.querySelector<HTMLElement>("[aria-label*='Breadcrumb' i], nav[aria-label*='Settings' i]") ??
      searchInput.closest("div, nav, header")?.parentElement ??
      container;

    const catTrigger =
      queryByText(/^(?:[1-3]\.\s*)?(Account|Workspace|Vault)\b/i, "button, [role='button']", breadcrumbBar) ??
      findByText(/Category|Workspace|Account/i, "button", breadcrumbBar);
    await clickElement(catTrigger);
    expect(document.body.textContent).toMatch(/1\.\s*Account/i);
    expect(document.body.textContent).toMatch(/2\.\s*Workspace/i);
    expect(document.body.textContent).toMatch(/3\.\s*Vault/i);
    const popper1 = document.body.querySelector("[data-radix-popper-content-wrapper], [role='menu'], [role='listbox']") ?? document.body;
    await clickByText(/^(?:2\.\s*)?Workspace\b/i, "button, [role='menuitem'], [role='option']", popper1);

    const subTrigger =
      queryByText(/Workspace Preset/i, "button, [role='button']", breadcrumbBar) ??
      findByText(/Sub-Setting|Workspace Preset/i, "button", breadcrumbBar);
    await clickElement(subTrigger);
    expect(document.body.textContent).toContain("Central .app/config.json");
    expect(document.body.textContent).toContain("Deep Explorer");
    expect(document.body.textContent).toContain("Visual Engine");
    const popper2 = document.body.querySelector("[data-radix-popper-content-wrapper], [role='menu'], [role='listbox']") ?? document.body;
    await clickByText(/Workspace Preset/i, "button, [role='menuitem'], [role='option']", popper2);

    const secTrigger =
      queryByText(/#dashboard-overview|Dashboard Overview/i, "button, [role='button']", breadcrumbBar) ??
      findByText(/#/i, "button", breadcrumbBar);
    await clickElement(secTrigger);
    expect(document.body.textContent).toMatch(/#preset-catalog|Preset Catalogs/i);
    expect(document.body.textContent).toMatch(/#impact-preview|Impact Diff Preview/i);

    await setInputValue(searchInput, "Session Activity");
    const sessionHit = findAllByText(/Session Activity/i, "button, [role='option'], [role='menuitem']");
    expect(sessionHit.length).toBeGreaterThan(0);
    await clickElement(sessionHit[sessionHit.length - 1]);
    expect(document.body.textContent).toMatch(/Active Sessions|Current Session/i);
  });

  it("5. Editor Right Sidebar 13-Item Tree & Deep Explorer Standalone Tab (R3.3, R4.6, F5, F11)", async () => {
    const container = await mountClean();
    await clickByText(/^Editor$/i, "nav button");

    let rightDrawer = container.querySelector<HTMLElement>("aside[aria-label='Right Drawer']");
    if (!rightDrawer) {
      await clickByAriaLabel(/Toggle Right Drawer|Right Drawer|Settings Sidebar/i, container);
      rightDrawer = container.querySelector<HTMLElement>("aside[aria-label='Right Drawer']");
    }
    expect(rightDrawer).not.toBeNull();
    const drawerText = rightDrawer?.textContent ?? "";
    expect(drawerText).toContain("Account");
    expect(drawerText).toContain("Workspace");
    expect(drawerText).toContain("Vault");
    for (const label of THIRTEEN_SUB_SETTINGS) {
      expect(drawerText).toContain(label);
    }

    await clickByText("Deep Explorer", "button, [role='button']", rightDrawer ?? document.body);
    const bodyText = document.body.textContent ?? "";
    for (const lens of ["Graph", "Diagram", "Table", "Cards"]) {
      expect(bodyText).toContain(lens);
    }
    expect(bodyText).toMatch(/Branch|Cabang/i);
    expect(bodyText).toMatch(/Folder/i);
    expect(bodyText).toMatch(/Depth|Kedalaman/i);
    for (const grp of ["Hierarchy", "Properties", "Tags", "Backlinks", "Keywords"]) {
      expect(bodyText).toContain(grp);
    }

    const openTabBtn = findByText(/Buka Deep Explorer sebagai Tab Workspace Mandiri/i, "button");
    await clickElement(openTabBtn);

    const standaloneBtnAfter = queryByText(/Buka Deep Explorer sebagai Tab Workspace Mandiri/i, "button");
    expect(standaloneBtnAfter === null || standaloneBtnAfter.closest("[aria-hidden='true']") !== null).toBe(true);

    const deepTab =
      container.querySelector("[aria-label='Close Deep Explorer'], [role='tab'][aria-label*='Deep Explorer' i]") ??
      queryByText(/^Deep Explorer$/i, "[role='tab'], div.h-10 span, div.h-10 button", container);
    expect(deepTab).not.toBeNull();

    const activeExplorerScope =
      Array.from(container.querySelectorAll<HTMLElement>("div")).find(
        (el) => !el.closest("[aria-hidden='true']") && el.getAttribute("aria-hidden") !== "true" && /Graph/i.test(el.textContent ?? "") && /Cards/i.test(el.textContent ?? ""),
      ) ?? container;
    await clickByText(/^Table$/i, "button, [role='tab']", activeExplorerScope);
    expect(
      activeExplorerScope.querySelector("table") ?? queryByText(/File-Node \(\.md\)/i, "*", activeExplorerScope),
    ).not.toBeNull();
  });
});
