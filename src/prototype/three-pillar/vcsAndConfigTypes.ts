export type WorkspaceModeId = "freeform" | "atlas" | "studio" | "academy";
export type WorkspaceModeCatalogId = WorkspaceModeId | "scholar";

export type DeepExplorerViewKind = "graph" | "diagram" | "table" | "cards";
// @deprecated M1->M2/M3 compat shim
export type HelicopterViewKind = DeepExplorerViewKind;

export type ReorganizeBy = "hierarchy" | "properties" | "tags" | "backlinks" | "keywords";

export type RestructureModeV2 = "virtual_grouping" | "physical_file_sync";
// @deprecated M1->M2/M3 compat shim (includes legacy "physical_sync", normalized to "physical_file_sync")
export type RestructureMode = RestructureModeV2 | "physical_sync";

export function normalizeRestructureMode(mode: RestructureMode): RestructureModeV2 {
  return mode === "physical_sync" ? "physical_file_sync" : mode;
}

export type GraphSolverKind =
  | "mindmap"
  | "fishbone"
  | "timeline"
  | "argument-map"
  | "skill-tree";

export type PresentationLens = "atlas" | "publication" | "course" | "template";
export type PresetOrigin = "core_preset" | "user_custom" | "community_preset";
export type PublishVisibility = "public_listed" | "public_unlisted" | "shared" | "private";
export type ShareStudioSubTab = "publish" | "collaborate" | "versions";
export type TargetScopeMode = "vault" | "node";

export type CollaboratorRole =
  | "viewer"
  | "commenter"
  | "contributor"
  | "editor"
  | "admin"
  | "student"
  | "teacher"
  | "institution_admin";

export type AcademyNodeLevel = "falsafah" | "kurikulum" | "silabus" | "rps" | "instruksi";

export type PortfolioStudyStage =
  | "seedling"
  | "budding"
  | "evergreen"
  | "published"
  | "mastered";

export type LmsNodeStatus = "locked" | "available" | "mastered";

// @deprecated M1->M2/M3 compat shim (replaced by SettingsSubId in settingsCatalog.ts)
export type SettingsHubSectionId =
  | "vault_lenses"
  | "share_access_vcs"
  | "academy_sdk"
  | "account_app";

export type AppThemeId = "obsidian_dark" | "calm_daylight" | "high_contrast_scholar";
export type ExploreDensityId = "compact" | "comfortable" | "spacious";
export type ProfileHeaderDisplayId = "full_banner" | "compact_card" | "minimal";
export type EditorFontFamilyId =
  | "inter_mono"
  | "jetbrains_mono"
  | "merriweather_serif"
  | "system_sans";
export type EditorKeybindingMode = "default" | "vim" | "emacs";
export type AiProviderId = "ollama" | "webllm" | "byok";
export type AiPersonaId = "academic_editor" | "socratic_reviewer" | "concise_summarizer";
export type ConnectorStyleId = "bezier" | "orthogonal" | "straight";
export type BackupScheduleFrequency = "manual" | "hourly" | "daily" | "weekly";

export interface AppearanceConfigBlock {
  theme: AppThemeId;
  explore_card_density: ExploreDensityId;
  profile_header_display: ProfileHeaderDisplayId;
  accessibility: {
    reduced_motion: boolean;
    high_contrast: boolean;
    screen_reader_hints: boolean;
  };
  editor: {
    font_family: EditorFontFamilyId;
    font_size_px: number;
    line_height: number;
    max_line_width_ch: number;
    auto_pair_brackets: boolean;
    spellcheck: boolean;
    keybindings: EditorKeybindingMode;
  };
  writing_assistant: {
    enabled: boolean;
    provider: AiProviderId;
    persona: AiPersonaId;
  };
  markdown_toolbar: {
    floating_formatting_toolbar: boolean;
    slash_commands: boolean;
  };
  system_sync: {
    offline_cache_enabled: boolean;
    auto_sync_interval_sec: number;
  };
}

