import { useState, useRef, useEffect, useCallback } from "react";
import { TableData, TableColumn } from "@/domains/editor/shared/utils/tableTypes";
import {
  parseMarkdownTable,
  stringifyMarkdownTable,
} from "@/domains/editor/shared/utils/tableParser";

interface UseEditorInteractiveTableControllerProps {
  initialMarkdown?: string;
  tableData?: TableData;
  readOnly?: boolean;
  onChange?: (newMarkdown: string) => void;
}

export function useEditorInteractiveTableController({
  initialMarkdown = "",
  tableData: propTableData,
  readOnly = false,
  onChange,
}: UseEditorInteractiveTableControllerProps) {
  const [data, setData] = useState<TableData>(() => {
    if (propTableData) return propTableData;
    const parsed = parseMarkdownTable(initialMarkdown);
    return (
      parsed || {
        columns: [
          { id: "col_1", name: "Header 1", alignment: "left" },
          { id: "col_2", name: "Header 2", alignment: "left" },
        ],
        rows: [["", ""]],
      }
    );
  });

  const [colWidths, setColWidths] = useState<number[]>(() =>
    data.columns.map((c) => c.width || 140),
  );
  const [rowHeights, setRowHeights] = useState<number[]>(() =>
    data.rows.map(() => 34),
  );
  const [pinnedColIndex, setPinnedColIndex] = useState<number | null>(null);
  const [wrapStates, setWrapStates] = useState<boolean[]>(() =>
    data.columns.map((c) => Boolean(c.wrap)),
  );

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (propTableData) {
      setData(propTableData);
      setColWidths(propTableData.columns.map((c) => c.width || 140));
      setRowHeights(propTableData.rows.map(() => 34));
      setWrapStates(propTableData.columns.map((c) => Boolean(c.wrap)));
    }
  }, [propTableData]);

  const emitChange = useCallback(
    (nextData: TableData) => {
      setData(nextData);
      const nextMd = stringifyMarkdownTable(nextData);
      onChange?.(nextMd);
    },
    [onChange],
  );

  const handleSort = (colIndex: number, direction: "asc" | "desc") => {
    const sortedRows = [...data.rows].sort((a, b) => {
      const valA = a[colIndex] || "";
      const valB = b[colIndex] || "";
      return direction === "asc"
        ? valA.localeCompare(valB, undefined, { numeric: true })
        : valB.localeCompare(valA, undefined, { numeric: true });
    });
    emitChange({ ...data, rows: sortedRows });
  };

  const togglePin = (colIndex: number) => {
    setPinnedColIndex((prev) => (prev === colIndex ? null : colIndex));
  };

  const toggleWrap = (colIndex: number) => {
    setWrapStates((prev) => {
      const next = [...prev];
      next[colIndex] = !next[colIndex];
      return next;
    });
  };

  const handleAddColumn = (targetIndex: number) => {
    if (readOnly) return;
    const colNum = data.columns.length + 1;
    const newCol: TableColumn = {
      id: `col_${Date.now()}`,
      name: `Kolom ${colNum}`,
      alignment: "left",
    };
    const nextCols = [...data.columns];
    nextCols.splice(targetIndex, 0, newCol);

    const nextRows = data.rows.map((row) => {
      const cells = [...row];
      cells.splice(targetIndex, 0, "");
      return cells;
    });

    setColWidths((prev) => {
      const next = [...prev];
      next.splice(targetIndex, 0, 140);
      return next;
    });
    setWrapStates((prev) => {
      const next = [...prev];
      next.splice(targetIndex, 0, false);
      return next;
    });

    emitChange({ ...data, columns: nextCols, rows: nextRows });
  };

  const handleDeleteColumn = (colIndex: number) => {
    if (readOnly || data.columns.length <= 1) return;
    const nextCols = data.columns.filter((_, i) => i !== colIndex);
    const nextRows = data.rows.map((row) => row.filter((_, i) => i !== colIndex));

    setColWidths((prev) => prev.filter((_, i) => i !== colIndex));
    setWrapStates((prev) => prev.filter((_, i) => i !== colIndex));
    if (pinnedColIndex === colIndex) setPinnedColIndex(null);

    emitChange({ ...data, columns: nextCols, rows: nextRows });
  };

  const handleAlign = (
    colIndex: number,
    alignment: "left" | "center" | "right",
  ) => {
    if (readOnly) return;
    const nextCols = data.columns.map((c, i) =>
      i === colIndex ? { ...c, alignment } : c,
    );
    emitChange({ ...data, columns: nextCols });
  };

  const handleDuplicateColumn = (colIndex: number) => {
    if (readOnly) return;
    const sourceCol = data.columns[colIndex];
    const newCol: TableColumn = {
      ...sourceCol,
      id: `col_${Date.now()}`,
      name: `${sourceCol.name} (Copy)`,
    };
    const nextCols = [...data.columns];
    nextCols.splice(colIndex + 1, 0, newCol);

    const nextRows = data.rows.map((row) => {
      const cells = [...row];
      cells.splice(colIndex + 1, 0, row[colIndex] || "");
      return cells;
    });

    setColWidths((prev) => {
      const next = [...prev];
      next.splice(colIndex + 1, 0, prev[colIndex] || 140);
      return next;
    });
    setWrapStates((prev) => {
      const next = [...prev];
      next.splice(colIndex + 1, 0, prev[colIndex]);
      return next;
    });

    emitChange({ ...data, columns: nextCols, rows: nextRows });
  };

  const handleColumnNameChange = (colIndex: number, name: string) => {
    const nextCols = data.columns.map((c, i) =>
      i === colIndex ? { ...c, name } : c,
    );
    emitChange({ ...data, columns: nextCols });
  };

  const handleAddRow = () => {
    if (readOnly) return;
    const newRow = data.columns.map(() => "");
    setRowHeights((prev) => [...prev, 34]);
    emitChange({ ...data, rows: [...data.rows, newRow] });
  };

  const handleDeleteRow = (rowIndex: number) => {
    if (readOnly) return;
    const nextRows = data.rows.filter((_, i) => i !== rowIndex);
    setRowHeights((prev) => prev.filter((_, i) => i !== rowIndex));
    emitChange({ ...data, rows: nextRows });
  };

  const handleCellChange = (rIdx: number, cIdx: number, val: string) => {
    const nextRows = data.rows.map((r, i) =>
      i === rIdx ? r.map((c, j) => (j === cIdx ? val : c)) : r,
    );
    emitChange({ ...data, rows: nextRows });
  };

  const handleStartColResize = (cIdx: number, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = colWidths[cIdx] || 140;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const delta = moveEvt.clientX - startX;
      const newWidth = Math.max(70, startWidth + delta);
      setColWidths((prev) => {
        const next = [...prev];
        next[cIdx] = newWidth;
        return next;
      });
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const handleStartRowResize = (rIdx: number, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startHeight = rowHeights[rIdx] || 34;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const delta = moveEvt.clientY - startY;
      const newHeight = Math.max(26, startHeight + delta);
      setRowHeights((prev) => {
        const next = [...prev];
        next[rIdx] = newHeight;
        return next;
      });
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  return {
    containerRef,
    data,
    colWidths,
    rowHeights,
    pinnedColIndex,
    wrapStates,
    handleSort,
    togglePin,
    toggleWrap,
    handleAddColumn,
    handleDeleteColumn,
    handleAlign,
    handleDuplicateColumn,
    handleColumnNameChange,
    handleAddRow,
    handleDeleteRow,
    handleCellChange,
    handleStartColResize,
    handleStartRowResize,
  };
}
