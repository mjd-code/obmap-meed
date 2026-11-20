import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import {
  ACTIVE_SNAPSHOT_ID,
  SNAPSHOT_CATALOG,
  getActiveSnapshotStage,
  getSnapshotStage,
  isSnapshotActive,
  listSnapshotStages,
} from "../../snapshots/snapshotRegistry";
import {
  REQUIRED_CONFIG_SECTIONS,
  SCHEMA_V2_HELP_DOCS,
  formatAppConfigJson,
  validateAppConfigJson,
} from "../configSchemaValidator";
import { PROTOTYPE_EDITOR_FILES } from "../mockEditorData";
import { INITIAL_APPEARANCE_STATE } from "../mockSettingsDefaults";
import { buildAppConfigJson } from "../mockVcsAndConfigData";
import {
  BUILT_IN_PRESETS,
  COMMUNITY_PRESETS,
  INITIAL_USER_CUSTOM_PRESETS,
  applyPresetToConfig,
  computePresetImpactDiff,
} from "../presetCatalogData";
import {
  SETTINGS_CATALOG,
  SETTINGS_CATEGORIES,
  getCategoryCounts,
  getSubSettingsByCategory,
  legacySectionToSettingsSelection,
  normalizeSettingsSelection,
  searchSettingsCatalog,
} from "../settingsCatalog";
import { useThreePillarPrototypeController } from "../useThreePillarPrototypeController";
import { normalizeRestructureMode } from "../vcsAndConfigTypes";
import {
  allGroups,
  applyPrototypeAppearanceTokens,
  closeAllLeavesInTree,
  closeLeafInTree,
  closeLeavesByNodeIdInTree,
  closeLeavesToRightInTree,
  createInitialWorkspaceTree,
  moveLeafInTree,
  openViewInTree,
  resetWorkspaceTreeIdsForTest,
  splitGroupInTree,
  togglePinLeafInTree,
} from "./index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function renderControllerHook<T>(useHook: () => T) {
  const result = { current: undefined as unknown as T };
  function Harness() {
    result.current = useHook();
    return null;
  }
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(Harness));
  });
  return {
    result,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe("snapshotRegistry", () => {
  it("exposes stage-02-three-pillar-v2 as active and stage-01 as archived", () => {
    expect(ACTIVE_SNAPSHOT_ID).toBe("stage-02-three-pillar-v2");
    const active = getActiveSnapshotStage();
    expect(active.status).toBe("active");
    expect(active.badgeText).toBe(
      "Active Dynamic Mockup — Ready for 1:1 Main-App Migration & Snapshot Freeze"
    );
    expect(isSnapshotActive(ACTIVE_SNAPSHOT_ID)).toBe(true);
    expect(isSnapshotActive("stage-01-three-pillar-v1")).toBe(false);
    expect(listSnapshotStages("archived")).toHaveLength(1);
    expect(getSnapshotStage("non-existent").id).toBe(ACTIVE_SNAPSHOT_ID);
    expect(SNAPSHOT_CATALOG.map((s) => s.id)).toEqual([
      "stage-01-three-pillar-v1",
      "stage-02-three-pillar-v2",
    ]);
  });
});

describe("settingsCatalog", () => {
  it("defines exact 3 categories (3/5/5) and 13 ordered sub-settings with #symbols", () => {
    expect(SETTINGS_CATEGORIES.map((c) => [c.id, c.count])).toEqual([
      ["account", 3],
      ["workspace", 5],
      ["vault", 5],
    ]);
    expect(getCategoryCounts()).toEqual({ account: 3, workspace: 5, vault: 5 });
    expect(SETTINGS_CATALOG.map((s) => s.id)).toEqual([
      "account_profile",
      "account_credentials",
      "account_sessions",
      "workspace_preset",
      "workspace_config_json",
      "workspace_deep_explorer",
      "workspace_appearance",
      "workspace_visual_engine",
      "vault_dashboard",
      "vault_collaborating",
      "vault_vcs_history",
      "vault_publish",
      "vault_import_export",
    ]);
    expect(getSubSettingsByCategory("workspace")).toHaveLength(5);
    expect(normalizeSettingsSelection("workspace_preset", "invalid").sectionId).toBe(
      "dashboard-overview"
    );
    expect(searchSettingsCatalog("#impact-preview")[0]?.matchedSection?.symbol).toBe(
      "#impact-preview"
    );
    expect(legacySectionToSettingsSelection("account_app").subSettingId).toBe(
      "account_profile"
    );
  });
});

describe("Schema v2 builder & validator", () => {
  it("builds 10-block Schema v2 config without default_helicopter_view and validates cleanly", () => {
    const cfg = buildAppConfigJson({
      vaultId: "v-test",
      name: "Test Vault",
      primaryMode: "atlas",
      defaultDeepExplorerView: "diagram",
      lens: "atlas",
    });
    expect(Object.keys(cfg)).toEqual([...REQUIRED_CONFIG_SECTIONS]);
    expect("default_helicopter_view" in cfg.mode).toBe(false);
    expect(cfg.meta.sdk).toBe("@app/sdk");
    expect(cfg.publishing.license).toBe("CC BY-SA 4.0");
    expect(SCHEMA_V2_HELP_DOCS).toHaveLength(10);

    const raw = JSON.stringify(cfg, null, 2);
    const res = validateAppConfigJson(raw);
    expect(res.valid).toBe(true);
    expect(res.statusLabel).toBe("Valid (.app/config.json Schema v2)");
    expect(formatAppConfigJson(raw).ok).toBe(true);
  });

  it("reports line/property errors on invalid syntax, missing blocks, and invalid enums", () => {
    const badSyntax = validateAppConfigJson('{\n  "meta": { broken }\n}');
    expect(badSyntax.valid).toBe(false);
    expect(badSyntax.statusLabel).toBe("Invalid JSON Syntax");
    expect(badSyntax.errors[0]?.line).toBeGreaterThanOrEqual(1);

    const cfg = buildAppConfigJson({
      vaultId: "v-test",
      name: "Test Vault",
      primaryMode: "atlas",
      defaultDeepExplorerView: "graph",
      lens: "atlas",
    });
    const broken = {
      ...cfg,
      mode: { ...cfg.mode, primary_mode: "invalid_mode" },
      deep_explorer: {
        ...cfg.deep_explorer,
        default_view: "helicopter",
        restructure_mode: "physical_sync",
      },
      meta: { ...cfg.meta, sdk: "@wrong/sdk" },
    };
    const { extensions: _omitted, ...missingSection } = broken;
    void _omitted;
    const res = validateAppConfigJson(JSON.stringify(missingSection, null, 2));
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.property === "extensions")).toBe(true);
    expect(res.errors.some((e) => e.property === "mode.primary_mode")).toBe(true);
    expect(res.errors.some((e) => e.property === "deep_explorer.default_view")).toBe(true);
    expect(res.errors.some((e) => e.property === "deep_explorer.restructure_mode")).toBe(true);
    expect(res.errors.some((e) => e.property === "meta.sdk")).toBe(true);
    expect(formatAppConfigJson("{bad").ok).toBe(false);
  });
});

