/**
 * LinkStylingTab - Combined link/edge configuration with topology settings
 */

import { Label } from "@/global/ui/label";
import { Slider } from "@/global/ui/slider-number";
import { Switch } from "@/global/ui/switch";
import { Badge } from "@/global/ui/badge";
import { Link2, MoveRight, Sparkles, GitBranch, Tags } from "lucide-react";
import type { LinkConfig, TopologyConfig, LinkStyle } from "@/domains/graph/shared/stores/useGraphStore";
import { ColorPicker } from "@/domains/graph/components/GraphColorPicker";
import { CollapsibleSection } from "@/domains/graph/components/GraphCollapsibleSection";
import { GraphLinkTypeStyleCards } from "@/domains/graph/components/GraphLinkTypeStyleCards";
import { useGraphLinkStylingController } from "@/domains/graph/shared/hooks/useGraphLinkStylingController";

interface LinkStylingTabProps {
  config: LinkConfig;
  topologyConfig: TopologyConfig;
  is3D: boolean;
  onUpdate: (updates: Partial<LinkConfig>) => void;
  onTopologyUpdate: (updates: Partial<TopologyConfig>) => void;
  onTopologyStyleUpdate: (
    linkType: keyof TopologyConfig["styles"],
    updates: Partial<LinkStyle>,
  ) => void;
}

export function LinkStylingTab({
  config,
  topologyConfig,
  onUpdate,
  onTopologyUpdate,
  onTopologyStyleUpdate,
}: LinkStylingTabProps) {
  const ctrl = useGraphLinkStylingController({
    config,
    topologyConfig,
    onUpdate,
    onTopologyUpdate,
    onTopologyStyleUpdate,
  });

  return (
    <div className="space-y-4">
      {/* Link Types (Topology) */}
      <CollapsibleSection
        icon={<GitBranch className="w-4 h-4 text-primary" />}
        title="Link Types"
        defaultOpen={true}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-3">
              <GitBranch className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="font-medium text-sm">Hierarchical Links</Label>
                <p className="text-xs text-muted-foreground">Parent-child folder structure</p>
              </div>
            </div>
            <Switch
              checked={topologyConfig.showHierarchy}
              onCheckedChange={(checked) => onTopologyUpdate({ showHierarchy: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-3">
              <Link2 className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="font-medium text-sm">Backlink Connections</Label>
                <p className="text-xs text-muted-foreground">Wikilinks between notes</p>
              </div>
            </div>
            <Switch
              checked={topologyConfig.showBacklinks}
              onCheckedChange={(checked) => onTopologyUpdate({ showBacklinks: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-3">
              <Tags className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="font-medium text-sm">Tag-Based Edges</Label>
                <p className="text-xs text-muted-foreground">Connect notes sharing tags</p>
              </div>
            </div>
            <Switch
              checked={topologyConfig.showTags}
              onCheckedChange={(checked) => onTopologyUpdate({ showTags: checked })}
            />
          </div>

          <div className="p-3 rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <Label className="font-medium text-sm">Tag Threshold</Label>
              <Badge variant="outline" className="font-mono">
                {topologyConfig.tagThreshold}{" "}
                {topologyConfig.tagThreshold === 1 ? "tag" : "tags"}
              </Badge>
            </div>
            <Slider
              value={[topologyConfig.tagThreshold]}
              onValueChange={([value]) => onTopologyUpdate({ tagThreshold: value })}
              min={1}
              max={5}
              step={1}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Minimum shared tags to create a connection
            </p>
          </div>
        </div>
      </CollapsibleSection>

      <GraphLinkTypeStyleCards
        config={config}
        topologyConfig={topologyConfig}
        curveDegrees={ctrl.curveDegrees}
        opacityPercent={ctrl.opacityPercent}
        onUpdate={onUpdate}
        onTopologyStyleUpdate={onTopologyStyleUpdate}
        onDashPresetChange={ctrl.handleDashPresetChange}
      />

      {/* Directional Arrows */}
      <CollapsibleSection
        icon={<MoveRight className="w-4 h-4 text-primary" />}
        title="Directional Arrows"
        defaultOpen={false}
      >
        <div className="space-y-4 p-3 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Show Arrows</Label>
              <p className="text-xs text-muted-foreground">Display direction indicators</p>
            </div>
            <Switch
              checked={config.showArrows}
              onCheckedChange={(checked) => onUpdate({ showArrows: checked })}
            />
          </div>

          {config.showArrows && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Arrow Length</Label>
                  <Badge variant="outline" className="font-mono text-xs">
                    {config.arrowLength}
                  </Badge>
                </div>
                <Slider
                  value={[config.arrowLength]}
                  onValueChange={([value]) => onUpdate({ arrowLength: value })}
                  min={1}
                  max={20}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Arrow Position</Label>
                  <Badge variant="outline" className="font-mono text-xs">
                    {ctrl.arrowPercent}%
                  </Badge>
                </div>
                <Slider
                  value={[config.arrowRelPos]}
                  onValueChange={([value]) => onUpdate({ arrowRelPos: value })}
                  min={0}
                  max={1}
                  step={0.05}
                />
                <p className="text-xs text-muted-foreground">0 = at source, 1 = at target</p>
              </div>
            </>
          )}
        </div>
      </CollapsibleSection>

      {/* Particle Flow Animation */}
      <CollapsibleSection
        icon={<Sparkles className="w-4 h-4 text-primary" />}
        title="Particle Animation"
        defaultOpen={false}
      >
        <div className="space-y-4 p-3 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Show Particles</Label>
              <p className="text-xs text-muted-foreground">Animate flow along links</p>
            </div>
            <Switch
              checked={config.showParticles}
              onCheckedChange={(checked) => onUpdate({ showParticles: checked })}
            />
          </div>

          {config.showParticles && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Particle Count</Label>
                  <Badge variant="outline" className="font-mono text-xs">
                    {config.particles}
                  </Badge>
                </div>
                <Slider
                  value={[config.particles]}
                  onValueChange={([value]) => onUpdate({ particles: value })}
                  min={1}
                  max={20}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Speed</Label>
                  <Badge variant="outline" className="font-mono text-xs">
                    {config.particleSpeed.toFixed(3)}
                  </Badge>
                </div>
                <Slider
                  value={[config.particleSpeed]}
                  onValueChange={([value]) => onUpdate({ particleSpeed: value })}
                  min={0.001}
                  max={0.05}
                  step={0.001}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Particle Width</Label>
                  <Badge variant="outline" className="font-mono text-xs">
                    {config.particleWidth}px
                  </Badge>
                </div>
                <Slider
                  value={[config.particleWidth]}
                  onValueChange={([value]) => onUpdate({ particleWidth: value })}
                  min={1}
                  max={10}
                  step={0.5}
                />
              </div>

              <ColorPicker
                label="Particle Color"
                value={config.particleColor}
                onChange={(color) => onUpdate({ particleColor: color })}
              />
            </>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}
