import React from "react";
import type { Node } from "@/domains/graph/shared/utils/graph.types";
import { BulkPublishModal } from "@/domains/collaboration/components/CollabBulkPublishModal";
import { Button } from "@/global/ui/button";
import { Input } from "@/global/ui/input";
import { Textarea } from "@/global/ui/textarea";
import { Badge } from "@/global/ui/badge";
import { Checkbox } from "@/global/ui/checkbox";
import { Folder, FileText, Image, Globe, Search, CheckCircle, Check, X, Layers } from "lucide-react";
import { cn } from "@/global/utils";
import { useGraphFolderOverviewController } from "@/domains/graph/shared/hooks/useGraphFolderOverviewController";
import { GraphFolderItemActionsMenu } from "@/domains/graph/components/GraphFolderItemActionsMenu";

interface FolderOverviewEditorProps {
  folderNode: Node;
  onUpdateFolder: (updated: Node) => void;
  onDeleteFolder: (folderId: string) => void;
}

export const FolderOverviewEditor: React.FC<FolderOverviewEditorProps> = ({
  folderNode,
  onUpdateFolder,
}) => {
  const ctrl = useGraphFolderOverviewController(folderNode);

  const renderItemActions = (item: Node) => (
    <GraphFolderItemActionsMenu
      item={item}
      canPublish={ctrl.canPublish}
      onOpenEditor={(n) => ctrl.openFile(n.id, n.name, "tab")}
      onOpenInGraph={ctrl.handleOpenInGraph}
      onStartRename={ctrl.startRename}
      onPublishFolderRecursive={ctrl.handlePublishFolderRecursive}
      onPublishSingleItem={ctrl.handlePublishSingleItem}
      onDeleteItem={ctrl.handleDeleteItem}
    />
  );

  const renderStatusBadge = (itemId: string) =>
    ctrl.publishedMap[itemId]?.status === "published" ? (
      <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[9px] px-1.5 py-0 gap-1 h-4">
        <CheckCircle className="w-2.5 h-2.5" /> Terbit
      </Badge>
    ) : (
      <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground h-4">Draf</Badge>
    );

  const renderNodeTitle = (item: Node) => {
    if (ctrl.editingId === item.id) {
      return (
        <div className="flex items-center gap-1.5 w-full min-w-0">
          <Input
            value={ctrl.editingName}
            onChange={(e) => ctrl.setEditingName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") ctrl.commitRename(item);
              if (e.key === "Escape") ctrl.setEditingId(null);
            }}
            autoFocus
            className="h-7 text-xs bg-background border-primary/50 focus-visible:ring-1 flex-1 min-w-0"
          />
          <Button size="icon" variant="ghost" onClick={() => ctrl.commitRename(item)} className="h-6 w-6 text-emerald-500 hover:text-emerald-600 shrink-0">
            <Check className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => ctrl.setEditingId(null)} className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      );
    }

    const Icon = item.type === "folder" ? Folder : item.type === "media" || item.type === "pdf" ? Image : FileText;
    const iconColor = item.type === "folder" ? "text-amber-500" : item.type === "media" || item.type === "pdf" ? "text-emerald-500" : "text-blue-500";

    return (
      <button
        type="button"
        onClick={() => ctrl.openFile(item.id, item.name, "tab")}
        className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors text-left font-medium text-xs leading-snug group w-full min-w-0 overflow-hidden"
      >
        <Icon className={cn("w-3.5 h-3.5 shrink-0", iconColor)} />
        <span className="truncate block min-w-0 flex-1 group-hover:underline">{item.name}</span>
      </button>
    );
  };

  return (
    <div className="w-full max-w-full min-w-0 flex flex-col gap-4 sm:gap-5 py-1 overflow-hidden">
      {/* Header Statistik & Deskripsi Folder */}
      <div className="w-full max-w-full min-w-0 rounded-lg border border-border/40 bg-muted/15 p-3 sm:p-3.5 space-y-2 sm:space-y-2.5 overflow-hidden">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
          <Badge variant="outline" className="gap-1.5 font-medium bg-background/50 px-2.5 py-0.5">
            <Layers className="w-3.5 h-3.5 text-primary" />
            Total: {ctrl.stats.total} item
          </Badge>
          <Badge variant="outline" className="gap-1.5 font-medium bg-background/50 px-2.5 py-0.5">
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            {ctrl.stats.notes} Catatan
          </Badge>
          <Badge variant="outline" className="gap-1.5 font-medium bg-background/50 px-2.5 py-0.5">
            <Folder className="w-3.5 h-3.5 text-amber-500" />
            {ctrl.stats.subfolders} Subfolder
          </Badge>
          {ctrl.stats.media > 0 && (
            <Badge variant="outline" className="gap-1.5 font-medium bg-background/50 px-2.5 py-0.5">
              <Image className="w-3.5 h-3.5 text-emerald-500" />
              {ctrl.stats.media} Media
            </Badge>
          )}
        </div>

        <Textarea
          value={folderNode.content}
          onChange={(e) => onUpdateFolder({ ...folderNode, content: e.target.value })}
          placeholder="Tambahkan catatan atau deskripsi ringkas tentang folder ini..."
          className="w-full min-h-[50px] sm:min-h-[56px] max-h-[140px] bg-background/40 border-border/30 text-xs leading-relaxed placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-offset-0 focus:outline-none resize-y rounded-md"
        />
      </div>

      {/* Toolbar Pencarian & Publikasi */}
      <div className="w-full max-w-full min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
        <div className="relative flex-1 w-full md:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
          <Input
            value={ctrl.searchQuery}
            onChange={(e) => ctrl.setSearchQuery(e.target.value)}
            placeholder="Cari file atau catatan dalam folder..."
            className="h-8 pl-8 text-xs bg-muted/20 border-border/40 focus-visible:ring-1 focus-visible:ring-offset-0 w-full"
          />
        </div>

        {ctrl.canPublish && (
          <Button
            size="sm"
            variant="secondary"
            onClick={ctrl.handlePublishSelectedOnly}
            className="h-7 text-xs font-medium gap-1.5 flex-1 sm:flex-initial"
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Publikasikan Terpilih ({ctrl.selectedIds.size})</span>
          </Button>
        )}
      </div>

      {ctrl.selectedIds.size > 0 && (
        <div className="sticky top-2 z-20 w-full max-w-full min-w-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 sm:px-3.5 sm:py-2 rounded-lg bg-primary text-primary-foreground shadow-md animate-in fade-in slide-in-from-top-1 duration-150">
          <span className="text-xs font-medium">{ctrl.selectedIds.size} item dipilih</span>
          <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
            {ctrl.canPublish && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => ctrl.handlePublishFolderRecursive(folderNode)}
                className="h-7 text-xs font-medium gap-1.5 flex-1 sm:flex-initial"
              >
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Publikasikan Terpilih</span>
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={ctrl.clearSelection}
              className="h-7 text-xs text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary/80 shrink-0"
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      {/* Tampilan Mobile */}
      <div className="block md:hidden w-full max-w-full min-w-0 rounded-lg border border-border/60 overflow-hidden bg-background">
        <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/40 text-muted-foreground text-xs font-medium">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={ctrl.isAllSelected}
              onCheckedChange={ctrl.toggleSelectAll}
              aria-label="Pilih semua item"
            />
            <span>Pilih Semua ({ctrl.filteredChildren.length})</span>
          </label>
        </div>

        <div className="divide-y divide-border/20 w-full max-w-full">
          {ctrl.filteredChildren.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              {ctrl.searchQuery
                ? "Tidak ada file yang cocok dengan pencarian."
                : "Folder ini masih kosong."}
            </div>
          ) : (
            ctrl.filteredChildren.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 transition-colors w-full max-w-full min-w-0",
                  ctrl.selectedIds.has(item.id) ? "bg-muted/30" : "hover:bg-muted/15",
                )}
              >
                <Checkbox
                  checked={ctrl.selectedIds.has(item.id)}
                  onCheckedChange={() => ctrl.toggleSelectOne(item.id)}
                  aria-label={`Pilih ${item.name}`}
                />
                <div className="flex-1 min-w-0 max-w-full flex flex-col gap-1 overflow-hidden">
                  {renderNodeTitle(item)}
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <Badge variant="secondary" className="text-[9px] uppercase py-0 px-1 h-4">
                      {item.type}
                    </Badge>
                    {renderStatusBadge(item.id)}
                  </div>
                </div>
                <div className="shrink-0 flex items-center ml-auto pl-1">
                  {renderItemActions(item)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tampilan Desktop */}
      <div className="hidden md:block w-full max-w-full min-w-0 rounded-lg border border-border/60 overflow-hidden bg-background">
        <div className="w-full max-w-full min-w-0 overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
          <table className="w-full text-left text-xs border-collapse table-fixed">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30 text-muted-foreground font-medium">
                <th className="w-10 px-3 py-2 text-center shrink-0">
                  <Checkbox
                    checked={ctrl.isAllSelected}
                    onCheckedChange={ctrl.toggleSelectAll}
                    aria-label="Pilih semua item"
                  />
                </th>
                <th className="px-3 py-2 w-auto min-w-0 font-medium">Nama Dokumen</th>
                <th className="w-20 px-3 py-2 shrink-0">Tipe</th>
                <th className="w-28 px-3 py-2 shrink-0">Status Web</th>
                <th className="w-14 px-3 py-2 text-right shrink-0">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {ctrl.filteredChildren.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    {ctrl.searchQuery
                      ? "Tidak ada file yang cocok dengan pencarian."
                      : "Folder ini masih kosong."}
                  </td>
                </tr>
              ) : (
                ctrl.filteredChildren.map((item) => (
                  <tr
                    key={item.id}
                    className={cn(
                      "group transition-colors hover:bg-muted/20",
                      ctrl.selectedIds.has(item.id) && "bg-muted/30",
                    )}
                  >
                    <td className="w-10 px-3 py-2 text-center shrink-0">
                      <Checkbox
                        checked={ctrl.selectedIds.has(item.id)}
                        onCheckedChange={() => ctrl.toggleSelectOne(item.id)}
                        aria-label={`Pilih ${item.name}`}
                      />
                    </td>
                    <td className="px-3 py-2 font-medium max-w-0 overflow-hidden">
                      {renderNodeTitle(item)}
                    </td>
                    <td className="w-20 px-3 py-2 shrink-0">
                      <Badge variant="secondary" className="text-[9px] uppercase py-0 px-1.5 h-4">
                        {item.type}
                      </Badge>
                    </td>
                    <td className="w-28 px-3 py-2 shrink-0">{renderStatusBadge(item.id)}</td>
                    <td className="w-14 px-3 py-2 text-right shrink-0">
                      {renderItemActions(item)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BulkPublishModal
        open={Boolean(ctrl.bulkModalFolder)}
        onOpenChange={(isOpen) => {
          if (!isOpen) ctrl.closeBulkModal();
        }}
        folderNode={ctrl.bulkModalFolder as any}
        allNodes={ctrl.nodes as any}
        currentVaultId={ctrl.currentVaultId}
        selectedNodeIds={ctrl.selectedForPublishIds}
      />
    </div>
  );
};
