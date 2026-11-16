import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { GraphFloatingDock } from '@/domains/graph/components/FloatingDock/GraphFloatingDock';
import { GraphContextualInspector } from '@/domains/graph/components/GraphContextualInspector';
import { GraphCanvasUtilityDock } from '@/domains/graph/components/GraphCanvasUtilityDock';
import { useGraphStore, useNodeStore } from '@/global/stores';
import { globalGraphInteractionStore } from '@/domains/graph/shared/stores/useGraphInteractionStore';
import { defaultHierarchyColorConfig } from '@/domains/graph/shared/utils/hierarchyColors';

describe('XMIND-STEP-05 + FloatingDock: Unified Floating Dock & Contextual Smart Inspector', () => {
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
      orientation: 'balanced',
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

  it('renders GraphFloatingDock clusters, deterministic physics guard, smart zoom + inspector toggle, and bottom-right utility dock', async () => {
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
    const onToggleInspector = vi.fn();
    const onClose = vi.fn();

    const renderHarness = async (overrides?: { layout?: 'mindmap' | 'free-force'; canvasMode?: 'mindmap' | 'graph' }) => {
      const state = globalGraphInteractionStore.getState();
      await act(async () => {
        root.render(
          <div className="relative w-[1024px] h-[720px]">
            <GraphFloatingDock
              layout={overrides?.layout ?? state.layoutMode}
              canvasMode={overrides?.canvasMode ?? state.canvasMode}
              orientation={state.orientation}
              onCanvasModeChange={state.setCanvasMode}
              onLayoutChange={state.setLayoutMode}
              onOrientationChange={state.setOrientation}
              isOutlineMode={false}
              onToggleOutlineMode={onToggleOutlineMode}
              isInspectorOpen={true}
              onToggleInspector={onToggleInspector}
              onSmartZoom={onSmartZoom}
              search="riset"
            />
            <GraphCanvasUtilityDock
              depths={[0, 1]}
              hierarchy={defaultHierarchyColorConfig}
              nodes={useNodeStore.getState().nodes}
              links={[]}
              graphRef={{ current: undefined }}
              viewportWidth={1024}
              viewportHeight={720}
              folderColor="#fff"
              fileColor="#fff"
              linkColor="#fff"
              selectedNodeId="f1"
              onSmartZoom={onSmartZoom}
            />
            <GraphContextualInspector isOpen={true} onClose={onClose} />
          </div>,
        );
      });
    };

    await renderHarness();

    // 1. Unified Floating Dock pill with 6 clusters
    const toolbar = container.querySelector('[role="toolbar"][aria-label="Graph Floating Dock"]');
    expect(toolbar).not.toBeNull();
    expect(toolbar?.querySelectorAll('button')).toHaveLength(6);

    // 2. Open Layout cluster & verify Global Structure selector
    const layoutBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Mode & Layout"]');
    await act(async () => {
      layoutBtn!.click();
    });
    const structureSelect = container.querySelector<HTMLSelectElement>('select[aria-label="Struktur Graf Global"]');
    expect(structureSelect?.value).toBe('mindmap-balanced');

    // 3. Open Physics cluster in deterministic Mindmap mode -> guard banner & 1-click Free-Force activation
    const physicsBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Engine & Physics"]');
    await act(async () => {
      physicsBtn!.click();
    });
    const panel = container.querySelector('[role="region"][aria-label="Graph Dock Cluster Panel"]');
    expect(panel?.textContent).toContain('Simulasi fisika dinonaktifkan pada layout deterministik');

    const activateForceBtn = Array.from(panel!.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Aktifkan Free-Force'),
    );
    await act(async () => {
      activateForceBtn!.click();
    });
    expect(globalGraphInteractionStore.getState().layoutMode).toBe('free-force');
    expect(globalGraphInteractionStore.getState().canvasMode).toBe('graph');

    await renderHarness({ layout: 'free-force', canvasMode: 'graph' });
    expect(container.querySelector('[role="region"][aria-label="Graph Dock Cluster Panel"]')?.textContent).not.toContain(
      'Simulasi fisika dinonaktifkan pada layout deterministik',
    );

    // 4. Open Smart Zoom cluster -> Fit View + Inspector toggle inside cluster
    const zoomBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Smart Zoom & Camera"]');
    await act(async () => {
      zoomBtn!.click();
    });
    const fitBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Fit View"]');
    await act(async () => {
      fitBtn!.click();
    });
    expect(onSmartZoom).toHaveBeenCalledWith('fit');

    const inspectorToggle = container.querySelector<HTMLButtonElement>('button[aria-label="Smart Inspector"]');
    await act(async () => {
      inspectorToggle!.click();
    });
    expect(onToggleInspector).toHaveBeenCalledTimes(1);

    // 5. Escape closes active dock cluster card
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(container.querySelector('[role="region"][aria-label="Graph Dock Cluster Panel"]')).toBeNull();

    // 6. GraphCanvasUtilityDock moved to bottom-right
    const utilityDock = container.querySelector('button[aria-label="Mini-map"]')?.closest('div');
    expect(utilityDock?.className).toContain('bottom-3');
    expect(utilityDock?.className).toContain('right-3');

    // 7. GraphContextualInspector interactions remain 100% operational
    const inspector = container.querySelector('aside[aria-label="Smart Graph Inspector"]');
    expect(inspector?.textContent).toContain('Topik & Cabang');
    const pillBtn = Array.from(inspector!.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Pill');
    await act(async () => {
      pillBtn!.click();
    });
    expect(globalGraphInteractionStore.getState().nodeStyleOverrides.f1?.topicShape).toBe('pill');

    const wrapBtn = Array.from(inspector!.querySelectorAll('button')).find((b) => b.textContent?.includes('+ Boundary'));
    await act(async () => {
      wrapBtn!.click();
    });
    expect(globalGraphInteractionStore.getState().boundaries).toHaveLength(1);
    expect(inspector?.textContent).toContain('Dekorasi Aktif (1)');
  });
});
