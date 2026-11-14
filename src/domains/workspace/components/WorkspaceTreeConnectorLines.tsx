import React from "react";
import { cn } from "@/global/utils";
import { Folder, FileText, Image, Music, Video } from "lucide-react";
import type { ExplorerNode } from "@/domains/workspace/shared/hooks/useWorkspaceFileExplorerController";

export const TREE_INDENT_WIDTH = 16;

// Sesuaikan fungsi getExplorerNodeIcon agar menangani node bertipe "pdf" maupun mediaType "pdf":
export const getExplorerNodeIcon = (node: ExplorerNode) => {
  if (node.type === "folder") {
    return <Folder className="w-4 h-4 shrink-0 text-yellow-500" />;
  }
  if (
    node.type === "pdf" ||
    (node.type === "media" && node.mediaType === "pdf")
  ) {
    return <FileText className="w-4 h-4 shrink-0 text-rose-500" />;
  }
  if (node.type === "media") {
    if (node.mediaType === "image") {
      return <Image className="w-4 h-4 shrink-0 text-emerald-500" />;
    }
    if (node.mediaType === "audio") {
      return <Music className="w-4 h-4 shrink-0 text-purple-500" />;
    }
    if (node.mediaType === "video") {
      return <Video className="w-4 h-4 shrink-0 text-red-500" />;
    }
  }
  return <FileText className="w-4 h-4 shrink-0 text-primary" />;
};

interface WorkspaceTreeConnectorLinesProps {
  level: number;
  parentLines: boolean[];
  isLastChild: boolean;
  hasChildren: boolean;
  siblingIndex: number;
  targetSiblingIndex: number;
}

/** Declarative orthogonal connector lines rendered left of nested tree rows. */
export const WorkspaceTreeConnectorLines: React.FC<
  WorkspaceTreeConnectorLinesProps
> = ({
  level,
  parentLines,
  isLastChild,
  hasChildren,
  siblingIndex,
  targetSiblingIndex,
}) => {
  if (level <= 0) return null;

  const isTopVerticalActive =
    targetSiblingIndex !== -1 && siblingIndex <= targetSiblingIndex;
  const isHorizontalActive =
    targetSiblingIndex !== -1 && siblingIndex === targetSiblingIndex;
  const isBottomVerticalActive =
    targetSiblingIndex !== -1 && siblingIndex < targetSiblingIndex;

  const connectorLeft = (level - 1) * TREE_INDENT_WIDTH + 14;
  const activeLineClass =
    "bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)] z-10";

  return (
    <div className="absolute left-0 top-0 bottom-0 pointer-events-none">
      {parentLines.map(
        (showLine, idx) =>
          showLine && (
            <div
              key={idx}
              className="absolute w-[1px] bg-border/40"
              style={{
                left: `${idx * TREE_INDENT_WIDTH + 14}px`,
                top: 0,
                bottom: 0,
              }}
            />
          ),
      )}

      {/* Segmen Vertikal Atas (0px -> 14px) */}
      <div
        className={cn(
          "absolute w-[1px] transition-colors duration-150",
          isTopVerticalActive ? activeLineClass : "bg-border/40",
        )}
        style={{
          left: `${connectorLeft}px`,
          top: 0,
          height: "14px",
        }}
      />

      {/* Konektor Horizontal ke Node (14px) */}
      <div
        className={cn(
          "absolute h-[1px] transition-colors duration-150",
          isHorizontalActive ? activeLineClass : "bg-border/40",
        )}
        style={{
          left: `${connectorLeft}px`,
          width: hasChildren ? "12px" : "26px",
          top: "14px",
        }}
      />

      {/* Segmen Vertikal Bawah (14px -> 100%) */}
      {!isLastChild && (
        <div
          className={cn(
            "absolute w-[1px] transition-colors duration-150",
            isBottomVerticalActive ? activeLineClass : "bg-border/40",
          )}
          style={{
            left: `${connectorLeft}px`,
            top: "14px",
            bottom: 0,
          }}
        />
      )}
    </div>
  );
};
