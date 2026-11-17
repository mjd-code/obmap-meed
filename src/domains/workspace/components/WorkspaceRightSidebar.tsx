import { useEffect } from "react";
import { SidebarPanel } from "@/domains/workspace/components/WorkspaceSidebarPanel";
import { useUIStore } from "@/global/stores";
import {
  allGroups,
  useWorkspaceStore,
} from "@/domains/workspace/shared/stores/useWorkspaceStore";

/** Right-side push/slide-out sidebar hosting Universal Settings navigation. */
export function WorkspaceRightSidebar() {
  const rightSidebarOpen = useUIStore((s) => s.rightSidebarOpen);
  const setRightSidebarOpen = useUIStore((s) => s.setRightSidebarOpen);

  useEffect(() => {
    if (!rightSidebarOpen) return;
    const ws = useWorkspaceStore.getState();
    const hasSettingsLeaf = allGroups(ws.root).some((g) =>
      g.leaves.some((l) => l.view.type === "settings"),
    );
    if (!hasSettingsLeaf) {
      ws.openView({
        type: "settings",
        title: "Settings",
        settingsSection: "account",
      });
    }
  }, [rightSidebarOpen]);

  if (!rightSidebarOpen) return null;

  return (
    <SidebarPanel
      side="right"
      activeTool="settings"
      onClose={() => setRightSidebarOpen(false)}
    />
  );
}
