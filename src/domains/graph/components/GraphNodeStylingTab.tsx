/**
 * NodeStylingTab - Node visual configuration with collapsible sections
 */

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
  Circle,
  Eye,
  Sparkles,
  Shapes,
  Square,
  Diamond,
  Triangle,
  Hexagon,
} from "lucide-react";
import type { NodeConfig } from "@/domains/graph/shared/stores/useGraphStore";
import { CollapsibleSection } from "@/domains/graph/components/GraphCollapsibleSection";
import { GraphNodeLabelSection } from "@/domains/graph/components/GraphNodeLabelSection";
import { useGraphNodeStylingController } from "@/domains/graph/shared/hooks/useGraphNodeStylingController";

interface NodeStylingTabProps {
  config: NodeConfig;
  is3D: boolean;
  onUpdate: (updates: Partial<NodeConfig>) => void;
}

export function NodeStylingTab({ config, is3D, onUpdate }: NodeStylingTabProps) {
  const ctrl = useGraphNodeStylingController({ config, onUpdate });

  return (
    <div className="space-y-4">
      {/* Shape Configuration */}
      <CollapsibleSection
        icon={<Shapes className="w-4 h-4 text-primary" />}
        title="Node Shape"
        defaultOpen={true}
      >
        <div className="space-y-4 p-3 rounded-lg bg-card border border-border">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Shape</Label>
            <Select value={config.shape} onValueChange={ctrl.handleShapeChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="circle">
                  <div className="flex items-center gap-2">
                    <Circle className="w-4 h-4" />
                    Circle
                  </div>
                </SelectItem>
                <SelectItem value="square">
                  <div className="flex items-center gap-2">
                    <Square className="w-4 h-4" />
                    Square
                  </div>
                </SelectItem>
                <SelectItem value="diamond">
                  <div className="flex items-center gap-2">
                    <Diamond className="w-4 h-4" />
                    Diamond
                  </div>
                </SelectItem>
                <SelectItem value="triangle">
                  <div className="flex items-center gap-2">
                    <Triangle className="w-4 h-4" />
                    Triangle
                  </div>
                </SelectItem>
                <SelectItem value="hexagon">
                  <div className="flex items-center gap-2">
                    <Hexagon className="w-4 h-4" />
                    Hexagon
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Visual shape for all nodes</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Dimensions & Fidelity */}
      <CollapsibleSection
        icon={<Circle className="w-4 h-4 text-primary" />}
        title="Dimensions & Fidelity"
        defaultOpen={false}
      >
        <div className="space-y-4 p-3 rounded-lg bg-card border border-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Relative Size</Label>
              <Badge variant="outline" className="font-mono text-xs">
                {config.relSize}
              </Badge>
            </div>
            <Slider
              value={[config.relSize]}
              onValueChange={ctrl.handleRelSizeChange}
              min={1}
              max={70}
              step={1}
            />
            <p className="text-xs text-muted-foreground">Base node size (nodeRelSize)</p>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <div>
              <Label className="text-sm font-medium">Size by hierarchy level</Label>
              <p className="text-xs text-muted-foreground">
                Make deeper nodes progressively smaller
              </p>
            </div>
            <Switch
              checked={config.sizeByDepth}
              onCheckedChange={ctrl.handleSizeByDepthChange}
            />
          </div>

          {config.sizeByDepth && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Level size interval</Label>
                <Badge variant="outline" className="font-mono text-xs">
                  {config.depthSizeInterval}px
                </Badge>
              </div>
              <Slider
                value={[config.depthSizeInterval]}
                onValueChange={ctrl.handleDepthIntervalChange}
                min={0.25}
                max={4}
                step={0.25}
              />
            </div>
          )}

          {is3D && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Geometry Resolution</Label>
                <Badge variant="outline" className="font-mono text-xs">
                  {config.resolution}
                </Badge>
              </div>
              <Slider
                value={[config.resolution]}
                onValueChange={ctrl.handleResolutionChange}
                min={4}
                max={32}
                step={2}
              />
              <p className="text-xs text-muted-foreground">
                Sphere segments (higher = smoother, slower)
              </p>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Glow */}
      <CollapsibleSection
        icon={<Sparkles className="w-4 h-4 text-primary" />}
        title="Glow Animation"
        defaultOpen={false}
      >
        <div className="space-y-4 p-3 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Glowing nodes</Label>
              <p className="text-xs text-muted-foreground">
                Soft pulsing halo in each node's color
              </p>
            </div>
            <Switch checked={config.glow} onCheckedChange={ctrl.handleGlowChange} />
          </div>

          {config.glow && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Glow intensity</Label>
                  <Badge variant="outline" className="font-mono text-xs">
                    {config.glowIntensity.toFixed(2)}
                  </Badge>
                </div>
                <Slider
                  value={[config.glowIntensity]}
                  onValueChange={ctrl.handleGlowIntensityChange}
                  min={0.1}
                  max={1}
                  step={0.05}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Pulse speed</Label>
                  <Badge variant="outline" className="font-mono text-xs">
                    {config.glowSpeed === 0 ? "Static" : `${config.glowSpeed.toFixed(1)}x`}
                  </Badge>
                </div>
                <Slider
                  value={[config.glowSpeed]}
                  onValueChange={ctrl.handleGlowSpeedChange}
                  min={0}
                  max={3}
                  step={0.1}
                />
                <p className="text-xs text-muted-foreground">
                  Set to 0 for a steady halo without animation
                </p>
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Visibility & Transparency */}
      <CollapsibleSection
        icon={<Eye className="w-4 h-4 text-primary" />}
        title="Visibility & Transparency"
        defaultOpen={false}
      >
        <div className="space-y-4 p-3 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Node Visibility</Label>
              <p className="text-xs text-muted-foreground">Show/hide all nodes</p>
            </div>
            <Switch checked={config.visible} onCheckedChange={ctrl.handleVisibleChange} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Opacity</Label>
              <Badge variant="outline" className="font-mono text-xs">
                {Math.round(config.opacity * 100)}%
              </Badge>
            </div>
            <Slider
              value={[config.opacity]}
              onValueChange={ctrl.handleOpacityChange}
              min={0.1}
              max={1}
              step={0.05}
            />
          </div>
        </div>
      </CollapsibleSection>

      <GraphNodeLabelSection
        config={config}
        hierarchy={ctrl.hierarchy}
        onUpdate={onUpdate}
        onHierarchyUpdate={ctrl.updateHierarchyConfig}
      />
    </div>
  );
}
