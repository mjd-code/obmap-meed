import { afterEach, describe, expect, it } from "vitest";
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

function expectAllVisible(patterns: readonly RegExp[]): void {
  for (const pattern of patterns) expect(findByText(pattern)).toBeTruthy();
}

async function openSettingsHub(): Promise<void> {
  await clickByAriaLabel(/Menu Profil Pengguna/i);
  await clickByText(/Settings Hub/i);
  expect(findByText(/Settings Hub/i)).toBeTruthy();
}

async function pickBreadcrumbItem(triggerPattern: RegExp, targetPattern: RegExp): Promise<void> {
  await clickByText(triggerPattern, "button, [role='button']");
  const menuScope = document.querySelector("[role='menu'], [role='listbox'], [data-radix-popper-content-wrapper]");
  if (menuScope) {
    const scoped = findAllByText(targetPattern, "button, [role='menuitem'], [role='option']", menuScope);
    if (scoped.length > 0) {
      await clickElement(scoped[scoped.length - 1]);
      return;
    }
  }
  const matches = findAllByText(targetPattern, "button, [role='menuitem'], [role='option']");
  if (matches.length === 0) throw new Error(`Breadcrumb item not found: ${String(targetPattern)}`);
  await clickElement(matches[matches.length - 1]);
}

async function jumpViaQuickSearch(query: string, targetPattern: RegExp): Promise<void> {
  const searchInput = findInputByPlaceholderOrLabel(/cari.*setting|quick search|lompat|search settings/i);
  await setInputValue(searchInput, query);
  const matches = findAllByText(targetPattern, "button, [role='menuitem'], [role='option']");
  if (matches.length === 0) throw new Error(`Quick search result not found: ${String(targetPattern)}`);
  await clickElement(matches[matches.length - 1]);
}

