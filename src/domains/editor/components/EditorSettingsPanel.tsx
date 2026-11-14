/**
 * EditorSettingsPanel - Unified editor configuration (mirrors the Graph Config panel).
 */

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/global/ui/sheet";
import { Button } from "@/global/ui/button";
import { Badge } from "@/global/ui/badge";
import { Pencil, RotateCcw } from "lucide-react";
import { EditorSettingsContent } from "@/domains/editor/components/EditorSettingsTabs";
import { useEditorSettingsController } from "@/domains/editor/shared/hooks/useEditorSettingsController";

export { EditorSettingsContent };

interface EditorSettingsPanelProps {
  variant?: "default" | "compact";
}

export function EditorSettingsPanel({
  variant = "compact",
}: EditorSettingsPanelProps) {
  const ctrl = useEditorSettingsController();

  const trigger =
    variant === "compact" ? (
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2"
      >
        <Pencil className="w-4 h-4" />
        <span className="flex-1 text-left">Configure</span>
        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
          {ctrl.enabledCount}
        </Badge>
      </Button>
    ) : (
      <Button variant="outline" className="shadow-lg gap-2">
        <Pencil className="w-4 h-4" />
        Editor Settings
      </Button>
    );

  return (
    <Sheet open={ctrl.isOpen} onOpenChange={ctrl.setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side={ctrl.isMobile ? "bottom" : "right"}
        className={
          ctrl.isMobile
            ? "h-[85vh] max-h-[85vh] rounded-t-2xl p-0"
            : "w-full max-w-[420px] p-0"
        }
      >
        <div className="flex flex-col h-full overflow-hidden">
          <SheetHeader className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-background/95">
            <div className="flex items-center justify-between gap-2">
              <SheetTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Pencil className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span className="truncate">Editor Settings</span>
              </SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={ctrl.reset}
                className="text-muted-foreground hover:text-foreground h-8 px-2 sm:px-3"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline text-xs">Reset</span>
              </Button>
            </div>
          </SheetHeader>

          <EditorSettingsContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}
