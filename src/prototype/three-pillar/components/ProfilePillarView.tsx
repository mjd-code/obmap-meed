import React from "react";
import { Link2, Lock } from "lucide-react";
import { cn } from "@/global/utils";
import { Badge } from "@/global/ui/badge";
import { PROTOTYPE_ARTIFACTS, PROTOTYPE_SCHOLAR_PROFILE, PROTOTYPE_VAULTS } from "../mockData";
import type {
  DerivedViewMode,
  LmsNodeStatus,
  ProfileSubTab,
  PrototypeArtifactCard,
  PrototypeKanbanTask,
  SimulatedRole,
} from "../types";
import { PrototypeSvgThumbnail } from "./PrototypeSvgThumbnails";
import { ProfileIdentityHeader } from "./ProfileIdentityHeader";
import { ProfileLmsSkillTreePanel } from "./ProfileLmsSkillTreePanel";
import { ProfileVaultCollectionsPanel } from "./ProfileVaultCollectionsPanel";
import { ProfileWorkspaceViewsPanel } from "./ProfileWorkspaceViewsPanel";

interface ProfilePillarViewProps {
  role: SimulatedRole;
  effectiveVisitorView: boolean;
  isPreviewAsVisitor: boolean;
  onTogglePreviewAsVisitor: () => void;
  subTab: ProfileSubTab;
  onChangeSubTab: (tab: ProfileSubTab) => void;
  selectedVaultHighlight: string | null;
  onSelectVaultHighlight: (slug: string | null) => void;
  lmsStatuses: Record<string, LmsNodeStatus>;
  selectedLmsNodeId: string;
  onSelectLmsNode: (id: string) => void;
  onSubmitLmsQuiz: (nodeId: string, idx: number) => void;
  derivedViewMode: DerivedViewMode;
  onChangeDerivedViewMode: (m: DerivedViewMode) => void;
  kanbanTasks: PrototypeKanbanTask[];
  onCycleKanbanTask: (id: string) => void;
  onOpenArtifactPeek: (card: PrototypeArtifactCard) => void;
  onOpenEditor: () => void;
}

const PUBLIC_TABS: { id: ProfileSubTab; label: string }[] = [
  { id: "works", label: "Karya" },
  { id: "vaults", label: "Vaults" },
  { id: "courses", label: "Courses (LMS)" },
  { id: "constellation", label: "Konstelasi" },
  { id: "about", label: "Sitasi" },
];

const OWNER_TABS: { id: ProfileSubTab; label: string }[] = [
  { id: "shared", label: "Shared" },
  { id: "private_local", label: "Pribadi & Lokal" },
  { id: "workspace_views", label: "Views" },
];

