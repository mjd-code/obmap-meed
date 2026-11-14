import React from "react";
import { Slider } from "@/global/ui/slider";
import { Switch } from "@/global/ui/switch";
import { Label } from "@/global/ui/label";
import { Separator } from "@/global/ui/separator";
import type { GraphConfigState } from "@/domains/graph/shared/stores/useGraphStore";
import { Type, Filter, Sliders } from "lucide-react";

export interface PublicReaderGraphSettingsSectionsProps {
  config: GraphConfigState;
  onUpdateNodeOption: <K extends keyof GraphConfigState["nodes"]>(
    key: K,
    value: GraphConfigState["nodes"][K]
  ) => void;
  onUpdateForceOption: <K extends keyof GraphConfigState["forces"]>(
    key: K,
    value: GraphConfigState["forces"][K]
  ) => void;
}

/**
 * Pure declarative visual settings subsections (node labels, node type filters,
 * and physics force spacing) inside PublicReaderGraphSettingsPopover.
 */
export const PublicReaderGraphSettingsSections: React.FC<
  PublicReaderGraphSettingsSectionsProps
> = ({ config, onUpdateNodeOption, onUpdateForceOption }) => {
  return (
    <>
      <Separator className="bg-border/50" />

      {/* 3. Label Catatan */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 font-medium text-foreground text-[11px]">
          <Type className="w-3 h-3 text-primary" />
          <span>Label Catatan</span>
        </div>

        <div className="flex items-center justify-between py-0.5">
          <Label className="text-xs text-muted-foreground cursor-pointer">
            Tampilkan Nama Catatan
          </Label>
          <Switch
            checked={config.nodes.showLabels}
            onCheckedChange={(checked) => onUpdateNodeOption("showLabels", checked)}
          />
        </div>

        {config.nodes.showLabels && (
          <>
            <div className="flex items-center justify-between py-0.5">
              <Label className="text-xs text-muted-foreground cursor-pointer">
                Kotak Latar Label (Card Pill)
              </Label>
              <Switch
                checked={config.nodes.labelBox}
                onCheckedChange={(checked) => onUpdateNodeOption("labelBox", checked)}
              />
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Ukuran Teks Label</span>
                <span className="font-mono">{config.nodes.labelSize}px</span>
              </div>
              <Slider
                min={8}
                max={18}
                step={1}
                value={[config.nodes.labelSize]}
                onValueChange={([val]) => onUpdateNodeOption("labelSize", val)}
              />
            </div>
          </>
        )}
      </div>

      <Separator className="bg-border/50" />

      {/* 4. Filter Jenis Node */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 font-medium text-foreground text-[11px]">
          <Filter className="w-3 h-3 text-primary" />
          <span>Filter Jenis Node</span>
        </div>
        <div className="flex items-center justify-between py-0.5">
          <Label className="text-xs text-muted-foreground cursor-pointer">
            Catatan Teks (Files)
          </Label>
          <Switch
            checked={config.nodes.showFileNodes}
            onCheckedChange={(checked) => onUpdateNodeOption("showFileNodes", checked)}
          />
        </div>
        <div className="flex items-center justify-between py-0.5">
          <Label className="text-xs text-muted-foreground cursor-pointer">
            Folder / Kategori Hub
          </Label>
          <Switch
            checked={config.nodes.showFolderNodes}
            onCheckedChange={(checked) => onUpdateNodeOption("showFolderNodes", checked)}
          />
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* 5. Jarak & Peregangan Fisika */}
      <div className="space-y-2.5 pb-1">
        <div className="flex items-center gap-1.5 font-medium text-foreground text-[11px]">
          <Sliders className="w-3 h-3 text-primary" />
          <span>Jarak Node & Keregangan</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Panjang Relasi</span>
            <span className="font-mono">{config.forces.linkDistance}px</span>
          </div>
          <Slider
            min={30}
            max={250}
            step={5}
            value={[config.forces.linkDistance]}
            onValueChange={([val]) => onUpdateForceOption("linkDistance", val)}
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Gaya Tolak Antar Node</span>
            <span className="font-mono">{Math.abs(config.forces.chargeStrength)}</span>
          </div>
          <Slider
            min={50}
            max={500}
            step={10}
            value={[Math.abs(config.forces.chargeStrength)]}
            onValueChange={([val]) => onUpdateForceOption("chargeStrength", -val)}
          />
        </div>
      </div>
    </>
  );
};
