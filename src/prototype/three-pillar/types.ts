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

export type PresentationLens = "atlas" | "publication" | "course";

export type StorageOrigin =
  | "public_listed"
  | "public_unlisted"
  | "shared"
  | "cloud_private"
  | "local_folder"
  | "indexed_db";

export type DerivedViewMode = "grid" | "tree" | "kanban" | "calendar" | "analytics";

export type ProfileSubTab =
  | "works"
  | "vaults"
  | "courses"
  | "constellation"
  | "about"
  | "shared"
  | "private_local"
  | "workspace_views";

export type LmsNodeStatus = "locked" | "available" | "mastered";

export type SvgPreviewKind =
  | "mindmap"
  | "argument-map"
  | "skill-tree"
  | "fishbone"
  | "constellation";

export type EditorRibbonTool = "files" | "vcs" | "graph" | "mindmap" | "settings";

export type EditorSplitMode = "split" | "editor" | "graph";

export type GraphSolverKind = "mindmap" | "argument-map" | "fishbone" | "timeline";

export type PublishVisibility = "public_listed" | "public_unlisted" | "shared" | "private";

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
}

export interface PrototypeVaultItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  lens: PresentationLens;
  origin: StorageOrigin;
  notesCount: number;
  privateNotesCount: number;
  updatedAt: string;
  collaboratorsCount?: number;
  topic: string;
  svgKind: SvgPreviewKind;
}

export interface PrototypeLmsNode {
  id: string;
  title: string;
  role: "concept" | "module" | "assessment";
  duration: string;
  prerequisites: string[];
  initialStatus: LmsNodeStatus;
  summary: string;
  quizQuestion: string;
  quizOptions: string[];
  correctOptionIndex: number;
}

export interface PrototypeKanbanTask {
  id: string;
  title: string;
  noteSlug: string;
  status: "backlog" | "in_progress" | "peer_review" | "published";
  due: string;
  epistemicStatus: string;
  vaultTitle: string;
}

export interface PrototypeEditorFile {
  id: string;
  name: string;
  folder: string;
  vaultId: string;
  status: "evergreen" | "budding" | "seedling";
  visibility: "public" | "private";
  yaml: Record<string, string>;
  content: string;
  svgKind: SvgPreviewKind;
}

export interface PrototypeNotificationItem {
  id: string;
  kind: "citation" | "merge_request" | "lms";
  title: string;
  detail: string;
  timeAgo: string;
}
