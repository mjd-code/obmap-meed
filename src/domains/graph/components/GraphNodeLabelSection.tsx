import { Label } from "@/global/ui/label";
import { Slider } from "@/global/ui/slider-number";
import { Switch } from "@/global/ui/switch";
import { Badge } from "@/global/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/global/ui/select";
import { Type } from "lucide-react";
import type { NodeConfig, HierarchyColorConfig } from "@/domains/graph/shared/stores/useGraphStore";
import { ColorPicker } from "@/domains/graph/components/GraphColorPicker";
import { CollapsibleSection } from "@/domains/graph/components/GraphCollapsibleSection";
import { GraphNodeColorSection } from "@/domains/graph/components/GraphNodeColorSection";
import { GraphLabelPositionControl } from "@/domains/graph/components/GraphLabelPositionControl";
import { GraphNodeShapeSection } from "@/domains/graph/components/GraphNodeShapeSection";
import { useGraphEngineStore } from "@/domains/graph/shared/stores/useGraphEngineStore";

export interface GraphNodeLabelSectionProps {
  config: NodeConfig;
  hierarchy: HierarchyColorConfig;
  onUpdate: (updates: Partial<NodeConfig>) => void;
  onHierarchyUpdate: (updates: Partial<HierarchyColorConfig>) => void;
}

/**
 * Pure declarative configuration view for graph node colors, text labels, and shapes.
 */
export function GraphNodeLabelSection({
  config,
  hierarchy,
  onUpdate,
  onHierarchyUpdate,
}: GraphNodeLabelSectionProps) {
  const engineShowLabels = useGraphEngineStore((s) => s.showLabels);
  const effectiveShowLabels = engineShowLabels && config.showLabels;
  const applyShowLabels = (showLabels: boolean, labelBox: boolean) => {
    if (showLabels && !useGraphEngineStore.getState().showLabels) {
      useGraphEngineStore.getState().patch({ showLabels: true });
    }
    onUpdate({ showLabels, labelBox });
  };

  return (
    <>
      <GraphNodeColorSection
        config={config}
        hierarchy={hierarchy}
        onUpdate={onUpdate}
        onHierarchyUpdate={onHierarchyUpdate}
      />

      {/* Labels Configuration */}
      <CollapsibleSection
        icon={<Type className="w-4 h-4 text-primary" />}
        title="Label Configuration"
        defaultOpen={false}
      >
        <div className="space-y-4 p-3 rounded-lg bg-card border border-border">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Node Display Mode</Label>
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-border/60 bg-muted/40 p-1">
              {[
                {
                  id: "nodes",
                  label: "Only Node",
                  active: !effectiveShowLabels,
                  apply: () => applyShowLabels(false, false),
                },
                {
                  id: "labels",
                  label: "With Text",
                  active: effectiveShowLabels && !config.labelBox,
                  apply: () => applyShowLabels(true, false),
                },
                {
                  id: "boxes",
                  label: "With Label + Text",
                  active: effectiveShowLabels && config.labelBox,
                  apply: () => applyShowLabels(true, true),
                },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={mode.apply}
                  className={`py-1 px-1.5 vk-text-xs font-medium rounded transition-all truncate ${
                    mode.active
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <GraphLabelPositionControl
            value={config.labelPosition ?? "auto"}
            onChange={(labelPosition) => onUpdate({ labelPosition })}
          />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Show Labels</Label>
              <p className="text-xs text-muted-foreground">Display node names</p>
            </div>
            <Switch
              checked={effectiveShowLabels}
              onCheckedChange={(checked) => {
                if (checked && !useGraphEngineStore.getState().showLabels) {
                  useGraphEngineStore.getState().patch({ showLabels: true });
                }
                onUpdate({ showLabels: checked, ...(checked ? {} : { labelBox: false }) });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Label Source Field</Label>
            <Select
              value={config.labelField}
              onValueChange={(value: NodeConfig["labelField"]) =>
                onUpdate({ labelField: value })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Node Name</SelectItem>
                <SelectItem value="id">Node ID</SelectItem>
                <SelectItem value="custom">Custom Field</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Label Size</Label>
              <Badge variant="outline" className="font-mono text-xs">
                {config.labelSize}px
              </Badge>
            </div>
            <Slider
              value={[config.labelSize]}
              onValueChange={([value]) => onUpdate({ labelSize: value })}
              min={8}
              max={32}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Font Style</Label>
            <Select
              value={config.labelFontStyle}
              onValueChange={(value: NodeConfig["labelFontStyle"]) =>
                onUpdate({ labelFontStyle: value })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="bold">
                  <span className="font-bold">Bold</span>
                </SelectItem>
                <SelectItem value="italic">
                  <span className="italic">Italic</span>
                </SelectItem>
                <SelectItem value="bold-italic">
                  <span className="font-bold italic">Bold Italic</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ColorPicker
            label="Label Text Color"
            value={config.labelColor}
            onChange={(color) => onUpdate({ labelColor: color })}
          />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Label Box</Label>
              <p className="text-xs text-muted-foreground">Off shows only the node shape</p>
            </div>
            <Switch
              checked={config.labelBox}
              onCheckedChange={(checked) => onUpdate({ labelBox: checked })}
            />
          </div>

          {config.labelBox && (
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Label Background</Label>
                <p className="text-xs text-muted-foreground">Show background behind text</p>
              </div>
              <Switch
                checked={config.labelBackground}
                onCheckedChange={(checked) => onUpdate({ labelBackground: checked })}
              />
            </div>
          )}

          {config.labelBox && config.labelBackground && (
            <ColorPicker
              label="Background Color"
              value={config.labelBackgroundColor}
              onChange={(color) => onUpdate({ labelBackgroundColor: color })}
            />
          )}
        </div>
      </CollapsibleSection>

      <GraphNodeShapeSection config={config} onUpdate={onUpdate} />
    </>
  );
}
