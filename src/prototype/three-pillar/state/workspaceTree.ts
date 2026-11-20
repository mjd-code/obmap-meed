import type {
  OpenMode,
  PrototypeViewState,
  PrototypeWorkspaceGroup,
  PrototypeWorkspaceLeaf,
  PrototypeWorkspaceNode,
  PrototypeWorkspaceSplit,
} from "./prototypeStateTypes";
import {
  allGroups,
  findGroup,
  makeEmptyGroupFallback,
  mapGroups,
  nextTreeId,
  pruneTree,
  sameViewTarget,
} from "./workspaceTreeQueries";

export * from "./workspaceTreeQueries";

export function splitGroupInTree(
  root: PrototypeWorkspaceNode,
  groupId: string,
  direction: "horizontal" | "vertical",
  initialView: PrototypeViewState = { type: "empty", title: "New Tab" }
): { root: PrototypeWorkspaceNode; activeGroupId: string } {
  const newLeaf: PrototypeWorkspaceLeaf = { kind: "leaf", id: nextTreeId("leaf"), view: initialView };
  const newGroup: PrototypeWorkspaceGroup = {
    kind: "group",
    id: nextTreeId("group"),
    leaves: [newLeaf],
    activeLeafId: newLeaf.id,
  };

  function insertSplit(node: PrototypeWorkspaceNode): PrototypeWorkspaceNode {
    if (node.kind === "group") {
      if (node.id !== groupId) return node;
      const split: PrototypeWorkspaceSplit = {
        kind: "split",
        id: nextTreeId("split"),
        direction,
        children: [node, newGroup],
        sizes: [50, 50],
      };
      return split;
    }
    return { ...node, children: node.children.map(insertSplit) };
  }
  return { root: insertSplit(root), activeGroupId: newGroup.id };
}

export function openViewInTree(
  root: PrototypeWorkspaceNode,
  activeGroupId: string,
  view: PrototypeViewState,
  mode: OpenMode = "reuse-tab"
): { root: PrototypeWorkspaceNode; activeGroupId: string } {
  const existingGroup = allGroups(root).find((g) => g.leaves.some((l) => sameViewTarget(l.view, view)));
  if (existingGroup && mode !== "new-tab") {
    const existingLeaf = existingGroup.leaves.find((l) => sameViewTarget(l.view, view))!;
    return {
      root: mapGroups(root, (g) => (g.id === existingGroup.id ? { ...g, activeLeafId: existingLeaf.id } : g)),
      activeGroupId: existingGroup.id,
    };
  }
  if (mode === "split-right") return splitGroupInTree(root, activeGroupId, "horizontal", view);

  const targetGroup = findGroup(root, activeGroupId) ?? allGroups(root)[0];
  if (!targetGroup) return { root, activeGroupId };

  if (mode === "reuse-tab" && targetGroup.activeLeafId) {
    const activeLeaf = targetGroup.leaves.find((l) => l.id === targetGroup.activeLeafId);
    if (activeLeaf && activeLeaf.view.type === "empty" && !activeLeaf.pinned) {
      return {
        root: mapGroups(root, (g) =>
          g.id === targetGroup.id
            ? { ...g, leaves: g.leaves.map((l) => (l.id === activeLeaf.id ? { ...l, view } : l)) }
            : g
        ),
        activeGroupId: targetGroup.id,
      };
    }
  }

  const newLeaf: PrototypeWorkspaceLeaf = { kind: "leaf", id: nextTreeId("leaf"), view, pinned: false };
  return {
    root: mapGroups(root, (g) =>
      g.id === targetGroup.id ? { ...g, leaves: [...g.leaves, newLeaf], activeLeafId: newLeaf.id } : g
    ),
    activeGroupId: targetGroup.id,
  };
}

export function closeLeafInTree(
  root: PrototypeWorkspaceNode,
  activeGroupId: string,
  groupId: string,
  leafId: string
): { root: PrototypeWorkspaceNode; activeGroupId: string } {
  const nextRaw = mapGroups(root, (g) => {
    if (g.id !== groupId) return g;
    const idx = g.leaves.findIndex((l) => l.id === leafId);
    if (idx < 0) return g;
    const remaining = g.leaves.filter((l) => l.id !== leafId);
    const nextActive =
      g.activeLeafId === leafId ? remaining[Math.min(idx, remaining.length - 1)]?.id ?? null : g.activeLeafId;
    return { ...g, leaves: remaining, activeLeafId: nextActive };
  });
  const pruned = pruneTree(nextRaw);
  if (!pruned) return makeEmptyGroupFallback(groupId);
  const nextActiveGroupId = findGroup(pruned, activeGroupId) ? activeGroupId : allGroups(pruned)[0]?.id ?? activeGroupId;
  return { root: pruned, activeGroupId: nextActiveGroupId };
}

export function closeLeavesToRightInTree(
  root: PrototypeWorkspaceNode,
  groupId: string,
  leafId: string
): PrototypeWorkspaceNode {
  return mapGroups(root, (g) => {
    if (g.id !== groupId) return g;
    const idx = g.leaves.findIndex((l) => l.id === leafId);
    if (idx < 0) return g;
    const kept = g.leaves.filter((l, i) => i <= idx || l.pinned);
    const activeStill = kept.some((l) => l.id === g.activeLeafId);
    return { ...g, leaves: kept, activeLeafId: activeStill ? g.activeLeafId : kept[kept.length - 1]?.id ?? null };
  });
}

