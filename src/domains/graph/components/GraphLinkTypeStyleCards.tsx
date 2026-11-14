import { Label } from "@/global/ui/label";
import { Slider } from "@/global/ui/slider-number";
import { Badge } from "@/global/ui/badge";
import { Input } from "@/global/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/global/ui/select";
import { Link2, Palette } from "lucide-react";
import type { LinkConfig, TopologyConfig, LinkStyle } from "@/domains/graph/shared/stores/useGraphStore";
import { ColorPicker } from "@/domains/graph/components/GraphColorPicker";
import { HierarchyLinkColorControls } from "@/domains/graph/components/GraphHierarchyColorControls";
import { CollapsibleSection } from "@/domains/graph/components/GraphCollapsibleSection";
import {
  DASH_PRESETS,
  LINE_STYLES,
  LINK_TYPE_INFO,
} from "@/domains/graph/shared/hooks/useGraphLinkStylingController";

interface GraphLinkTypeStyleCardsProps {
  config: LinkConfig;
  topologyConfig: TopologyConfig;
  curveDegrees: number;
  opacityPercent: number;
  onUpdate: (updates: Partial<LinkConfig>) => void;
  onTopologyStyleUpdate: (
    linkType: keyof TopologyConfig["styles"],
    updates: Partial<LinkStyle>,
  ) => void;
  onDashPresetChange: (value: string) => void;
}

export function GraphLinkTypeStyleCards({
  config,
  topologyConfig,
  curveDegrees,
  opacityPercent,
  onUpdate,
  onTopologyStyleUpdate,
  onDashPresetChange,
}: GraphLinkTypeStyleCardsProps) {
  return (
    <>
      {/* Per-Type Styling */}
      <CollapsibleSection
        icon={<Palette className="w-4 h-4 text-primary" />}
        title="Link Type Styling"
        defaultOpen={false}
      >
        <div className="space-y-4">
          {(["hierarchy", "backlink", "tag"] as const).map((linkType) => {
            const info = LINK_TYPE_INFO[linkType];
            const style = topologyConfig.styles[linkType];
            const Icon = info.icon;

            return (
              <div key={linkType} className="p-3 rounded-lg bg-card border border-border space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <Label className="font-medium text-sm">{info.label}</Label>
                </div>

                <ColorPicker
                  label="Color"
                  value={style.color}
                  onChange={(color) => onTopologyStyleUpdate(linkType, { color })}
                />

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Line Style</Label>
                  <Select
                    value={style.lineStyle}
                    onValueChange={(value: "solid" | "dashed" | "dotted") =>
                      onTopologyStyleUpdate(linkType, { lineStyle: value })
                    }
                  >
                    <SelectTrigger className="w-full h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LINE_STYLES.map((ls) => (
                        <SelectItem key={ls.value} value={ls.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-0.5 bg-foreground"
                              style={{
                                borderBottom: `2px ${ls.value} currentColor`,
                                background: "none",
                              }}
                            />
                            {ls.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Opacity ({Math.round(style.opacity * 100)}%)
                    </Label>
                    <Slider
                      value={[style.opacity]}
                      onValueChange={([value]) => onTopologyStyleUpdate(linkType, { opacity: value })}
                      min={0.1}
                      max={1}
                      step={0.1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Width ({style.width}px)</Label>
                    <Slider
                      value={[style.width]}
                      onValueChange={([value]) => onTopologyStyleUpdate(linkType, { width: value })}
                      min={0.5}
                      max={5}
                      step={0.5}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* Geometric Properties */}
      <CollapsibleSection
        icon={<Link2 className="w-4 h-4 text-primary" />}
        title="Geometric Properties"
        defaultOpen={false}
      >
        <div className="space-y-4 p-3 rounded-lg bg-card border border-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Link Width</Label>
              <Badge variant="outline" className="font-mono text-xs">
                {config.width}px
              </Badge>
            </div>
            <Slider
              value={[config.width]}
              onValueChange={([value]) => onUpdate({ width: value })}
              min={0.5}
              max={10}
              step={0.5}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Curvature</Label>
              <Badge variant="outline" className="font-mono text-xs">
                {config.curvature.toFixed(2)}
              </Badge>
            </div>
            <Slider
              value={[config.curvature]}
              onValueChange={([value]) => onUpdate({ curvature: value })}
              min={0}
              max={1}
              step={0.05}
            />
            <p className="text-xs text-muted-foreground">0 = straight line, 1 = max curve</p>
          </div>

          {config.curvature > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Curve Rotation</Label>
                <Badge variant="outline" className="font-mono text-xs">
                  {curveDegrees}°
                </Badge>
              </div>
              <Slider
                value={[config.curveRotation]}
                onValueChange={([value]) => onUpdate({ curveRotation: value })}
                min={0}
                max={Math.PI * 2}
                step={0.1}
              />
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Visual Differentiation */}
      <CollapsibleSection
        icon={<Palette className="w-4 h-4 text-primary" />}
        title="Visual Appearance"
        defaultOpen={false}
      >
        <HierarchyLinkColorControls />

        <div className="space-y-4 p-3 rounded-lg bg-card border border-border">
          <ColorPicker
            label="Default Link Color"
            value={config.color}
            onChange={(color) => onUpdate({ color })}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Opacity</Label>
              <Badge variant="outline" className="font-mono text-xs">
                {opacityPercent}%
              </Badge>
            </div>
            <Slider
              value={[config.opacity]}
              onValueChange={([value]) => onUpdate({ opacity: value })}
              min={0.1}
              max={1}
              step={0.05}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Line Style</Label>
            <Select
              value={config.dashArray || "solid"}
              onValueChange={onDashPresetChange}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DASH_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    <div className="flex items-center gap-3">
                      <svg width="48" height="4" className="flex-shrink-0">
                        <line
                          x1="0"
                          y1="2"
                          x2="48"
                          y2="2"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={preset.value === "solid" ? undefined : preset.value}
                        />
                      </svg>
                      {preset.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="pt-2">
              <Label className="text-xs text-muted-foreground">Custom Pattern</Label>
              <Input
                value={config.dashArray}
                onChange={(e) => onUpdate({ dashArray: e.target.value })}
                placeholder="e.g. 5,5,10,5"
                className="h-8 mt-1 font-mono text-xs"
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>
    </>
  );
}
