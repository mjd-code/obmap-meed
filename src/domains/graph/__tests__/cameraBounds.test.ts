import { describe, it, expect } from 'vitest';
import { calculateCameraBounds, seedInitialNodePositions } from '@/domains/graph/shared/utils/cameraBounds';
import type { RenderNode } from '@/domains/graph/shared/utils/graph.types';
import type { Node } from '@/global/types';

describe('cameraBounds utility', () => {
  it('returns safe fallback when node array is empty', () => {
    const bounds = calculateCameraBounds([], { viewportWidth: 1000, viewportHeight: 800 });
    expect(bounds.width).toBe(0);
    expect(bounds.height).toBe(0);
    expect(bounds.centerX).toBe(0);
    expect(bounds.centerY).toBe(0);
    expect(bounds.dynamicPadding).toBeGreaterThanOrEqual(40);
  });

  it('calculates bounding box and dynamic padding for dispersed nodes', () => {
    const testNodes: RenderNode[] = [
      { id: '1', name: 'A', x: -100, y: -50, val: 10, type: 'file', parentId: null, depth: 0, tags: [], content: '', childCount: 0 },
      { id: '2', name: 'B', x: 200, y: 150, val: 10, type: 'file', parentId: null, depth: 0, tags: [], content: '', childCount: 0 },
    ];

    const bounds = calculateCameraBounds(testNodes, { viewportWidth: 1200, viewportHeight: 800 });

    expect(bounds.minX).toBe(-110);
    expect(bounds.maxX).toBe(210);
    expect(bounds.minY).toBe(-60);
    expect(bounds.maxY).toBe(160);
    expect(bounds.centerX).toBe(50);
    expect(bounds.centerY).toBe(50);
    expect(bounds.dynamicPadding).toBeGreaterThanOrEqual(40);
    expect(bounds.dynamicPadding).toBeLessThanOrEqual(140);
  });

  it('deterministically seeds positions for new nodes with golden ratio spiral', () => {
    const rawNodes: Node[] = [
      { id: 'n1', name: 'First', type: 'file', parentId: null, depth: 0, tags: [], content: '' },
      { id: 'n2', name: 'Second', type: 'file', parentId: null, depth: 0, tags: [], content: '' },
    ];
    const cache = new Map<string, RenderNode>();

    const seeded = seedInitialNodePositions(rawNodes, cache);
    expect(seeded).toHaveLength(2);
    expect(typeof seeded[0].x).toBe('number');
    expect(typeof seeded[0].y).toBe('number');
    expect(typeof seeded[1].x).toBe('number');
    expect(typeof seeded[1].y).toBe('number');
  });
});