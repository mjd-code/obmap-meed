import { Label } from '@/global/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/global/ui/select';
import { Palette, Sparkles, GitBranch } from 'lucide-react';
import type { HierarchyColorConfig, NodeConfig } from '@/domains/graph/shared/stores/useGraphStore';
import { ColorPicker } from '@/domains/graph/components/GraphColorPicker';
import { ColorEngineControls } from '@/domains/graph/components/GraphColorEngineControls';
import { CollapsibleSection } from '@/domains/graph/components/GraphCollapsibleSection';

export interface GraphNodeColorSectionProps {
  config: NodeConfig;
  hierarchy: HierarchyColorConfig;
  onUpdate: (updates: Partial<NodeConfig>) => void;
  onHierarchyUpdate: (updates: Partial<HierarchyColorConfig>) => void;
}

/**
 * Collapsible color engine & node/branch palette settings for Graph Engine node configuration.
 */
export function GraphNodeColorSection({
  config,
  hierarchy,
  onUpdate,
  onHierarchyUpdate,
}: GraphNodeColorSectionProps) {
  return (
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
            onValueChange={(autoColorBy: NodeConfig['autoColorBy']) =>
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
  );
}
