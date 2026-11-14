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
import {
  Type,
  Shapes,
  Circle,
  Square,
  Diamond,
  Triangle,
  Hexagon,
  Palette,
  Sparkles,
  GitBranch,
} from "lucide-react";
import type { NodeConfig, HierarchyColorConfig } from "@/domains/graph/shared/stores/useGraphStore";
import { ColorPicker } from "@/domains/graph/components/GraphColorPicker";
import { ColorEngineControls } from "@/domains/graph/components/GraphColorEngineControls";
import { CollapsibleSection } from "@/domains/graph/components/GraphCollapsibleSection";

interface GraphNodeLabelSectionProps {
  config: NodeConfig;
  hierarchy: HierarchyColorConfig;
  onUpdate: (updates: Partial<NodeConfig>) => void;
  onHierarchyUpdate: (updates: Partial<HierarchyColorConfig>) => void;
}

export function GraphNodeLabelSection({
  config,
  hierarchy,
  onUpdate,
  onHierarchyUpdate,
}: GraphNodeLabelSectionProps) {
  return (
    <>
      {/* Color Management */}
      <CollapsibleSection
        icon={<Palette className="w-4 h-4 text-primary" />}
        title="Color Management"
        defaultOpen={false}
      >
        <div className="p-3 rounded-lg bg-card border border-border">
          <ColorEngineControls
            hierarchy={hierarchy}
            nodeConfig={config}
            onHierarchyUpdate={onHierarchyUpdate}
            onNodeConfigUpdate={onUpdate}
          />
        </div>

        <div className="space-y-4 p-3 rounded-lg bg-card border border-border">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Auto-Color By</Label>
            <Select
              value={config.autoColorBy}
              onValueChange={(autoColorBy: NodeConfig["autoColorBy"]) =>
                onUpdate({ autoColorBy })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted" />
                    Manual Colors
                  </div>
                </SelectItem>
                <SelectItem value="type">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    Node Type (file/folder)
                  </div>
                </SelectItem>
                <SelectItem value="depth">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    Depth Level
                  </div>
                </SelectItem>
                <SelectItem value="branch">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-3 h-3" />
                    Branch (Inheritance)
                  </div>
                </SelectItem>
                <SelectItem value="tags">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    First Tag
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <ColorPicker
              label="Folder Color"
              value={config.folderColor}
              onChange={(color) => onUpdate({ folderColor: color })}
            />
            <ColorPicker
              label="File Color"
              value={config.fileColor}
              onChange={(color) => onUpdate({ fileColor: color })}
            />
            <ColorPicker
              label="Selected Color"
              value={config.selectedColor}
              onChange={(color) => onUpdate({ selectedColor: color })}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Labels Configuration */}
      <CollapsibleSection
        icon={<Type className="w-4 h-4 text-primary" />}
        title="Label Configuration"
        defaultOpen={false}
      >
        <div className="space-y-4 p-3 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Show Labels</Label>
              <p className="text-xs text-muted-foreground">Display node names</p>
            </div>
            <Switch
              checked={config.showLabels}
              onCheckedChange={(checked) => onUpdate({ showLabels: checked })}
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

      {/* Auto Shape Format Configuration */}
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
    </>
  );
}
