import { Switch } from "@/global/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/global/ui/select";
import { ControlSliderRow } from "@/global/ui/ControlSliderRow";
import { SectionHeaderWithReset } from "@/global/ui/SectionHeaderWithReset";
import { ColorPicker } from "@/domains/graph/components/GraphColorPicker";
import { Circle, Type, Shapes } from "lucide-react";
import type { GraphConfigState, NodeConfig } from "@/domains/graph/shared/stores/useGraphStore";
import {
  FONT_STYLES,
  NODE_SHAPES,
  type LabelMode,
} from "@/domains/graph/shared/hooks/useGraphAppearanceController";

export interface GraphAppearanceNodesSectionProps {
  config: GraphConfigState;
  labelMode: LabelMode;
  setLabelMode: (mode: LabelMode) => void;
  updateNodeConfig: (upd: Partial<NodeConfig>) => void;
}

/**
 * Pure declarative Nodes tab content for GraphAppearancePanel: shape representation,
 * scale controls, and typography configuration cards.
 */
export function GraphAppearanceNodesSection({
  config,
  labelMode,
  setLabelMode,
  updateNodeConfig,
}: GraphAppearanceNodesSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-3.5 items-start">
      {/* BENTO 1: BENTUK & TIPE NODE */}
      <div className="space-y-3 rounded-xl border border-border/70 bg-card/60 p-3 shadow-xs">
        <SectionHeaderWithReset
          title="Bentuk & Representasi"
          icon={Shapes}
          description="Bentuk geometris dan ikon format item"
          onReset={() =>
            updateNodeConfig({
              showFolderNodes: true,
              showFileNodes: true,
              autoShapeByFormat: true,
              formatMarkerStyle: "shapes",
            })
          }
        />

        <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2 rounded-lg border border-border/40">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground font-medium">Folder</span>
            <Switch
              checked={config.nodes.showFolderNodes}
              onCheckedChange={(checked) => updateNodeConfig({ showFolderNodes: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground font-medium">File Note</span>
            <Switch
              checked={config.nodes.showFileNodes}
              onCheckedChange={(checked) => updateNodeConfig({ showFileNodes: checked })}
            />
          </div>
        </div>

        <div className="space-y-2 pt-1 border-t border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-foreground">Bentuk Otomatis Format</span>
              <p className="text-[10px] text-muted-foreground">Bentuk unik per tipe file</p>
            </div>
            <Switch
              checked={config.nodes.autoShapeByFormat ?? true}
              onCheckedChange={(checked) => updateNodeConfig({ autoShapeByFormat: checked })}
            />
          </div>

          {(config.nodes.autoShapeByFormat ?? true) ? (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground">Gaya Marker:</span>
              <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-md border border-border/40">
                <button
                  type="button"
                  onClick={() => updateNodeConfig({ formatMarkerStyle: "shapes" })}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                    (config.nodes.formatMarkerStyle ?? "shapes") === "shapes"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Geometri
                </button>
                <button
                  type="button"
                  onClick={() => updateNodeConfig({ formatMarkerStyle: "icons" })}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                    config.nodes.formatMarkerStyle === "icons"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Ikon Explorer
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-muted-foreground font-medium">
                Bentuk Manual Semua Node
              </span>
              <Select
                value={config.nodes.shape}
                onValueChange={(val) => updateNodeConfig({ shape: val as NodeConfig["shape"] })}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NODE_SHAPES.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* BENTO 2: UKURAN & SKALA NODE */}
      <div className="space-y-3 rounded-xl border border-border/70 bg-card/60 p-3 shadow-xs">
        <SectionHeaderWithReset
          title="Ukuran & Skala"
          icon={Circle}
          description="Dimensi relatif dan pembesaran hierarkis"
          onReset={() => updateNodeConfig({ relSize: 6, sizeByDepth: false })}
        />

        <ControlSliderRow
          label="Ukuran Relatif Node"
          description="Radius dasar lingkaran dan poligon node"
          value={config.nodes.relSize}
          min={1}
          max={60}
          step={1}
          defaultValue={6}
          onChange={(v) => updateNodeConfig({ relSize: v })}
        />

        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <div>
            <span className="text-xs font-medium text-foreground">Skala Kedalaman Hierarki</span>
            <p className="text-[10px] text-muted-foreground">Node root lebih besar dari cabang</p>
          </div>
          <Switch
            checked={config.nodes.sizeByDepth}
            onCheckedChange={(checked) => updateNodeConfig({ sizeByDepth: checked })}
          />
        </div>
      </div>

      {/* BENTO 3: LABEL & TIPOGRAFI */}
      <div className="space-y-3 rounded-xl border border-border/70 bg-card/60 p-3 shadow-xs">
        <SectionHeaderWithReset
          title="Label & Tipografi"
          icon={Type}
          description="Penamaan, kotak teks, dan gaya font"
          onReset={() =>
            updateNodeConfig({
              showLabels: true,
              labelBox: false,
              labelSize: 11,
              labelFontStyle: "normal",
            })
          }
        />

        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-muted-foreground">Mode Tampilan Label</span>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-border/60 bg-muted/40 p-1">
            {[
              { id: "nodes", label: "Titik Saja" },
              { id: "labels", label: "+ Label" },
              { id: "boxes", label: "+ Kotak" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setLabelMode(m.id as LabelMode)}
                className={`py-1 text-[11px] font-medium rounded transition-all ${
                  labelMode === m.id
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-foreground">Gaya Huruf</span>
            <Select
              value={config.nodes.labelFontStyle ?? "normal"}
              onValueChange={(val) =>
                updateNodeConfig({ labelFontStyle: val as NodeConfig["labelFontStyle"] })
              }
            >
              <SelectTrigger className="h-7 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_STYLES.map((f) => (
                  <SelectItem key={f.value} value={f.value} className="text-xs">
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ControlSliderRow
            label="Ukuran Font Label"
            unit="px"
            value={config.nodes.labelSize}
            min={8}
            max={32}
            step={1}
            defaultValue={11}
            onChange={(v) => updateNodeConfig({ labelSize: v })}
          />

          <ColorPicker
            label="Warna Teks Label"
            value={config.nodes.labelColor}
            onChange={(val) => updateNodeConfig({ labelColor: val })}
          />
        </div>
      </div>
    </div>
  );
}
