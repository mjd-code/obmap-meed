import {
  Download,
  FileArchive,
  Folder,
  FileText,
  Image,
  Music,
  Video,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/global/ui/button";
import { TabsContent } from "@/global/ui/tabs";
import { Checkbox } from "@/global/ui/checkbox";
import { ScrollArea } from "@/global/ui/scroll-area";
import { Badge } from "@/global/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/global/ui/dropdown-menu";
import type { ExportOptions } from "@/domains/vault/shared/api/ImportExportService";
import type { ImportExportNode } from "@/domains/workspace/shared/hooks/useWorkspaceImportExportController";

interface WorkspaceExportTabContentProps {
  includeMedia: boolean;
  onIncludeMediaChange: (include: boolean) => void;
  selectedExportNodes: Set<string>;
  folders: ImportExportNode[];
  files: ImportExportNode[];
  media: ImportExportNode[];
  totalNodesCount: number;
  onExport: (type: ExportOptions["type"]) => void;
  onToggleNodeSelection: (nodeId: string) => void;
}

/** Declarative view for the Export tab inside WorkspaceImportExportPanel. */
export function WorkspaceExportTabContent({
  includeMedia,
  onIncludeMediaChange,
  selectedExportNodes,
  folders,
  files,
  media,
  totalNodesCount,
  onExport,
  onToggleNodeSelection,
}: WorkspaceExportTabContentProps) {
  return (
    <TabsContent value="export" className="space-y-4 mt-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Quick Export</span>
          <div className="flex items-center gap-2">
            <Checkbox
              id="includeMedia"
              checked={includeMedia}
              onCheckedChange={(checked) => onIncludeMediaChange(!!checked)}
            />
            <label htmlFor="includeMedia" className="text-sm text-muted-foreground">
              Include media
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => onExport("vault")}
          >
            <FileArchive className="w-5 h-5" />
            <span className="text-sm">Entire Vault</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Download className="w-5 h-5" />
                <span className="text-sm">Export Selected</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onExport("folder")}>
                <Folder className="w-4 h-4 mr-2" />
                Selected Folders
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("files")}>
                <FileText className="w-4 h-4 mr-2" />
                Selected Files
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onExport("media")}>
                <Image className="w-4 h-4 mr-2" />
                All Media Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Select Items to Export</span>
          <Badge variant="secondary">{selectedExportNodes.size} selected</Badge>
        </div>

        <ScrollArea className="h-[200px] border rounded-lg p-2">
          {folders.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Folders</p>
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-accent/50 cursor-pointer"
                  onClick={() => onToggleNodeSelection(folder.id)}
                >
                  <Checkbox checked={selectedExportNodes.has(folder.id)} />
                  <Folder className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm truncate">{folder.name}</span>
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Files</p>
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-accent/50 cursor-pointer"
                  onClick={() => onToggleNodeSelection(file.id)}
                >
                  <Checkbox checked={selectedExportNodes.has(file.id)} />
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm truncate">{file.name}</span>
                </div>
              ))}
            </div>
          )}

          {media.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Media</p>
              {media.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-accent/50 cursor-pointer"
                  onClick={() => onToggleNodeSelection(m.id)}
                >
                  <Checkbox checked={selectedExportNodes.has(m.id)} />
                  {m.mediaType === "image" && (
                    <Image className="w-4 h-4 text-green-500" />
                  )}
                  {m.mediaType === "audio" && (
                    <Music className="w-4 h-4 text-purple-500" />
                  )}
                  {m.mediaType === "video" && (
                    <Video className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm truncate">{m.name}</span>
                </div>
              ))}
            </div>
          )}

          {totalNodesCount === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No items to export
            </div>
          )}
        </ScrollArea>
      </div>
    </TabsContent>
  );
}
