import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  ACTIVE_SNAPSHOT_ID,
  getSnapshotStage,
} from "../../snapshots/snapshotRegistry";
import {
  legacySectionToSettingsSelection,
  normalizeSettingsSelection,
  settingsSelectionToLegacySection,
  type SettingsSelection,
  type SettingsSubId,
} from "../settingsCatalog";
import type { PillarId, SettingsHubSectionId, SimulatedRole } from "../types";

export function useNavigationState() {
  const [activePillar, setActivePillar] = useState<PillarId>("explore");
  const [role, setRole] = useState<SimulatedRole>("owner");
  const [isPreviewAsVisitor, setIsPreviewAsVisitor] = useState(false);
  const [isAuthenticatedSim, setIsAuthenticatedSim] = useState(true);
  const [editorMode, setEditorMode] = useState<"live" | "sandbox">("live");
  const [activeSnapshotId, setActiveSnapshotIdState] = useState<string>(ACTIVE_SNAPSHOT_ID);
  const [isAppSettingsFullPageOpen, setIsAppSettingsFullPageOpen] = useState(false);
  const [activeSettingsTabOpen, setActiveSettingsTabOpen] = useState(false);
  const [settingsSelection, setSettingsSelection] = useState<SettingsSelection>(() =>
    normalizeSettingsSelection("workspace_preset")
  );

  const effectiveVisitorView = role === "visitor" || isPreviewAsVisitor;

  const selectPillar = useCallback((pillar: PillarId) => {
    setIsAppSettingsFullPageOpen(false);
    setActivePillar(pillar);
  }, []);

  const handleRoleChange = useCallback((nextRole: SimulatedRole) => {
    setRole(nextRole);
    if (nextRole !== "owner") setIsPreviewAsVisitor(false);
    setEditorMode(nextRole === "visitor" ? "sandbox" : "live");
  }, []);

  const toggleAuthSim = useCallback(() => {
    setIsAuthenticatedSim((prev) => {
      const next = !prev;
      toast.info(next ? "Signed in sebagai @dr.aras.wicaksono" : "Signed out — mode tamu lokal aktif");
      return next;
    });
  }, []);

  const setActiveSnapshotId = useCallback((id: string) => {
    const stage = getSnapshotStage(id);
    setActiveSnapshotIdState(stage.id);
    toast.info(`Snapshot aktif: ${stage.label}`);
  }, []);

  const selectSettings = useCallback((subId: SettingsSubId, sectionId?: string) => {
    setSettingsSelection(normalizeSettingsSelection(subId, sectionId));
  }, []);

  // @deprecated M1->M2/M3 compat shim
  const settingsHubSection: SettingsHubSectionId = settingsSelectionToLegacySection(
    settingsSelection.subSettingId
  );

  // @deprecated M1->M2/M3 compat shim
  const setSettingsHubSection = useCallback((section: SettingsHubSectionId) => {
    setSettingsSelection(legacySectionToSettingsSelection(section));
  }, []);

  return {
    activePillar,
    selectPillar,
    role,
    handleRoleChange,
    isPreviewAsVisitor,
    setIsPreviewAsVisitor,
    effectiveVisitorView,
    isAuthenticatedSim,
    toggleAuthSim,
    editorMode,
    setEditorMode,
    activeSnapshotId,
    setActiveSnapshotId,
    isAppSettingsFullPageOpen,
    setIsAppSettingsFullPageOpen,
    activeSettingsTabOpen,
    setActiveSettingsTabOpen,
    settingsSelection,
    selectSettings,
    settingsHubSection,
    setSettingsHubSection,
  };
}
