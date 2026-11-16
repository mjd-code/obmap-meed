import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { EditorFormatToolbar } from '@/domains/editor/components/EditorFormatToolbar';
import type { EditorApi } from '@/domains/editor/shared/utils/editor.types';
import { GraphEngineSettings } from '@/domains/settings/components/SettingsGraphEngineSection';
import NotFound from '@/pages/NotFound';
import { PublicReaderQuickPreferencesPopover } from '@/domains/community/components/PublicReaderQuickPreferencesPopover';
import { Badge, badgeVariants } from '@/global/ui/badge';
import { buttonVariants } from '@/global/ui/button';
import { useThemeStore } from '@/domains/settings/shared/stores/useThemeStore';

function createMockEditorApi(): EditorApi {
  return {
    getValue: vi.fn(() => ''),
    setValue: vi.fn(),
    getSelection: vi.fn(() => ''),
    replaceSelection: vi.fn(),
    replaceRange: vi.fn(),
    getCursor: vi.fn(() => ({ line: 1, col: 0, offset: 0 })),
    setCursor: vi.fn(),
    getLine: vi.fn(() => ''),
    lineCount: vi.fn(() => 1),
    posToOffset: vi.fn(() => 0),
    offsetToPos: vi.fn(() => ({ line: 1, col: 0, offset: 0 })),
    focus: vi.fn(),
    toggleWrap: vi.fn(),
    toggleLinePrefix: vi.fn(),
    insertBlock: vi.fn(),
    wordCount: vi.fn(() => 0),
    undo: vi.fn(() => true),
    redo: vi.fn(() => true),
    canUndo: vi.fn(() => true),
    canRedo: vi.fn(() => true),
  };
}

describe('UI-STEP-04..06 Verification Suite', () => {
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

  it('UI-STEP-04: renders EditorFormatToolbar groups and invokes EditorApi commands', async () => {
    const mockApi = createMockEditorApi();

    await act(async () => {
      root.render(
        <EditorFormatToolbar
          api={mockApi}
          groups={{ format: true, headings: true, blocks: false, insert: true }}
        />,
      );
    });

    const boldBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Tebal (Bold)"]');
    const h1Btn = container.querySelector<HTMLButtonElement>('button[aria-label="Heading 1"]');
    const hrBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Garis Pemisah"]');
    const ulBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Daftar Poin"]');
    const undoBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Undo (Ctrl+Z)"]');

    expect(boldBtn).not.toBeNull();
    expect(h1Btn).not.toBeNull();
    expect(hrBtn).not.toBeNull();
    expect(ulBtn).toBeNull(); // blocks group disabled

    await act(async () => {
      boldBtn!.click();
      h1Btn!.click();
      hrBtn!.click();
      undoBtn!.click();
    });

    expect(mockApi.toggleWrap).toHaveBeenCalledWith('**');
    expect(mockApi.toggleLinePrefix).toHaveBeenCalledWith('# ');
    expect(mockApi.insertBlock).toHaveBeenCalledWith('---');
    expect(mockApi.undo).toHaveBeenCalledTimes(1);
  });

  it('UI-STEP-04: renders FreeForceControls inside SettingsGraphEngineSection forces tab', async () => {
    await act(async () => {
      root.render(<GraphEngineSettings />);
    });

    const forcesTrigger = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]')).find(
      (btn) => btn.textContent?.includes('Forces'),
    );
    expect(forcesTrigger).toBeTruthy();

    await act(async () => {
      forcesTrigger!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
      forcesTrigger!.focus();
      forcesTrigger!.click();
    });

    expect(container.textContent).toContain('Fisika Gaya Pegas (Free Force)');
    expect(container.textContent).toContain('Kocok Ulang');
    expect(container.textContent).toContain('Freeze');
  });

  it('UI-STEP-05: renders NotFound with SPA navigation links to /, /vaults, and /explore', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await act(async () => {
        root.render(
          <MemoryRouter initialEntries={['/legacy-route-missing']}>
            <NotFound />
          </MemoryRouter>,
        );
      });

      expect(container.textContent).toContain('Halaman Tidak Ditemukan');
      expect(container.textContent).toContain('/legacy-route-missing');

      const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
      expect(hrefs).toContain('/');
      expect(hrefs).toContain('/vaults');
      expect(hrefs).toContain('/explore');
    } finally {
      errSpy.mockRestore();
    }
  });

  it('UI-STEP-05: PublicReaderQuickPreferencesPopover updates theme preset, font, and prose size', async () => {
    await act(async () => {
      root.render(<PublicReaderQuickPreferencesPopover />);
    });

    const trigger = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Preferensi Tampilan Pembaca"]',
    );
    expect(trigger).not.toBeNull();

    await act(async () => {
      trigger!.click();
    });

    const sepiaBtn = Array.from(document.body.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.trim() === 'Sepia',
    );
    const serifBtn = Array.from(document.body.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.includes('Newsreader'),
    );
    const increaseBtn = document.body.querySelector<HTMLButtonElement>(
      'button[aria-label="Perbesar teks bacaan"]',
    );

    expect(sepiaBtn).toBeTruthy();
    expect(serifBtn).toBeTruthy();
    expect(increaseBtn).toBeTruthy();

    await act(async () => {
      sepiaBtn!.click();
      serifBtn!.click();
      increaseBtn!.click();
    });

    const appearance = useThemeStore.getState().appearance;
    expect(appearance.presetId).toBe('warm-sepia');
    expect(appearance.typography.proseFont).toBe('Newsreader');
    expect(appearance.typography.proseSize).toBe(17);
  });

  it('UI-STEP-06: exposes semantic Badge variants and responsive Button icon-sm size', async () => {
    await act(async () => {
      root.render(<Badge variant="success">Tersinkron</Badge>);
    });

    expect(badgeVariants({ variant: 'success' })).toContain('text-success');
    expect(badgeVariants({ variant: 'warning' })).toContain('text-warning');
    expect(badgeVariants({ variant: 'danger' })).toContain('text-danger');
    expect(badgeVariants({ variant: 'info' })).toContain('text-info');
    expect(buttonVariants({ size: 'icon-sm' })).toContain('sm:h-7 sm:w-7');
    expect(container.textContent).toContain('Tersinkron');
  });
});
