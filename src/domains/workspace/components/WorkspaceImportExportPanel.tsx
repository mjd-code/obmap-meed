import { Upload, Download } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/global/ui/tabs";
import { WorkspaceImportTabContent } from "@/domains/workspace/components/WorkspaceImportTabContent";
import { WorkspaceExportTabContent } from "@/domains/workspace/components/WorkspaceExportTabContent";
import {
  useWorkspaceImportExportController,
  type ImportExportPanelProps,
} from "@/domains/workspace/shared/hooks/useWorkspaceImportExportController";

/** Declarative tabbed view for importing and exporting vault nodes and media. */
export const ImportExportPanel = ({
  nodes,
  onImportComplete,
  isSheet: _isSheet = false,
}: ImportExportPanelProps) => {
  const controller = useWorkspaceImportExportController({
    nodes,
    onImportComplete,
  });

  return (
    <Tabs defaultValue="import" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="import" className="gap-2">
          <Upload className="w-4 h-4" />
          Import
        </TabsTrigger>
        <TabsTrigger value="export" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </TabsTrigger>
      </TabsList>

      <WorkspaceImportTabContent
        isImporting={controller.isImporting}
        importProgress={controller.importProgress}
        lastResult={controller.lastResult}
        showImportSettings={controller.showImportSettings}
        onShowImportSettingsChange={controller.setShowImportSettings}
        duplicateStrategy={controller.duplicateStrategy}
        onDuplicateStrategyChange={controller.setDuplicateStrategy}
        fileInputRef={controller.fileInputRef}
        folderInputRef={controller.folderInputRef}
        zipInputRef={controller.zipInputRef}
        mediaInputRef={controller.mediaInputRef}
        onFileImport={controller.handleFileImport}
      />

      <WorkspaceExportTabContent
        includeMedia={controller.includeMedia}
        onIncludeMediaChange={controller.setIncludeMedia}
        selectedExportNodes={controller.selectedExportNodes}
        folders={controller.folders}
        files={controller.files}
        media={controller.media}
        totalNodesCount={nodes.length}
        onExport={controller.handleExport}
        onToggleNodeSelection={controller.toggleNodeSelection}
      />
    </Tabs>
  );
};

// Wave 2 Dual Named Export Compatibility
export { ImportExportPanel as WorkspaceImportExportPanel };
