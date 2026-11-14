import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/global/ui/card";
import { Checkbox } from "@/global/ui/checkbox";
import { Label } from "@/global/ui/label";
import { Slider } from "@/global/ui/slider-number";
import { Input } from "@/global/ui/input";
import { Button } from "@/global/ui/button";
import { Badge } from "@/global/ui/badge";
import { Separator } from "@/global/ui/separator";
import { Network, GitBranch, Hash, Link2, Sparkles, Plus, Trash2 } from "lucide-react";
import {
  useGraphDynamicLinkController,
  type DynamicLinkNode,
  type DynamicLinkItem,
  type MetadataRule,
} from "@/domains/graph/shared/hooks/useGraphDynamicLinkController";

type Node = DynamicLinkNode;
type Link = DynamicLinkItem;

interface DynamicLinkManagerProps {
  nodes: Node[];
  baseLinks: Link[];
  onLinksUpdate: (links: Link[]) => void;
}

export const DynamicLinkManager = ({
  nodes,
  baseLinks,
  onLinksUpdate,
}: DynamicLinkManagerProps) => {
  const ctrl = useGraphDynamicLinkController({ nodes, baseLinks, onLinksUpdate });

  return (
    <Card className="border-border shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="w-5 h-5" />
          Dynamic Link Layers
        </CardTitle>
        <CardDescription>
          Enable multiple link types to visualize different relationships
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Layer toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                id="hierarchy"
                checked={ctrl.enabledLayers.hierarchy}
                onCheckedChange={() => ctrl.toggleLayer("hierarchy")}
              />
              <Label htmlFor="hierarchy" className="flex items-center gap-2 cursor-pointer">
                <GitBranch
                  className="w-4 h-4"
                  style={{ color: ctrl.getLinkTypeColor("hierarchy") }}
                />
                Hierarchy Links
              </Label>
            </div>
            <Badge variant="secondary">{ctrl.hierarchyLinks.length}</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="tags"
                  checked={ctrl.enabledLayers.tags}
                  onCheckedChange={() => ctrl.toggleLayer("tags")}
                />
                <Label htmlFor="tags" className="flex items-center gap-2 cursor-pointer">
                  <Hash className="w-4 h-4" style={{ color: ctrl.getLinkTypeColor("tag") }} />
                  Tag-based Links
                </Label>
              </div>
              <Badge variant="secondary">{ctrl.tagLinks.length}</Badge>
            </div>
            {ctrl.enabledLayers.tags && (
              <div className="ml-10 space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Minimum shared tags: {ctrl.tagThreshold}
                </Label>
                <Slider
                  value={[ctrl.tagThreshold]}
                  onValueChange={(value) => ctrl.setTagThreshold(value[0])}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                id="backlinks"
                checked={ctrl.enabledLayers.backlinks}
                onCheckedChange={() => ctrl.toggleLayer("backlinks")}
              />
              <Label htmlFor="backlinks" className="flex items-center gap-2 cursor-pointer">
                <Link2 className="w-4 h-4" style={{ color: ctrl.getLinkTypeColor("backlink") }} />
                Backlinks (Wikilinks)
              </Label>
            </div>
            <Badge variant="secondary">{ctrl.backlinkLinks.length}</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="custom"
                  checked={ctrl.enabledLayers.custom}
                  onCheckedChange={() => ctrl.toggleLayer("custom")}
                />
                <Label htmlFor="custom" className="flex items-center gap-2 cursor-pointer">
                  <Sparkles
                    className="w-4 h-4"
                    style={{ color: ctrl.getLinkTypeColor("custom") }}
                  />
                  Custom Rules
                </Label>
              </div>
              <Badge variant="secondary">{ctrl.customLinks.length}</Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Custom Rules Builder */}
        {ctrl.enabledLayers.custom && (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Add Metadata Rule</Label>
              <Input
                placeholder="Rule name..."
                value={ctrl.newRuleName}
                onChange={(e) => ctrl.setNewRuleName(e.target.value)}
                className="bg-secondary"
              />
              <select
                value={ctrl.newRuleCondition}
                onChange={(e) =>
                  ctrl.setNewRuleCondition(e.target.value as MetadataRule["condition"])
                }
                className="w-full px-3 py-2 rounded-md bg-secondary border border-border"
              >
                <option value="tag-contains">Tag contains</option>
                <option value="name-pattern">Name matches pattern</option>
                <option value="content-keyword">Content contains keyword</option>
              </select>
              <Input
                placeholder="Value to match..."
                value={ctrl.newRuleValue}
                onChange={(e) => ctrl.setNewRuleValue(e.target.value)}
                className="bg-secondary"
              />
              <Button onClick={ctrl.handleAddRule} className="w-full" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </div>

            {ctrl.metadataRules.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Active Rules</Label>
                {ctrl.metadataRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-2 rounded-md bg-secondary/50 border border-border"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {rule.condition.replace("-", " ")}: "{rule.value}"
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => ctrl.handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Summary and Apply */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Dynamic Links:</span>
            <Badge variant="default" className="text-base px-3 py-1">
              {ctrl.allLinks.length}
            </Badge>
          </div>

          <Button onClick={ctrl.handleApplyLinks} className="w-full" size="lg">
            <Network className="w-4 h-4 mr-2" />
            Apply Link Layers
          </Button>
        </div>

        {/* Legend */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Link Type Colors</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["hierarchy", "tag", "backlink", "custom"] as const).map((t) => (
              <div key={t} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: ctrl.getLinkTypeColor(t) }}
                />
                <span className="capitalize">{t === "tag" ? "Tag-based" : `${t}s`}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
