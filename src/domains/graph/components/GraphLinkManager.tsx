import { Button } from "@/global/ui/button";
import { Input } from "@/global/ui/input";
import { Badge } from "@/global/ui/badge";
import { ScrollArea } from "@/global/ui/scroll-area";
import { Trash2, GitBranch, Link2Off, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/global/ui/card";
import { Separator } from "@/global/ui/separator";
import {
  useGraphLinkManagerController,
  type LinkManagerNode,
  type LinkManagerEdge,
} from "@/domains/graph/shared/hooks/useGraphLinkManagerController";

type Node = LinkManagerNode;
type Link = LinkManagerEdge;

interface LinkManagerProps {
  nodes: Node[];
  links: Link[];
  onUpdateLinks: (links: Link[]) => void;
  onAutoLink: () => void;
}

export const LinkManager = ({ nodes, links, onUpdateLinks, onAutoLink }: LinkManagerProps) => {
  const ctrl = useGraphLinkManagerController({ nodes, links, onUpdateLinks });

  const renderLinkRow = (link: Link, idx: number, isCustom = false) => {
    const sourceId = ctrl.getLinkSourceId(link);
    const targetId = ctrl.getLinkTargetId(link);
    const sourceNode = ctrl.getNodeById(sourceId);
    const targetNode = ctrl.getNodeById(targetId);

    return (
      <div
        key={`${isCustom ? "custom" : "hierarchy"}-${idx}`}
        className={
          isCustom
            ? "flex items-center justify-between p-3 bg-accent/10 rounded-lg border border-accent/20 hover:bg-accent/20 transition-colors"
            : "flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
        }
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs text-muted-foreground">
            {sourceNode?.type === "folder" ? "📁" : "📄"}
          </span>
          <span className="text-sm font-medium truncate">
            {sourceNode?.name || "Unknown"}
          </span>
          <span className="text-xs text-muted-foreground">→</span>
          <span className="text-xs text-muted-foreground">
            {targetNode?.type === "folder" ? "📁" : "📄"}
          </span>
          <span className="text-sm truncate">{targetNode?.name || "Unknown"}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => ctrl.handleDeleteLink(link)}
          className="hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    );
  };

  return (
    <Card className="w-full h-full flex flex-col bg-card border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">Link Manager</CardTitle>
            <CardDescription>Monitor and manage node connections</CardDescription>
          </div>
          <Badge variant="secondary" className="text-sm">
            {links.length} total
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={onAutoLink}
            variant="default"
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Auto-link Hierarchy
          </Button>
          <Button onClick={ctrl.handleRemoveOrphans} variant="outline" size="sm">
            <Link2Off className="w-4 h-4 mr-2" />
            Remove Orphans
          </Button>
          <Button onClick={ctrl.handleRemoveDuplicates} variant="outline" size="sm">
            <GitBranch className="w-4 h-4 mr-2" />
            Remove Duplicates
          </Button>
        </div>

        <Input
          placeholder="Search links..."
          value={ctrl.searchQuery}
          onChange={(e) => ctrl.setSearchQuery(e.target.value)}
          className="bg-secondary border-border"
        />

        <ScrollArea className="flex-1">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Card className="p-3 bg-secondary/50">
                <p className="text-xs text-muted-foreground">Hierarchy</p>
                <p className="text-2xl font-bold text-primary">{ctrl.hierarchyLinks.length}</p>
              </Card>
              <Card className="p-3 bg-secondary/50">
                <p className="text-xs text-muted-foreground">Custom</p>
                <p className="text-2xl font-bold text-accent">{ctrl.customLinks.length}</p>
              </Card>
              <Card className="p-3 bg-secondary/50">
                <p className="text-xs text-muted-foreground">Orphaned</p>
                <p className="text-2xl font-bold text-destructive">{ctrl.orphanedLinks.length}</p>
              </Card>
            </div>

            {ctrl.hierarchyLinks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-foreground">Hierarchy Links</h3>
                  <Badge variant="secondary" className="text-xs">
                    {ctrl.hierarchyLinks.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {ctrl.hierarchyLinks.map((link, idx) => renderLinkRow(link, idx, false))}
                </div>
              </div>
            )}

            {ctrl.hierarchyLinks.length > 0 && ctrl.customLinks.length > 0 && <Separator />}

            {ctrl.customLinks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-foreground">Custom Links</h3>
                  <Badge variant="secondary" className="text-xs">
                    {ctrl.customLinks.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {ctrl.customLinks.map((link, idx) => renderLinkRow(link, idx, true))}
                </div>
              </div>
            )}

            {ctrl.filteredLinks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <GitBranch className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No links found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