describe("Tier 1 — Settings Hub 13 Sub-Views (Opaque-Box)", () => {
  afterEach(() => {
    resetPrototypeTestDom();
  });

  it("covers Account sub-settings #1 Profile Customization, #2 Credentials & Security, and #3 Session Activity", async () => {
    const { unmount } = await mountPrototypePage();
    try {
      await openSettingsHub();
      expectAllVisible([/Account/i, /Profile Customization/i]);

      // #1 Profile Customization: Full Name, @username, Bio, Affiliation/ORCID, Social & Academic Links CRUD
      await setInputValue(findInputByPlaceholderOrLabel(/full name|nama lengkap/i), "Dr. Aras Wicaksono Ph.D");
      await setInputValue(findInputByPlaceholderOrLabel(/username|handle/i), "@aras.research");
      await setInputValue(findInputByPlaceholderOrLabel(/bio/i), "Graf pengetahuan deterministik & Living Skill Tree.");
      await setInputValue(findInputByPlaceholderOrLabel(/affiliation|afiliasi/i), "ITB Lab Epistemologi");
      await setInputValue(findInputByPlaceholderOrLabel(/orcid/i), "0000-0002-8491-3302");
      await clickByText(/Simpan Profil|Save Profile/i);
      expect(findByText(/@aras\.research/i)).toBeTruthy();

      await setInputValue(findInputByPlaceholderOrLabel(/label.*tautan|link label|label/i), "ORCID Mirror");
      await setInputValue(findInputByPlaceholderOrLabel(/https:\/\/|url/i), "https://github.com/sidra-lab");
      await clickByText(/Tambah Tautan|Add Link/i);
      expect(findByText(/ORCID Mirror/i)).toBeTruthy();
      await clickByText(/Edit/i);
      const deleteLinkBtns = findAllByText(/Hapus|Delete|Remove/i, "button, [role='button']");
      await clickElement(deleteLinkBtns[deleteLinkBtns.length - 1]);

      // #2 Credentials & Security: Reset Email, Reset Password + strength, API Keys / PAT CRUD
      await pickBreadcrumbItem(/Profile Customization/i, /Credentials & Security/i);
      expect(findByText(/Credentials & Security/i)).toBeTruthy();
      await setInputValue(findInputByPlaceholderOrLabel(/email/i), "aras.updated@itb.ac.id");
      await clickByText(/Reset Email|Ubah Email/i);

      await setInputValue(findInputByPlaceholderOrLabel(/current password|sandi saat ini/i), "CurrentPass#1");
      await setInputValue(findInputByPlaceholderOrLabel(/new password|sandi baru/i), "SidraStrong#2026");
      await setInputValue(findInputByPlaceholderOrLabel(/confirm|konfirmasi/i), "SidraStrong#2026");
      expect(findByText(/Kuat|Sangat Kuat|Strong/i)).toBeTruthy();
      await clickByText(/Reset Password|Perbarui Sandi/i);

      await setInputValue(findInputByPlaceholderOrLabel(/token|pat/i), "E2E Automation PAT");
      await clickByText(/Buat Token|Create.*Token|Generate/i);
      expect(findByText(/E2E Automation PAT/i)).toBeTruthy();
      await clickByText(/Revoke|Cabut/i);

      // #3 Session Activity: Device & Browser, Location, Last Active, Current Session badge, Revoke actions
      await pickBreadcrumbItem(/Credentials & Security/i, /Session Activity/i);
      expectAllVisible([/ThinkPad X1 Carbon/i, /Chrome 131\.0/i, /Bandung, ID/i, /Aktif sekarang/i, /Current Session/i]);
      const revokeSingle = queryByText(/^Revoke Session$|^Cabut Sesi$/i, "button");
      if (revokeSingle) await clickElement(revokeSingle);
      await clickByText(/Revoke All Other|Cabut Semua Sesi Lain/i);
      expect(findByText(/Current Session/i)).toBeTruthy();
      expect(queryByText(/MacBook Pro M3/i)).toBeNull();
    } finally {
      await unmount();
    }
  });

  it("covers Workspace sub-settings #4 Preset, #5 .app/config.json, #6 Deep Explorer, #7 Appearance, and #8 Visual Engine", async () => {
    const { unmount } = await mountPrototypePage();
    try {
      await openSettingsHub();
      await pickBreadcrumbItem(/Account/i, /^Workspace$/i);

      // #4 Workspace Preset (Dashboard Overview, Quick Links, Built-in/Custom/Community, Impact Diff Preview)
      expectAllVisible([
        /Deep Explorer/i, /\.app\/config\.json/i, /Visual Engine/i, /Appearance/i, /Vault Publish/i,
        /Freeform/i, /Atlas/i, /Studio/i, /Academy/i, /Scholar/i, /Fishbone Root-Cause Audit/i,
      ]);
      await setInputValue(findInputByPlaceholderOrLabel(/nama preset|preset name/i), "Custom E2E Preset");
      await clickByText(/Buat Preset|Create Preset/i);
      expect(findByText(/Custom E2E Preset/i)).toBeTruthy();
      const editPresetBtn = queryByText(/^Edit$/i, "button");
      if (editPresetBtn) await clickElement(editPresetBtn);
      await clickByText(/Duplicate|Duplikat/i);
      await clickByText(/Set.*Default|Jadikan Default/i);
      const delPresetBtns = findAllByText(/Hapus|Delete/i, "button");
      await clickElement(delPresetBtns[delPresetBtns.length - 1]);

      await clickByText(/Adopt|Adopsi/i);
      expectAllVisible([/What Will Change|Impact Diff Preview/i, /Validate & Apply Preset/i]);
      await clickByText(/Validate & Apply Preset/i);

      // #5 Central .app/config.json Inspector & Dynamic Raw Editor (10 blocks, status, Format, Reset, Schema Help)
      await pickBreadcrumbItem(/Workspace Preset/i, /Central \.app\/config\.json/i);
      expect(findByText(/Valid \(\.app\/config\.json Schema v2\)/i)).toBeTruthy();
      expectAllVisible([
        /"meta"/i, /"mode"/i, /"deep_explorer"/i, /"appearance"/i, /"visual_engine"/i,
        /"schema"/i, /"publishing"/i, /"access"/i, /"academy"/i, /"extensions"/i,
      ]);
      await clickByText(/Format|Prettify/i);
      await clickByText(/Reset.*Default|Reset ke Default/i);
      expect(findByText(/Schema v2|Dokumentasi/i)).toBeTruthy();

      // #6 Deep Explorer (4 Lenses, filters, Reorganize, Virtual vs Physical, YAML, Academy, standalone tab)
      await pickBreadcrumbItem(/Central \.app\/config\.json/i, /^Deep Explorer$/i);
      expectAllVisible([/Graph/i, /Diagram/i, /Table/i, /Cards/i, /Branch/i, /Folder/i, /Depth/i]);
      await clickByText(/^Table$/i);
      expectAllVisible([/Hierarchy/i, /Properties/i, /Tags/i, /Backlinks/i, /Keywords/i]);
      await clickByText(/Backlinks/i);
      expectAllVisible([/Virtual Grouping/i, /Physical File Sync/i, /epistemic_status/i, /falsafah/i]);
      await clickByText(/Physical File Sync/i);
      await clickByText(/Buka Deep Explorer sebagai Tab Workspace Mandiri/i);
      expect(findByText(/Deep Explorer/i)).toBeTruthy();

      // Re-open Settings Hub and test #7 Appearance & Accessibility
      await openSettingsHub();
      await pickBreadcrumbItem(/Account/i, /^Workspace$/i);
      await pickBreadcrumbItem(/Workspace Preset/i, /Appearance & Accessibility/i);
      expectAllVisible([
        /Obsidian Dark/i, /Calm Daylight/i, /High-Contrast Scholar/i,
        /Comfortable|Compact|Spacious/i, /Profile Header|Header Profil/i,
        /Font/i, /Auto-Pair/i, /Floating/i, /Slash/i,
        /Reduced Motion/i, /High Contrast/i, /Screen Reader/i, /Ollama/i, /Offline Cache/i,
      ]);
      await clickByText(/Calm Daylight/i);
      await clickByText(/Reduced Motion/i);

      // #8 Visual Engine via Quick Search (D3 physics + Deterministic Solvers + Shortcuts)
      await jumpViaQuickSearch("Visual Engine", /Visual Engine/i);
      expectAllVisible([
        /Repulsion/i, /Link Distance/i, /Center Gravity/i, /Render Limit|Batas Render/i, /Label Fade/i,
        /Cluster/i, /Orphan/i, /Mindmap/i, /Fishbone/i, /Timeline/i, /Argument Map/i, /Skill Tree/i,
        /Bézier|Bezier/i, /Orthogonal/i, /Straight/i, /Branch Color|Warna Cabang/i, /Spacing/i,
        /Tab/i, /Enter/i, /Space/i,
      ]);
      await clickByText(/Fishbone/i);
      await clickByText(/Orthogonal/i);
    } finally {
      await unmount();
    }
  });

  it("covers Vault sub-settings #9 Dashboard, #10 Collaborating, #11 VCS/Diff, #12 Publish, and #13 Import/Export", async () => {
    const { unmount } = await mountPrototypePage();
    try {
      await openSettingsHub();
      await pickBreadcrumbItem(/Account/i, /^Vault$/i);

      // #9 Vaults Dashboard (stats, sync/YAML health, switch/create/delete vault)
      expectAllVisible([/YAML/i, /Sync/i, /Atlas Kognisi & Memori/i, /Kuliah Graf & DAG/i]);
      await clickByText(/Kuliah Graf & DAG/i);
      await setInputValue(findInputByPlaceholderOrLabel(/nama vault|vault name/i), "Vault Riset E2E");
      await clickByText(/Buat Vault|Create Vault/i);
      expect(findByText(/Vault Riset E2E/i)).toBeTruthy();
      const delVaultBtns = findAllByText(/Hapus|Delete/i, "button");
      await clickElement(delVaultBtns[delVaultBtns.length - 1]);

      // #10 Vaults Collaborating (Give Access AS & WITH, Vault/Node, 7 roles, CRUD, time-window)
      await pickBreadcrumbItem(/Vaults Dashboard/i, /Vaults Collaborating/i);
      expectAllVisible([
        /Give Access/i, /Full Vault|Vault/i, /Node/i,
        /Viewer/i, /Commenter/i, /Contributor/i, /Editor/i, /Admin/i, /Student/i, /Teacher/i,
        /Read/i, /Create/i, /Time-Window|Waktu/i,
      ]);
      await setInputValue(findInputByPlaceholderOrLabel(/@handle|handle|kolaborator/i), "@kolaborator.e2e");
      await clickByText(/Berikan Akses|Give Access|Tambah Kolaborator/i);
      expect(findByText(/@kolaborator\.e2e/i)).toBeTruthy();

      // #11 VCS, Diff, Backup & History (snapshot, rollback, Visual Diff, KMR, Backup schedule)
      await pickBreadcrumbItem(/Vaults Collaborating/i, /VCS, Diff, Backup & History/i);
      await setInputValue(findInputByPlaceholderOrLabel(/label snapshot|snapshot/i), "snap-tier1-e2e");
      await clickByText(/Buat Snapshot|Create Snapshot/i);
      expect(findByText(/snap-tier1-e2e/i)).toBeTruthy();
      await clickByText(/Rollback/i);
      expectAllVisible([/sintesis-graf-pengetahuan\.md/i, /KMR #14/i, /Backup/i]);

      // #12 Vaults Publish (Publish AS & WITH, Vault/Node, 4 Lenses, 4 Visibilities, citation/fork, matrix)
      await pickBreadcrumbItem(/VCS, Diff, Backup & History/i, /Vaults Publish/i);
      expectAllVisible([
        /Publish AS/i, /Full Vault|Vault/i, /Node/i,
        /Atlas/i, /Publication/i, /Course/i, /Template/i,
        /public_listed/i, /public_unlisted/i, /shared/i, /private/i,
        /Citation|Sitasi/i, /Fork/i, /Matriks|Matrix/i,
      ]);
      await clickByText(/Course/i);
      await clickByText(/public_unlisted/i);

      // #13 Import & Export Vault (Import .md/Obsidian, .zip, .app/config.json; Export .zip, JSON bundle, Preset)
      await pickBreadcrumbItem(/Vaults Publish/i, /Import & Export Vault/i);
      expectAllVisible([/Obsidian/i, /\.zip/i, /\.app\/config\.json/i, /JSON Bundle/i, /Community Preset/i]);
      await clickByText(/Import/i);
      await clickByText(/Export/i);
    } finally {
      await unmount();
    }
  });
});
