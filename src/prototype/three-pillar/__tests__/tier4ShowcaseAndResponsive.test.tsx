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

const THIRTEEN_SETTINGS_LABELS: readonly RegExp[] = [
  /Profile Customization/i, /Credentials & Security/i, /Session Activity/i,
  /Workspace Preset/i, /Central \.app\/config\.json/i, /^Deep Explorer$/i,
  /Appearance & Accessibility/i, /Visual Engine/i,
  /Vaults Dashboard/i, /Vaults Collaborating/i, /VCS, Diff, Backup & History/i,
  /Vaults Publish/i, /Import & Export Vault/i,
];

let cleanup: (() => Promise<void>) | null = null;

beforeEach(async () => {
  resetPrototypeTestDom();
  await setTestViewportWidth(1280);
});

afterEach(async () => {
  if (cleanup) {
    await cleanup();
    cleanup = null;
  }
  resetPrototypeTestDom();
});

async function navDesktopPillar(label: "Explore" | "Profile" | "Editor"): Promise<void> {
  const desktopNav = document.querySelector("nav[aria-label='Navigasi 3 Pilar']");
  if (!desktopNav) throw new Error("Desktop Navigasi 3 Pilar not found");
  await clickByText(new RegExp(`^${label}$`, "i"), "button", desktopNav);
}

async function openSettingsViaUserMenu(): Promise<void> {
  await clickByAriaLabel(/Menu Profil Pengguna/i);
  await clickByText(/Settings Hub/i);
  expect(findByText(/Settings Hub/i)).toBeTruthy();
}

async function pickSetting(
  category: "Account" | "Workspace" | "Vault",
  subLabel: RegExp,
): Promise<void> {
  const rightDrawer = document.querySelector("aside[aria-label='Right Drawer']");
  const sidebarMatch = rightDrawer
    ? findAllByText(subLabel, "button", rightDrawer)[0]
    : undefined;
  if (sidebarMatch) {
    await clickElement(sidebarMatch);
    return;
  }
  const catTrigger = findAllByText(/^(?:\d+\.\s*)?(Account|Workspace|Vault)$/i, "button")[0];
  if (catTrigger && !new RegExp(`\\b${category}\\b`, "i").test(catTrigger.textContent ?? "")) {
    await clickElement(catTrigger);
    const popper = document.querySelector("[data-radix-popper-content-wrapper], [role='menu'], [role='listbox']");
    const catOption = findAllByText(
      new RegExp(`^(?:\\d+\\.\\s*)?${category}\\b`, "i"),
      "button, [role='menuitem'], [role='option']",
      popper ?? document.body,
    );
    await clickElement(catOption[catOption.length - 1]);
  }
  const subNames = [
    "Profile Customization", "Credentials & Security", "Session Activity",
    "Workspace Preset", "Central \\.app\\/config\\.json", "Deep Explorer",
    "Appearance & Accessibility", "Visual Engine", "Vaults Dashboard",
    "Vaults Collaborating", "VCS, Diff, Backup & History", "Vaults Publish", "Import & Export Vault",
  ];
  const subTrigger = findAllByText(new RegExp(`^(?:\\d+\\.\\s*)?(?:${subNames.join("|")})$`, "i"), "button")[0];
  if (subTrigger && !subLabel.test((subTrigger.textContent ?? "").trim())) {
    await clickElement(subTrigger);
    const popper = document.querySelector("[data-radix-popper-content-wrapper], [role='menu'], [role='listbox']");
    const target = findAllByText(subLabel, "button, [role='menuitem'], [role='option']", popper ?? document.body);
    await clickElement(target[target.length - 1]);
  }
}

function assertNoInlineSettingsRail(): void {
  expect(queryByText(/^Vault & Lenses$/i, "aside button")).toBeNull();
  expect(queryByText(/^Share · Access · VCS$/i, "aside button")).toBeNull();
  expect(queryByText(/^Account & App$/i, "aside button")).toBeNull();
  const nonDrawerAside = Array.from(document.body.querySelectorAll("aside")).filter(
    (el) => el.getAttribute("aria-label") !== "Right Drawer" && el.getAttribute("aria-label") !== "Left Drawer",
  );
  expect(nonDrawerAside.length).toBe(0);
}

