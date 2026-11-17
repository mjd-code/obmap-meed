import { useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/global/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/global/ui/popover";
import {
  GraphNodeContextStyleMenu,
  type GraphNodeContextStyleMenuProps,
} from "@/domains/graph/components/GraphNodeContextStyleMenu";

/**
 * Trigger button and popover container for per-node Style & Format actions inside ContextualToolbar.
 */
export function GraphNodeContextStylePopover(props: GraphNodeContextStyleMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 w-7 rounded-full p-0 hover:bg-accent/50 ${
            open ? "bg-accent text-primary" : "text-foreground"
          }`}
          title="Style & Format Node"
          aria-label="Style & Format Node"
        >
          <Palette className="h-3.5 w-3.5 text-primary" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={10}
        className="w-[276px] max-w-[calc(100vw-1.5rem)] p-3 rounded-xl border-border/80 bg-popover/95 backdrop-blur-md shadow-2xl z-50"
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
      >
        <GraphNodeContextStyleMenu {...props} />
      </PopoverContent>
    </Popover>
  );
}
