import { Label } from "@/global/ui/label";
import { Switch } from "@/global/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/global/ui/select";
import {
  Shapes,
  Circle,
  Square,
  Diamond,
  Triangle,
  Hexagon,
} from "lucide-react";
import type { NodeConfig } from "@/domains/graph/shared/stores/useGraphStore";
import { CollapsibleSection } from "@/domains/graph/components/GraphCollapsibleSection";

export interface GraphNodeShapeSectionProps {
  config: NodeConfig;
  onUpdate: (updates: Partial<NodeConfig>) => void;
}

/**
 * Collapsible shape-by-format and uniform node shape selector subsection.
 */
export function GraphNodeShapeSection({
  config,
  onUpdate,
}: GraphNodeShapeSectionProps) {
  return (
    <CollapsibleSection
      icon={<Shapes className="w-4 h-4 text-primary" />}
      title="Node Shape by Format"
      defaultOpen={true}
    >
      <div className="space-y-4 p-3 rounded-lg bg-card border border-border">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-sm font-medium">Auto shape by format</Label>
            <p className="text-xs text-muted-foreground">
              Bentuk mewakili format item, warna mewakili hierarki/tags
            </p>
          </div>
          <Switch
            checked={config.autoShapeByFormat ?? true}
            onCheckedChange={(checked) => onUpdate({ autoShapeByFormat: checked })}
          />
        </div>

        {config.autoShapeByFormat ? (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
            <div className="flex items-center gap-2 p-1.5 rounded bg-muted/40">
              <Hexagon className="w-3.5 h-3.5 text-amber-500" />
              <span>Folder: Hexagon</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded bg-muted/40">
              <Circle className="w-3.5 h-3.5 text-primary" />
              <span>Note: Circle</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded bg-muted/40">
              <Square className="w-3.5 h-3.5 text-emerald-500" />
              <span>Image: Square</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded bg-muted/40">
              <Triangle className="w-3.5 h-3.5 text-purple-500" />
              <span>Sound/Voice: Triangle</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded bg-muted/40 col-span-2">
              <Diamond className="w-3.5 h-3.5 text-rose-500" />
              <span>PDF Document: Diamond</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2 pt-2 border-t border-border/50 animate-fade-in">
            <Label className="text-sm font-medium">Uniform Shape</Label>
            <Select
              value={config.shape}
              onValueChange={(value: NodeConfig["shape"]) => onUpdate({ shape: value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="diamond">Diamond</SelectItem>
                <SelectItem value="triangle">Triangle</SelectItem>
                <SelectItem value="hexagon">Hexagon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
