import type {
  PrototypeAppearanceState,
  PrototypeVisualEngineState,
  WorkspacePresetEntry,
} from "../settingsTypes";
import type {
  AppCentralConfigJsonV2,
  AppearanceConfigBlock,
  VisualEngineConfigBlock,
} from "../vcsAndConfigTypes";
import type { PrototypeDeepExplorerState } from "./prototypeStateTypes";

export function toAppearanceBlock(s: PrototypeAppearanceState): AppearanceConfigBlock {
  return {
    theme: s.theme,
    explore_card_density: s.exploreCardDensity,
    profile_header_display: s.profileHeaderDisplay,
    accessibility: {
      reduced_motion: s.reducedMotion,
      high_contrast: s.highContrast,
      screen_reader_hints: s.screenReaderHints,
    },
    editor: {
      font_family: s.editorFontFamily,
      font_size_px: s.editorFontSizePx,
      line_height: s.editorLineHeight,
      max_line_width_ch: s.editorMaxLineWidthCh,
      auto_pair_brackets: s.autoPairBrackets,
      spellcheck: s.spellcheck,
      keybindings: s.keybindings,
    },
    writing_assistant: {
      enabled: s.aiAssistantEnabled,
      provider: s.aiProvider,
      persona: s.aiPersona,
    },
    markdown_toolbar: {
      floating_formatting_toolbar: s.floatingFormattingToolbar,
      slash_commands: s.slashCommands,
    },
    system_sync: {
      offline_cache_enabled: s.offlineCacheEnabled,
      auto_sync_interval_sec: s.autoSyncIntervalSec,
    },
  };
}

export function toVisualEngineBlock(s: PrototypeVisualEngineState): VisualEngineConfigBlock {
  return {
    graph_mode: {
      repulsion_force: s.repulsionForce,
      link_distance: s.linkDistance,
      center_gravity: s.centerGravity,
      node_render_limit: s.nodeRenderLimit,
      label_fade_threshold: s.labelFadeThreshold,
      cluster_colors_enabled: s.clusterColorsEnabled,
      hide_orphan_nodes: s.hideOrphanNodes,
    },
    deterministic_solvers: {
      default_solver: s.defaultSolver,
      connector_style: s.connectorStyle,
      branch_color_coding: s.branchColorCoding,
      branch_spacing_px: s.branchSpacingPx,
      keyboard_shortcuts_enabled: s.keyboardShortcutsEnabled,
    },
  };
}

export function buildLiveConfigSnapshot(params: {
  baseConfig: AppCentralConfigJsonV2;
  activePresetId: string;
  appearanceState: PrototypeAppearanceState;
  visualEngineState: PrototypeVisualEngineState;
  deepExplorerState: PrototypeDeepExplorerState;
}): AppCentralConfigJsonV2 {
  const { baseConfig, activePresetId, appearanceState, visualEngineState, deepExplorerState } = params;
  return {
    ...baseConfig,
    mode: { ...baseConfig.mode, active_preset_id: activePresetId },
    deep_explorer: {
      default_view: deepExplorerState.defaultView,
      reorganize_by: deepExplorerState.reorganizeBy,
      restructure_mode: deepExplorerState.restructureMode,
      default_depth: deepExplorerState.depthFilter,
      branch_filter: deepExplorerState.branchFilter,
      show_orphans: !visualEngineState.hideOrphanNodes,
    },
    appearance: toAppearanceBlock(appearanceState),
    visual_engine: toVisualEngineBlock(visualEngineState),
    schema: {
      ...baseConfig.schema,
      required_yaml: deepExplorerState.requiredYamlProperties,
      strict_frontmatter_validation: deepExplorerState.strictFrontmatterValidation,
    },
  };
}

export function buildCustomPresetFromLive(params: {
  name: string;
  description: string;
  template?: WorkspacePresetEntry;
  liveConfig: AppCentralConfigJsonV2;
  deepExplorerState: PrototypeDeepExplorerState;
  visualEngineState: PrototypeVisualEngineState;
  appearanceState: PrototypeAppearanceState;
  fallbackIndex: number;
}): WorkspacePresetEntry {
  const { name, description, template, liveConfig, deepExplorerState, visualEngineState, appearanceState, fallbackIndex } = params;
  return {
    id: `custom-${Date.now()}`,
    name: name.trim() || `Preset Kustom ${fallbackIndex}`,
    group: "user_custom",
    primaryMode: liveConfig.mode.primary_mode,
    origin: "user_custom",
    authorHandle: "@dr.aras.wicaksono",
    description: description.trim() || "Konfigurasi workspace kustom dari status saat ini.",
    configPatch: template
      ? { ...template.configPatch, presetOrigin: "user_custom" }
      : {
          primaryMode: liveConfig.mode.primary_mode,
          presetOrigin: "user_custom",
          defaultView: deepExplorerState.defaultView,
          reorganizeBy: deepExplorerState.reorganizeBy,
          restructureMode: deepExplorerState.restructureMode,
          defaultSolver: visualEngineState.defaultSolver,
          connectorStyle: visualEngineState.connectorStyle,
          hideOrphanNodes: visualEngineState.hideOrphanNodes,
          theme: appearanceState.theme,
          aiAssistantEnabled: appearanceState.aiAssistantEnabled,
          defaultLens: liveConfig.publishing.default_lens,
          academyEnabled: liveConfig.academy.enabled,
          zenFocusMode: liveConfig.academy.zen_focus_mode,
          defaultTemplate: liveConfig.schema.default_template,
        },
  };
}
