import { useState } from "react";
import { toast } from "sonner";

export interface LinkManagerNode {
  id: string;
  name: string;
  type: "folder" | "file" | "media" | "pdf";
  parentId: string | null;
  depth: number;
  mediaType?: "image" | "audio" | "video" | "pdf";
}

export interface LinkManagerEdge {
  source: string | LinkManagerNode;
  target: string | LinkManagerNode;
  type?: "hierarchy" | "tag" | "backlink" | "semantic" | "custom";
}

export interface UseGraphLinkManagerControllerProps {
  nodes: LinkManagerNode[];
  links: LinkManagerEdge[];
  onUpdateLinks: (links: LinkManagerEdge[]) => void;
}

export function useGraphLinkManagerController({
  nodes,
  links,
  onUpdateLinks,
}: UseGraphLinkManagerControllerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const getNodeById = (id: string) => nodes.find((n) => n.id === id);

  const getLinkSourceId = (link: LinkManagerEdge): string => {
    return typeof link.source === "string" ? link.source : link.source.id;
  };

  const getLinkTargetId = (link: LinkManagerEdge): string => {
    return typeof link.target === "string" ? link.target : link.target.id;
  };

  const handleDeleteLink = (link: LinkManagerEdge) => {
    const sourceId = getLinkSourceId(link);
    const targetId = getLinkTargetId(link);

    const newLinks = links.filter((l) => {
      const lSourceId = getLinkSourceId(l);
      const lTargetId = getLinkTargetId(l);
      return !(lSourceId === sourceId && lTargetId === targetId);
    });

    onUpdateLinks(newLinks);
    toast.success("Link removed");
  };

  const handleRemoveOrphans = () => {
    const validNodeIds = new Set(nodes.map((n) => n.id));
    const validLinks = links.filter((link) => {
      const sourceId = getLinkSourceId(link);
      const targetId = getLinkTargetId(link);
      return validNodeIds.has(sourceId) && validNodeIds.has(targetId);
    });

    const removed = links.length - validLinks.length;
    if (removed > 0) {
      onUpdateLinks(validLinks);
      toast.success(`Removed ${removed} orphaned link(s)`);
    } else {
      toast.info("No orphaned links found");
    }
  };

  const handleRemoveDuplicates = () => {
    const seen = new Set<string>();
    const uniqueLinks = links.filter((link) => {
      const sourceId = getLinkSourceId(link);
      const targetId = getLinkTargetId(link);
      const key = `${sourceId}-${targetId}`;

      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    const removed = links.length - uniqueLinks.length;
    if (removed > 0) {
      onUpdateLinks(uniqueLinks);
      toast.success(`Removed ${removed} duplicate link(s)`);
    } else {
      toast.info("No duplicate links found");
    }
  };

  const filteredLinks = links.filter((link) => {
    if (!searchQuery) return true;

    const sourceId = getLinkSourceId(link);
    const targetId = getLinkTargetId(link);
    const sourceNode = getNodeById(sourceId);
    const targetNode = getNodeById(targetId);

    const query = searchQuery.toLowerCase();
    return (
      sourceNode?.name.toLowerCase().includes(query) ||
      targetNode?.name.toLowerCase().includes(query)
    );
  });

  const hierarchyLinks = filteredLinks.filter((link) => {
    const sourceId = getLinkSourceId(link);
    const targetId = getLinkTargetId(link);
    const targetNode = getNodeById(targetId);
    return targetNode?.parentId === sourceId;
  });

  const customLinks = filteredLinks.filter((link) => {
    const sourceId = getLinkSourceId(link);
    const targetId = getLinkTargetId(link);
    const targetNode = getNodeById(targetId);
    return targetNode?.parentId !== sourceId;
  });

  const orphanedLinks = links.filter((link) => {
    const sourceId = getLinkSourceId(link);
    const targetId = getLinkTargetId(link);
    return !getNodeById(sourceId) || !getNodeById(targetId);
  });

  return {
    searchQuery,
    setSearchQuery,
    getNodeById,
    getLinkSourceId,
    getLinkTargetId,
    handleDeleteLink,
    handleRemoveOrphans,
    handleRemoveDuplicates,
    filteredLinks,
    hierarchyLinks,
    customLinks,
    orphanedLinks,
  };
}
