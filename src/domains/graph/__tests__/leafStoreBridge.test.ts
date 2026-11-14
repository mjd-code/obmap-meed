import { describe, it, expect, beforeEach } from "vitest";
import {
  getOrCreateLeafConfigStore,
  disposeLeafConfigStore,
} from "@/domains/graph/shared/stores/useLeafGraphConfigStore";
import { useGraphStore } from "@/domains/graph/shared/stores/useGraphStore";
import {
  getOrCreateLeafInteractionStore,
  disposeLeafInteractionStore,
  globalGraphInteractionStore,
} from "@/domains/graph/shared/stores/useGraphInteractionStore";

describe("Hierarchical Store Bridge (Global <-> Leaf)", () => {
  beforeEach(() => {
    disposeLeafConfigStore("leaf-bridge-test-1");
    disposeLeafConfigStore("leaf-bridge-test-2");
    disposeLeafInteractionStore("leaf-bridge-test-1");
    disposeLeafInteractionStore("leaf-bridge-test-2");
    useGraphStore.getState().resetConfig();
    globalGraphInteractionStore.getState().setLayoutMode("mindmap");
    globalGraphInteractionStore.getState().stopTimeLapse();
  });

  it("writes leaf config mutations through to global useGraphStore without loops", () => {
    const leafStore = getOrCreateLeafConfigStore("leaf-bridge-test-1");

    leafStore.getState().setNodeConfig({ relSize: 18, showFolderNodes: false });

    expect(leafStore.getState().config.nodes.relSize).toBe(18);
    expect(leafStore.getState().config.nodes.showFolderNodes).toBe(false);
    expect(useGraphStore.getState().config.nodes.relSize).toBe(18);
    expect(useGraphStore.getState().config.nodes.showFolderNodes).toBe(false);
  });

  it("broadcasts global useGraphStore updates to active leaf config stores", () => {
    const leafA = getOrCreateLeafConfigStore("leaf-bridge-test-1");
    const leafB = getOrCreateLeafConfigStore("leaf-bridge-test-2");

    useGraphStore.getState().updateLinkConfig({ width: 5, showParticles: true });

    expect(leafA.getState().config.links.width).toBe(5);
    expect(leafA.getState().config.links.showParticles).toBe(true);
    expect(leafB.getState().config.links.width).toBe(5);
    expect(leafB.getState().config.links.showParticles).toBe(true);
  });

  it("writes leaf interaction mutations (canvasMode, layoutMode, timeLapse) to globalGraphInteractionStore", () => {
    const leafStore = getOrCreateLeafInteractionStore("leaf-bridge-test-1");

    leafStore.getState().setLayoutMode("kamada-kawai");
    expect(leafStore.getState().canvasMode).toBe("graph");
    expect(globalGraphInteractionStore.getState().layoutMode).toBe("kamada-kawai");
    expect(globalGraphInteractionStore.getState().canvasMode).toBe("graph");

    leafStore.getState().setLayoutMode("timeline");
    expect(leafStore.getState().canvasMode).toBe("mindmap");
    expect(globalGraphInteractionStore.getState().layoutMode).toBe("timeline");
    expect(globalGraphInteractionStore.getState().canvasMode).toBe("mindmap");

    leafStore.getState().startTimeLapse();
    leafStore.getState().setTimeLapseProgress(4, 12);
    expect(globalGraphInteractionStore.getState().isTimeLapseActive).toBe(true);
    expect(globalGraphInteractionStore.getState().timeLapseStep).toBe(4);
    expect(globalGraphInteractionStore.getState().timeLapseTotal).toBe(12);
  });

  it("broadcasts globalGraphInteractionStore layout changes to open leaf interaction stores", () => {
    const leafStore = getOrCreateLeafInteractionStore("leaf-bridge-test-1", "free-force");

    globalGraphInteractionStore.getState().setLayoutMode("org-chart");

    expect(leafStore.getState().layoutMode).toBe("org-chart");
    expect(leafStore.getState().canvasMode).toBe("mindmap");
  });
});
