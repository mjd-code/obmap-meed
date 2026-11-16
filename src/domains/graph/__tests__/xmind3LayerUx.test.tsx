import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { GraphQuickCanvasBar } from '@/domains/graph/components/GraphQuickCanvasBar';
import { GraphContextualInspector } from '@/domains/graph/components/GraphContextualInspector';
import { useGraphStore, useNodeStore } from '@/global/stores';
import { globalGraphInteractionStore } from '@/domains/graph/shared/stores/useGraphInteractionStore';

describe('XMIND-STEP-05: 3-Layer Quick Canvas Bar & Contextual Smart Inspector', () => {
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
    localStorage.clear();
    useNodeStore.getState().reset();
    useGraphStore.getState().resetConfig();
    globalGraphInteractionStore.setState({
      layoutMode: 'mindmap',
      canvasMode: 'mindmap',
      layoutArrangement: 'auto',
      boundaries: [],
      summaries: [],
      relationships: [],
      manualNodeOffsets: {},
      subtreeLayoutOverrides: {},
      nodeStyleOverrides: {},
      branchColorOverrides: {},
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    container?.remove();
  });

  it('renders Layer 1 GraphQuickCanvasBar and Layer 2/3 GraphContextualInspector with scope switching', async () => {
    const sampleNode = {
      id: 'f1',
      name: 'Topik Riset',
      content: '---\npriority: 2\n---\n# Topik Riset\n## Sub\n',
      type: 'file' as const,
      parentId: 'root',
      depth: 1,
      tags: ['research'],
    };
    useNodeStore.getState().setNodes([
      { id: 'root', name: 'Root', content: '', type: 'folder', parentId: null, depth: 0, tags: [] },
      sampleNode,
    ]);
    useNodeStore.getState().setSelectedNode(sampleNode);

    const onSmartZoom = vi.fn();
    const onToggleOutlineMode = vi.fn();
    const onClose = vi.fn();

    await act(async () => {
      root.render(
        <div>
          <GraphQuickCanvasBar
            isOutlineMode={false}
            onToggleOutlineMode={onToggleOutlineMode}
            isInspectorOpen={true}
            onToggleInspector={vi.fn()}
            onSmartZoom={onSmartZoom}
          />
          <GraphContextualInspector isOpen={true} onClose={onClose} />
        </div>,
      );
    });

    const toolbar = container.querySelector('[role="toolbar"][aria-label="Quick Canvas Bar"]');
    expect(toolbar).not.toBeNull();
    const structureSelect = container.querySelector<HTMLSelectElement>(
      'select[aria-label="Struktur Graf Global"]',
    );
    expect(structureSelect?.value).toBe('mindmap-balanced');

    const fitBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Fit View"]');
    await act(async () => {
      fitBtn!.click();
    });
    expect(onSmartZoom).toHaveBeenCalledWith('fit');

    const inspector = container.querySelector('aside[aria-label="Smart Graph Inspector"]');
    expect(inspector?.textContent).toContain('Topik & Cabang');
    expect(inspector?.textContent).toContain('Topik Riset');

    const pillBtn = Array.from(inspector!.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Pill',
    );
    expect(pillBtn).toBeTruthy();
    await act(async () => {
      pillBtn!.click();
    });
    expect(globalGraphInteractionStore.getState().nodeStyleOverrides.f1?.topicShape).toBe('pill');

    const wrapBtn = Array.from(inspector!.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('+ Boundary'),
    );
    await act(async () => {
      wrapBtn!.click();
    });
    expect(globalGraphInteractionStore.getState().boundaries).toHaveLength(1);
    expect(inspector?.textContent).toContain('Dekorasi Aktif (1)');

    expect(inspector?.textContent).not.toContain('Fisika Gaya Pegas (Free Force)');
    const engineTrigger = Array.from(inspector!.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Engine & Physics Tuning'),
    );
    await act(async () => {
      engineTrigger!.click();
    });
    expect(inspector?.textContent).toContain('Ukuran Font Label');
  });
});
