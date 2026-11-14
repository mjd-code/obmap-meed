import { useEffect, useMemo, useRef, useState } from "react";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import {
  createEditorExtensions,
  appearanceTheme,
  appearanceCompartment,
} from "@/domains/editor/shared/utils/cmSetup";
import { createEditorApi } from "@/domains/editor/shared/utils/editorApi";
import { setActiveEditor } from "@/domains/editor/shared/api/activeEditor";
import {
  countWords,
  splitDocument,
  replaceBody,
} from "@/domains/editor/shared/utils/frontmatterField";
import type { SuggestSource } from "@/domains/editor/shared/utils/suggestions";
import type { EditorApi, EditorMode } from "@/domains/editor/shared/utils/editor.types";
import { useNodeStore } from "@/global/stores";
import { useEditorSettingsStore } from "@/domains/editor/shared/stores/useEditorSettingsStore";
import {
  splitDocumentFootnotes,
  assembleDocumentWithFootnotes,
  upsertFootnoteDefinition,
} from "@/domains/editor/shared/utils/footnoteParser";

interface UseEditorMarkdownViewControllerProps {
  value: string;
  onChange: (next: string) => void;
  mode: EditorMode;
  placeholder?: string;
  onWikilinkClick?: (target: string) => void;
  onTagClick?: (tag: string) => void;
  onSave?: () => void;
}

export function useEditorMarkdownViewController({
  value,
  onChange,
  mode,
  placeholder,
  onWikilinkClick,
  onTagClick,
  onSave,
}: UseEditorMarkdownViewControllerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const valueRef = useRef(value);
  const changeRef = useRef(onChange);
  const saveRef = useRef(onSave);
  const handlersRef = useRef({ onWikilinkClick, onTagClick });
  const [api, setApi] = useState<EditorApi | null>(null);

  valueRef.current = value;
  changeRef.current = onChange;
  saveRef.current = onSave;
  handlersRef.current = { onWikilinkClick, onTagClick };

  const { cleanBody, definitionsMap } = useMemo(() => {
    const { body: rawBody } = splitDocument(value);
    return splitDocumentFootnotes(rawBody);
  }, [value]);

  const cleanBodyRef = useRef(cleanBody);
  cleanBodyRef.current = cleanBody;

  const definitionsMapRef = useRef(definitionsMap);
  definitionsMapRef.current = definitionsMap;

  const nodes = useNodeStore((state) => state.nodes);
  const suggestRef = useRef<SuggestSource>({ files: [], tags: [] });
  suggestRef.current = useMemo<SuggestSource>(() => {
    const tags = new Set<string>();
    nodes.forEach((n) => n.tags?.forEach((t) => tags.add(t)));
    return {
      files: nodes
        .filter((n) => n.type !== "folder")
        .map((n) => ({ name: n.name, type: n.type })),
      tags: Array.from(tags).sort(),
      properties: ["title", "tags", "aliases", "created", "updated", "status"],
    };
  }, [nodes]);

  const isReading = mode === "reading";

  const appearance = useEditorSettingsStore((s) => s.appearance);
  const behavior = useEditorSettingsStore((s) => s.behavior);
  const suggestions = useEditorSettingsStore((s) => s.suggestions);
  const toolbarSettings = useEditorSettingsStore((s) => s.toolbar);

  const settingsRef = useRef({ appearance, behavior, suggestions });
  settingsRef.current = { appearance, behavior, suggestions };

  const [editingPopover, setEditingPopover] = useState<{
    isOpen: boolean;
    label: string;
    virtualElement: { getBoundingClientRect: () => DOMRect } | null;
  }>({ isOpen: false, label: "", virtualElement: null });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const handleOpenPopover = (e: Event) => {
      const customEvt = e as CustomEvent<{ label: string; rect: DOMRect }>;
      const { label, rect } = customEvt.detail;
      setEditingPopover({
        isOpen: true,
        label,
        virtualElement: {
          getBoundingClientRect: () => rect,
        },
      });
    };

    host.addEventListener("open-footnote-popover", handleOpenPopover);
    return () => {
      host.removeEventListener("open-footnote-popover", handleOpenPopover);
    };
  }, []);

  const structuralKey = JSON.stringify({
    behavior,
    suggestions,
    lineNumbers: appearance.showLineNumbers,
    activeLine: appearance.highlightActiveLine,
    selectionMatches: appearance.highlightSelectionMatches,
  });

  useEffect(() => {
    if (isReading || !hostRef.current) return;

    const editorApi = createEditorApi(() => viewRef.current);
    const state = EditorState.create({
      doc: cleanBodyRef.current,
      extensions: createEditorExtensions({
        mode: mode === "live" ? "live" : "source",
        placeholder,
        settings: settingsRef.current,
        getSuggestSource: () => suggestRef.current,
        handlers: {
          onWikilinkClick: (t) => handlersRef.current.onWikilinkClick?.(t),
          onTagClick: (t) => handlersRef.current.onTagClick?.(t),
        },
        onChange: (nextCleanBody) => {
          isInternalChangeRef.current = true;
          cleanBodyRef.current = nextCleanBody;
          const bodyWithFootnotes = assembleDocumentWithFootnotes(
            nextCleanBody,
            definitionsMapRef.current,
          );
          const doc = replaceBody(valueRef.current, bodyWithFootnotes);
          valueRef.current = doc;
          changeRef.current(doc);
        },
        onSave: () => saveRef.current?.(),
      }),
    });

    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;
    setApi(editorApi);
    setActiveEditor(editorApi);

    return () => {
      view.destroy();
      viewRef.current = null;
      setApi(null);
      setActiveEditor(null);
    };
  }, [mode, isReading, placeholder, structuralKey]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: appearanceCompartment.reconfigure(appearanceTheme(appearance)),
    });
  }, [appearance]);

  const isInternalChangeRef = useRef(false);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();

    if (current === cleanBody) {
      isInternalChangeRef.current = false;
      return;
    }

    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }

    view.dispatch({
      changes: { from: 0, to: current.length, insert: cleanBody },
    });
  }, [cleanBody]);

  const words = useMemo(() => countWords(value), [value]);

  const handleSaveFootnote = (label: string, newText: string) => {
    const updatedDoc = upsertFootnoteDefinition(
      valueRef.current,
      label,
      newText,
    );
    changeRef.current(updatedDoc);
  };

  const handleJumpToCitation = () => {
    window.dispatchEvent(
      new CustomEvent("jump-to-citation-section", {
        detail: { label: editingPopover.label },
      }),
    );
  };

  const handleFocusEditor = () => {
    if (api) setActiveEditor(api);
  };

  return {
    hostRef,
    cleanBody,
    definitionsMap,
    isReading,
    toolbarSettings,
    editingPopover,
    setEditingPopover,
    words,
    handleSaveFootnote,
    handleJumpToCitation,
    handleFocusEditor,
  };
}
