import type { RefObject } from "react";
import {
  FileArchive,
  Folder,
  FileText,
  Image,
  Music,
  Video,
  Check,
  AlertCircle,
  ChevronDown,
  Settings2,
} from "lucide-react";
import { Button } from "@/global/ui/button";
import { TabsContent } from "@/global/ui/tabs";
import { Progress } from "@/global/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/global/ui/radio-group";
import { Label } from "@/global/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/global/ui/collapsible";
import type {
  DuplicateStrategy,
  ImportResult,
} from "@/domains/vault/shared/api/ImportExportService";

interface WorkspaceImportTabContentProps {
  isImporting: boolean;
  importProgress: number;
  lastResult: ImportResult | null;
  showImportSettings: boolean;
  onShowImportSettingsChange: (open: boolean) => void;
  duplicateStrategy: DuplicateStrategy;
  onDuplicateStrategyChange: (strategy: DuplicateStrategy) => void;
  fileInputRef: RefObject<HTMLInputElement>;
  folderInputRef: RefObject<HTMLInputElement>;
  zipInputRef: RefObject<HTMLInputElement>;
  mediaInputRef: RefObject<HTMLInputElement>;
  onFileImport: (files: FileList | null, type: string) => void;
}

/** Declarative view for the Import tab inside WorkspaceImportExportPanel. */
export function WorkspaceImportTabContent({
  isImporting,
  importProgress,
  lastResult,
  showImportSettings,
  onShowImportSettingsChange,
  duplicateStrategy,
  onDuplicateStrategyChange,
  fileInputRef,
  folderInputRef,
  zipInputRef,
  mediaInputRef,
  onFileImport,
}: WorkspaceImportTabContentProps) {
  return (
    <TabsContent value="import" className="space-y-4 mt-4">
      {isImporting && (
        <div className="space-y-2">
          <Progress value={importProgress} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">
            Importing files...
          </p>
        </div>
      )}

      {lastResult && (
        <div
          className={`p-3 rounded-lg border ${
            lastResult.success
              ? "border-green-500/30 bg-green-500/10"
              : "border-yellow-500/30 bg-yellow-500/10"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {lastResult.success ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            )}
            <span className="text-sm font-medium">
              {lastResult.success
                ? "Import Complete"
                : "Import Completed with Warnings"}
            </span>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>{lastResult.folders} folders</span>
            <span>{lastResult.files} files</span>
            <span>{lastResult.media} media</span>
          </div>
          {lastResult.errors.length > 0 && (
            <div className="mt-2 text-xs text-destructive">
              {lastResult.errors.slice(0, 3).map((err, i) => (
                <p key={i}>{err}</p>
              ))}
              {lastResult.errors.length > 3 && (
                <p>...and {lastResult.errors.length - 3} more errors</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Import Settings */}
      <Collapsible
        open={showImportSettings}
        onOpenChange={onShowImportSettingsChange}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between mb-3">
            <span className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Import Settings
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showImportSettings ? "rotate-180" : ""}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pb-4">
          <div className="p-3 border rounded-lg bg-muted/30 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              When duplicate names are found:
            </p>
            <RadioGroup
              value={duplicateStrategy}
              onValueChange={(v) => onDuplicateStrategyChange(v as DuplicateStrategy)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rename" id="rename" />
                <Label htmlFor="rename" className="text-sm cursor-pointer">
                  Auto-rename (e.g., "file (1)")
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="overwrite" id="overwrite" />
                <Label htmlFor="overwrite" className="text-sm cursor-pointer">
                  Overwrite existing
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="skip" id="skip" />
                <Label htmlFor="skip" className="text-sm cursor-pointer">
                  Skip duplicates
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="merge" id="merge" />
                <Label htmlFor="merge" className="text-sm cursor-pointer">
                  Merge content (append)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="grid grid-cols-2 gap-3">
        {/* Files */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".md,.markdown,.txt"
          className="hidden"
          onChange={(e) => onFileImport(e.target.files, "files")}
        />
        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
        >
          <FileText className="w-6 h-6" />
          <span className="text-sm">Files</span>
          <span className="text-xs text-muted-foreground">.md, .txt</span>
        </Button>

        {/* Folder */}
        <input
          ref={folderInputRef}
          type="file"
          multiple
          {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
          className="hidden"
          onChange={(e) => onFileImport(e.target.files, "folder")}
        />
        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          onClick={() => folderInputRef.current?.click()}
          disabled={isImporting}
        >
          <Folder className="w-6 h-6" />
          <span className="text-sm">Folder</span>
          <span className="text-xs text-muted-foreground">With structure</span>
        </Button>

        {/* ZIP */}
        <input
          ref={zipInputRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={(e) => onFileImport(e.target.files, "zip")}
        />
        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          onClick={() => zipInputRef.current?.click()}
          disabled={isImporting}
        >
          <FileArchive className="w-6 h-6" />
          <span className="text-sm">ZIP Archive</span>
          <span className="text-xs text-muted-foreground">.zip</span>
        </Button>

        {/* Media */}
        <input
          ref={mediaInputRef}
          type="file"
          multiple
          accept="image/*,audio/*,video/*"
          className="hidden"
          onChange={(e) => onFileImport(e.target.files, "media")}
        />
        <Button
          variant="outline"
          className="h-24 flex-col gap-2"
          onClick={() => mediaInputRef.current?.click()}
          disabled={isImporting}
        >
          <div className="flex gap-1">
            <Image className="w-5 h-5" />
            <Music className="w-5 h-5" />
            <Video className="w-5 h-5" />
          </div>
          <span className="text-sm">Media</span>
          <span className="text-xs text-muted-foreground">
            Image, Audio, Video
          </span>
        </Button>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <strong>Supported formats:</strong>
        </p>
        <p>• Markdown: .md, .markdown, .txt</p>
        <p>• Images: .png, .jpg, .gif, .webp, .svg</p>
        <p>• Audio: .mp3, .wav, .ogg, .m4a</p>
        <p>• Video: .mp4, .webm, .mov</p>
      </div>
    </TabsContent>
  );
}
