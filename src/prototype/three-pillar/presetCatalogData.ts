import type { PresetImpactDiffItem, WorkspacePresetEntry } from "./settingsTypes";
import type { AppCentralConfigJsonV2 } from "./vcsAndConfigTypes";

export {
  BUILT_IN_PRESETS,
  COMMUNITY_PRESETS,
  INITIAL_USER_CUSTOM_PRESETS,
} from "./presetCatalogItems";

export function computePresetImpactDiff(
  currentConfig: AppCentralConfigJsonV2,
  preset: WorkspacePresetEntry
): PresetImpactDiffItem[] {
  const p = preset.configPatch;
  const candidates: Array<{
    path: string;
    label: string;
    before: string;
    after: string;
    severity: PresetImpactDiffItem["severity"];
  }> = [
    { path: "mode.primary_mode", label: "Primary Workspace Mode", before: currentConfig.mode.primary_mode, after: p.primaryMode, severity: "layout" },
    { path: "mode.preset_origin", label: "Preset Origin", before: currentConfig.mode.preset_origin, after: p.presetOrigin, severity: "info" },
    { path: "deep_explorer.default_view", label: "Deep Explorer Lens", before: currentConfig.deep_explorer.default_view, after: p.defaultView, severity: "layout" },
    { path: "deep_explorer.reorganize_by", label: "Group / Reorganize By", before: currentConfig.deep_explorer.reorganize_by, after: p.reorganizeBy, severity: "layout" },
    { path: "deep_explorer.restructure_mode", label: "Restructure Mode", before: currentConfig.deep_explorer.restructure_mode, after: p.restructureMode, severity: "schema" },
    { path: "visual_engine.deterministic_solvers.default_solver", label: "Deterministic Solver", before: currentConfig.visual_engine.deterministic_solvers.default_solver, after: p.defaultSolver, severity: "layout" },
    { path: "visual_engine.deterministic_solvers.connector_style", label: "Connector Line Style", before: currentConfig.visual_engine.deterministic_solvers.connector_style, after: p.connectorStyle, severity: "layout" },
    { path: "visual_engine.graph_mode.hide_orphan_nodes", label: "Hide Orphan Nodes", before: String(currentConfig.visual_engine.graph_mode.hide_orphan_nodes), after: String(p.hideOrphanNodes), severity: "info" },
    { path: "appearance.theme", label: "Global App Theme", before: currentConfig.appearance.theme, after: p.theme, severity: "info" },
    { path: "appearance.writing_assistant.enabled", label: "Writing Assistant (BYO-AI)", before: String(currentConfig.appearance.writing_assistant.enabled), after: String(p.aiAssistantEnabled), severity: "info" },
    { path: "publishing.default_lens", label: "Default Presentation Lens", before: currentConfig.publishing.default_lens, after: p.defaultLens, severity: "schema" },
    { path: "academy.enabled", label: "Academy Skill Tree", before: String(currentConfig.academy.enabled), after: String(p.academyEnabled), severity: "schema" },
    { path: "academy.zen_focus_mode", label: "Academy Zen Focus Mode", before: String(currentConfig.academy.zen_focus_mode), after: String(p.zenFocusMode), severity: "info" },
    { path: "schema.default_template", label: "Default Note Template", before: currentConfig.schema.default_template, after: p.defaultTemplate, severity: "schema" },
  ];
  return candidates.filter((item) => item.before !== item.after);
}

export function applyPresetToConfig(
  currentConfig: AppCentralConfigJsonV2,
  preset: WorkspacePresetEntry
): AppCentralConfigJsonV2 {
  const p = preset.configPatch;
  return {
    ...currentConfig,
    mode: {
      ...currentConfig.mode,
      primary_mode: p.primaryMode,
      active_preset_id: preset.id,
      preset_origin: p.presetOrigin,
    },
    deep_explorer: {
      ...currentConfig.deep_explorer,
      default_view: p.defaultView,
      reorganize_by: p.reorganizeBy,
      restructure_mode: p.restructureMode,
      show_orphans: !p.hideOrphanNodes,
    },
    appearance: {
      ...currentConfig.appearance,
      theme: p.theme,
      writing_assistant: {
        ...currentConfig.appearance.writing_assistant,
        enabled: p.aiAssistantEnabled,
      },
    },
    visual_engine: {
      ...currentConfig.visual_engine,
      graph_mode: {
        ...currentConfig.visual_engine.graph_mode,
        hide_orphan_nodes: p.hideOrphanNodes,
      },
      deterministic_solvers: {
        ...currentConfig.visual_engine.deterministic_solvers,
        default_solver: p.defaultSolver,
        connector_style: p.connectorStyle,
      },
    },
    schema: {
      ...currentConfig.schema,
      default_template: p.defaultTemplate,
    },
    publishing: {
      ...currentConfig.publishing,
      default_lens: p.defaultLens,
    },
    academy: {
      ...currentConfig.academy,
      enabled: p.academyEnabled,
      zen_focus_mode: p.zenFocusMode,
    },
  };
}
