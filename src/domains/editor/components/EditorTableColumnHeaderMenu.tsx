import React from "react";
import {
  ArrowUpAZ,
  ArrowDownZA,
  ArrowLeft,
  ArrowRight,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Trash2,
  Pin,
  WrapText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/global/ui/dropdown-menu";

interface EditorTableColumnHeaderMenuProps {
  colIndex: number;
  readOnly: boolean;
  columnsCount: number;
  isPinned: boolean;
  isWrapped: boolean;
  onSort: (colIndex: number, direction: "asc" | "desc") => void;
  onTogglePin: (colIndex: number) => void;
  onToggleWrap: (colIndex: number) => void;
  onAddColumn: (targetIndex: number) => void;
  onAlign: (colIndex: number, alignment: "left" | "center" | "right") => void;
  onDuplicateColumn: (colIndex: number) => void;
  onDeleteColumn: (colIndex: number) => void;
}

export const EditorTableColumnHeaderMenu: React.FC<
  EditorTableColumnHeaderMenuProps
> = ({
  colIndex,
  readOnly,
  columnsCount,
  isPinned,
  isWrapped,
  onSort,
  onTogglePin,
  onToggleWrap,
  onAddColumn,
  onAlign,
  onDuplicateColumn,
  onDeleteColumn,
}) => {
  return (
    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover/th:opacity-100 transition-opacity">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="px-1 py-0.2 rounded bg-muted/90 text-muted-foreground hover:bg-primary hover:text-primary-foreground text-[9px] shadow-sm cursor-pointer"
            title="Opsi Kolom"
          >
            :::
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          className="w-48 p-1 text-[11px] backdrop-blur-md"
        >
          <DropdownMenuItem
            className="py-1 px-2 text-[11px] gap-2 cursor-pointer"
            onClick={() => onSort(colIndex, "asc")}
          >
            <ArrowUpAZ className="w-3.5 h-3.5 opacity-70" />
            <span>Sort by column (A to Z)</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="py-1 px-2 text-[11px] gap-2 cursor-pointer"
            onClick={() => onSort(colIndex, "desc")}
          >
            <ArrowDownZA className="w-3.5 h-3.5 opacity-70" />
            <span>Sort by column (Z to A)</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-0.5" />

          <DropdownMenuItem
            className="py-1 px-2 text-[11px] gap-2 cursor-pointer"
            onClick={() => onTogglePin(colIndex)}
          >
            <Pin className="w-3.5 h-3.5 opacity-70" />
            <span>
              {isPinned
                ? "Unfreeze column"
                : "Freeze column (pin to start)"}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="py-1 px-2 text-[11px] gap-2 cursor-pointer"
            onClick={() => onToggleWrap(colIndex)}
          >
            <WrapText className="w-3.5 h-3.5 opacity-70" />
            <span>
              {isWrapped
                ? "Unwrap text (single line)"
                : "Wrap text (multi-line)"}
            </span>
          </DropdownMenuItem>

          {!readOnly && (
            <>
              <DropdownMenuSeparator className="my-0.5" />
              <DropdownMenuItem
                className="py-1 px-2 text-[11px] gap-2 cursor-pointer"
                onClick={() => onAddColumn(colIndex)}
              >
                <ArrowLeft className="w-3.5 h-3.5 opacity-70" />
                <span>Add column to left</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="py-1 px-2 text-[11px] gap-2 cursor-pointer"
                onClick={() => onAddColumn(colIndex + 1)}
              >
                <ArrowRight className="w-3.5 h-3.5 opacity-70" />
                <span>Add column to right</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-0.5" />
              <DropdownMenuItem
                className="py-1 px-2 text-[11px] gap-2 cursor-pointer"
                onClick={() => onAlign(colIndex, "left")}
              >
                <AlignLeft className="w-3.5 h-3.5 opacity-70" />
                <span>Align left</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="py-1 px-2 text-[11px] gap-2 cursor-pointer"
                onClick={() => onAlign(colIndex, "center")}
              >
                <AlignCenter className="w-3.5 h-3.5 opacity-70" />
                <span>Align center</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="py-1 px-2 text-[11px] gap-2 cursor-pointer"
                onClick={() => onAlign(colIndex, "right")}
              >
                <AlignRight className="w-3.5 h-3.5 opacity-70" />
                <span>Align right</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-0.5" />
              <DropdownMenuItem
                className="py-1 px-2 text-[11px] gap-2 cursor-pointer"
                onClick={() => onDuplicateColumn(colIndex)}
              >
                <Copy className="w-3.5 h-3.5 opacity-70" />
                <span>Duplicate column</span>
              </DropdownMenuItem>

              {columnsCount > 1 && (
                <DropdownMenuItem
                  className="py-1 px-2 text-[11px] gap-2 text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => onDeleteColumn(colIndex)}
                >
                  <Trash2 className="w-3.5 h-3.5 opacity-70" />
                  <span>Delete column</span>
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
