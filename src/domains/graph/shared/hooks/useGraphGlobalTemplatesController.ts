import { useState } from "react";
import { toast } from "sonner";
import { useGraphStore } from "@/global/stores";
import {
  useGraphTemplatesStore,
  type GraphTemplate,
} from "@/domains/graph/shared/stores/useGraphTemplatesStore";
import type { GraphConfigState } from "@/domains/graph/shared/stores/useGraphStore";
import type { LayoutMode, MindmapOrientation } from "@/domains/graph/shared/utils/graph.types";

export interface UseGraphGlobalTemplatesControllerProps {
  config: GraphConfigState;
  layout: LayoutMode;
  orientation: MindmapOrientation;
  onLayoutChange: (layout: LayoutMode) => void;
  onOrientationChange: (orientation: MindmapOrientation) => void;
  setConfig: (cfg: GraphConfigState) => void;
}

export function useGraphGlobalTemplatesController({
  config,
  layout,
  orientation,
  onLayoutChange,
  onOrientationChange,
  setConfig,
}: UseGraphGlobalTemplatesControllerProps) {
  const [templateName, setTemplateName] = useState("");
  const templates = useGraphTemplatesStore((s) => s.templates);
  const defaultTemplateId = useGraphTemplatesStore((s) => s.defaultTemplateId);
  const saveTemplate = useGraphTemplatesStore((s) => s.saveTemplate);
  const deleteTemplate = useGraphTemplatesStore((s) => s.deleteTemplate);
  const setDefaultTemplate = useGraphTemplatesStore((s) => s.setDefaultTemplate);
  const stats = useGraphStore((s) => s.stats);

  const handleSaveTemplate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = templateName.trim();
    if (!trimmed) {
      toast.error("Masukkan nama template terlebih dahulu");
      return;
    }

    try {
      saveTemplate(trimmed, config, layout, orientation);
      setTemplateName("");
      toast.success(`Template "${trimmed}" berhasil disimpan`);
    } catch {
      toast.error("Gagal menyimpan template graph");
    }
  };

  const handleApplyTemplate = (template: GraphTemplate) => {
    try {
      setConfig(template.config);
      if (template.layoutMode) {
        onLayoutChange(template.layoutMode);
      }
      if (template.orientation) {
        onOrientationChange(template.orientation);
      }
      toast.success(`Template "${template.name}" diterapkan`);
    } catch {
      toast.error("Gagal menerapkan template");
    }
  };

  const handleToggleDefault = (template: GraphTemplate) => {
    const isCurrentDefault = defaultTemplateId === template.id;
    const nextDefault = isCurrentDefault ? null : template.id;
    setDefaultTemplate(nextDefault);

    if (nextDefault) {
      toast.success(`"${template.name}" dijadikan template default`);
    } else {
      toast.info("Template default dihapus");
    }
  };

  const handleDeleteTemplate = (template: GraphTemplate) => {
    deleteTemplate(template.id);
    toast.info(`Template "${template.name}" telah dihapus`);
  };

  const templateList = Object.values(templates);
  const templateCount = templateList.length;

  return {
    templateName,
    setTemplateName,
    templateList,
    templateCount,
    defaultTemplateId,
    stats,
    handleSaveTemplate,
    handleApplyTemplate,
    handleToggleDefault,
    handleDeleteTemplate,
  };
}
