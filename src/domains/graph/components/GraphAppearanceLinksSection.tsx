import { Switch } from "@/global/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/global/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/global/ui/tabs";
import { ControlSliderRow } from "@/global/ui/ControlSliderRow";
import { SectionHeaderWithReset } from "@/global/ui/SectionHeaderWithReset";
import { ColorPicker } from "@/domains/graph/components/GraphColorPicker";
import { HierarchyLinkColorControls } from "@/domains/graph/components/GraphHierarchyColorControls";
import { Link2, Sparkles, GitFork } from "lucide-react";
import type {
  GraphConfigState,
  LinkConfig,
  TopologyConfig,
  LinkStyle,
  HierarchyColorConfig,
} from "@/domains/graph/shared/stores/useGraphStore";
import {
  LINK_STYLE_TYPES,
  LINE_STYLES,
  type LinkStyleType,
} from "@/domains/graph/shared/hooks/useGraphAppearanceController";

interface GraphAppearanceLinksSectionProps {
  config: GraphConfigState;
  styleType: LinkStyleType;
  setStyleType: (type: LinkStyleType) => void;
  currentStyle: LinkStyle;
  updateTopologyConfig: (upd: Partial<TopologyConfig>) => void;
  updateTopologyStyle: (type: LinkStyleType, upd: Partial<LinkStyle>) => void;
  updateHierarchyConfig: (upd: Partial<HierarchyColorConfig>) => void;
  updateLinkConfig: (upd: Partial<LinkConfig>) => void;
}

export function GraphAppearanceLinksSection({
  config,
  styleType,
  setStyleType,
  currentStyle,
  updateTopologyConfig,
  updateTopologyStyle,
  updateHierarchyConfig,
  updateLinkConfig,
}: GraphAppearanceLinksSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-3.5 items-start">
      {/* BENTO 1: VISIBILITAS TIPE LINK */}
      <div className="space-y-3 rounded-xl border border-border/70 bg-card/60 p-3 shadow-xs">
        <SectionHeaderWithReset
          title="Tipe Relasi Tautan"
          icon={GitFork}
          description="Filter visibilitas garis berdasarkan hubungan"
          onReset={() =>
            updateTopologyConfig({
              showHierarchy: true,
              showBacklinks: true,
              showTags: true,
              tagThreshold: 1,
            })
          }
        />

        <div className="space-y-2 bg-muted/30 p-2.5 rounded-lg border border-border/40">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground font-medium">Tautan Hierarkis</span>
            <Switch
              checked={config.topology.showHierarchy}
              onCheckedChange={(checked) => updateTopologyConfig({ showHierarchy: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground font-medium">Tautan Balik (Backlinks)</span>
            <Switch
              checked={config.topology.showBacklinks}
              onCheckedChange={(checked) => updateTopologyConfig({ showBacklinks: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground font-medium">Relasi Berbasis Tag</span>
            <Switch
              checked={config.topology.showTags}
              onCheckedChange={(checked) => updateTopologyConfig({ showTags: checked })}
            />
          </div>
        </div>

        {config.topology.showTags && (
          <ControlSliderRow
            label="Ambang Batas Tag"
            description="Minimal tag bersama untuk membentuk garis"
            value={config.topology.tagThreshold}
            min={1}
            max={5}
            step={1}
            defaultValue={1}
            onChange={(v) => updateTopologyConfig({ tagThreshold: v })}
          />
        )}
      </div>

      {/* BENTO 2: STYLING SPESIFIK TIPE GARIS */}
      <div className="space-y-3 rounded-xl border border-border/70 bg-card/60 p-3 shadow-xs">
        <SectionHeaderWithReset
          title="Gaya Per Tipe Tautan"
          icon={Link2}
          description="Warna, ketebalan, dan pola garis per tipe"
        />

        <Tabs
          value={styleType}
          onValueChange={(val) => setStyleType(val as LinkStyleType)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 h-7 p-0.5 bg-muted/60">
            {LINK_STYLE_TYPES.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="text-[10px] px-1 py-0.5">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="space-y-2.5">
          <ColorPicker
            label="Warna Garis"
            value={currentStyle.color}
            onChange={(val) => updateTopologyStyle(styleType, { color: val })}
          />

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-foreground">Pola Garis</span>
            <Select
              value={currentStyle.lineStyle}
              onValueChange={(val) =>
                updateTopologyStyle(styleType, { lineStyle: val as LinkStyle["lineStyle"] })
              }
            >
              <SelectTrigger className="h-7 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LINE_STYLES.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ControlSliderRow
            label="Ketebalan Garis"
            unit="px"
            value={currentStyle.width}
            min={0.5}
            max={5}
            step={0.5}
            defaultValue={1.2}
            formatValue={(v) => `${v.toFixed(1)}px`}
            onChange={(val) => updateTopologyStyle(styleType, { width: val })}
          />

          <ControlSliderRow
            label="Opasitas Tautan"
            unit="%"
            value={Math.round(currentStyle.opacity * 100)}
            min={10}
            max={100}
            step={5}
            defaultValue={60}
            onChange={(val) => updateTopologyStyle(styleType, { opacity: val / 100 })}
          />
        </div>
      </div>

      {/* BENTO 3: GEOMETRI GLOBAL & PARTIKEL */}
      <div className="space-y-3 rounded-xl border border-border/70 bg-card/60 p-3 shadow-xs">
        <SectionHeaderWithReset
          title="Geometri Global & Partikel"
          icon={Sparkles}
          description="Kelengkungan global dan aliran partikel"
          onReset={() => updateLinkConfig({ curvature: 0, width: 1.2, showParticles: false })}
        />

        <div className="space-y-2.5">
          <ControlSliderRow
            label="Kelengkungan Tautan (Curvature)"
            value={config.links.curvature}
            min={0}
            max={0.8}
            step={0.05}
            defaultValue={0}
            formatValue={(v) => v.toFixed(2)}
            onChange={(val) => updateLinkConfig({ curvature: val })}
          />

          <ControlSliderRow
            label="Ketebalan Global"
            unit="px"
            value={config.links.width}
            min={0.5}
            max={5}
            step={0.5}
            defaultValue={1.2}
            formatValue={(v) => `${v.toFixed(1)}px`}
            onChange={(val) => updateLinkConfig({ width: val })}
          />

          <div className="flex items-center justify-between pt-1 border-t border-border/40">
            <div>
              <span className="text-xs font-medium text-foreground">
                Aliran Partikel Bergerak
              </span>
              <p className="text-[10px] text-muted-foreground">
                Animasi titik melintasi tautan
              </p>
            </div>
            <Switch
              checked={config.links.showParticles}
              onCheckedChange={(checked) => updateLinkConfig({ showParticles: checked })}
            />
          </div>

          {config.links.showParticles && (
            <ControlSliderRow
              label="Jumlah Partikel per Garis"
              value={config.links.particles}
              min={1}
              max={8}
              step={1}
              defaultValue={3}
              onChange={(val) => updateLinkConfig({ particles: val })}
            />
          )}

          <div className="pt-2 border-t border-border/40">
            <HierarchyLinkColorControls
              hierarchy={config.hierarchy}
              onChange={updateHierarchyConfig}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