export const ProfilePillarView: React.FC<ProfilePillarViewProps> = ({
  role,
  effectiveVisitorView,
  isPreviewAsVisitor,
  onTogglePreviewAsVisitor,
  subTab,
  onChangeSubTab,
  selectedVaultHighlight,
  onSelectVaultHighlight,
  lmsStatuses,
  selectedLmsNodeId,
  onSelectLmsNode,
  onSubmitLmsQuiz,
  derivedViewMode,
  onChangeDerivedViewMode,
  kanbanTasks,
  onCycleKanbanTask,
  onOpenArtifactPeek,
  onOpenEditor,
}) => {
  const scholar = PROTOTYPE_SCHOLAR_PROFILE;
  const publicVaults = PROTOTYPE_VAULTS.filter((v) => v.origin === "public_listed");
  const sharedVaults = PROTOTYPE_VAULTS.filter((v) => v.origin === "shared");
  const privateLocalVaults = PROTOTYPE_VAULTS.filter((v) =>
    ["cloud_private", "local_folder", "indexed_db", "public_unlisted"].includes(v.origin)
  );
  const visibleWorks = PROTOTYPE_ARTIFACTS.filter(
    (a) => !selectedVaultHighlight || a.vaultSlug === selectedVaultHighlight
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-5 overflow-x-hidden">
      <ProfileIdentityHeader
        role={role}
        effectiveVisitorView={effectiveVisitorView}
        isPreviewAsVisitor={isPreviewAsVisitor}
        onTogglePreviewAsVisitor={onTogglePreviewAsVisitor}
        onOpenEditor={onOpenEditor}
      />

      {/* Symmetrical Tab Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3 min-w-0">
        <div className="flex items-center gap-1 max-w-full overflow-x-auto no-scrollbar">
          {PUBLIC_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onChangeSubTab(t.id)}
              className={cn(
                "px-3 py-1.5 rounded-full vk-text-xs font-medium whitespace-nowrap transition-colors",
                subTab === t.id ? "bg-elevated text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {!effectiveVisitorView && (
          <div className="flex items-center gap-1 rounded-full border border-border/80 bg-surface p-0.5 overflow-x-auto no-scrollbar">
            {OWNER_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChangeSubTab(t.id)}
                className={cn(
                  "px-3 py-1 rounded-full vk-text-xs font-medium whitespace-nowrap transition-colors inline-flex items-center gap-1",
                  subTab === t.id ? "bg-warning/15 text-warning" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Lock className="h-3 w-3" />
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {subTab === "works" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => onSelectVaultHighlight(null)}
              className={cn(
                "px-3 py-1 rounded-full border vk-text-2xs font-medium whitespace-nowrap transition-colors",
                selectedVaultHighlight === null ? "bg-primary text-primary-foreground border-primary" : "bg-surface border-border text-muted-foreground"
              )}
            >
              Semua Sorotan
            </button>
            {publicVaults.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelectVaultHighlight(selectedVaultHighlight === v.slug ? null : v.slug)}
                className={cn(
                  "px-3 py-1 rounded-full border vk-text-2xs font-medium whitespace-nowrap transition-colors",
                  selectedVaultHighlight === v.slug ? "bg-primary text-primary-foreground border-primary" : "bg-surface border-border text-foreground"
                )}
              >
                {v.title}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleWorks.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => onOpenArtifactPeek(card)}
                className="text-left rounded-2xl border border-border/80 bg-card hover:border-primary/45 p-4 space-y-3 transition-all"
              >
                <PrototypeSvgThumbnail kind={card.svgKind} compact className="rounded-xl" />
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="vk-text-2xs capitalize">{card.format}</Badge>
                  <span className="vk-text-2xs text-muted-foreground">{card.updatedAt}</span>
                </div>
                <div>
                  <h3 className="vk-text-sm font-semibold line-clamp-1">{card.title}</h3>
                  <p className="vk-text-xs text-muted-foreground line-clamp-1 mt-0.5">{card.excerpt}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {subTab === "vaults" && (
        <ProfileVaultCollectionsPanel mode="public" vaults={publicVaults} effectiveVisitorView={effectiveVisitorView} onOpenEditor={onOpenEditor} />
      )}

      {subTab === "courses" && (
        <ProfileLmsSkillTreePanel lmsStatuses={lmsStatuses} selectedNodeId={selectedLmsNodeId} onSelectNode={onSelectLmsNode} onSubmitQuiz={onSubmitLmsQuiz} onOpenInEditor={onOpenEditor} />
      )}

      {subTab === "constellation" && (
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="vk-text-base font-semibold">Konstelasi Lintas-Vault · {scholar.handle}</h3>
            <Badge variant="info" className="vk-text-2xs">Deterministic Overview</Badge>
          </div>
          <PrototypeSvgThumbnail kind="constellation" className="h-72 rounded-xl" />
        </div>
      )}

      {subTab === "about" && (
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
          <h3 className="vk-text-base font-semibold">Jejaring Sitasi Federated</h3>
          <div className="space-y-2">
            <div className="rounded-xl bg-surface px-4 py-3 flex items-center justify-between gap-2 vk-text-xs">
              <span><Link2 className="h-3.5 w-3.5 inline mr-1.5 text-primary" /> @nadia.putri mengutip <code>sintesis-graf-pengetahuan</code></span>
              <Badge variant="success" className="vk-text-2xs">Verified</Badge>
            </div>
            <div className="rounded-xl bg-surface px-4 py-3 flex items-center justify-between gap-2 vk-text-xs">
              <span><Link2 className="h-3.5 w-3.5 inline mr-1.5 text-primary" /> @hendra.wijaya mem-fork <code>kuliah-graf-dag</code></span>
              <Badge variant="info" className="vk-text-2xs">CC BY-SA 4.0</Badge>
            </div>
          </div>
        </div>
      )}

      {subTab === "shared" && !effectiveVisitorView && (
        <ProfileVaultCollectionsPanel mode="shared" vaults={sharedVaults} effectiveVisitorView={effectiveVisitorView} onOpenEditor={onOpenEditor} />
      )}

      {subTab === "private_local" && !effectiveVisitorView && (
        <ProfileVaultCollectionsPanel mode="private_local" vaults={privateLocalVaults} effectiveVisitorView={effectiveVisitorView} onOpenEditor={onOpenEditor} />
      )}

      {subTab === "workspace_views" && !effectiveVisitorView && (
        <ProfileWorkspaceViewsPanel mode={derivedViewMode} onChangeMode={onChangeDerivedViewMode} tasks={kanbanTasks} onCycleTaskStatus={onCycleKanbanTask} onOpenEditor={onOpenEditor} />
      )}
    </div>
  );
};
