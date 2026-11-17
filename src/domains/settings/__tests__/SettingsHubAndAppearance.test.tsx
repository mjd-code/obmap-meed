import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { SettingsHub } from '@/domains/settings/components/SettingsHub';
import { WorkspaceSettingsNavList } from '@/domains/workspace/components/WorkspaceSettingsNavList';
import {
  SETTINGS_SECTIONS,
  isSettingsSectionId,
} from '@/domains/settings/shared/utils/settingsNavigation';
import { useThemeStore } from '@/domains/settings/shared/stores/useThemeStore';

describe('UI-STEP-02: Single-Sidebar SettingsHub + Right Sidebar Navigation & Appearance Section', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    if (typeof globalThis.ResizeObserver === 'undefined') {
      globalThis.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }
  });

  beforeEach(() => {
    useThemeStore.getState().resetTheme();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('registers appearance and graph-engine in SETTINGS_SECTIONS and validates their IDs', () => {
    const ids = SETTINGS_SECTIONS.map((s) => s.id);
    expect(ids).toContain('appearance');
    expect(ids).toContain('graph-engine');
    expect(isSettingsSectionId('appearance')).toBe(true);
    expect(isSettingsSectionId('graph-engine')).toBe(true);
  });

  it('renders SettingsHub without an internal duplicate sidebar, 6 preset cards, WCAG preview, and wires WorkspaceSettingsNavList clicks cleanly', async () => {
    const onSelectSection = vi.fn();

    await act(async () => {
      root.render(
        <div className="flex h-[600px]">
          <div className="flex-1">
            <SettingsHub active="appearance" />
          </div>
          <WorkspaceSettingsNavList
            settingsSearch=""
            onSettingsSearchChange={vi.fn()}
            activeSettingsSection="appearance"
            filteredSections={null}
            onSelectSection={onSelectSection}
          />
        </div>,
      );
    });

    // No duplicate internal settings sidebar inside SettingsHub
    const innerAside = container.querySelector('aside[aria-label="Settings categories"]');
    expect(innerAside).toBeNull();

    const nav = container.querySelector('nav[aria-label="Settings navigation"]');
    expect(nav).not.toBeNull();
    expect(nav?.textContent).toContain('Appearance & Accessibility');
    expect(nav?.textContent).toContain('Graph Engine');

    const presetButtons = container.querySelectorAll('button[data-preset-id]');
    expect(presetButtons.length).toBe(6);

    const previewAside = container.querySelector('aside[aria-label="Live appearance preview"]');
    expect(previewAside).not.toBeNull();
    expect(previewAside?.textContent).toMatch(/WCAG (AA|AAA)/);

    const daylightBtn = container.querySelector<HTMLButtonElement>(
      'button[data-preset-id="daylight-paper"]',
    );
    expect(daylightBtn).not.toBeNull();
    await act(async () => {
      daylightBtn!.click();
    });

    expect(useThemeStore.getState().appearance.presetId).toBe('daylight-paper');
    expect(document.documentElement.getAttribute('data-theme')).toBe('daylight-paper');

    const graphEngineBtn = Array.from(nav!.querySelectorAll('button')).find(
      (btn) => btn.textContent?.includes('Graph Engine'),
    );
    expect(graphEngineBtn).toBeDefined();
    await act(async () => {
      graphEngineBtn!.click();
    });
    expect(onSelectSection).toHaveBeenCalledWith('graph-engine', 'Graph Engine');
  });
});
