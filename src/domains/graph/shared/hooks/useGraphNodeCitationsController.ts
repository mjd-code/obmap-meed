import { useState, useMemo, useEffect } from "react";
import {
  parseFootnotes,
  upsertFootnoteDefinition,
  deleteFootnoteDefinition,
} from "@/domains/editor/shared/utils/footnoteParser";

export interface UseGraphNodeCitationsControllerProps {
  content: string;
  onContentChange?: (updatedContent: string) => void;
  onChange?: (updatedContent: string) => void;
}

export function useGraphNodeCitationsController({
  content,
  onContentChange,
  onChange,
}: UseGraphNodeCitationsControllerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");

  const handleUpdate = onContentChange || onChange;

  const { definitions, unresolved, nextNumber } = useMemo(
    () => parseFootnotes(content),
    [content],
  );

  const totalCount = definitions.length + unresolved.length;

  useEffect(() => {
    const handleJumpEvent = (e: Event) => {
      const customEvt = e as CustomEvent<{ label?: string }>;
      const targetLabel = customEvt.detail?.label;

      setIsOpen(true);

      requestAnimationFrame(() => {
        setTimeout(() => {
          const target = targetLabel
            ? document.getElementById(`citation-def-${targetLabel}`) ||
              document.getElementById("node-citations-section")
            : document.getElementById("node-citations-section");

          if (!target) return;

          const viewport = target.closest(
            "[data-radix-scroll-area-viewport]",
          ) as HTMLElement | null;

          if (viewport) {
            const targetRect = target.getBoundingClientRect();
            const viewportRect = viewport.getBoundingClientRect();
            const relativeOffset = targetRect.top - viewportRect.top + viewport.scrollTop;

            viewport.scrollTo({
              top: Math.max(0, relativeOffset - 24),
              behavior: "smooth",
            });
          }

          target.classList.add("ring-2", "ring-primary/60", "bg-primary/10");
          setTimeout(() => {
            target.classList.remove("ring-2", "ring-primary/60", "bg-primary/10");
          }, 1500);
        }, 60);
      });
    };

    window.addEventListener("jump-to-citation-section", handleJumpEvent);
    return () => {
      window.removeEventListener("jump-to-citation-section", handleJumpEvent);
    };
  }, []);

  const handleStartEdit = (label: string, text: string) => {
    setEditingLabel(label);
    setDraftText(text);
  };

  const handleSaveEdit = (label: string) => {
    if (handleUpdate) {
      const nextContent = upsertFootnoteDefinition(content, label, draftText);
      handleUpdate(nextContent);
    }
    setEditingLabel(null);
  };

  const handleDelete = (label: string) => {
    if (handleUpdate) {
      const nextContent = deleteFootnoteDefinition(content, label);
      handleUpdate(nextContent);
    }
    if (editingLabel === label) setEditingLabel(null);
  };

  const handleAddNew = () => {
    const label = String(nextNumber);
    setEditingLabel(label);
    setDraftText("");
    setIsOpen(true);
  };

  return {
    isOpen,
    setIsOpen,
    editingLabel,
    setEditingLabel,
    draftText,
    setDraftText,
    definitions,
    unresolved,
    nextNumber,
    totalCount,
    handleStartEdit,
    handleSaveEdit,
    handleDelete,
    handleAddNew,
  };
}
