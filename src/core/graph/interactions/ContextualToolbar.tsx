import { 
  GitBranch, 
  Palette, 
  Plus, 
  Focus, 
  Trash2, 
  Check, 
  RotateCcw 
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import type { MindmapLayoutMode } from "../model/graphTypes";

const MINDMAP_STRUCTURES: { mode: MindmapLayoutMode; label: string }[] = [
  { mode: "mindmap", label: "Mindmap (Balanced)" },
  { mode: "org-chart", label: "Org Chart (Top-Down)" },
  { mode: "brace-map", label: "Brace Map (Left-Right)" },
  { mode: "fishbone", label: "Fishbone (Cause-Effect)" },
  { mode: "timeline", label: "Timeline (Sequential)" },
];

const PRESET_BRANCH_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", 
  "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"
];

interface ContextualToolbarProps {
  x: number;
  y: number;
  nodeId: string;
  nodeName: string;
  isFolder: boolean;
  currentOverride?: MindmapLayoutMode;
  currentColor?: string;
  isFocused: boolean;
  onSetStructure: (layout: MindmapLayoutMode | null) => void;
  onSetColor: (color: string | null) => void;
  onAddSub: () => void;
  onToggleFocus: () => void;
  onDelete: () => void;
}

export function ContextualToolbar({
  x,
  y,
  nodeId,
  nodeName,
  currentOverride,
  currentColor,
  isFocused,
  onSetStructure,
  onSetColor,
  onAddSub,
  onToggleFocus,
  onDelete,
}: ContextualToolbarProps) {
  const toolbarWidth = 260;
  
  // Clamping x dan y agar toolbar selalu di dalam viewport layar
  const clampedX = typeof window !== 'undefined'
    ? Math.max(toolbarWidth / 2 + 12, Math.min(window.innerWidth - toolbarWidth / 2 - 12, x))
    : x;

  const clampedY = typeof window !== 'undefined'
    ? Math.max(50, Math.min(window.innerHeight - 20, y - 18))
    : y - 18;

  return (
    <div
      className="absolute z-50 flex items-center gap-1 p-1 bg-card/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-lg animate-in fade-in zoom-in-95 duration-150 select-none pointer-events-auto"
      style={{
        left: `${clampedX}px`,
        top: `${clampedY}px`,
        transform: "translate(-50%, -100%)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Structure Override Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 hover:bg-accent/50">
            <GitBranch className="h-3.5 w-3.5 text-primary" />
            <span className="max-w-[85px] truncate font-medium">
              {currentOverride ?? "Structure"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52 text-xs">
          <DropdownMenuLabel>Subtree Layout Override</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {MINDMAP_STRUCTURES.map((s) => (
            <DropdownMenuItem
              key={s.mode}
              onClick={() => onSetStructure(s.mode)}
              className="flex items-center justify-between cursor-pointer"
            >
              <span>{s.label}</span>
              {currentOverride === s.mode && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          ))}
          {currentOverride && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onSetStructure(null)}
                className="text-muted-foreground gap-1.5 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                Reset to Tree Default
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="h-4 w-px bg-border my-auto" />

      {/* 2. Branch Color Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-accent/50" title="Change Branch Color">
            <Palette
              className="h-3.5 w-3.5"
              style={{ color: currentColor || "currentColor" }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-44 p-2">
          <div className="text-[11px] font-medium text-muted-foreground mb-2">
            Branch Color
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {PRESET_BRANCH_COLORS.map((c) => (
              <button
                key={c}
                className="h-6 w-6 rounded-md border border-border flex items-center justify-center transition-transform hover:scale-110"
                style={{ backgroundColor: c }}
                onClick={() => onSetColor(c)}
              >
                {currentColor === c && <Check className="h-3 w-3 text-white drop-shadow" />}
              </button>
            ))}
          </div>
          {currentColor && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 h-6 text-[11px] text-muted-foreground"
              onClick={() => onSetColor(null)}
            >
              Reset Color
            </Button>
          )}
        </PopoverContent>
      </Popover>

      <div className="h-4 w-px bg-border my-auto" />

      {/* 3. Add Sub-Node (Tab Shortcut) */}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs gap-1 hover:bg-accent/50"
        onClick={onAddSub}
        title="Add Sub-note (Tab)"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Sub</span>
      </Button>

      {/* 4. Focus Subtree */}
      <Button
        variant="ghost"
        size="sm"
        className={`h-7 w-7 p-0 hover:bg-accent/50 ${isFocused ? "text-primary" : ""}`}
        onClick={onToggleFocus}
        title={isFocused ? "Unfocus (Show All)" : "Focus Subtree"}
      >
        <Focus className="h-3.5 w-3.5" />
      </Button>

      {/* 5. Delete Node */}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
        onClick={onDelete}
        title="Delete Node (Delete)"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}