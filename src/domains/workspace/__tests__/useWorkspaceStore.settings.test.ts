import { describe, it, expect } from "vitest";
import { useWorkspaceStore } from "@/domains/workspace/shared/stores/useWorkspaceStore";
import { useUIStore } from "@/domains/workspace/shared/stores/useUIStore";

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

  it("manages independent left/right sidebars and mutually excludes them on mobile screens", () => {
    useUIStore.getState().reset();
    const originalWidth = window.innerWidth;

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    });

    try {
      useUIStore.getState().setActiveTool("files");
      expect(useUIStore.getState().activeTool).toBe("files");
      expect(useUIStore.getState().rightSidebarOpen).toBe(false);

      // Opening right sidebar on mobile closes left sidebar
      useUIStore.getState().toggleRightSidebar();
      expect(useUIStore.getState().rightSidebarOpen).toBe(true);
      expect(useUIStore.getState().activeTool).toBeNull();

      // Opening left sidebar on mobile closes right sidebar
      useUIStore.getState().setActiveTool("files");
      expect(useUIStore.getState().activeTool).toBe("files");
      expect(useUIStore.getState().rightSidebarOpen).toBe(false);
    } finally {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        writable: true,
        value: originalWidth,
      });
    }
  });
});
