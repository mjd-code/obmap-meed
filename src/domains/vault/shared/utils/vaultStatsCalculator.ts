/**
 * Pure vault graph statistics calculator extracted from VaultManager (TD-003).
 */

export interface VaultStats {
  fileCount: number;
  folderCount: number;
  tagCount: number;
  orphanedNodes: number;
  avgConnections: number;
}

export function calculateVaultStats(graphData: {
  nodes: Array<{ id: string; type?: string; tags?: string[] }>;
  links: Array<{ source: string | { id: string }; target: string | { id: string } }>;
}): VaultStats {
  const files = graphData.nodes.filter((n) => n.type === "file");
  const folders = graphData.nodes.filter((n) => n.type === "folder");

  const allTags = new Set<string>();
  graphData.nodes.forEach((node) =>
    node.tags?.forEach((tag) => allTags.add(tag)),
  );

  const connectedNodes = new Set<string>();
  graphData.links.forEach((link) => {
    const sourceId =
      typeof link.source === "string" ? link.source : link.source.id;
    const targetId =
      typeof link.target === "string" ? link.target : link.target.id;
    connectedNodes.add(sourceId);
    connectedNodes.add(targetId);
  });

  const orphanedNodes = graphData.nodes.filter(
    (n) => !connectedNodes.has(n.id) && n.type === "file",
  ).length;

  const avgConnections =
    graphData.nodes.length > 0
      ? (graphData.links.length * 2) / graphData.nodes.length
      : 0;

  return {
    fileCount: files.length,
    folderCount: folders.length,
    tagCount: allTags.size,
    orphanedNodes,
    avgConnections,
  };
}
