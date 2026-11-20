import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { INITIAL_PORTFOLIO_STUDY_ITEMS } from "../mockPortfolioData";
import { PROTOTYPE_ACADEMY_TREE } from "../mockVcsAndConfigData";
import type {
  DeepExplorerViewKind,
  LmsNodeStatus,
  PortfolioStudyStage,
  ProfileSubTab,
  PrototypeAcademyTreeNode,
  PrototypePortfolioStudyItem,
} from "../types";
import type { PrototypeAcademySlice } from "./prototypeStateTypes";

const OWNER_ONLY_TABS: ReadonlySet<ProfileSubTab> = new Set([
  "shared",
  "private_local",
  "workspace_views",
]);

const STAGE_ORDER: PortfolioStudyStage[] = [
  "seedling",
  "budding",
  "evergreen",
  "published",
  "mastered",
];

export function useProfileAcademyState(effectiveVisitorView: boolean): PrototypeAcademySlice {
  const [profileSubTab, setProfileSubTab] = useState<ProfileSubTab>("works");
  const [selectedVaultHighlight, setSelectedVaultHighlight] = useState<string | null>(null);
  const [pinnedVaultIds, setPinnedVaultIds] = useState<string[]>(["v-atlas", "v-lms"]);
  const [academyTree, setAcademyTree] = useState<PrototypeAcademyTreeNode[]>(PROTOTYPE_ACADEMY_TREE);
  const [selectedLmsNodeId, setSelectedLmsNodeId] = useState<string>("aca-4");
  const [lmsStatuses, setLmsStatuses] = useState<Record<string, LmsNodeStatus>>(() =>
    Object.fromEntries(PROTOTYPE_ACADEMY_TREE.map((n) => [n.id, n.initialStatus]))
  );
  const [profileDeepExplorerView, setProfileDeepExplorerView] =
    useState<DeepExplorerViewKind>("cards");
  const [portfolioItems, setPortfolioItems] = useState<PrototypePortfolioStudyItem[]>(
    INITIAL_PORTFOLIO_STUDY_ITEMS
  );

  useEffect(() => {
    if (effectiveVisitorView && OWNER_ONLY_TABS.has(profileSubTab)) {
      setProfileSubTab("works");
    }
  }, [effectiveVisitorView, profileSubTab]);

  const togglePinVault = useCallback((vaultId: string) => {
    setPinnedVaultIds((prev) => {
      const exists = prev.includes(vaultId);
      toast.success(exists ? "Vault dilepas dari pin profil" : "Vault disematkan di profil publik");
      return exists ? prev.filter((id) => id !== vaultId) : [...prev, vaultId];
    });
  }, []);

  const completeLmsNodeQuiz = useCallback(
    (nodeId: string, optionIndex: number) => {
      const target = academyTree.find((n) => n.id === nodeId);
      if (!target) return;
      if (optionIndex !== target.correctOptionIndex) {
        toast.error("Jawaban belum tepat — tinjau kembali ringkasan modul.");
        return;
      }
      setLmsStatuses((prev) => {
        const next: Record<string, LmsNodeStatus> = { ...prev, [nodeId]: "mastered" };
        for (const node of academyTree) {
          if (
            next[node.id] === "locked" &&
            node.prerequisites.every((req) => next[req] === "mastered")
          ) {
            next[node.id] = "available";
          }
        }
        return next;
      });
      toast.success("Simpul dikuasai (Mastered)! Simpul lanjutan terbuka.");
    },
    [academyTree]
  );

  const addStudentSubNode = useCallback((parentNodeId: string, noteTitle: string) => {
    const cleanTitle = noteTitle.trim() || "refleksi-pembelajar.md";
    setAcademyTree((prev) =>
      prev.map((node) =>
        node.id === parentNodeId
          ? {
              ...node,
              studentSubNodes: [
                ...node.studentSubNodes,
                {
                  id: `sub-${Date.now()}`,
                  studentName: "Anda (Pembelajar)",
                  studentHandle: "@pelajar.sidra",
                  title: cleanTitle.endsWith(".md") ? cleanTitle : `${cleanTitle}.md`,
                  status: "submitted",
                  updatedAt: "Baru saja",
                },
              ],
            }
          : node
      )
    );
    toast.success(`Sub-node pelajar tumbuh di bawah "${parentNodeId.toUpperCase()}".`);
  }, []);

  const cyclePortfolioStage = useCallback((itemId: string) => {
    setPortfolioItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const nextStage = STAGE_ORDER[(STAGE_ORDER.indexOf(item.stage) + 1) % STAGE_ORDER.length];
        toast.info(`YAML epistemic_status: "${nextStage}" diperbarui di ${item.noteSlug}.md`);
        return { ...item, stage: nextStage };
      })
    );
  }, []);

  return {
    profileSubTab,
    setProfileSubTab,
    selectedVaultHighlight,
    setSelectedVaultHighlight,
    pinnedVaultIds,
    togglePinVault,
    academyTree,
    lmsStatuses,
    selectedLmsNodeId,
    setSelectedLmsNodeId,
    completeLmsNodeQuiz,
    addStudentSubNode,
    profileDeepExplorerView,
    setProfileDeepExplorerView,
    portfolioItems,
    cyclePortfolioStage,
  };
}
