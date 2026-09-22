import { useEffect, useMemo, useRef, useState } from "react";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { cn } from "@/shared/lib";
import { EditorToolbar } from "@/core/editor/toolbar/EditorToolbar";
import { PropertiesPanel } from "@/core/editor/frontmatter/PropertiesPanel";
import {
  createEditorExtensions,
  appearanceTheme,
  appearanceCompartment,
} from "@/core/editor/cm/setup";
import { createEditorApi } from "@/core/editor/cm/state/editorApi";
import { setActiveEditor } from "@/core/editor/activeEditor";
import {
  countWords,
  splitDocument,
  replaceBody,
} from "@/core/editor/cm/extensions/frontmatterField";
import type { SuggestSource } from "@/core/editor/suggest/suggestions";
import type { EditorApi, EditorMode } from "@/core/editor/types";
import { useNodeStore } from "@/shared/stores";
import { useEditorSettingsStore } from "@/shared/stores/useEditorSettingsStore";
import { parseHeadings, type HeadingNode } from "@/core/editor/headings/headingTree";
import { FloatingToc } from "@/core/editor/headings/FloatingToc";
import { FoldableMarkdown } from "@/core/editor/headings/FoldableMarkdown";

interface MarkdownViewProps {
  value: string;
  onChange: (next: string) => void;
  mode?: EditorMode;
  placeholder?: string;
  showToolbar?: boolean;
  showProperties?: boolean;
  onWikilinkClick?: (target: string) => void;
  onTagClick?: (tag: string) => void;
  onSave?: () => void;
  className?: string;
  /** Rendered next to the source editor (split view). */
  sideBySide?: boolean;
}

