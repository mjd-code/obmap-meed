import type { ConfigValidationResult } from "../configSchemaValidator";
import type { SettingsSelection, SettingsSubId } from "../settingsCatalog";
import type {
  AccountProfileFormErrors,
  PasswordStrengthResult,
  PresetImpactDiffItem,
  PrototypeApiToken,
  PrototypeAppearanceState,
  PrototypeBackupSchedule,
  PrototypeCrossVaultStats,
  PrototypeImportExportRecord,
  PrototypeSessionItem,
  PrototypeSocialLink,
  PrototypeVisualEngineState,
  SocialLinkPlatform,
  WorkspacePresetEntry,
} from "../settingsTypes";
import type {
  AppCentralConfigJsonV2,
  DeepExplorerViewKind,
  ExploreLensFilter,
  ExploreSubTab,
  GraphSolverKind,
  LmsNodeStatus,
  PillarId,
  ProfileSubTab,
  PrototypeAcademyTreeNode,
  PrototypeArtifactCard,
  PrototypeEditorFile,
  PrototypePortfolioStudyItem,
  PrototypeScholarProfile,
  ReorganizeBy,
  RestructureMode,
  RestructureModeV2,
  SimulatedRole,
  WorkspaceModeId,
} from "../types";

export type PrototypeViewType =
  | "markdown"
  | "deep_explorer"
  | "settings"
  | "graph"
  | "empty";

export type OpenMode = "reuse-tab" | "new-tab" | "split-right";

export interface PrototypeViewState {
  type: PrototypeViewType;
  nodeId?: string;
  title?: string;
}

export interface PrototypeWorkspaceLeaf {
  kind: "leaf";
  id: string;
  view: PrototypeViewState;
  pinned?: boolean;
}

export interface PrototypeWorkspaceGroup {
  kind: "group";
  id: string;
  leaves: PrototypeWorkspaceLeaf[];
  activeLeafId: string | null;
}

export interface PrototypeWorkspaceSplit {
  kind: "split";
  id: string;
  direction: "horizontal" | "vertical";
  children: PrototypeWorkspaceNode[];
  sizes: number[];
}

export type PrototypeWorkspaceNode =
  | PrototypeWorkspaceGroup
  | PrototypeWorkspaceSplit;

