import type {
  AppCentralConfigJson,
  HelicopterViewKind,
  PortfolioStudyStage,
  PresentationLens,
  PresetOrigin,
  WorkspaceModeId,
} from "./vcsAndConfigTypes";

export * from "./vcsAndConfigTypes";

export type PillarId = "explore" | "profile" | "editor";

export type SimulatedRole = "owner" | "visitor" | "stage2_pending";

export type ExploreSubTab = "discover" | "following";

export type ArtifactFormat =
  | "all"
  | "mindmap"
  | "course"
  | "argument-map"
  | "article"
  | "template";

export type ExploreLensFilter = "all" | PresentationLens;

export type StorageOrigin =
  | "public_listed"
  | "public_unlisted"
  | "shared"
  | "cloud_private"
  | "local_folder"
  | "indexed_db";

export type ProfileSubTab =
  | "works"
  | "vaults"
  | "courses"
  | "constellation"
  | "about"
  | "shared"
  | "private_local"
  | "workspace_views";

export type SvgPreviewKind =
  | "mindmap"
  | "argument-map"
  | "skill-tree"
  | "fishbone"
  | "constellation"
  | "timeline";

export type GraphSolverKind =
  | "mindmap"
  | "fishbone"
  | "timeline"
  | "argument-map"
  | "skill-tree";

export interface PrototypeScholarProfile {
  name: string;
  handle: string;
  initials: string;
  title: string;
  affiliation: string;
  orcid: string;
  bio: string;
  verifiedScholar: boolean;
  stats: {
    citations: number;
    publishedWorks: number;
    followers: string;
    lmsMastery: number;
  };
}

export interface PrototypeLearningPath {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  modulesCount: number;
  lens: PresentationLens;
  presetOrigin: PresetOrigin;
  badge: string;
  svgKind: SvgPreviewKind;
  authorHandle: string;
  targetArtifactId: string;
}

export interface PrototypeArtifactCard {
  id: string;
  title: string;
  excerpt: string;
  authorName: string;
  authorHandle: string;
  verifiedScholar: boolean;
  format: Exclude<ArtifactFormat, "all">;
  lens: PresentationLens;
  workspaceMode: WorkspaceModeId;
  presetOrigin: PresetOrigin;
  topic: string;
  visibility: StorageOrigin;
  vaultSlug: string;
  vaultTitle: string;
  nodesCount: number;
  citationsCount: number;
  forksCount: number;
  sparksCount: number;
  updatedAt: string;
  epistemicStatus: "seedling" | "budding" | "evergreen" | "peer_reviewed";
  license: string;
  svgKind: SvgPreviewKind;
  isFollowingAuthor?: boolean;
  lmsProgress?: number;
  slideSummaries: string[];
  markdownPreview: string;
  yamlFrontmatter: Record<string, string>;
  appConfigPreview: AppCentralConfigJson;
}

export interface PrototypeVaultItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  lens: PresentationLens;
  primaryMode: WorkspaceModeId;
  defaultHelicopterView: HelicopterViewKind;
  presetOrigin: PresetOrigin;
  origin: StorageOrigin;
  notesCount: number;
  privateNotesCount: number;
  updatedAt: string;
  collaboratorsCount?: number;
  topic: string;
  svgKind: SvgPreviewKind;
  appConfig: AppCentralConfigJson;
}

export interface PrototypePortfolioStudyItem {
  id: string;
  title: string;
  noteSlug: string;
  workspaceMode: WorkspaceModeId;
  stage: PortfolioStudyStage;
  tags: string[];
  backlinksCount: number;
  keyword: string;
  updatedAt: string;
  vaultTitle: string;
}

export interface PrototypeEditorFile {
  id: string;
  name: string;
  folder: string;
  vaultId: string;
  status: "evergreen" | "budding" | "seedling";
  visibility: "public" | "private";
  svgKind: SvgPreviewKind;
  tags: string[];
  keyword: string;
  backlinks: string[];
  yaml: Record<string, string>;
  content: string;
}

export interface PrototypeNotificationItem {
  id: string;
  kind: "citation" | "merge_request" | "lms";
  title: string;
  detail: string;
  timeAgo: string;
}
