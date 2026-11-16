import { EditorState, Extension, Compartment } from "@codemirror/state";
import {
  EditorView,
  keymap,
  drawSelection,
  highlightActiveLine,
  lineNumbers,
  placeholder as placeholderExt,
  rectangularSelection,
  crosshairCursor,
} from "@codemirror/view";
import {
  history,
  defaultKeymap,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
import { markdown, markdownLanguage, insertNewlineContinueMarkup, deleteMarkupBackward } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import {
  bracketMatching,
  indentOnInput,
  indentUnit,
  foldNodeProp,
} from "@codemirror/language";

import { editorTheme, markdownHighlight } from "@/domains/editor/shared/utils/cmTheme";
import { headingFolding } from "@/domains/editor/shared/utils/headingFold";
import { livePreview, sourceHighlighting } from "@/domains/editor/shared/utils/livePreview";
import {
  wikilinkExtension,
  type LinkHandlers,
} from "@/domains/editor/shared/utils/wikilinkField";
import {
  frontmatterField,
  wordCountField,
} from "@/domains/editor/shared/utils/frontmatterField";
import {
  wikilinkCompletion,
  tagCompletion,
  slashCommandCompletion,
  type SuggestSource,
} from "@/domains/editor/shared/utils/suggestions";
import {
  defaultAppearanceConfig,
  FONT_FAMILY_CSS,
  type EditorAppearanceConfig,
  type EditorBehaviorConfig,
  type EditorSuggestionsConfig,
} from "@/domains/editor/shared/stores/useEditorSettingsStore";
import { Table as GfmTable } from "@lezer/markdown";
import { footnoteLivePreview } from "@/domains/editor/shared/utils/cmFootnoteWidget";


export interface EditorSettingsSnapshot {
  appearance: EditorAppearanceConfig;
  behavior: EditorBehaviorConfig;
  suggestions: EditorSuggestionsConfig;
}

export interface EditorSetupOptions {
  mode: "source" | "live";
  placeholder?: string;
  settings: EditorSettingsSnapshot;
  getSuggestSource: () => SuggestSource;
  handlers: LinkHandlers;
  onChange: (value: string) => void;
  onSave?: () => void;
}

/** Font / size / spacing driven by user settings and global `--vk-prose-*` tokens. */
export function appearanceTheme(appearance: EditorAppearanceConfig): Extension {
  const fontSizeCss =
    appearance.fontSize === defaultAppearanceConfig.fontSize
      ? `var(--vk-prose-size, ${appearance.fontSize}px)`
      : `${appearance.fontSize}px`;
  const lineHeightCss =
    appearance.lineHeight === defaultAppearanceConfig.lineHeight
      ? `var(--vk-prose-line-height, ${appearance.lineHeight})`
      : String(appearance.lineHeight);
  const maxWidthCss =
    appearance.contentWidth === defaultAppearanceConfig.contentWidth
      ? `var(--vk-prose-max-width, ${appearance.contentWidth}ch)`
      : `${appearance.contentWidth}ch`;

  return EditorView.theme({
    "&": { fontSize: fontSizeCss },
    ".cm-scroller": {
      fontFamily: FONT_FAMILY_CSS[appearance.fontFamily],
      lineHeight: lineHeightCss,
      letterSpacing: "var(--vk-prose-letter-spacing, 0em)",
    },
    ".cm-content": appearance.limitContentWidth
      ? {
          maxWidth: maxWidthCss,
          marginLeft: "auto",
          marginRight: "auto",
        }
      : {},
  });
}

export const appearanceCompartment = new Compartment();

export function createEditorExtensions(
  options: EditorSetupOptions,
): Extension[] {
  const { appearance, behavior, suggestions } = options.settings;

  const overrides = [
    suggestions.wikilinks ? wikilinkCompletion(options.getSuggestSource) : null,
    suggestions.tags ? tagCompletion(options.getSuggestSource) : null,
    suggestions.slashCommands ? slashCommandCompletion() : null,
  ].filter(Boolean) as ReturnType<typeof wikilinkCompletion>[];

  return [
    history(),
    footnoteLivePreview(),
    drawSelection(),
    rectangularSelection(),
    crosshairCursor(),
    ...(appearance.showLineNumbers ? [lineNumbers()] : []),
    ...(appearance.highlightActiveLine ? [highlightActiveLine()] : []),
    ...(appearance.highlightSelectionMatches
      ? [highlightSelectionMatches()]
      : []),
    ...(behavior.indentOnInput ? [indentOnInput()] : []),
    ...(behavior.bracketMatching ? [bracketMatching()] : []),
    ...(behavior.autoCloseBrackets ? [closeBrackets()] : []),
    ...(behavior.lineWrapping ? [EditorView.lineWrapping] : []),
    indentUnit.of(" ".repeat(Math.max(1, behavior.indentUnit))),
    EditorState.tabSize.of(Math.max(1, behavior.indentUnit)),
    EditorView.contentAttributes.of({
      spellcheck: behavior.spellcheck ? "true" : "false",
    }),
    placeholderExt(options.placeholder ?? "Write '/' or start writing..."),
    markdown({
      base: markdownLanguage,
      codeLanguages: languages,
      addKeymap: true,
      extensions: [
        GfmTable,
        {
          props: [
            // Menonaktifkan folding otomatis untuk paragraph & blok non-heading
            foldNodeProp.add(() => () => null),
          ],
        },
      ],
    }),
    markdownHighlight,
    headingFolding(),
    editorTheme,
    appearanceCompartment.of(appearanceTheme(appearance)),
    frontmatterField,
    wordCountField,
    ...(suggestions.enabled && overrides.length
      ? [
          autocompletion({
            activateOnTyping: suggestions.activateOnTyping,
            icons: false,
            // 1. Render kustom ikon Notion-style untuk slash menu
            addToOptions: [
              {
                render(completion) {
                  const anyComp = completion as any;
                  if (!anyComp.iconSvg) return null;
                  const iconEl = document.createElement("span");
                  iconEl.className =
                    "cm-custom-icon mr-2.5 inline-flex items-center justify-center w-6 h-6 rounded-md bg-muted/60 text-foreground border border-border/40 shrink-0 text-xs";
                  iconEl.innerHTML = anyComp.iconSvg;
                  return iconEl;
                },
                position: 20, // Tampil sebelum label (label ada di posisi 50)
              },
            ],
            override: overrides,
          }),
        ]
      : []),
    ...wikilinkExtension(options.handlers),
    ...(options.mode === "live" ? livePreview() : sourceHighlighting()),
    keymap.of([
      { key: "Enter", run: insertNewlineContinueMarkup },
      { key: "Backspace", run: deleteMarkupBackward },
      { key: "Tab", run: indentWithTab.run },
      { key: "Shift-Tab", run: indentWithTab.run },
      {
        key: "Mod-s",
        preventDefault: true,
        run: () => {
          options.onSave?.();
          return true;
        },
      },
      ...(behavior.autoCloseBrackets ? closeBracketsKeymap : []),
      ...completionKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...defaultKeymap,
    ]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) options.onChange(update.state.doc.toString());
    }),
  ];
}

export function createEditorState(
  doc: string,
  extensions: Extension[],
): EditorState {
  return EditorState.create({ doc, extensions });
}
