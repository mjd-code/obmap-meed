import { describe, it, expect } from "vitest";
import { useWorkspaceStore } from "@/domains/workspace/shared/stores/useWorkspaceStore";

describe("useWorkspaceStore — Settings Navigation Reactivity", () => {
  it("updates settingsSection and title when switching settings sections on an already-open settings tab", () => {
    const store = useWorkspaceStore.getState();

    store.openView({
      type: "settings",
      title: "Settings: Account",
      settingsSection: "account",
    });

    let activeLeaf = useWorkspaceStore.getState().getActiveLeaf();
    expect(activeLeaf?.view.type).toBe("settings");
    expect(activeLeaf?.view.settingsSection).toBe("account");

    // Switch to another settings section while settings tab is already active
    useWorkspaceStore.getState().openView({
      type: "settings",
      title: "Settings: Visual Engine",
      settingsSection: "graph-engine",
    });

    activeLeaf = useWorkspaceStore.getState().getActiveLeaf();
    expect(activeLeaf?.view.type).toBe("settings");
    expect(activeLeaf?.view.settingsSection).toBe("graph-engine");
    expect(activeLeaf?.view.title).toBe("Settings: Visual Engine");
  });

  it("updates settingsSection when calling setLeafView on an existing settings leaf", () => {
    const store = useWorkspaceStore.getState();

    store.openView({
      type: "settings",
      title: "Settings: Account",
      settingsSection: "account",
    });

    const leafId = useWorkspaceStore.getState().getActiveLeaf()?.id;
    expect(leafId).toBeDefined();

    useWorkspaceStore.getState().setLeafView(leafId!, {
      type: "settings",
      title: "Settings: Vaults",
      settingsSection: "vaults",
    });

    const updatedLeaf = useWorkspaceStore.getState().getActiveLeaf();
    expect(updatedLeaf?.view.settingsSection).toBe("vaults");
    expect(updatedLeaf?.view.title).toBe("Settings: Vaults");
  });
});
