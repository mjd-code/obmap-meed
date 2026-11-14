import { useState } from "react";
import { Type, Keyboard, Sparkles, LayoutPanelTop } from "lucide-react";
import { useIsMobile } from "@/global/hooks/useMobile";
import {
  useEditorSettingsStore,
  type EditorFontFamily,
} from "@/domains/editor/shared/stores/useEditorSettingsStore";

export const EDITOR_SETTINGS_TABS = [
  { value: "appearance", icon: Type, label: "Look" },
  { value: "behavior", icon: Keyboard, label: "Typing" },
  { value: "suggestions", icon: Sparkles, label: "Assist" },
  { value: "toolbar", icon: LayoutPanelTop, label: "Toolbar" },
] as const;

export interface SettingToggleDescriptor {
  key: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function useEditorSettingsContentController() {
  const [activeTab, setActiveTab] = useState("appearance");
  const {
    appearance,
    behavior,
    suggestions,
    toolbar,
    updateAppearance,
    updateBehavior,
    updateSuggestions,
    updateToolbar,
    updateToolbarGroup,
  } = useEditorSettingsStore();

  const appearanceToggles: SettingToggleDescriptor[] = [
    {
      key: "showLineNumbers",
      label: "Line numbers",
      checked: appearance.showLineNumbers,
      onChange: (v) => updateAppearance({ showLineNumbers: v }),
    },
    {
      key: "highlightActiveLine",
      label: "Highlight current line",
      checked: appearance.highlightActiveLine,
      onChange: (v) => updateAppearance({ highlightActiveLine: v }),
    },
    {
      key: "highlightSelectionMatches",
      label: "Highlight matching text",
      checked: appearance.highlightSelectionMatches,
      onChange: (v) => updateAppearance({ highlightSelectionMatches: v }),
    },
  ];

  const behaviorTogglesAfterIndent: SettingToggleDescriptor[] = [
    {
      key: "tabIndents",
      label: "Tab key indents",
      checked: behavior.tabIndents,
      onChange: (v) => updateBehavior({ tabIndents: v }),
    },
    {
      key: "autoCloseBrackets",
      label: "Auto-close brackets",
      checked: behavior.autoCloseBrackets,
      onChange: (v) => updateBehavior({ autoCloseBrackets: v }),
    },
    {
      key: "bracketMatching",
      label: "Match brackets",
      checked: behavior.bracketMatching,
      onChange: (v) => updateBehavior({ bracketMatching: v }),
    },
    {
      key: "indentOnInput",
      label: "Smart indent while typing",
      checked: behavior.indentOnInput,
      onChange: (v) => updateBehavior({ indentOnInput: v }),
    },
    {
      key: "spellcheck",
      label: "Spell check",
      checked: behavior.spellcheck,
      onChange: (v) => updateBehavior({ spellcheck: v }),
    },
  ];

  const nestedSuggestionToggles: SettingToggleDescriptor[] = [
    {
      key: "activateOnTyping",
      label: "Show while typing",
      checked: suggestions.activateOnTyping,
      onChange: (v) => updateSuggestions({ activateOnTyping: v }),
    },
    {
      key: "wikilinks",
      label: "Note links [[...]]",
      checked: suggestions.wikilinks,
      onChange: (v) => updateSuggestions({ wikilinks: v }),
    },
    {
      key: "tags",
      label: "Tags #...",
      checked: suggestions.tags,
      onChange: (v) => updateSuggestions({ tags: v }),
    },
    {
      key: "properties",
      label: "Properties",
      description: "Show suggestions while editing property names and values.",
      checked: suggestions.properties,
      onChange: (v) => updateSuggestions({ properties: v }),
    },
  ];

  const toolbarGroupToggles: SettingToggleDescriptor[] = [
    {
      key: "format",
      label: "Bold / italic / code",
      checked: toolbar.groups.format,
      onChange: (v) => updateToolbarGroup("format", v),
    },
    {
      key: "headings",
      label: "Headings",
      checked: toolbar.groups.headings,
      onChange: (v) => updateToolbarGroup("headings", v),
    },
    {
      key: "blocks",
      label: "Lists & quotes",
      checked: toolbar.groups.blocks,
      onChange: (v) => updateToolbarGroup("blocks", v),
    },
    {
      key: "insert",
      label: "Links, tables & math",
      checked: toolbar.groups.insert,
      onChange: (v) => updateToolbarGroup("insert", v),
    },
  ];

  const handleFontChange = (fontFamily: string) =>
    updateAppearance({ fontFamily: fontFamily as EditorFontFamily });

  const handleContentWidthChange = (raw: string) =>
    updateAppearance({
      contentWidth: Math.min(160, Math.max(40, Number(raw) || 40)),
    });

  const handleAutoSaveDelayChange = (raw: string) =>
    updateBehavior({
      autoSaveDelay: Math.min(10000, Math.max(200, Number(raw) || 200)),
    });

  return {
    activeTab,
    setActiveTab,
    appearance,
    behavior,
    suggestions,
    toolbar,
    updateAppearance,
    updateBehavior,
    updateSuggestions,
    updateToolbar,
    appearanceToggles,
    behaviorTogglesAfterIndent,
    nestedSuggestionToggles,
    toolbarGroupToggles,
    handleFontChange,
    handleContentWidthChange,
    handleAutoSaveDelayChange,
  };
}

export function useEditorSettingsController() {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const { suggestions, toolbar, behavior, reset } = useEditorSettingsStore();

  const enabledCount =
    Number(suggestions.enabled) +
    Number(toolbar.showToolbar) +
    Number(toolbar.showProperties) +
    Number(behavior.lineWrapping);

  return {
    isOpen,
    setIsOpen,
    isMobile,
    enabledCount,
    reset,
  };
}
