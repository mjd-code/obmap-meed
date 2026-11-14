import React from "react";
import type { Node } from "@/domains/graph/shared/utils/graph.types";
import { Button } from "@/global/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/global/ui/dropdown-menu";
import {
  Globe,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Edit2,
  FolderTree,
  Network,
} from "lucide-react";

interface GraphFolderItemActionsMenuProps {
  item: Node;
  canPublish: boolean;
  onOpenEditor: (item: Node) => void;
  onOpenInGraph: (item: Node) => void;
  onStartRename: (item: Node) => void;
  onPublishFolderRecursive: (item: Node) => void;
  onPublishSingleItem: (item: Node) => void;
  onDeleteItem: (itemId: string) => void;
}

export const GraphFolderItemActionsMenu: React.FC<GraphFolderItemActionsMenuProps> = ({
  item,
  canPublish,
  onOpenEditor,
  onOpenInGraph,
  onStartRename,
  onPublishFolderRecursive,
  onPublishSingleItem,
  onDeleteItem,
}) => {
  const isFile = item.type === "file";
  const isFolder = item.type === "folder";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 sm:h-7 sm:w-7 opacity-100 sm:opacity-80 hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground active:bg-muted/40 shrink-0"
          aria-label={`Aksi untuk ${item.name}`}
        >
          <MoreHorizontal className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 text-xs">
        <DropdownMenuItem onClick={() => onOpenEditor(item)} className="text-xs">
          <ExternalLink className="w-3.5 h-3.5 mr-2" />
          Buka di Editor
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onOpenInGraph(item)}
          className="text-xs cursor-pointer"
        >
          <Network className="w-3.5 h-3.5 mr-2 text-primary" />
          Buka di Tab Graph
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onStartRename(item)} className="text-xs">
          <Edit2 className="w-3.5 h-3.5 mr-2" />
          Ubah Nama
        </DropdownMenuItem>

        {isFolder && canPublish && (
          <DropdownMenuItem
            onClick={() => onPublishFolderRecursive(item)}
            className="text-xs text-primary focus:text-primary font-medium"
          >
            <FolderTree className="w-3.5 h-3.5 mr-2" />
            Publikasikan Subfolder (Rekursif)
          </DropdownMenuItem>
        )}

        {isFile && canPublish && (
          <DropdownMenuItem
            onClick={() => onPublishSingleItem(item)}
            className="text-xs text-primary focus:text-primary"
          >
            <Globe className="w-3.5 h-3.5 mr-2" />
            Publikasikan Catatan Ini
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDeleteItem(item.id)}
          className="text-xs text-destructive focus:text-destructive"
        >
          <Trash2 className="w-3.5 h-3.5 mr-2" />
          Hapus
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
