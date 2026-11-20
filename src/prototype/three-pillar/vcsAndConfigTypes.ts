export type WorkspaceModeId = "freeform" | "atlas" | "studio" | "academy";

export type HelicopterViewKind = "graph" | "diagram" | "table" | "cards";

export type ReorganizeBy = "hierarchy" | "properties" | "tags" | "backlinks" | "keywords";

export type RestructureMode = "virtual_grouping" | "physical_sync";

export type PresentationLens = "atlas" | "publication" | "course" | "template";

export type PresetOrigin = "core_preset" | "community_preset";

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

export type SettingsHubSectionId =
  | "vault_lenses"
  | "share_access_vcs"
  | "academy_sdk"
  | "account_app";

/** Single Centralized Vault Configuration: `.app/config.json` (Unified 7-block Constitution) */
export interface AppCentralConfigJson {
  $schema: string;
  meta: {
    vault_id: string;
    name: string;
    version: string;
    config_path: ".app/config.json";
    sdk: "@app/sdk";
  };
  mode: {
    primary_mode: WorkspaceModeId;
    default_helicopter_view: HelicopterViewKind;
    preset_origin: PresetOrigin;
    roadmap_note: "scholar_mode_v2_2_planned";
  };
  schema: {
    default_template: string;
    required_yaml: string[];
    epistemic_stages: PortfolioStudyStage[];
  };
  publishing: {
    default_lens: PresentationLens;
    visibility: PublishVisibility;
    license: string;
    allow_citation: boolean;
    allow_fork: boolean;
  };
  access: {
    default_scope: TargetScopeMode;
    owner_handle: string;
    role_matrix: CollaboratorRole[];
  };
  academy: {
    hierarchy: AcademyNodeLevel[];
    max_files_per_submission: number;
    time_window: string;
    zen_focus_mode: boolean;
  };
  extensions: {
    sdk_package: "@app/sdk";
    enabled: string[];
    community_presets: string[];
  };
}

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
  status: "open" | "merged";
  diffSummary: string;
  updatedAt: string;
}