export const MarkdownView = ({
  value,
  onChange,
  mode = "live",
  placeholder,
  showToolbar = true,
  showProperties = false,
  onWikilinkClick,
  onTagClick,
  onSave,
  className,
  sideBySide = false,
}: MarkdownViewProps) => {
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

  // The YAML frontmatter never reaches the text editor — it is edited
  // exclusively through the collapsible properties panel.
  const body = useMemo(() => splitDocument(value).body, [value]);
  const bodyRef = useRef(body);
  bodyRef.current = body;

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

  // Changing these requires rebuilding the extension set.
  const structuralKey = JSON.stringify({
    behavior,
    suggestions,
    lineNumbers: appearance.showLineNumbers,
    activeLine: appearance.highlightActiveLine,
    selectionMatches: appearance.highlightSelectionMatches,
  });

  // Mount / re-create the editor when the editing mode or structural settings change.
  useEffect(() => {
    if (isReading || !hostRef.current) return;

    const editorApi = createEditorApi(() => viewRef.current);
    const state = EditorState.create({
      doc: bodyRef.current,
      extensions: createEditorExtensions({
        mode: mode === "live" ? "live" : "source",
        placeholder,
        settings: settingsRef.current,
        getSuggestSource: () => suggestRef.current,
        handlers: {
          onWikilinkClick: (t) => handlersRef.current.onWikilinkClick?.(t),
          onTagClick: (t) => handlersRef.current.onTagClick?.(t),
        },
        onChange: (next) => {
          bodyRef.current = next;
          const doc = replaceBody(valueRef.current, next);
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

  // Live-apply font / spacing changes without rebuilding the editor.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: appearanceCompartment.reconfigure(appearanceTheme(appearance)),
    });
  }, [appearance]);

  // Keep the document in sync when the value changes from outside.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === body) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: body },
    });
  }, [body]);

  const words = useMemo(() => countWords(value), [value]);

  // ---- Table of contents -------------------------------------------------
  const headings = useMemo(() => parseHeadings(body), [body]);
  const [activeEditorHeading, setActiveEditorHeading] = useState<string | null>(null);
  const [activeReadHeading, setActiveReadHeading] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const headingsRef = useRef(headings);
  headingsRef.current = headings;

  // Track the heading closest to the top of the CodeMirror viewport.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const scroller = view.scrollDOM;
    const update = () => {
      const rect = scroller.getBoundingClientRect();
      const pos = view.posAtCoords({ x: rect.left + 8, y: rect.top + 8 });
      if (pos == null) return;
      const line = view.state.doc.lineAt(pos).number - 1;
      const list = headingsRef.current;
      let current: HeadingNode | null = null;
      for (const h of list) if (h.line <= line) current = h;
      setActiveEditorHeading(current?.id ?? list[0]?.id ?? null);
    };
    update();
    scroller.addEventListener("scroll", update, { passive: true });
    return () => scroller.removeEventListener("scroll", update);
  }, [api, headings.length]);

  // Track the heading closest to the top of the rendered preview.
  useEffect(() => {
    const host = previewRef.current;
    if (!host) return;
    const findScroller = (el: HTMLElement | null): HTMLElement | Window => {
      let node = el?.parentElement ?? null;
      while (node) {
        const overflow = getComputedStyle(node).overflowY;
        if ((overflow === "auto" || overflow === "scroll") && node.scrollHeight > node.clientHeight)
          return node;
        node = node.parentElement;
      }
      return window;
    };
    const scroller = findScroller(host);
    const update = () => {
      const top = host.getBoundingClientRect().top;
      const elements = Array.from(
        host.querySelectorAll<HTMLElement>("[data-heading-id]"),
      );
      let current: string | null = elements[0]?.dataset.headingId ?? null;
      for (const el of elements) {
        if (el.getBoundingClientRect().top - top <= 8)
          current = el.dataset.headingId ?? current;
      }
      setActiveReadHeading(current);
    };
    update();
    scroller.addEventListener("scroll", update, { passive: true });
    return () => scroller.removeEventListener("scroll", update);
  }, [body, isReading, sideBySide]);

  const scrollEditorTo = (heading: HeadingNode) => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      selection: { anchor: Math.min(heading.from, view.state.doc.length) },
      effects: EditorView.scrollIntoView(
        Math.min(heading.from, view.state.doc.length),
        { y: "start" },
      ),
    });
    view.focus();
  };

  const scrollPreviewTo = (heading: HeadingNode) => {
    const el = previewRef.current?.querySelector<HTMLElement>(
      `[data-heading-id="${CSS.escape(heading.id)}"]`,
    );
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("heading-flash");
    window.setTimeout(() => el.classList.remove("heading-flash"), 1200);
  };

  const editorSurface = (
    <div className="relative w-full">
      <div
        ref={hostRef}
        className="min-h-[50vh] w-full text-sm"
        onFocus={() => api && setActiveEditor(api)}
      />
      <FloatingToc
        headings={headings}
        activeId={activeEditorHeading}
        onSelect={scrollEditorTo}
      />
    </div>
  );

  const previewSurface = (
    <div ref={previewRef} className="relative">
      {body ? (
        <FoldableMarkdown
          content={body}
          onWikilinkClick={onWikilinkClick}
          onTagClick={onTagClick}
        />
      ) : (
        <p className="text-muted-foreground/30 text-sm italic">
          Nothing to preview
        </p>
      )}
      <FloatingToc
        headings={headings}
        activeId={activeReadHeading}
        onSelect={scrollPreviewTo}
      />
    </div>
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {showProperties && toolbarSettings.showProperties && (
        <PropertiesPanel value={value} onChange={onChange} />
      )}
      {/* {showToolbar && toolbarSettings.showToolbar && !isReading && (
        <EditorToolbar editor={api} groups={toolbarSettings.groups} />
      )} */}

      {isReading ? (
        <div className="prose-container min-h-[50vh] py-3">{previewSurface}</div>
      ) : sideBySide ? (
        <div className="grid grid-cols-2 gap-6 min-h-[50vh]">
          <div className="rounded-lg border border-border/30 bg-muted/20 overflow-hidden">
            {editorSurface}
          </div>
          <div className="rounded-lg border border-border/30 bg-muted/20 p-5 overflow-auto">
            {previewSurface}
          </div>
        </div>
      ) : (
        editorSurface
      )}

      {toolbarSettings.showWordCount && (
        <div className="px-1 text-[11px] text-muted-foreground/60">
          {words} {words === 1 ? "word" : "words"}
        </div>
      )}
    </div>
  );
};
