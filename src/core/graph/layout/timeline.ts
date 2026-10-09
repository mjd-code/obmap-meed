import type { LayoutContext, LayoutGeometry, NodeTarget, TimelineAxis } from '../model/graphTypes';
import { boundsOf } from './layoutMath';

export interface TimelineInput {
  ids: string[];
  roots: string[];
  childrenOf: (id: string) => string[];
  parentOf?: (id: string) => string | null;
  context: LayoutContext;
}

export function timelineLayout({ ids, roots, childrenOf, parentOf, context }: TimelineInput): LayoutGeometry {
  const targets = new Map<string, NodeTarget>();
  if (!ids.length) {
    return { mode: 'timeline', targets, bounds: boundsOf(targets), decorations: [] };
  }

  const visible = new Set(ids);
  const metric = (id: string) => context.nodeMetrics.get(id) ?? { width: 140, height: 38 };

  const maxMetric = ids.reduce(
    (largest, id) => {
      const current = metric(id);
      return {
        width: Math.max(largest.width, current.width),
        height: Math.max(largest.height, current.height),
      };
    },
    { width: 140, height: 38 }
  );

  const baselineY = 0;
  const laneGap = Math.max(context.laneGap, maxMetric.height + context.siblingGap + 20);

  // 1. Root utama (central topic)
  const primaryRoot = roots.find((r) => visible.has(r)) ?? ids[0];
  
  // 2. Milestones = direct children dari root berdasarkan urutan hierarki/explorer
  // Jika tidak ada children, gunakan visible roots sebagai milestones
  const rootChildren = childrenOf(primaryRoot).filter((id) => visible.has(id));
  const milestones = rootChildren.length > 0 
    ? rootChildren 
    : roots.filter((r) => visible.has(r));

  const milestoneIds = new Set(milestones);
  targets.set(primaryRoot, { x: 0, y: baselineY, side: 0, lane: 0 });

  // 3. Spacing horizontal sepanjang timeline axis (XMind horizontal flow)
  const stepX = maxMetric.width + context.siblingGap + 60;
  let currentX = stepX;

  milestones.forEach((milestoneId, index) => {
    // Alternating lane (atas / bawah dari garis axis: lane 1 dan -1)
    const lane = index % 2 === 0 ? 1 : -1;
    const y = baselineY + lane * laneGap;

    targets.set(milestoneId, {
      x: currentX,
      y,
      side: lane as -1 | 1,
      lane,
    });

    // 4. Tempatkan descendants / sub-notes di bawah/atas milestone
    const subKids = childrenOf(milestoneId).filter((id) => visible.has(id));
    let subYCursor = y + (lane * (metric(milestoneId).height + 16));

    for (const subId of subKids) {
      targets.set(subId, {
        x: currentX + 30, // sedikit indentasi
        y: subYCursor,
        side: lane as -1 | 1,
        lane,
      });
      subYCursor += lane * (metric(subId).height + context.siblingGap);
    }

    currentX += stepX;
  });

  // 5. Buat garis axis timeline (spine tengah)
  const decorations: TimelineAxis[] = [
    {
      kind: 'timeline-axis',
      y: baselineY,
      x1: -60,
      x2: currentX + 60,
      ticks: milestones.map((id) => ({
        x: targets.get(id)?.x ?? 0,
        label: '',
      })),
    },
  ];

  return {
    mode: 'timeline',
    targets,
    bounds: boundsOf(targets, context.nodeMetrics),
    decorations,
  };
}