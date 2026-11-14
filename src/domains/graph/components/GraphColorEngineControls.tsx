import { Button } from "@/global/ui/button";
import { Palette, Layers, Tag, Paintbrush } from "lucide-react";
import { cn } from "@/global/utils/cn";
import { ColorPicker } from "@/domains/graph/components/GraphColorPicker";
import { SectionHeaderWithReset } from "@/global/ui/SectionHeaderWithReset";
import type { HierarchyColorConfig } from "@/domains/graph/shared/utils/hierarchyColors";
import type { NodeConfig } from "@/domains/graph/shared/stores/useGraphStore";
import { useGraphColorEngineController } from "@/domains/graph/shared/hooks/useGraphColorEngineController";
import { GraphColorHierarchyBento } from "@/domains/graph/components/GraphColorHierarchyBento";

interface ColorEngineControlsProps {
  hierarchy: HierarchyColorConfig;
  nodeConfig: NodeConfig;
  onHierarchyUpdate: (updates: Partial<HierarchyColorConfig>) => void;
  onNodeConfigUpdate: (updates: Partial<NodeConfig>) => void;
  className?: string;
  compact?: boolean;
}

export function ColorEngineControls({
  hierarchy,
  nodeConfig,
  onHierarchyUpdate,
  onNodeConfigUpdate,
  className,
  compact = false,
}: ColorEngineControlsProps) {
  const ctrl = useGraphColorEngineController({
    hierarchy,
    nodeConfig,
    onHierarchyUpdate,
    onNodeConfigUpdate,
  });

  return (
    <div className={cn("space-y-3.5", className)}>
      {/* Top Bar: Mode Selector */}
      <div className="space-y-2 border-b border-border/40 pb-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs font-semibold text-foreground">Color Engine Mode</span>
          </div>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary capitalize tracking-wider">
            {ctrl.activeMode}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted/50 p-1 border border-border/40">
          <button
            type="button"
            onClick={() => ctrl.handleModeChange("hierarchy")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-1.5 px-2 text-xs transition-all select-none min-w-0",
              ctrl.activeMode === "hierarchy"
                ? "bg-card text-foreground font-medium shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40",
            )}
          >
            <Layers className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Hierarchy</span>
          </button>

          <button
            type="button"
            onClick={() => ctrl.handleModeChange("categorical")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-1.5 px-2 text-xs transition-all select-none min-w-0",
              ctrl.activeMode === "categorical"
                ? "bg-card text-foreground font-medium shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40",
            )}
          >
            <Tag className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">Category</span>
          </button>

          <button
            type="button"
            onClick={() => ctrl.handleModeChange("custom")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-1.5 px-2 text-xs transition-all select-none min-w-0",
              ctrl.activeMode === "custom"
                ? "bg-card text-foreground font-medium shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40",
            )}
          >
            <Paintbrush className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">Custom</span>
          </button>
        </div>
      </div>

      {/* MODE 1: HIERARCHY BENTO GRID */}
      {ctrl.activeMode === "hierarchy" && (
        <GraphColorHierarchyBento
          hierarchy={hierarchy}
          compact={compact}
          colorSpread={ctrl.colorSpread}
          saturationShift={ctrl.saturationShift}
          onHierarchyUpdate={onHierarchyUpdate}
          onGenerateHarmony={ctrl.handleGenerateHarmony}
          onApplyPreset={ctrl.handleApplyPreset}
          onApplySpreadAndSat={ctrl.handleApplySpreadAndSat}
          onSetLevelColor={ctrl.setLevelColor}
          onAddLevel={ctrl.addLevel}
          onRemoveLevel={ctrl.removeLevel}
        />
      )}

      {/* MODE 2: CATEGORICAL BENTO GRID */}
      {ctrl.activeMode === "categorical" && (
        <div className={cn("grid gap-3.5", compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
          <div className="rounded-xl border border-border/60 bg-card/60 p-3.5 shadow-xs backdrop-blur-xs space-y-3">
            <SectionHeaderWithReset
              icon={Tag}
              title="Sumber Kategori"
              description="Pilih bagaimana graf menentukan variasi warna node"
            />

            <div className="space-y-1.5">
              <Button
                type="button"
                variant={nodeConfig.autoColorBy === "tags" ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-start gap-2.5 text-xs h-9",
                  nodeConfig.autoColorBy === "tags" &&
                    "bg-background shadow-xs border border-border/60",
                )}
                onClick={() => {
                  onHierarchyUpdate({ enabled: false });
                  onNodeConfigUpdate({ autoColorBy: "tags" });
                }}
              >
                <Tag className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <div className="flex flex-col text-left">
                  <span className="font-medium">Markdown Tags</span>
                  <span className="text-[10px] text-muted-foreground">
                    Warna berdasarkan tag (#proyek, #catatan)
                  </span>
                </div>
              </Button>

              <Button
                type="button"
                variant={nodeConfig.autoColorBy === "branch" ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-start gap-2.5 text-xs h-9",
                  nodeConfig.autoColorBy === "branch" &&
                    "bg-background shadow-xs border border-border/60",
                )}
                onClick={() => {
                  onHierarchyUpdate({ enabled: false });
                  onNodeConfigUpdate({ autoColorBy: "branch" });
                }}
              >
                <Layers className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <div className="flex flex-col text-left">
                  <span className="font-medium">Subtree Cabang</span>
                  <span className="text-[10px] text-muted-foreground">
                    Keturunan mewarisi corak cabang akar
                  </span>
                </div>
              </Button>

              <Button
                type="button"
                variant={nodeConfig.autoColorBy === "type" ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-start gap-2.5 text-xs h-9",
                  nodeConfig.autoColorBy === "type" &&
                    "bg-background shadow-xs border border-border/60",
                )}
                onClick={() => {
                  onHierarchyUpdate({ enabled: false });
                  onNodeConfigUpdate({ autoColorBy: "type" });
                }}
              >
                <Palette className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <div className="flex flex-col text-left">
                  <span className="font-medium">Tipe Entitas</span>
                  <span className="text-[10px] text-muted-foreground">
                    Pemisahan warna Folder vs Catatan
                  </span>
                </div>
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/60 p-3.5 shadow-xs backdrop-blur-xs space-y-3">
            <SectionHeaderWithReset
              icon={Paintbrush}
              title="Warna Spesifik Entitas"
              description="Konfigurasi warna untuk tipe berkas dan folder"
            />

            <div className="space-y-2 pt-1">
              <ColorPicker
                label="Warna Folder"
                value={nodeConfig.folderColor}
                onChange={(val) => onNodeConfigUpdate({ folderColor: val })}
              />
              <ColorPicker
                label="Warna File / Catatan"
                value={nodeConfig.fileColor}
                onChange={(val) => onNodeConfigUpdate({ fileColor: val })}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: CUSTOM BENTO GRID */}
      {ctrl.activeMode === "custom" && (
        <div className={cn("grid gap-3.5", compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
          <div className="rounded-xl border border-border/60 bg-card/60 p-3.5 shadow-xs backdrop-blur-xs space-y-3">
            <SectionHeaderWithReset
              icon={Paintbrush}
              title="Warna Tunggal / Khusus"
              description="Terapkan warna monokrom atau identitas visual khusus"
            />

            <div className="space-y-2 pt-1">
              <ColorPicker
                label="Warna Utama Catatan"
                value={nodeConfig.fileColor}
                onChange={(val) => {
                  onHierarchyUpdate({ enabled: false });
                  onNodeConfigUpdate({ fileColor: val, autoColorBy: "none" });
                }}
              />
              <ColorPicker
                label="Warna Utama Folder"
                value={nodeConfig.folderColor}
                onChange={(val) => {
                  onHierarchyUpdate({ enabled: false });
                  onNodeConfigUpdate({ folderColor: val });
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
