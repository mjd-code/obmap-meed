import type { PrototypeEditorFile } from "../types";
import type {
  PrototypeViewState,
  PrototypeWorkspaceGroup,
  PrototypeWorkspaceNode,
} from "./prototypeStateTypes";

let idCounter = 100;

export function nextTreeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function resetWorkspaceTreeIdsForTest(start = 100): void {
  idCounter = start;
}

export function createInitialWorkspaceTree(
  initialFile: PrototypeEditorFile
): { root: PrototypeWorkspaceGroup; activeGroupId: string } {
  const leafId = "leaf-initial-1";
  const groupId = "group-main-1";
  return {
    root: {
      kind: "group",
      id: groupId,
      leaves: [
        {
          kind: "leaf",
          id: leafId,
          view: { type: "markdown", nodeId: initialFile.id, title: initialFile.name },
          pinned: false,
        },
      ],
      activeLeafId: leafId,
    },
    activeGroupId: groupId,
  };
}

export function allGroups(node: PrototypeWorkspaceNode): PrototypeWorkspaceGroup[] {
  if (node.kind === "group") return [node];
  return node.children.flatMap(allGroups);
}

export function findGroup(
  node: PrototypeWorkspaceNode,
  groupId: string
): PrototypeWorkspaceGroup | null {
  if (node.kind === "group") return node.id === groupId ? node : null;
  for (const child of node.children) {
    const found = findGroup(child, groupId);
    if (found) return found;
  }
  return null;
}

export function findLeafGroup(
  node: PrototypeWorkspaceNode,
  leafId: string
): PrototypeWorkspaceGroup | null {
  if (node.kind === "group") {
    return node.leaves.some((leaf) => leaf.id === leafId) ? node : null;
  }
  for (const child of node.children) {
    const found = findLeafGroup(child, leafId);
    if (found) return found;
  }
  return null;
}

export function pruneTree(node: PrototypeWorkspaceNode): PrototypeWorkspaceNode | null {
  if (node.kind === "group") {
    return node.leaves.length > 0 ? node : null;
  }
  const surviving: PrototypeWorkspaceNode[] = [];
  const survivingSizes: number[] = [];
  node.children.forEach((child, idx) => {
    const pruned = pruneTree(child);
    if (pruned) {
      surviving.push(pruned);
      survivingSizes.push(node.sizes[idx] ?? 50);
    }
  });
  if (surviving.length === 0) return null;
  if (surviving.length === 1) return surviving[0];
  const sum = survivingSizes.reduce((acc, s) => acc + s, 0) || 100;
  return {
    ...node,
    children: surviving,
    sizes: survivingSizes.map((s) => Number(((s / sum) * 100).toFixed(2))),
  };
}

export function mapGroups(
  node: PrototypeWorkspaceNode,
  fn: (group: PrototypeWorkspaceGroup) => PrototypeWorkspaceGroup
): PrototypeWorkspaceNode {
  if (node.kind === "group") return fn(node);
  return { ...node, children: node.children.map((child) => mapGroups(child, fn)) };
}

export function sameViewTarget(a: PrototypeViewState, b: PrototypeViewState): boolean {
  if (a.type !== b.type) return false;
  if (a.nodeId || b.nodeId) return a.nodeId === b.nodeId;
  return a.title === b.title;
}

export function makeEmptyGroupFallback(groupId?: string): {
  root: PrototypeWorkspaceGroup;
  activeGroupId: string;
} {
  const leafId = nextTreeId("leaf");
  const resolvedGroupId = groupId ?? nextTreeId("group");
  return {
    root: {
      kind: "group",
      id: resolvedGroupId,
      leaves: [{ kind: "leaf", id: leafId, view: { type: "empty", title: "New Tab" } }],
      activeLeafId: leafId,
    },
    activeGroupId: resolvedGroupId,
  };
}

export function buildNewEditorFileRecord(
  folder: string,
  name: string | undefined,
  vaultId: string,
  indexHint: number
): PrototypeEditorFile {
  const cleanName = (name?.trim() || `catatan-baru-${indexHint}`).replace(/\.md$/i, "");
  return {
    id: `file-${Date.now()}`,
    name: `${cleanName}.md`,
    folder: folder || "01-Fondasi",
    vaultId,
    status: "seedling",
    visibility: "private",
    svgKind: "mindmap",
    tags: ["draft"],
    keyword: "Catatan Baru",
    backlinks: [],
    yaml: { epistemic_status: "seedling", visibility: "private" },
    content: `# ${cleanName}\n\nMulai menulis pengetahuan atomik di sini.`,
  };
}
