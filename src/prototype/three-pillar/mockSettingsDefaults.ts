import type {
  PrototypeAppearanceState,
  PrototypeBackupSchedule,
  PrototypeImportExportRecord,
  PrototypeVisualEngineState,
} from "./settingsTypes";
import type {
  AppearanceConfigBlock,
  VisualEngineConfigBlock,
} from "./vcsAndConfigTypes";

export const DEFAULT_APPEARANCE_CONFIG: AppearanceConfigBlock = {
  theme: "obsidian_dark",
  explore_card_density: "comfortable",
  profile_header_display: "full_banner",
  accessibility: {
    reduced_motion: false,
    high_contrast: false,
    screen_reader_hints: true,
  },
  editor: {
    font_family: "inter_mono",
    font_size_px: 15,
    line_height: 1.65,
    max_line_width_ch: 76,
    auto_pair_brackets: true,
    spellcheck: true,
    keybindings: "default",
  },
  writing_assistant: {
    enabled: true,
    provider: "ollama",
    persona: "academic_editor",
  },
  markdown_toolbar: {
    floating_formatting_toolbar: true,
    slash_commands: true,
  },
  system_sync: {
    offline_cache_enabled: true,
    auto_sync_interval_sec: 30,
  },
};

export const DEFAULT_VISUAL_ENGINE_CONFIG: VisualEngineConfigBlock = {
  graph_mode: {
    repulsion_force: 240,
    link_distance: 110,
    center_gravity: 0.35,
    node_render_limit: 400,
    label_fade_threshold: 0.65,
    cluster_colors_enabled: true,
    hide_orphan_nodes: false,
  },
  deterministic_solvers: {
    default_solver: "mindmap",
    connector_style: "bezier",
    branch_color_coding: true,
    branch_spacing_px: 48,
    keyboard_shortcuts_enabled: true,
  },
};

export const INITIAL_APPEARANCE_STATE: PrototypeAppearanceState = {
  theme: DEFAULT_APPEARANCE_CONFIG.theme,
  exploreCardDensity: DEFAULT_APPEARANCE_CONFIG.explore_card_density,
  profileHeaderDisplay: DEFAULT_APPEARANCE_CONFIG.profile_header_display,
  reducedMotion: DEFAULT_APPEARANCE_CONFIG.accessibility.reduced_motion,
  highContrast: DEFAULT_APPEARANCE_CONFIG.accessibility.high_contrast,
  screenReaderHints: DEFAULT_APPEARANCE_CONFIG.accessibility.screen_reader_hints,
  editorFontFamily: DEFAULT_APPEARANCE_CONFIG.editor.font_family,
  editorFontSizePx: DEFAULT_APPEARANCE_CONFIG.editor.font_size_px,
  editorLineHeight: DEFAULT_APPEARANCE_CONFIG.editor.line_height,
  editorMaxLineWidthCh: DEFAULT_APPEARANCE_CONFIG.editor.max_line_width_ch,
  autoPairBrackets: DEFAULT_APPEARANCE_CONFIG.editor.auto_pair_brackets,
  spellcheck: DEFAULT_APPEARANCE_CONFIG.editor.spellcheck,
  keybindings: DEFAULT_APPEARANCE_CONFIG.editor.keybindings,
  aiAssistantEnabled: DEFAULT_APPEARANCE_CONFIG.writing_assistant.enabled,
  aiProvider: DEFAULT_APPEARANCE_CONFIG.writing_assistant.provider,
  aiPersona: DEFAULT_APPEARANCE_CONFIG.writing_assistant.persona,
  floatingFormattingToolbar: DEFAULT_APPEARANCE_CONFIG.markdown_toolbar.floating_formatting_toolbar,
  slashCommands: DEFAULT_APPEARANCE_CONFIG.markdown_toolbar.slash_commands,
  offlineCacheEnabled: DEFAULT_APPEARANCE_CONFIG.system_sync.offline_cache_enabled,
  autoSyncIntervalSec: DEFAULT_APPEARANCE_CONFIG.system_sync.auto_sync_interval_sec,
};

export const INITIAL_VISUAL_ENGINE_STATE: PrototypeVisualEngineState = {
  repulsionForce: DEFAULT_VISUAL_ENGINE_CONFIG.graph_mode.repulsion_force,
  linkDistance: DEFAULT_VISUAL_ENGINE_CONFIG.graph_mode.link_distance,
  centerGravity: DEFAULT_VISUAL_ENGINE_CONFIG.graph_mode.center_gravity,
  nodeRenderLimit: DEFAULT_VISUAL_ENGINE_CONFIG.graph_mode.node_render_limit,
  labelFadeThreshold: DEFAULT_VISUAL_ENGINE_CONFIG.graph_mode.label_fade_threshold,
  clusterColorsEnabled: DEFAULT_VISUAL_ENGINE_CONFIG.graph_mode.cluster_colors_enabled,
  hideOrphanNodes: DEFAULT_VISUAL_ENGINE_CONFIG.graph_mode.hide_orphan_nodes,
  defaultSolver: DEFAULT_VISUAL_ENGINE_CONFIG.deterministic_solvers.default_solver,
  connectorStyle: DEFAULT_VISUAL_ENGINE_CONFIG.deterministic_solvers.connector_style,
  branchColorCoding: DEFAULT_VISUAL_ENGINE_CONFIG.deterministic_solvers.branch_color_coding,
  branchSpacingPx: DEFAULT_VISUAL_ENGINE_CONFIG.deterministic_solvers.branch_spacing_px,
  keyboardShortcutsEnabled: DEFAULT_VISUAL_ENGINE_CONFIG.deterministic_solvers.keyboard_shortcuts_enabled,
};

export const INITIAL_BACKUP_SCHEDULE: PrototypeBackupSchedule = {
  frequency: "daily",
  retentionCount: 14,
  lastBackupAt: "Hari ini · 04:00 WIB",
  nextBackupAt: "Besok · 04:00 WIB",
  autoSnapshotOnRestructure: true,
  destination: "Local Folder + Encrypted Snapshot Archive",
};

export const INITIAL_IMPORT_EXPORT_HISTORY: PrototypeImportExportRecord[] = [
  {
    id: "io-1",
    direction: "export",
    format: "markdown_zip",
    label: "atlas-kognisi-plaintext-v2.zip (.md + .app/config.json)",
    itemCount: 24,
    timestamp: "Kemarin · 16:20",
  },
  {
    id: "io-2",
    direction: "import",
    format: "obsidian_folder",
    label: "riset-zettelkasten-obsidian/",
    itemCount: 18,
    timestamp: "18 Nov · 10:15",
  },
];