export function closeAllLeavesInTree(
  root: PrototypeWorkspaceNode,
  activeGroupId: string,
  groupId: string
): { root: PrototypeWorkspaceNode; activeGroupId: string } {
  const nextRaw = mapGroups(root, (g) => {
    if (g.id !== groupId) return g;
    const pinned = g.leaves.filter((l) => l.pinned);
    return { ...g, leaves: pinned, activeLeafId: pinned[0]?.id ?? null };
  });
  const pruned = pruneTree(nextRaw);
  if (!pruned) return makeEmptyGroupFallback(groupId);
  const nextActive = findGroup(pruned, activeGroupId) ? activeGroupId : allGroups(pruned)[0]?.id ?? activeGroupId;
  return { root: pruned, activeGroupId: nextActive };
}

export function setActiveLeafInTree(
  root: PrototypeWorkspaceNode,
  groupId: string,
  leafId: string
): PrototypeWorkspaceNode {
  return mapGroups(root, (g) =>
    g.id === groupId && g.leaves.some((l) => l.id === leafId) ? { ...g, activeLeafId: leafId } : g
  );
}

export function togglePinLeafInTree(
  root: PrototypeWorkspaceNode,
  groupId: string,
  leafId: string
): PrototypeWorkspaceNode {
  return mapGroups(root, (g) =>
    g.id === groupId
      ? { ...g, leaves: g.leaves.map((l) => (l.id === leafId ? { ...l, pinned: !l.pinned } : l)) }
      : g
  );
}

export function setSplitSizesInTree(
  root: PrototypeWorkspaceNode,
  splitId: string,
  sizes: number[]
): PrototypeWorkspaceNode {
  if (root.kind === "group") return root;
  if (root.id === splitId) return { ...root, sizes };
  return { ...root, children: root.children.map((c) => setSplitSizesInTree(c, splitId, sizes)) };
}

export function moveLeafInTree(
  root: PrototypeWorkspaceNode,
  activeGroupId: string,
  fromGroupId: string,
  leafId: string,
  toGroupId: string,
  index?: number
): { root: PrototypeWorkspaceNode; activeGroupId: string } {
  const moving = findGroup(root, fromGroupId)?.leaves.find((l) => l.id === leafId);
  if (!moving) return { root, activeGroupId };
  const removed = mapGroups(root, (g) => {
    if (g.id !== fromGroupId) return g;
    const leaves = g.leaves.filter((l) => l.id !== leafId);
    return { ...g, leaves, activeLeafId: g.activeLeafId === leafId ? leaves[0]?.id ?? null : g.activeLeafId };
  });
  const inserted = mapGroups(removed, (g) => {
    if (g.id !== toGroupId) return g;
    const nextLeaves = [...g.leaves];
    const at = index !== undefined ? Math.max(0, Math.min(index, nextLeaves.length)) : nextLeaves.length;
    nextLeaves.splice(at, 0, moving);
    return { ...g, leaves: nextLeaves, activeLeafId: moving.id };
  });
  return { root: pruneTree(inserted) ?? inserted, activeGroupId: toGroupId };
}

export function moveLeafToNewSplitInTree(
  root: PrototypeWorkspaceNode,
  activeGroupId: string,
  fromGroupId: string,
  leafId: string,
  toGroupId: string,
  edge: "left" | "right" | "top" | "bottom"
): { root: PrototypeWorkspaceNode; activeGroupId: string } {
  const moving = findGroup(root, fromGroupId)?.leaves.find((l) => l.id === leafId);
  if (!moving) return { root, activeGroupId };
  const direction: "horizontal" | "vertical" = edge === "left" || edge === "right" ? "horizontal" : "vertical";
  const newGroup: PrototypeWorkspaceGroup = { kind: "group", id: nextTreeId("group"), leaves: [moving], activeLeafId: moving.id };
  const withoutSource = mapGroups(root, (g) => {
    if (g.id !== fromGroupId) return g;
    const leaves = g.leaves.filter((l) => l.id !== leafId);
    return { ...g, leaves, activeLeafId: leaves[0]?.id ?? null };
  });
  function wrapTarget(node: PrototypeWorkspaceNode): PrototypeWorkspaceNode {
    if (node.kind === "group") {
      if (node.id !== toGroupId) return node;
      return {
        kind: "split",
        id: nextTreeId("split"),
        direction,
        children: edge === "left" || edge === "top" ? [newGroup, node] : [node, newGroup],
        sizes: [50, 50],
      };
    }
    return { ...node, children: node.children.map(wrapTarget) };
  }
  const wrapped = wrapTarget(withoutSource);
  return { root: pruneTree(wrapped) ?? wrapped, activeGroupId: newGroup.id };
}

export function renameLeafByNodeIdInTree(
  root: PrototypeWorkspaceNode,
  nodeId: string,
  nextTitle: string
): PrototypeWorkspaceNode {
  return mapGroups(root, (g) => ({
    ...g,
    leaves: g.leaves.map((l) => (l.view.nodeId === nodeId ? { ...l, view: { ...l.view, title: nextTitle } } : l)),
  }));
}

export function closeLeavesByNodeIdInTree(
  root: PrototypeWorkspaceNode,
  activeGroupId: string,
  nodeId: string
): { root: PrototypeWorkspaceNode; activeGroupId: string } {
  const nextRaw = mapGroups(root, (g) => {
    const remaining = g.leaves.filter((l) => l.view.nodeId !== nodeId);
    const activeKept = remaining.some((l) => l.id === g.activeLeafId);
    return { ...g, leaves: remaining, activeLeafId: activeKept ? g.activeLeafId : remaining[0]?.id ?? null };
  });
  const pruned = pruneTree(nextRaw);
  if (!pruned) return makeEmptyGroupFallback();
  const nextActive = findGroup(pruned, activeGroupId) ? activeGroupId : allGroups(pruned)[0]?.id ?? activeGroupId;
  return { root: pruned, activeGroupId: nextActive };
}