export interface PrototypeWorkspaceState {
  root: PrototypeWorkspaceNode;
  activeGroupId: string;
  files: PrototypeEditorFile[];
  folders: string[];
  selectedFileId: string | null;
  activeFile: PrototypeEditorFile | null;
  leftSidebarTool: "files" | "vcs" | null;
  setLeftSidebarTool: (tool: "files" | "vcs" | null) => void;
  rightSidebarOpen: boolean;
  setRightSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  leftSidebarPinned: boolean;
  setLeftSidebarPinned: React.Dispatch<React.SetStateAction<boolean>>;
  rightSidebarPinned: boolean;
  setRightSidebarPinned: React.Dispatch<React.SetStateAction<boolean>>;
  openView: (view: PrototypeViewState, mode?: OpenMode) => void;
  openFile: (fileId: string, mode?: OpenMode) => void;
  openDeepExplorerTab: (view?: DeepExplorerViewKind | "academy") => void;
  openSettingsHubTab: () => void;
  closeLeaf: (groupId: string, leafId: string) => void;
  closeLeavesToRight: (groupId: string, leafId: string) => void;
  closeAllLeaves: (groupId: string) => void;
  setActiveLeaf: (groupId: string, leafId: string) => void;
  setActiveGroup: (groupId: string) => void;
  togglePinLeaf: (groupId: string, leafId: string) => void;
  splitGroup: (groupId: string, direction: "horizontal" | "vertical") => void;
  setSplitSizes: (splitId: string, sizes: number[]) => void;
  moveLeaf: (fromGroupId: string, leafId: string, toGroupId: string, index?: number) => void;
  moveLeafToNewSplit: (
    fromGroupId: string,
    leafId: string,
    toGroupId: string,
    edge: "left" | "right" | "top" | "bottom"
  ) => void;
  createFile: (folder: string, name?: string, vaultId?: string) => PrototypeEditorFile;
  createFolder: (folderName: string) => void;
  renameFile: (fileId: string, nextName: string) => void;
  deleteFile: (fileId: string) => void;
  moveFileToFolder: (fileId: string, folder: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  updateFileYaml: (fileId: string, yaml: Record<string, string>) => void;
  syncActiveVaultFiles: (vaultId: string) => void;
}

export interface PrototypeAccountState {
  profile: PrototypeScholarProfile;
  profileErrors: AccountProfileFormErrors;
  updateProfile: (patch: Partial<Pick<PrototypeScholarProfile, "name" | "handle" | "bio" | "affiliation" | "orcid" | "location">>) => boolean;
  addSocialLink: (platform: SocialLinkPlatform, label: string, url: string) => boolean;
  updateSocialLink: (id: string, patch: Partial<Omit<PrototypeSocialLink, "id">>) => void;
  removeSocialLink: (id: string) => void;
  email: string;
  lastPasswordUpdated: string;
  evaluatePasswordStrength: (password: string) => PasswordStrengthResult;
  resetEmail: (nextEmail: string) => boolean;
  resetPassword: (current: string, next: string, confirm: string) => boolean;
  pats: PrototypeApiToken[];
  createPat: (name: string, scopes: string[]) => PrototypeApiToken | null;
  revokePat: (id: string) => void;
  resetCredentials: () => void;
  sessions: PrototypeSessionItem[];
  revokeSession: (id: string) => boolean;
  revokeAllOtherSessions: () => number;
}

export interface PrototypeDeepExplorerState {
  defaultView: DeepExplorerViewKind;
  setDefaultView: (view: DeepExplorerViewKind) => void;
  branchFilter: string;
  setBranchFilter: (branch: string) => void;
  folderFilter: string;
  setFolderFilter: (folder: string) => void;
  depthFilter: number;
  setDepthFilter: (depth: number) => void;
  reorganizeBy: ReorganizeBy;
  setReorganizeBy: (by: ReorganizeBy) => void;
  restructureMode: RestructureModeV2;
  setRestructureMode: (mode: RestructureMode) => void;
  requiredYamlProperties: string[];
  strictFrontmatterValidation: boolean;
  setStrictFrontmatterValidation: (strict: boolean) => void;
  addYamlProperty: (prop: string) => void;
  removeYamlProperty: (prop: string) => void;
}

export interface PrototypePresetConfigState {
  builtInPresets: readonly WorkspacePresetEntry[];
  customPresets: WorkspacePresetEntry[];
  communityPresets: readonly WorkspacePresetEntry[];
  activePresetId: string;
  pendingPresetId: string | null;
  pendingPreset: WorkspacePresetEntry | null;
  pendingImpactDiff: PresetImpactDiffItem[];
  stagePresetForPreview: (presetId: string) => void;
  confirmApplyPreset: () => boolean;
  cancelPresetPreview: () => void;
  createCustomPreset: (name: string, description: string, basePresetId?: string) => WorkspacePresetEntry;
  updateCustomPreset: (presetId: string, patch: Partial<Pick<WorkspacePresetEntry, "name" | "description">>) => void;
  duplicatePreset: (presetId: string) => WorkspacePresetEntry | null;
  deleteCustomPreset: (presetId: string) => void;
  setDefaultCustomPreset: (presetId: string) => void;
  adoptCommunityPreset: (presetId: string, customize?: boolean) => WorkspacePresetEntry | null;
  liveConfig: AppCentralConfigJsonV2;
  rawDraft: string;
  isRawDirty: boolean;
  validationResult: ConfigValidationResult;
  setRawDraft: (next: string) => void;
  formatRawConfigJson: () => boolean;
  applyRawConfigJson: () => ConfigValidationResult;
  resetConfigToDefault: () => void;
}

export interface PrototypeExploreStateSlice {
  exploreSubTab: ExploreSubTab;
  setExploreSubTab: (tab: ExploreSubTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedLensFilter: ExploreLensFilter;
  setSelectedLensFilter: (filter: ExploreLensFilter) => void;
  selectedTopic: string;
  setSelectedTopic: (topic: string) => void;
  filteredExploreArtifacts: PrototypeArtifactCard[];
  sparkedIds: string[];
  bookmarkedIds: string[];
  followingHandles: string[];
  toggleSpark: (id: string) => void;
  toggleBookmark: (id: string) => void;
  toggleFollowAuthor: (handle: string) => void;
  quickPeekArtifact: PrototypeArtifactCard | null;
  setQuickPeekArtifact: (artifact: PrototypeArtifactCard | null) => void;
}

export interface PrototypeAcademySlice {
  profileSubTab: ProfileSubTab;
  setProfileSubTab: (tab: ProfileSubTab) => void;
  selectedVaultHighlight: string | null;
  setSelectedVaultHighlight: (slug: string | null) => void;
  pinnedVaultIds: string[];
  togglePinVault: (vaultId: string) => void;
  academyTree: PrototypeAcademyTreeNode[];
  lmsStatuses: Record<string, LmsNodeStatus>;
  selectedLmsNodeId: string;
  setSelectedLmsNodeId: (id: string) => void;
  completeLmsNodeQuiz: (nodeId: string, optionIndex: number) => void;
  addStudentSubNode: (parentNodeId: string, noteTitle: string) => void;
  profileDeepExplorerView: DeepExplorerViewKind;
  setProfileDeepExplorerView: (view: DeepExplorerViewKind) => void;
  portfolioItems: PrototypePortfolioStudyItem[];
  cyclePortfolioStage: (itemId: string) => void;
}

export interface PrototypeAppearanceActions {
  state: PrototypeAppearanceState;
  updateAppearance: (patch: Partial<PrototypeAppearanceState>) => void;
  resetAppearance: () => void;
  rootRef: React.RefObject<HTMLDivElement>;
}

export interface PrototypeVisualEngineActions {
  state: PrototypeVisualEngineState;
  updateVisualEngine: (patch: Partial<PrototypeVisualEngineState>) => void;
  resetVisualEngine: () => void;
  setDefaultSolver: (solver: GraphSolverKind) => void;
}

export interface PrototypeAppNavContract {
  activePillar: PillarId;
  selectPillar: (pillar: PillarId) => void;
  isAppSettingsFullPageOpen: boolean;
  setIsAppSettingsFullPageOpen: (open: boolean) => void;
  role: SimulatedRole;
  handleRoleChange: (role: SimulatedRole) => void;
  editorMode: "live" | "sandbox";
  setEditorMode: (mode: "live" | "sandbox") => void;
  isAuthenticatedSim: boolean;
  toggleAuthSim: () => void;
  activeSnapshotId: string;
  setActiveSnapshotId: (id: string) => void;
  settingsSelection: SettingsSelection;
  selectSettings: (subId: SettingsSubId, sectionId?: string) => void;
  activeSettingsTabOpen: boolean;
  setActiveSettingsTabOpen: (open: boolean) => void;
  crossVaultStats?: PrototypeCrossVaultStats;
  backupSchedule?: PrototypeBackupSchedule;
  importExportLogs?: PrototypeImportExportRecord[];
}