export interface VisualEngineConfigBlock {
  graph_mode: {
    repulsion_force: number;
    link_distance: number;
    center_gravity: number;
    node_render_limit: number;
    label_fade_threshold: number;
    cluster_colors_enabled: boolean;
    hide_orphan_nodes: boolean;
  };
  deterministic_solvers: {
    default_solver: GraphSolverKind;
    connector_style: ConnectorStyleId;
    branch_color_coding: boolean;
    branch_spacing_px: number;
    keyboard_shortcuts_enabled: boolean;
  };
}

/** Single Centralized Vault Configuration: `.app/config.json` (10-Block Schema v2) */
export interface AppCentralConfigJsonV2 {
  $schema?: string;
  meta: {
    schema_version: 2;
    vault_id: string;
    name: string;
    version: string;
    config_path: ".app/config.json";
    sdk: "@app/sdk";
    default_license: string;
  };
  mode: {
    primary_mode: WorkspaceModeId;
    active_preset_id: string;
    preset_origin: PresetOrigin;
    roadmap_note: "scholar_mode_v2_2_preview";
    // @deprecated M1->M2/M3 compat shim (TS-only optional; never emitted at runtime)
    default_helicopter_view?: DeepExplorerViewKind;
  };
  deep_explorer: {
    default_view: DeepExplorerViewKind;
    reorganize_by: ReorganizeBy;
    restructure_mode: RestructureModeV2;
    default_depth: number;
    branch_filter: string;
    show_orphans: boolean;
  };
  appearance: AppearanceConfigBlock;
  visual_engine: VisualEngineConfigBlock;
  schema: {
    default_template: string;
    required_yaml: string[];
    epistemic_stages: PortfolioStudyStage[];
    strict_frontmatter_validation: boolean;
  };
  publishing: {
    default_lens: PresentationLens;
    visibility: PublishVisibility;
    license: string;
    allow_citation: boolean;
    allow_fork: boolean;
    node_overrides: Record<
      string,
      { visibility: PublishVisibility; lens?: PresentationLens }
    >;
  };
  access: {
    default_scope: TargetScopeMode;
    owner_handle: string;
    role_matrix: CollaboratorRole[];
    auto_backup_schedule: BackupScheduleFrequency;
  };
  academy: {
    enabled: boolean;
    hierarchy: AcademyNodeLevel[];
    max_files_per_submission: number;
    time_window: string;
    zen_focus_mode: boolean;
    require_prerequisite_quiz: boolean;
  };
  extensions: {
    sdk_package: "@app/sdk";
    enabled: string[];
    community_presets: string[];
  };
}

export type AppCentralConfigJson = AppCentralConfigJsonV2;

export interface PrototypeStudentSubNode {
  id: string;
  studentName: string;
  studentHandle: string;
  title: string;
  status: "draft" | "submitted" | "mastered";
  updatedAt: string;
}

export interface PrototypeAcademyTreeNode {
  id: string;
  level: AcademyNodeLevel;
  code: string;
  title: string;
  parentId: string | null;
  duration: string;
  prerequisites: string[];
  initialStatus: LmsNodeStatus;
  summary: string;
  rules: {
    template: string;
    requiredYaml: string[];
    maxFiles: number;
    crud: string;
    timeWindow: string;
    zenMode: boolean;
  };
  studentSubNodes: PrototypeStudentSubNode[];
  quizQuestion: string;
  quizOptions: string[];
  correctOptionIndex: number;
}

export interface PrototypeAccessGrant {
  id: string;
  subjectName: string;
  subjectHandle: string;
  role: CollaboratorRole;
  scope: TargetScopeMode;
  targetName: string;
  crudPermissions: string[];
  timeWindow: string;
}

export interface PrototypeSnapshot {
  id: string;
  label: string;
  timestamp: string;
  author: string;
  summary: string;
  changedNodesCount: number;
}

export interface PrototypeVisualDiff {
  id: string;
  nodeTitle: string;
  markdownBefore: string;
  markdownAfter: string;
  yamlChanges: Array<{ key: string; before: string; after: string }>;
  structureDelta: string;
}

export interface PrototypeMergeRequest {
  id: string;
  title: string;
  authorHandle: string;
  sourceBranch: string;
  targetVault: string;
  status: "open" | "merged" | "rejected";
  diffSummary: string;
  updatedAt: string;
}
