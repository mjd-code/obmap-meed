import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildAppConfigJson } from "@/prototype/three-pillar/mockVcsAndConfigData";
import { SETTINGS_CATALOG } from "@/prototype/three-pillar/settingsCatalog";
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
} from "./prototypeTestHarness";

const WORKSPACE_ROOT = process.cwd();
const PROTOTYPE_DIR = path.join(WORKSPACE_ROOT, "src", "prototype");
const THREE_PILLAR_DIR = path.join(PROTOTYPE_DIR, "three-pillar");
const SNAPSHOTS_DIR = path.join(PROTOTYPE_DIR, "snapshots");

const FORBIDDEN_BACKEND_SYMBOLS = [
  /\bsupabase\b/,
  /\buseAuth\b/,
  /\bdevQuickLogin\b/,
  /\buseConfigSync\b/,
  /\buseVaultLifecycle\b/,
];

function collectTsFiles(dir: string, includeTests: boolean): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!includeTests && entry.name === "__tests__") continue;
      files.push(...collectTsFiles(full, includeTests));
    } else if (/\.(ts|tsx)$/.test(entry.name) && (includeTests || !/\.test\.(ts|tsx)$/.test(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

function countFileLines(filePath: string): number {
  const raw = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n").replace(/\n$/, "");
  return raw === "" ? 0 : raw.split("\n").length;
}

async function openSettingsHubFullPage(): Promise<void> {
  await clickByAriaLabel(/Menu Profil Pengguna/i);
  await clickByText(/Settings Hub/i);
}

async function openSubSetting(category: "Account" | "Workspace" | "Vault", subLabel: string): Promise<void> {
  const catBtn = findAllByText(/^(?:\d+\.\s*)?(Account|Workspace|Vault)$/i, "button")[0];
  if (catBtn && !new RegExp(`\\b${category}\\b`, "i").test(catBtn.textContent ?? "")) {
    await clickElement(catBtn);
    await clickByText(new RegExp(`^(?:\\d+\\.\\s*)?${category}\\b`, "i"), "button, [role='menuitem'], [role='option']");
  }
  const subPattern = new RegExp(`^${subLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
  const subNames = SETTINGS_CATALOG.map((s) => s.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const anySubTrigger = findAllByText(new RegExp(`^(?:\\d+\\.\\s*)?(?:${subNames.join("|")})$`, "i"), "button")[0];
  if (anySubTrigger && !subPattern.test((anySubTrigger.textContent ?? "").trim())) {
    await clickElement(anySubTrigger);
    await clickByText(new RegExp(subLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "button, [role='menuitem'], [role='option']");
  }
}

async function mountSettingsSub(category: "Account" | "Workspace" | "Vault", subLabel: string): Promise<void> {
  const mounted = await mountPrototypePage();
  unmountCurrent = mounted.unmount;
  await openSettingsHubFullPage();
  await openSubSetting(category, subLabel);
}

function getRawConfigTextarea(): HTMLTextAreaElement {
  const area = Array.from(document.body.querySelectorAll<HTMLTextAreaElement>("textarea")).find(
    (el) => el.value.includes("schema_version") || el.value.includes("primary_mode") || el.value.trim().startsWith("{"),
  );
  if (!area) throw new Error("Raw .app/config.json textarea not found");
  return area;
}

function findApplyConfigButton(): HTMLButtonElement {
  const btn = findAllByText(/Terapkan|Apply|Simpan Konfigurasi|Save Config/i, "button").find(
    (el): el is HTMLButtonElement => el instanceof HTMLButtonElement,
  );
  if (!btn) throw new Error("Apply/Save .app/config.json button not found");
  return btn;
}

const VALID_CONFIG_JSON = JSON.stringify(
  buildAppConfigJson({ vaultId: "v-atlas", name: "Atlas Kognisi & Memori", primaryMode: "atlas", defaultDeepExplorerView: "graph", lens: "atlas" }),
  null,
  2,
);

let unmountCurrent: (() => Promise<void>) | null = null;

afterEach(async () => {
  if (unmountCurrent) {
    await unmountCurrent();
    unmountCurrent = null;
  }
  resetPrototypeTestDom();
});

describe("Tier 2: Static Enforcement & Line-Cap Audit", () => {
  it("contains zero backend/auth/sync/lifecycle symbols in src/prototype/ implementation files", () => {
    const implFiles = collectTsFiles(PROTOTYPE_DIR, false);
    expect(implFiles.length).toBeGreaterThan(0);
    const violations: string[] = [];
    for (const file of implFiles) {
      const content = fs.readFileSync(file, "utf8");
      for (const pattern of FORBIDDEN_BACKEND_SYMBOLS) {
        if (pattern.test(content)) violations.push(`${path.relative(WORKSPACE_ROOT, file)} -> ${pattern.source}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("contains zero occurrences of Helicopter View (case-insensitive) in src/prototype/ non-test files", () => {
    const implFiles = collectTsFiles(PROTOTYPE_DIR, false);
    const matches = implFiles
      .filter((file) => /helicopter/i.test(fs.readFileSync(file, "utf8")))
      .map((file) => path.relative(WORKSPACE_ROOT, file));
    expect(matches).toEqual([]);
  });

  it("keeps every .ts/.tsx file in src/prototype/three-pillar/ and src/prototype/snapshots/ <= 300 lines", () => {
    const files = [...collectTsFiles(THREE_PILLAR_DIR, true), ...collectTsFiles(SNAPSHOTS_DIR, true)];
    expect(files.length).toBeGreaterThan(0);
    const oversized = files.map((f) => ({ file: path.relative(WORKSPACE_ROOT, f), lines: countFileLines(f) })).filter((e) => e.lines > 300);
    expect(oversized).toEqual([]);
  });

  it("defines stage-02-three-pillar-v2 in src/prototype/snapshots/snapshotRegistry.ts", () => {
    const registryPath = path.join(SNAPSHOTS_DIR, "snapshotRegistry.ts");
    expect(fs.existsSync(registryPath)).toBe(true);
    expect(fs.readFileSync(registryPath, "utf8")).toContain("stage-02-three-pillar-v2");
  });

  it("keeps EditorQuickSubFunctionPopovers.tsx present and referenced in Drawers and EditorPillarView (R2.2)", () => {
    const componentsDir = path.join(THREE_PILLAR_DIR, "components");
    expect(fs.existsSync(path.join(componentsDir, "EditorQuickSubFunctionPopovers.tsx"))).toBe(true);
    expect(fs.readFileSync(path.join(componentsDir, "PrototypeWorkspaceDrawers.tsx"), "utf8")).toContain(
      "EditorQuickSubFunctionPopovers",
    );
    expect(fs.readFileSync(path.join(componentsDir, "EditorPillarView.tsx"), "utf8")).toContain(
      "EditorQuickSubFunctionPopovers",
    );
  });
});

describe("Tier 2: .app/config.json Live Validator & Preset Impact Diff Guards", () => {
  it("blocks malformed JSON, invalid mode.primary_mode, and invalid deep_explorer values, then recovers on valid JSON", async () => {
    await mountSettingsSub("Workspace", "Central .app/config.json");

    const editor = getRawConfigTextarea();
    await setInputValue(editor, '{ "meta": { broken_json }');
    expect(findByText(/Invalid JSON Syntax|JSON syntax error|syntax/i)).toBeTruthy();
    expect(findApplyConfigButton().disabled).toBe(true);

    const badMode = JSON.parse(VALID_CONFIG_JSON) as Record<string, Record<string, unknown>>;
    badMode.mode.primary_mode = "invalid_mode";
    await setInputValue(editor, JSON.stringify(badMode, null, 2));
    expect(findByText(/mode\.primary_mode|primary_mode/i)).toBeTruthy();
    expect(findApplyConfigButton().disabled).toBe(true);

    const badExplorer = JSON.parse(VALID_CONFIG_JSON) as Record<string, Record<string, unknown>>;
    badExplorer.deep_explorer.default_view = "bad_view";
    badExplorer.deep_explorer.reorganize_by = "bad_reorg";
    badExplorer.deep_explorer.restructure_mode = "bad_restructure";
    await setInputValue(editor, JSON.stringify(badExplorer, null, 2));
    expect(findByText(/deep_explorer\.default_view/i)).toBeTruthy();
    expect(findByText(/deep_explorer\.reorganize_by/i)).toBeTruthy();
    expect(findByText(/deep_explorer\.restructure_mode/i)).toBeTruthy();
    expect(findApplyConfigButton().disabled).toBe(true);

    await setInputValue(editor, VALID_CONFIG_JSON);
    expect(findByText("Valid (.app/config.json Schema v2)")).toBeTruthy();
    expect(findApplyConfigButton().disabled).toBe(false);
  });

  it("opens What Will Change Impact Diff without immediate apply, preserves config on cancel, and applies on Validate & Apply Preset", async () => {
    await mountSettingsSub("Workspace", "Workspace Preset");

    await clickByText(/^Studio\b/i);
    expect(findByText(/What Will Change/i)).toBeTruthy();
    await clickByText(/Batal|Cancel/i, "button");
    expect(queryByText(/Validate & Apply Preset/i, "button")).toBeNull();

    await openSubSetting("Workspace", "Central .app/config.json");
    expect(getRawConfigTextarea().value).toContain('"primary_mode": "atlas"');

    await openSubSetting("Workspace", "Workspace Preset");
    await clickByText(/^Studio\b/i);
    expect(findByText(/What Will Change/i)).toBeTruthy();
    await clickByText(/Validate & Apply Preset/i, "button");

    await openSubSetting("Workspace", "Central .app/config.json");
    expect(getRawConfigTextarea().value).toContain('"primary_mode": "studio"');
  });
});

describe("Tier 2: Account & Vault Boundary Guards", () => {
  it("rejects invalid @username and ORCID format in Profile Customization", async () => {
    await mountSettingsSub("Account", "Profile Customization");

    const handleInput = findInputByPlaceholderOrLabel(/handle|username|@dr\.aras/i);
    await setInputValue(handleInput, "@bad user!");
    await clickByText(/Simpan Profil|Save Profile|Simpan/i, "button");
    expect(findByText(/Handle kanonik|3–32 karakter/i)).toBeTruthy();

    await setInputValue(handleInput, "@dr.aras.wicaksono");
    const orcidInput = findInputByPlaceholderOrLabel(/orcid|0000-/i);
    await setInputValue(orcidInput, "1234-bad-orcid");
    await clickByText(/Simpan Profil|Save Profile|Simpan/i, "button");
    expect(findByText(/Format ORCID|0000-0000-0000-0000/i)).toBeTruthy();
  });

  it("rejects weak password and mismatched confirmation in Credentials & Security", async () => {
    await mountSettingsSub("Account", "Credentials & Security");

    const curPw = findInputByPlaceholderOrLabel(/sandi saat ini|current password/i);
    const newPw = findInputByPlaceholderOrLabel(/sandi baru|new password/i);
    const confirmPw = findInputByPlaceholderOrLabel(/konfirmasi|confirm/i);

    await setInputValue(curPw, "OldPass123!");
    await setInputValue(newPw, "weak");
    await setInputValue(confirmPw, "weak");
    await clickByText(/Perbarui Sandi|Update Password|Ubah Sandi/i, "button");
    expect(findByText(/Sangat Lemah|Lemah|terlalu lemah/i)).toBeTruthy();

    await setInputValue(newPw, "StrongPass99!");
    await setInputValue(confirmPw, "MismatchPass99!");
    await clickByText(/Perbarui Sandi|Update Password|Ubah Sandi/i, "button");
    expect(findByText(/tidak cocok|mismatch/i)).toBeTruthy();
  });

  it("blocks individual revocation of Current Session and preserves it on Revoke All Other Sessions", async () => {
    await mountSettingsSub("Account", "Session Activity");

    expect(findByText(/ThinkPad X1 Carbon/i)).toBeTruthy();
    expect(findByText(/MacBook Pro M3/i)).toBeTruthy();
    let currentRow: HTMLElement | null = findByText(/ThinkPad X1 Carbon/i);
    while (currentRow?.parentElement && !/MacBook Pro M3/i.test(currentRow.parentElement.textContent ?? "")) {
      currentRow = currentRow.parentElement;
    }
    expect(currentRow?.textContent).toMatch(/Current Session/i);
    const currentRevokeBtns = Array.from(currentRow?.querySelectorAll("button") ?? []).filter((b) =>
      /Revoke|Cabut/i.test(b.textContent ?? ""),
    );
    for (const btn of currentRevokeBtns) {
      expect(btn.disabled || btn.getAttribute("aria-disabled") === "true").toBe(true);
    }
    await clickByText(/Revoke All Other Sessions/i, "button");

    expect(findByText(/Current Session/i)).toBeTruthy();
    expect(findByText(/ThinkPad X1 Carbon/i)).toBeTruthy();
    expect(queryByText(/MacBook Pro M3/i)).toBeNull();
  });

  it("guards against deleting the last remaining vault in Vaults Dashboard", async () => {
    await mountSettingsSub("Vault", "Vaults Dashboard");

    const getDeleteBtns = () =>
      findAllByText(/Hapus|Delete/i, "button").filter((b): b is HTMLButtonElement => b instanceof HTMLButtonElement);
    expect(getDeleteBtns().length).toBeGreaterThanOrEqual(2);
    for (let step = 0; step < 12; step += 1) {
      const enabled = getDeleteBtns().filter((b) => !b.disabled);
      if (enabled.length <= 1) break;
      await clickElement(enabled[0]);
    }
    const remaining = getDeleteBtns();
    if (remaining.length === 1 && !remaining[0].disabled) await clickElement(remaining[0]);
    expect(findAllByText(/Atlas Kognisi|Kuliah Graf|Monograf|Lab Riset|Proposal Hibah|Folder Lokal|Sandbox Offline/i).length).toBeGreaterThanOrEqual(1);
  });
});
