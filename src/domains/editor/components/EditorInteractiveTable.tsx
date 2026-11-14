import React from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/global/utils";
import type { TableData } from "@/domains/editor/shared/utils/tableTypes";
import { useEditorInteractiveTableController } from "@/domains/editor/shared/hooks/useEditorInteractiveTableController";
import { EditorTableColumnHeaderMenu } from "@/domains/editor/components/EditorTableColumnHeaderMenu";

interface InteractiveTableProps {
  initialMarkdown?: string;
  tableData?: TableData;
  readOnly?: boolean;
  onChange?: (newMarkdown: string) => void;
  className?: string;
}

export const InteractiveTable: React.FC<InteractiveTableProps> = ({
  initialMarkdown = "",
  tableData: propTableData,
  readOnly = false,
  onChange,
  className,
}) => {
  const ctrl = useEditorInteractiveTableController({
    initialMarkdown,
    tableData: propTableData,
    readOnly,
    onChange,
  });

  return (
    <div
      ref={ctrl.containerRef}
      className={cn(
        "my-3 w-full not-prose select-none relative group/table",
        className,
      )}
    >
      <div className="w-full max-w-full overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
        <table className="border-collapse border border-border/25 text-xs select-text table-fixed min-w-max">
          <colgroup>
            {ctrl.data.columns.map((_, cIdx) => (
              <col
                key={cIdx}
                style={{ width: `${ctrl.colWidths[cIdx] || 140}px` }}
              />
            ))}
            {!readOnly && <col style={{ width: "32px" }} />}
          </colgroup>

          <thead className="bg-muted/20 border-b border-border/40 font-semibold text-foreground select-none">
            <tr>
              {ctrl.data.columns.map((col, cIdx) => {
                const isPinned = ctrl.pinnedColIndex === cIdx;
                const isWrapped = ctrl.wrapStates[cIdx];

                return (
                  <th
                    key={col.id || cIdx}
                    className={cn(
                      "px-2 py-1.5 border-r border-border/25 relative group/th text-left font-medium",
                      col.alignment === "center" && "text-center",
                      col.alignment === "right" && "text-right",
                      isPinned &&
                        "sticky left-0 z-20 bg-background/95 backdrop-blur shadow-[2px_0_4px_rgba(0,0,0,0.1)]",
                    )}
                  >
                    <EditorTableColumnHeaderMenu
                      colIndex={cIdx}
                      readOnly={readOnly}
                      columnsCount={ctrl.data.columns.length}
                      isPinned={isPinned}
                      isWrapped={isWrapped}
                      onSort={ctrl.handleSort}
                      onTogglePin={ctrl.togglePin}
                      onToggleWrap={ctrl.toggleWrap}
                      onAddColumn={ctrl.handleAddColumn}
                      onAlign={ctrl.handleAlign}
                      onDuplicateColumn={ctrl.handleDuplicateColumn}
                      onDeleteColumn={ctrl.handleDeleteColumn}
                    />

                    {readOnly ? (
                      <div className="px-1 py-0.5 truncate text-foreground select-text">
                        {col.name}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={col.name}
                        onChange={(e) =>
                          ctrl.handleColumnNameChange(cIdx, e.target.value)
                        }
                        className="w-full bg-transparent border-none font-semibold text-foreground focus:outline-none focus:bg-muted/40 rounded px-1 py-0.5 truncate"
                      />
                    )}

                    <div
                      onPointerDown={(e) => ctrl.handleStartColResize(cIdx, e)}
                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 transition-colors z-10"
                    />
                  </th>
                );
              })}

              {!readOnly && (
                <th className="w-8 px-1 py-1 text-center align-middle border-l border-border/20">
                  <button
                    type="button"
                    onClick={() => ctrl.handleAddColumn(ctrl.data.columns.length)}
                    className="opacity-40 hover:opacity-100 text-muted-foreground hover:text-foreground text-xs font-bold transition-opacity px-1 rounded hover:bg-muted/40 cursor-pointer"
                    title="Tambah Kolom ke Kanan"
                  >
                    <Plus className="w-3.5 h-3.5 mx-auto" />
                  </button>
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/20">
            {ctrl.data.rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                style={{ height: `${ctrl.rowHeights[rIdx] || 34}px` }}
                className="even:bg-muted/5 hover:bg-muted/15 transition-colors relative group/row"
              >
                {row.map((cellVal, cIdx) => {
                  const isPinned = ctrl.pinnedColIndex === cIdx;
                  const isWrapped = ctrl.wrapStates[cIdx];
                  const col = ctrl.data.columns[cIdx];

                  return (
                    <td
                      key={cIdx}
                      className={cn(
                        "px-2 py-1 border-r border-border/20 align-top relative",
                        col?.alignment === "center" && "text-center",
                        col?.alignment === "right" && "text-right",
                        isPinned &&
                          "sticky left-0 z-10 bg-background/95 backdrop-blur shadow-[2px_0_4px_rgba(0,0,0,0.08)]",
                      )}
                    >
                      {readOnly ? (
                        <div
                          className={cn(
                            "px-1 py-0.5 text-xs text-foreground select-text",
                            isWrapped
                              ? "whitespace-normal break-words"
                              : "whitespace-nowrap truncate",
                          )}
                        >
                          {cellVal || "\u00A0"}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={cellVal}
                          onChange={(e) =>
                            ctrl.handleCellChange(rIdx, cIdx, e.target.value)
                          }
                          className={cn(
                            "w-full bg-transparent border-none text-foreground focus:outline-none focus:bg-muted/40 rounded px-1 py-0.5 text-xs",
                            isWrapped
                              ? "whitespace-normal"
                              : "whitespace-nowrap truncate",
                          )}
                        />
                      )}
                    </td>
                  );
                })}

                {!readOnly && (
                  <td className="w-8 px-1 py-1 text-center align-middle border-l border-border/20">
                    <button
                      type="button"
                      onClick={() => ctrl.handleDeleteRow(rIdx)}
                      className="opacity-0 group-hover/row:opacity-100 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded px-1 text-xs transition-opacity cursor-pointer"
                      title="Hapus Baris Ini"
                    >
                      <X className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  </td>
                )}

                <div
                  onPointerDown={(e) => ctrl.handleStartRowResize(rIdx, e)}
                  className="absolute left-0 right-0 bottom-0 h-1.5 cursor-row-resize hover:bg-primary/50 transition-colors z-10"
                />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <div className="pt-1 text-left">
          <button
            type="button"
            onClick={ctrl.handleAddRow}
            className="text-[11px] text-muted-foreground/60 hover:text-foreground font-medium px-1.5 py-0.5 rounded hover:bg-muted/30 transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3 opacity-70" />
            <span>Tambah Baris</span>
          </button>
        </div>
      )}
    </div>
  );
};
