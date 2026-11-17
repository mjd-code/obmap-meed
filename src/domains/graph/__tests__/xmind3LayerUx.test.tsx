import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { GraphFloatingDock } from '@/domains/graph/components/FloatingDock/GraphFloatingDock';
import { ContextualToolbar } from '@/domains/graph/components/GraphContextualToolbar';
import { GraphCanvasUtilityDock } from '@/domains/graph/components/GraphCanvasUtilityDock';
import { useGraphStore, useNodeStore } from '@/global/stores';
import { useGraphEngineStore } from '@/domains/graph/shared/stores/useGraphEngineStore';
import { globalGraphInteractionStore } from '@/domains/graph/shared/stores/useGraphInteractionStore';
import { defaultHierarchyColorConfig } from '@/domains/graph/shared/utils/hierarchyColors';

describe('XMIND-STEP-05 + FloatingDock: Unified Floating Dock, Label Modes & Context Style Menu', () => {
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
    useGraphEngineStore.setState({ showLabels: true });
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

  it('renders 6-button GraphFloatingDock (without Note AST or Smart Inspector), label modes, utility dock, and Context Menu Style & Format', async () => {
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
    const onUpdateNodeContent = vi.fn();

    const renderHarness = async (overrides?: { layout?: 'mindmap' | 'free-force'; canvasMode?: 'mindmap' | 'graph' }) => {
      const state = globalGraphInteractionStore.getState();
      const graphConfig = useGraphStore.getState().config;
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
            <ContextualToolbar
              x={300}
              y={300}
              node={sampleNode}
              canvasMode={overrides?.canvasMode ?? state.canvasMode}
              graphConfig={graphConfig}
              currentNodeStyle={state.nodeStyleOverrides[sampleNode.id]}
              currentBranchColor={state.branchColorOverrides[sampleNode.id]}
              boundaries={state.boundaries}
              summaries={state.summaries}
              currentOverride={state.subtreeLayoutOverrides[sampleNode.id]}
              isFocused={false}
              onSetStructure={(layout) => state.setSubtreeLayoutOverride(sampleNode.id, layout)}
              onSetNodeStyleOverride={state.setNodeStyleOverride}
              onPromoteColorToBranch={state.promoteColorToBranch}
              onSetBranchColorOverride={state.setBranchColorOverride}
              onUpsertBoundary={state.upsertBoundary}
              onRemoveBoundary={state.removeBoundary}
              onUpsertSummary={state.upsertSummary}
              onRemoveSummary={state.removeSummary}
              onAddSub={vi.fn()}
              onAddBoundary={() =>
                state.upsertBoundary({
                  id: `boundary-${sampleNode.id}`,
                  title: sampleNode.name,
                  nodeIds: [sampleNode.id],
                  shape: 'rounded',
                  padding: 16,
                })
              }
              onUpdateNodeContent={onUpdateNodeContent}
              onToggleFocus={vi.fn()}
              onZoomToSelection={vi.fn()}
              onDelete={vi.fn()}
            />
          </div>,
        );
      });
    };

    await renderHarness();

    // 1. Unified Floating Dock pill has 6 cluster buttons only (no Smart Inspector icon button)
    const toolbar = container.querySelector('[role="toolbar"][aria-label="Graph Floating Dock"]');
    expect(toolbar).not.toBeNull();
    expect(toolbar?.querySelectorAll('button')).toHaveLength(6);
    expect(toolbar?.querySelector('button[aria-label="Smart Inspector"]')).toBeNull();

    // 2. Open Layout cluster & verify Mindmap/Knowledge only (Note AST removed)
    const layoutBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Mode & Layout"]');
    await act(async () => {
      layoutBtn!.click();
    });
    const layoutPanel = container.querySelector('[role="region"][aria-label="Graph Dock Cluster Panel"]');
    expect(layoutPanel?.textContent).toContain('Mindmap');
    expect(layoutPanel?.textContent).toContain('Knowledge');
    expect(layoutPanel?.textContent).not.toContain('Note AST');
    expect(layoutPanel?.textContent).toContain('Org Chart');
    expect(layoutPanel?.textContent).toContain('L1');

    // 3. Appearance -> Node & Link -> Only Node / With Text / With Label + Text sync both stores
    useGraphEngineStore.setState({ showLabels: false });
    const appearanceBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Appearance & Living Canvas"]');
    await act(async () => {
      appearanceBtn!.click();
    });
    const nodeLinkTab = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Node & Link'),
    );
    await act(async () => {
      nodeLinkTab!.click();
    });
    const withTextBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.trim() === 'With Text',
    );
    await act(async () => {
      withTextBtn!.click();
    });
    expect(useGraphEngineStore.getState().showLabels).toBe(true);
    expect(useGraphStore.getState().config.nodes.showLabels).toBe(true);
    expect(useGraphStore.getState().config.nodes.labelBox).toBe(false);

    const onlyNodeBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.trim() === 'Only Node',
    );
    await act(async () => {
      onlyNodeBtn!.click();
    });
    expect(useGraphStore.getState().config.nodes.showLabels).toBe(false);
    expect(useGraphStore.getState().config.nodes.labelBox).toBe(false);

    const boxedBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.trim() === 'With Label + Text',
    );
    await act(async () => {
      boxedBtn!.click();
    });
    expect(useGraphEngineStore.getState().showLabels).toBe(true);
    expect(useGraphStore.getState().config.nodes.showLabels).toBe(true);
    expect(useGraphStore.getState().config.nodes.labelBox).toBe(true);

    // 3b. Verify Posisi Teks (With Text) customization under Label & Tipografi
    const posGroup = container.querySelector('[role="group"][aria-label="Posisi Teks Mode With Text"]');
    expect(posGroup).not.toBeNull();
    const belowBtn = Array.from(posGroup!.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Di Bawah',
    );
    await act(async () => {
      belowBtn!.click();
    });
    expect(useGraphStore.getState().config.nodes.labelPosition).toBe('below');
    const besideBtn = Array.from(posGroup!.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Di Samping',
    );
    await act(async () => {
      besideBtn!.click();
    });
    expect(useGraphStore.getState().config.nodes.labelPosition).toBe('beside');
    const autoPosBtn = Array.from(posGroup!.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Otomatis',
    );
    await act(async () => {
      autoPosBtn!.click();
    });
    expect(useGraphStore.getState().config.nodes.labelPosition).toBe('auto');

    // 4. Open Physics cluster in deterministic Mindmap mode -> guard banner & 1-click Free-Force activation
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

    // 5. Open Smart Zoom cluster -> Fit View (no Smart Inspector row inside)
    const zoomBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Smart Zoom & Camera"]');
    await act(async () => {
      zoomBtn!.click();
    });
    const fitBtn = container.querySelector<HTMLButtonElement>('button[aria-label="Fit View"]');
    await act(async () => {
      fitBtn!.click();
    });
    expect(onSmartZoom).toHaveBeenCalledWith('fit');

    // 6. Escape closes active dock cluster card
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(container.querySelector('[role="region"][aria-label="Graph Dock Cluster Panel"]')).toBeNull();

    // 7. GraphCanvasUtilityDock remains bottom-right
    const utilityDock = container.querySelector('button[aria-label="Mini-map"]')?.closest('div');
    expect(utilityDock?.className).toContain('bottom-3');
    expect(utilityDock?.className).toContain('right-3');

    // 8. Node Context Menu Style & Format popover works without side inspector panel
    await renderHarness({ layout: 'mindmap', canvasMode: 'mindmap' });
    const styleTrigger = container.querySelector<HTMLButtonElement>('button[aria-label="Style & Format Node"]');
    expect(styleTrigger).not.toBeNull();
    await act(async () => {
      styleTrigger!.click();
    });

    const pillBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Pill',
    );
    expect(pillBtn).toBeDefined();
    await act(async () => {
      pillBtn!.click();
    });
    expect(globalGraphInteractionStore.getState().nodeStyleOverrides.f1?.topicShape).toBe('pill');
    expect(onUpdateNodeContent).toHaveBeenCalled();

    const boundaryBtn = Array.from(document.body.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('+ Boundary'),
    );
    await act(async () => {
      boundaryBtn!.click();
    });
    expect(globalGraphInteractionStore.getState().boundaries).toHaveLength(1);
    await renderHarness({ layout: 'mindmap', canvasMode: 'mindmap' });

    const boundarySelect = document.body.querySelector<HTMLSelectElement>(
      'select[aria-label="Bentuk boundary node"]',
    );
    expect(boundarySelect).not.toBeNull();
    expect(boundarySelect?.value).toBe('rounded');

    const p3Btn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'P3',
    );
    expect(p3Btn).toBeDefined();
    await act(async () => {
      p3Btn!.click();
    });
    expect(onUpdateNodeContent.mock.calls.some((call) => String(call[1]).includes('priority: 3'))).toBe(true);
  });
});
