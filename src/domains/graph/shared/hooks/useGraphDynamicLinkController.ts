import { useState, useMemo } from "react";
import { toast } from "sonner";

export interface DynamicLinkNode {
  id: string;
  name: string;
  content: string;
  type: "folder" | "file" | "media" | "pdf";
  parentId: string | null;
  depth: number;
  tags: string[];
  wikilinks?: string[];
  mediaType?: "image" | "audio" | "video" | "pdf";
}

export interface DynamicLinkItem {
  source: string | DynamicLinkNode;
  target: string | DynamicLinkNode;
  type?: "hierarchy" | "tag" | "backlink" | "semantic" | "custom";
}

export interface MetadataRule {
  id: string;
  name: string;
  condition: "tag-contains" | "name-pattern" | "content-keyword";
  value: string;
}

export interface UseGraphDynamicLinkControllerProps {
  nodes: DynamicLinkNode[];
  baseLinks: DynamicLinkItem[];
  onLinksUpdate: (links: DynamicLinkItem[]) => void;
}

export function useGraphDynamicLinkController({
  nodes,
  onLinksUpdate,
}: UseGraphDynamicLinkControllerProps) {
  const [enabledLayers, setEnabledLayers] = useState({
    hierarchy: true,
    tags: false,
    backlinks: false,
    custom: false,
  });

  const [tagThreshold, setTagThreshold] = useState(2);
  const [metadataRules, setMetadataRules] = useState<MetadataRule[]>([]);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleCondition, setNewRuleCondition] =
    useState<MetadataRule["condition"]>("tag-contains");
  const [newRuleValue, setNewRuleValue] = useState("");

  const hierarchyLinks = useMemo((): DynamicLinkItem[] => {
    if (!enabledLayers.hierarchy) return [];

    const links: DynamicLinkItem[] = [];
    nodes.forEach((node) => {
      if (node.parentId) {
        links.push({
          source: node.parentId,
          target: node.id,
          type: "hierarchy",
        });
      }
    });
    return links;
  }, [nodes, enabledLayers.hierarchy]);

  const tagLinks = useMemo((): DynamicLinkItem[] => {
    if (!enabledLayers.tags) return [];

    const links: DynamicLinkItem[] = [];
    const linkSet = new Set<string>();

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];

        const sharedTags = nodeA.tags.filter((tag) => nodeB.tags.includes(tag));

        if (sharedTags.length >= tagThreshold) {
          const linkKey = `${nodeA.id}-${nodeB.id}`;
          if (!linkSet.has(linkKey)) {
            links.push({
              source: nodeA.id,
              target: nodeB.id,
              type: "tag",
            });
            linkSet.add(linkKey);
          }
        }
      }
    }

    return links;
  }, [nodes, enabledLayers.tags, tagThreshold]);

  const backlinkLinks = useMemo((): DynamicLinkItem[] => {
    if (!enabledLayers.backlinks) return [];

    const links: DynamicLinkItem[] = [];
    const linkSet = new Set<string>();

    nodes.forEach((node) => {
      if (node.wikilinks && node.wikilinks.length > 0) {
        node.wikilinks.forEach((wikilinkName) => {
          const targetNode = nodes.find(
            (n) => n.name.toLowerCase() === wikilinkName.toLowerCase() && n.type === "file",
          );

          if (targetNode) {
            const linkKey = `${node.id}-${targetNode.id}`;
            const reverseLinkKey = `${targetNode.id}-${node.id}`;

            if (!linkSet.has(linkKey) && !linkSet.has(reverseLinkKey)) {
              links.push({
                source: node.id,
                target: targetNode.id,
                type: "backlink",
              });
              linkSet.add(linkKey);
            }
          }
        });
      }
    });

    return links;
  }, [nodes, enabledLayers.backlinks]);

  const customLinks = useMemo((): DynamicLinkItem[] => {
    if (!enabledLayers.custom || metadataRules.length === 0) return [];

    const links: DynamicLinkItem[] = [];
    const linkSet = new Set<string>();

    metadataRules.forEach((rule) => {
      const matchingNodes = nodes.filter((node) => {
        switch (rule.condition) {
          case "tag-contains":
            return node.tags.some((tag) => tag.toLowerCase().includes(rule.value.toLowerCase()));
          case "name-pattern":
            return node.name.toLowerCase().includes(rule.value.toLowerCase());
          case "content-keyword":
            return node.content.toLowerCase().includes(rule.value.toLowerCase());
          default:
            return false;
        }
      });

      for (let i = 0; i < matchingNodes.length; i++) {
        for (let j = i + 1; j < matchingNodes.length; j++) {
          const linkKey = `${matchingNodes[i].id}-${matchingNodes[j].id}`;
          const reverseLinkKey = `${matchingNodes[j].id}-${matchingNodes[i].id}`;

          if (!linkSet.has(linkKey) && !linkSet.has(reverseLinkKey)) {
            links.push({
              source: matchingNodes[i].id,
              target: matchingNodes[j].id,
              type: "custom",
            });
            linkSet.add(linkKey);
          }
        }
      }
    });

    return links;
  }, [nodes, enabledLayers.custom, metadataRules]);

  const allLinks = useMemo(() => {
    const merged = [...hierarchyLinks, ...tagLinks, ...backlinkLinks, ...customLinks];
    const uniqueLinks = new Map<string, DynamicLinkItem>();

    merged.forEach((link) => {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;
      const key = `${sourceId}-${targetId}`;
      const reverseKey = `${targetId}-${sourceId}`;

      if (!uniqueLinks.has(key) && !uniqueLinks.has(reverseKey)) {
        uniqueLinks.set(key, link);
      }
    });

    return Array.from(uniqueLinks.values());
  }, [hierarchyLinks, tagLinks, backlinkLinks, customLinks]);

  const handleApplyLinks = () => {
    onLinksUpdate(allLinks);
    toast.success(`Applied ${allLinks.length} dynamic links`);
  };

  const handleAddRule = () => {
    if (!newRuleName.trim() || !newRuleValue.trim()) {
      toast.error("Please fill in rule name and value");
      return;
    }

    const newRule: MetadataRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName,
      condition: newRuleCondition,
      value: newRuleValue,
    };

    setMetadataRules([...metadataRules, newRule]);
    setNewRuleName("");
    setNewRuleValue("");
    toast.success("Rule added!");
  };

  const handleDeleteRule = (ruleId: string) => {
    setMetadataRules(metadataRules.filter((r) => r.id !== ruleId));
    toast.success("Rule deleted");
  };

  const toggleLayer = (layer: keyof typeof enabledLayers) => {
    setEnabledLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  const getLinkTypeColor = (type: DynamicLinkItem["type"]) => {
    switch (type) {
      case "hierarchy":
        return "hsl(var(--primary))";
      case "tag":
        return "hsl(var(--accent))";
      case "backlink":
        return "hsl(var(--secondary))";
      case "custom":
        return "hsl(var(--destructive))";
      default:
        return "hsl(var(--muted))";
    }
  };

  return {
    enabledLayers,
    tagThreshold,
    setTagThreshold,
    metadataRules,
    newRuleName,
    setNewRuleName,
    newRuleCondition,
    setNewRuleCondition,
    newRuleValue,
    setNewRuleValue,
    hierarchyLinks,
    tagLinks,
    backlinkLinks,
    customLinks,
    allLinks,
    handleApplyLinks,
    handleAddRule,
    handleDeleteRule,
    toggleLayer,
    getLinkTypeColor,
  };
}