describe("Tier 4: Stakeholder Showcase Flows & Responsive Viewports", () => {
  it("completes Stakeholder Showcase Flow 1: Explore -> Profile -> Editor -> Deep Explorer -> Settings Hub -> Publish/VCS", async () => {
    const mounted = await mountPrototypePage();
    cleanup = mounted.unmount;

    expect(findByText(/stage-02-three-pillar-v2/i)).toBeTruthy();

    await clickByText(/Arsitektur Memori/i);
    expect(findByText(/Mini-Graph Preview/i)).toBeTruthy();
    expect(findByText(/\.app\/config\.json Preset/i)).toBeTruthy();
    await clickByText(/^Close$/i, "button");

    await navDesktopPillar("Profile");
    await clickByText(/^Academy Tree$/i, "button");
    await clickByText(/RPS Pekan 3/i);
    await clickByText(/Mengukur bounding-box subtree/i);
    expect(findByText(/Lulus/i)).toBeTruthy();
    await setInputValue(findInputByPlaceholderOrLabel(/Catatan belajar/i), "catatan-uji-showcase.md");
    await clickByText(/Sub-Node/i, "button");
    expect(findByText(/catatan-uji-showcase\.md/i)).toBeTruthy();

    await navDesktopPillar("Editor");
    await clickByAriaLabel(/File Explorer/i);
    const addFileBtn = document.querySelector<HTMLElement>(
      "button[title='Add File'], button[aria-label*='Add File' i], button[aria-label*='New File' i]",
    );
    if (addFileBtn) await clickElement(addFileBtn);
    else await clickByAriaLabel(/New tab/i);
    const noteEditor = document.body.querySelector<HTMLTextAreaElement>("textarea");
    if (noteEditor) await setInputValue(noteEditor, "# Catatan Showcase\n\nDiperbarui di Editor.");

    await openSettingsViaUserMenu();
    await pickSetting("Workspace", /^Deep Explorer$/i);
    await clickByText(/Buka Deep Explorer sebagai Tab Workspace Mandiri/i, "button");

    await clickByText(/^Graph$/i, "button");
    await clickByText(/^Table$/i, "button");
    expect(findByText(/File-Node|Table/i)).toBeTruthy();
    await clickByText(/^Cards$/i, "button");

    await openSettingsViaUserMenu();
    await pickSetting("Workspace", /^Workspace Preset$/i);
    await clickByText(/^Studio\b/i);
    expect(findByText(/What Will Change|Impact Diff/i)).toBeTruthy();
    await clickByText(/Validate & Apply Preset/i, "button");

    await pickSetting("Workspace", /Central \.app\/config\.json/i);
    expect(findByText(/Valid \(\.app\/config\.json Schema v2\)/i)).toBeTruthy();
    const cfgArea = Array.from(document.body.querySelectorAll<HTMLTextAreaElement>("textarea")).find((el) =>
      el.value.includes("deep_explorer"),
    );
    expect(cfgArea?.value).toContain('"primary_mode": "studio"');

    await pickSetting("Vault", /VCS, Diff, Backup & History/i);
    await setInputValue(findInputByPlaceholderOrLabel(/label snapshot|snapshot/i), "showcase-snap-v2");
    await clickByText(/Buat Snapshot|Create Snapshot|\+ Snapshot/i, "button");
    expect(findByText(/showcase-snap-v2/i)).toBeTruthy();

    await pickSetting("Vault", /^Vaults Publish$/i);
    await clickByText(/public_unlisted/i);
    expect(findByText(/public_unlisted/i)).toBeTruthy();
  });

  it("completes Stakeholder Showcase Flow 2: Auth Sim, RBAC Owner, Full-Page Account Governance & Import/Export", async () => {
    const mounted = await mountPrototypePage();
    cleanup = mounted.unmount;

    await clickByAriaLabel(/Menu Profil Pengguna/i);
    await clickByText(/Keluar/i, "button");
    expect(findByText(/Mode Tamu|Tamu Lokal/i)).toBeTruthy();
    await clickByText(/Masuk/i, "button");
    expect(findByText(/@dr\.aras\.wicaksono/i)).toBeTruthy();
    await clickByText(/^Owner$/i, "button");

    await navDesktopPillar("Profile");
    await clickByText(/Full Account Settings/i, "button");
    assertNoInlineSettingsRail();

    await pickSetting("Account", /^Profile Customization$/i);
    await setInputValue(findInputByPlaceholderOrLabel(/bio/i), "Peneliti graf pengetahuan & kedaulatan plaintext.");
    await clickByText(/Simpan Profil|Save Profile|Simpan/i, "button");
    await setInputValue(findInputByPlaceholderOrLabel(/label.*tautan|link label|label/i), "ORCID Lab");
    await setInputValue(findInputByPlaceholderOrLabel(/https:\/\/|url/i), "https://orcid.org/0000-0002-8491-3302");
    await clickByText(/Tambah Tautan|Add Link/i, "button");
    expect(findByText(/ORCID Lab/i)).toBeTruthy();

    await pickSetting("Account", /^Credentials & Security$/i);
    await setInputValue(findInputByPlaceholderOrLabel(/token|pat/i), "Showcase PAT Token");
    await clickByText(/Buat Token|Create.*Token|Generate/i, "button");
    expect(findByText(/Showcase PAT Token/i)).toBeTruthy();

    await pickSetting("Account", /^Session Activity$/i);
    expect(findByText(/Current Session/i)).toBeTruthy();
    await clickByText(/Revoke All Other|Cabut Semua Sesi Lain/i, "button");
    expect(findByText(/ThinkPad X1 Carbon/i)).toBeTruthy();
    expect(queryByText(/MacBook Pro M3/i)).toBeNull();

    await pickSetting("Vault", /^Import & Export Vault$/i);
    await clickByText(/Import/i, "button");
    await clickByText(/Export/i, "button");
    expect(findByText(/Import & Export Vault/i)).toBeTruthy();
  });

  it("verifies responsive navigation, drawer toggles, dual navigator, and rail-free Settings Hub across 360px, 768px, and 1280px", async () => {
    const mounted = await mountPrototypePage();
    cleanup = mounted.unmount;

    // 360px mobile
    await setTestViewportWidth(360);
    expect(document.querySelector("nav[aria-label='Navigasi Mobile']")).toBeTruthy();
    expect(document.querySelector("button[aria-label='Pilih Halaman Aktif']")).toBeTruthy();
    const mobileNav = document.querySelector("nav[aria-label='Navigasi Mobile']");
    if (!mobileNav) throw new Error("Mobile nav not found");
    await clickByText(/^Profile$/i, "button", mobileNav);
    expect(document.querySelector("nav[aria-label='Navigasi Mobile']")).toBeTruthy();

    await clickByText(/^Editor$/i, "button", mobileNav);
    expect(document.querySelector("button[aria-label='Toggle Left Drawer']")).toBeTruthy();
    expect(document.querySelector("button[aria-label='Toggle Right Drawer']")).toBeTruthy();
    expect(document.querySelector("button[aria-label*='Quick Share' i], button[aria-label*='Quick Lens' i]")).toBeNull();

    await openSettingsViaUserMenu();
    assertNoInlineSettingsRail();
    expect(findByText(/Settings Hub/i)).toBeTruthy();

    // 768px tablet
    await setTestViewportWidth(768);
    expect(document.querySelector("nav[aria-label='Navigasi 3 Pilar']")).toBeTruthy();
    expect(document.querySelector("button[aria-label='New tab']")).toBeTruthy();
    assertNoInlineSettingsRail();

    // 1280px desktop
    await setTestViewportWidth(1280);
    const desktopNav = document.querySelector("nav[aria-label='Navigasi 3 Pilar']");
    expect(desktopNav).toBeTruthy();
    expect(findByText(/^Explore$/i, "button", desktopNav ?? document.body)).toBeTruthy();
    expect(findByText(/^Profile$/i, "button", desktopNav ?? document.body)).toBeTruthy();
    expect(findByText(/^Editor$/i, "button", desktopNav ?? document.body)).toBeTruthy();
    expect(document.querySelector("button[aria-label='Split right']")).toBeTruthy();
    expect(document.querySelector("button[aria-label='Split down']")).toBeTruthy();

    await clickByAriaLabel(/Toggle Right Drawer/i);
    const rightDrawer = document.querySelector("aside[aria-label='Right Drawer']");
    expect(rightDrawer).toBeTruthy();
    for (const pattern of THIRTEEN_SETTINGS_LABELS) {
      expect(findByText(pattern, "*", rightDrawer ?? document.body)).toBeTruthy();
    }
    expect(findByText(/Settings Hub/i)).toBeTruthy();
    expect(findInputByPlaceholderOrLabel(/cari.*setting|quick search|lompat|search settings/i)).toBeTruthy();
    assertNoInlineSettingsRail();
  });
});
