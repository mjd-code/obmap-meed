import type {
  AiPersonaId,
  AiProviderId,
  AppThemeId,
  BackupScheduleFrequency,
  ConnectorStyleId,
  DeepExplorerViewKind,
  EditorFontFamilyId,
  EditorKeybindingMode,
  ExploreDensityId,
  GraphSolverKind,
  PresentationLens,
  PresetOrigin,
  ProfileHeaderDisplayId,
  ReorganizeBy,
  RestructureModeV2,
  WorkspaceModeCatalogId,
  WorkspaceModeId,
} from "./vcsAndConfigTypes";

export type SocialLinkPlatform = "github" | "x" | "linkedin" | "scholar" | "website";

export interface PrototypeSocialLink {
  id: string;
  platform: SocialLinkPlatform;
  label: string;
  url: string;
}

export interface AccountProfileFormErrors {
  name?: string;
  handle?: string;
  orcid?: string;
  bio?: string;
}

export interface PrototypeApiToken {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  lastUsed: string;
}

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Sangat Lemah" | "Lemah" | "Cukup" | "Kuat" | "Sangat Kuat";
  checks: {
    minLength: boolean;
    hasUpperLower: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
}

export interface PrototypeSessionItem {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface PrototypeBackupSchedule {
  frequency: BackupScheduleFrequency;
  retentionCount: number;
  lastBackupAt: string;
  nextBackupAt: string;
  autoSnapshotOnRestructure: boolean;
  destination: string;
}

export type ImportExportFormatId =
  | "markdown_zip"
  | "obsidian_folder"
  | "config_json"
  | "json_bundle"
  | "community_preset";

export interface PrototypeImportExportRecord {
  id: string;
  direction: "import" | "export";
  format: ImportExportFormatId;
  label: string;
  itemCount: number;
  timestamp: string;
}

export type PresetCatalogGroup = "built_in" | "user_custom" | "community";

export interface WorkspacePresetPatch {
  primaryMode: WorkspaceModeId;
  presetOrigin: PresetOrigin;
  defaultView: DeepExplorerViewKind;
  reorganizeBy: ReorganizeBy;
  restructureMode: RestructureModeV2;
  defaultSolver: GraphSolverKind;
  connectorStyle: ConnectorStyleId;
  hideOrphanNodes: boolean;
  theme: AppThemeId;
  aiAssistantEnabled: boolean;
  defaultLens: PresentationLens;
  academyEnabled: boolean;
  zenFocusMode: boolean;
  defaultTemplate: string;
}

export interface WorkspacePresetEntry {
  id: string;
  name: string;
  group: PresetCatalogGroup;
  primaryMode: WorkspaceModeCatalogId;
  origin: PresetOrigin;
  authorHandle: string;
  description: string;
  badge?: string;
  previewOnly?: boolean;
  isDefault?: boolean;
  configPatch: WorkspacePresetPatch;
}

export interface PresetImpactDiffItem {
  path: string;
  label: string;
  before: string;
  after: string;
  severity: "info" | "layout" | "schema";
}

export interface PrototypeAppearanceState {
  theme: AppThemeId;
  exploreCardDensity: ExploreDensityId;
  profileHeaderDisplay: ProfileHeaderDisplayId;
  reducedMotion: boolean;
  highContrast: boolean;
  screenReaderHints: boolean;
  editorFontFamily: EditorFontFamilyId;
  editorFontSizePx: number;
  editorLineHeight: number;
  editorMaxLineWidthCh: number;
  autoPairBrackets: boolean;
  spellcheck: boolean;
  keybindings: EditorKeybindingMode;
  aiAssistantEnabled: boolean;
  aiProvider: AiProviderId;
  aiPersona: AiPersonaId;
  floatingFormattingToolbar: boolean;
  slashCommands: boolean;
  offlineCacheEnabled: boolean;
  autoSyncIntervalSec: number;
}

export interface PrototypeVisualEngineState {
  repulsionForce: number;
  linkDistance: number;
  centerGravity: number;
  nodeRenderLimit: number;
  labelFadeThreshold: number;
  clusterColorsEnabled: boolean;
  hideOrphanNodes: boolean;
  defaultSolver: GraphSolverKind;
  connectorStyle: ConnectorStyleId;
  branchColorCoding: boolean;
  branchSpacingPx: number;
  keyboardShortcutsEnabled: boolean;
}

export interface PrototypeCrossVaultStats {
  totalVaults: number;
  totalNotes: number;
  totalConnections: number;
  localStorageKb: number;
  cloudStorageKb: number;
  avgYamlHealthPct: number;
  syncedVaultsCount: number;
}