describe("presetCatalogData & workspaceTree", () => {
  it("computes impact diff and applies preset immutably", () => {
    const cfg = buildAppConfigJson({
      vaultId: "v-1",
      name: "V1",
      primaryMode: "freeform",
      defaultDeepExplorerView: "graph",
      lens: "atlas",
    });
    const academy = BUILT_IN_PRESETS.find((p) => p.id === "core-academy")!;
    const scholar = BUILT_IN_PRESETS.find((p) => p.primaryMode === "scholar")!;
    expect(scholar.previewOnly).toBe(true);
    expect(INITIAL_USER_CUSTOM_PRESETS.length).toBeGreaterThanOrEqual(2);
    expect(COMMUNITY_PRESETS.length).toBeGreaterThanOrEqual(3);

    const diff = computePresetImpactDiff(cfg, academy);
    expect(diff.some((d) => d.path === "mode.primary_mode" && d.after === "academy")).toBe(true);
    const next = applyPresetToConfig(cfg, academy);
    expect(next.mode.primary_mode).toBe("academy");
    expect(cfg.mode.primary_mode).toBe("freeform");
  });

  it("handles deterministic split, open, pin, move, and close tree operations", () => {
    resetWorkspaceTreeIdsForTest(10);
    const init = createInitialWorkspaceTree(PROTOTYPE_EDITOR_FILES[0]);
    const opened = openViewInTree(
      init.root,
      init.activeGroupId,
      { type: "deep_explorer", nodeId: "__deep_explorer__", title: "Deep Explorer" },
      "new-tab"
    );
    expect(allGroups(opened.root)[0].leaves).toHaveLength(2);
    const split = splitGroupInTree(opened.root, opened.activeGroupId, "horizontal");
    expect(allGroups(split.root)).toHaveLength(2);
    const pinned = togglePinLeafInTree(split.root, init.activeGroupId, "leaf-initial-1");
    const closedRight = closeLeavesToRightInTree(pinned, init.activeGroupId, "leaf-initial-1");
    expect(allGroups(closedRight)[0].leaves).toHaveLength(1);
    const moved = moveLeafInTree(closedRight, init.activeGroupId, init.activeGroupId, "leaf-initial-1", split.activeGroupId);
    expect(allGroups(moved.root)).toHaveLength(1);
    const closedAll = closeAllLeavesInTree(moved.root, moved.activeGroupId, moved.activeGroupId);
    expect(allGroups(closedAll.root)[0].leaves[0]?.pinned).toBe(true);
    const closedByNode = closeLeavesByNodeIdInTree(opened.root, opened.activeGroupId, "__deep_explorer__");
    expect(allGroups(closedByNode.root)[0].leaves).toHaveLength(1);
    const closedLast = closeLeafInTree(closedByNode.root, closedByNode.activeGroupId, closedByNode.activeGroupId, "leaf-initial-1");
    expect(allGroups(closedLast.root)[0].leaves[0]?.view.type).toBe("empty");
  });
});

