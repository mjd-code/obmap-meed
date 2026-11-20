import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { INITIAL_APPEARANCE_STATE } from "../mockSettingsDefaults";
import type { PrototypeAppearanceState } from "../settingsTypes";
import type { AppearanceConfigBlock } from "../vcsAndConfigTypes";
import { applyPrototypeAppearanceTokens } from "./themeTokenApplier";

export function useAppearanceState() {
  const [state, setState] = useState<PrototypeAppearanceState>(() => ({
    ...INITIAL_APPEARANCE_STATE,
  }));
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyPrototypeAppearanceTokens(rootRef.current, state);
  }, [state]);

  const updateAppearance = useCallback((patch: Partial<PrototypeAppearanceState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetAppearance = useCallback(() => {
    setState({ ...INITIAL_APPEARANCE_STATE });
    toast.info("Pengaturan Appearance & Accessibility direset ke default.");
  }, []);

  const hydrateFromConfig = useCallback((block: AppearanceConfigBlock) => {
    setState({
      theme: block.theme,
      exploreCardDensity: block.explore_card_density,
      profileHeaderDisplay: block.profile_header_display,
      reducedMotion: block.accessibility.reduced_motion,
      highContrast: block.accessibility.high_contrast,
      screenReaderHints: block.accessibility.screen_reader_hints,
      editorFontFamily: block.editor.font_family,
      editorFontSizePx: block.editor.font_size_px,
      editorLineHeight: block.editor.line_height,
      editorMaxLineWidthCh: block.editor.max_line_width_ch,
      autoPairBrackets: block.editor.auto_pair_brackets,
      spellcheck: block.editor.spellcheck,
      keybindings: block.editor.keybindings,
      aiAssistantEnabled: block.writing_assistant.enabled,
      aiProvider: block.writing_assistant.provider,
      aiPersona: block.writing_assistant.persona,
      floatingFormattingToolbar: block.markdown_toolbar.floating_formatting_toolbar,
      slashCommands: block.markdown_toolbar.slash_commands,
      offlineCacheEnabled: block.system_sync.offline_cache_enabled,
      autoSyncIntervalSec: block.system_sync.auto_sync_interval_sec,
    });
  }, []);

  return {
    state,
    rootRef,
    updateAppearance,
    resetAppearance,
    hydrateFromConfig,
  };
}