describe("useThreePillarPrototypeController & token applier", () => {
  it("runs presets impact diff, raw config validation gate, account/session guards, workspace CRUD, and academy in memory", () => {
    const { result, unmount } = renderControllerHook(() => useThreePillarPrototypeController());

    expect(normalizeRestructureMode("physical_sync")).toBe("physical_file_sync");
    act(() => result.current.deepExplorer.setRestructureMode("physical_sync"));
    expect(result.current.deepExplorer.restructureMode).toBe("physical_file_sync");

    const beforeMode = result.current.presets.liveConfig.mode.primary_mode;
    act(() => result.current.presets.stagePresetForPreview("core-academy"));
    expect(result.current.presets.pendingImpactDiff.length).toBeGreaterThan(0);
    expect(result.current.presets.liveConfig.mode.primary_mode).toBe(beforeMode);
    act(() => { result.current.presets.confirmApplyPreset(); });
    expect(result.current.presets.liveConfig.mode.primary_mode).toBe("academy");

    act(() => result.current.configJson.setRawDraft("{ invalid json"));
    let applyResult!: ReturnType<typeof result.current.configJson.applyRawConfigJson>;
    act(() => { applyResult = result.current.configJson.applyRawConfigJson(); });
    expect(applyResult.valid).toBe(false);
    act(() => result.current.configJson.resetConfigToDefault());
    act(() => { applyResult = result.current.configJson.applyRawConfigJson(); });
    expect(applyResult.valid).toBe(true);

    let profileOk = true;
    act(() => { profileOk = result.current.account.updateProfile({ orcid: "bad-orcid" }); });
    expect(profileOk).toBe(false);
    const currentSession = result.current.account.sessions.find((s) => s.isCurrent)!;
    let revokeCurrentOk = true;
    act(() => { revokeCurrentOk = result.current.account.revokeSession(currentSession.id); });
    expect(revokeCurrentOk).toBe(false);
    act(() => { result.current.account.revokeAllOtherSessions(); });
    expect(result.current.account.sessions).toHaveLength(1);

    act(() => { result.current.workspace.createFile("01-Fondasi", "catatan-uji"); });
    expect(result.current.workspace.files.some((f) => f.name === "catatan-uji.md")).toBe(true);

    expect(result.current.academy.lmsStatuses["aca-5"]).toBe("locked");
    act(() => {
      result.current.academy.completeLmsNodeQuiz("aca-4", 0);
      result.current.academy.addStudentSubNode("aca-5", "solusi-baru");
    });
    expect(result.current.academy.lmsStatuses["aca-5"]).toBe("available");

    const container = document.createElement("div");
    applyPrototypeAppearanceTokens(container, { ...INITIAL_APPEARANCE_STATE, theme: "calm_daylight", reducedMotion: true });
    expect(container.getAttribute("data-prototype-theme")).toBe("calm_daylight");
    expect(document.documentElement.getAttribute("data-prototype-theme")).toBeNull();
    unmount();
  });
});
