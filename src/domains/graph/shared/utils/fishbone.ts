/** Ishikawa (fishbone) layout: spine, alternating major ribs and sub-branches. */

import { subtreeWeights } from '@/domains/graph/shared/utils/buildGraphProjection';
import { resolveAABBCollisions } from '@/domains/graph/shared/utils/collisionResolver';
import type {
  FishboneRib,
  FishboneSpine,
  LayoutContext,
  LayoutDecoration,
  LayoutGeometry,
  NodeTarget,
} from '@/domains/graph/shared/utils/graph.types';
import { boundsOf } from '@/domains/graph/shared/utils/layoutMath';

export interface FishboneInput {
  ids: string[];
  roots: string[];
  childrenOf: (id: string) => string[];
  context: LayoutContext;
}

interface RibBranchBox {
  tangentSpan: number;
  outwardSpan: number;
}

export function fishboneLayout({ ids, roots, childrenOf, context }: FishboneInput): LayoutGeometry {
  const targets = new Map<string, NodeTarget>();
  const decorations: LayoutDecoration[] = [];
  if (!ids.length) {
    return { mode: 'fishbone', targets, bounds: boundsOf(targets), decorations };
  }

  const visible = new Set(ids);
  const children = (id: string) => childrenOf(id).filter((child) => visible.has(child));
  const visibleRoots = roots.filter((id) => visible.has(id));
  const weights = subtreeWeights(visibleRoots, children);

  const effect = context.rootId && visible.has(context.rootId) ? context.rootId : visibleRoots[0];
  const categories = effect
    ? [...children(effect), ...visibleRoots.filter((id) => id !== effect)]
    : visibleRoots;

  const alpha = context.ribAngle;
  const sinA = Math.sin(alpha);
  const cosA = Math.cos(alpha);
  const y0 = 0;
  const x0 = 0;
  const siblingGap = Math.max(context.siblingGap, 20);
  const levelGap = Math.max(context.levelGap, 56);

  const metricOf = (id: string) => context.nodeMetrics.get(id) ?? { width: 120, height: 36 };
  const maxCardWidth = ids.reduce((w, id) => Math.max(w, metricOf(id).width), 120);
  const maxCardHeight = ids.reduce((h, id) => Math.max(h, metricOf(id).height), 36);

  // Proyeksi AABB sebuah card pada vektor tangen (-cosA, sign*sinA) & normal keluar (sinA, sign*cosA)
  const projTan = (w: number, h: number) => w * Math.abs(cosA) + h * Math.abs(sinA);
  const projOut = (w: number, h: number) => w * Math.abs(sinA) + h * Math.abs(cosA);

  // Bottom-up ukuran sub-cabang agar depth >= 2 tidak bertabrakan dengan saudara atau rusuk sebelah
  const branchBoxCache = new Map<string, RibBranchBox>();
  const boxGuard = new Set<string>();
  const measureBranch = (id: string): RibBranchBox => {
    const cached = branchBoxCache.get(id);
    if (cached) return cached;
    const m = metricOf(id);
    const ownTan = Math.max(m.width * 0.65, projTan(m.width, m.height)) + siblingGap;
    const ownOut = projOut(m.width, m.height);
    if (boxGuard.has(id)) return { tangentSpan: ownTan, outwardSpan: ownOut };
    boxGuard.add(id);

    const kids = children(id);
    if (kids.length === 0) {
      const leaf = { tangentSpan: ownTan, outwardSpan: ownOut };
      branchBoxCache.set(id, leaf);
      return leaf;
    }

    let kidsTanSum = 0;
    let maxKidOut = 0;
    for (const kid of kids) {
      const kb = measureBranch(kid);
      kidsTanSum += kb.tangentSpan;
      maxKidOut = Math.max(maxKidOut, kb.outwardSpan);
    }

    const box: RibBranchBox = {
      tangentSpan: Math.max(ownTan, kidsTanSum + siblingGap),
      outwardSpan: ownOut + levelGap * 0.75 + maxKidOut,
    };
    branchBoxCache.set(id, box);
    return box;
  };

  for (const id of ids) measureBranch(id);

  const count = Math.max(1, categories.length);
  const categoryStats = categories.map((catId) => {
    const m = metricOf(catId);
    const kids = children(catId);
    const kidBoxes = kids.map((k) => measureBranch(k));
    const totalKidsTan = kidBoxes.reduce((sum, b) => sum + b.tangentSpan, 0);
    const maxKidOut = kidBoxes.reduce((mx, b) => Math.max(mx, b.outwardSpan), 0);
    const legacySpan = kids.length * (maxCardHeight + siblingGap * 1.5);
    const ribLength = Math.max(
      levelGap * 2.5,
      m.width +
        levelGap +
        Math.max(legacySpan, totalKidsTan) +
        Math.sqrt(weights.get(catId) ?? 1) * siblingGap * 2
    );
    const horizontalReach = ribLength * Math.abs(cosA) + maxKidOut * Math.abs(sinA) + m.width;
    return { catId, m, kids, kidBoxes, totalKidsTan, ribLength, horizontalReach };
  });

  const maxHorizStep = categoryStats.reduce(
    (mx, st) => Math.max(mx, st.m.width + st.horizontalReach * 0.55 + siblingGap * 2),
    maxCardWidth + levelGap + siblingGap * 3
  );
  const L = Math.max(700, context.width * 1.25, categories.length * maxHorizStep);
  const x1 = x0 + L;

  const effectMetric = effect ? metricOf(effect) : { width: 0, height: 0 };
  if (effect) {
    targets.set(effect, { x: x1 + effectMetric.width / 2 + siblingGap, y: y0, side: 0 });
  }
  decorations.push({
    kind: 'fishbone-spine',
    x1: x0,
    y1: y0,
    x2: x1,
    y2: y0,
    targetId: effect,
  } as FishboneSpine);

  // Lacak daftar sub-rib agar x2/y2 dapat diselaraskan bila AABB resolver mendorong kartu ekstrem
  const subRibLinks: Array<{ sourceId: string; targetId: string; fixedSource?: { x: number; y: number } }> = [];

  categoryStats.forEach(({ catId, kids, kidBoxes, totalKidsTan, ribLength }, index) => {
    const anchorX = x0 + ((index + 1) * L) / (count + 1);
    const sign: 1 | -1 = index % 2 === 0 ? -1 : 1;
    const cx = anchorX - ribLength * cosA;
    const cy = y0 + sign * ribLength * sinA;
    targets.set(catId, { x: cx, y: cy, side: sign });
    decorations.push({
      kind: 'fishbone-rib',
      x1: anchorX,
      y1: y0,
      x2: cx,
      y2: cy,
      major: true,
      sourceId: effect,
      targetId: catId,
    } as FishboneRib);

    const outwardX = sinA;
    const outwardY = sign * cosA;
    const tangentX = -cosA;
    const tangentY = sign * sinA;

    const placeSubBranch = (
      id: string,
      baseX: number,
      baseY: number,
      depth: number
    ) => {
      const m = metricOf(id);
      const diagClearance = m.width * Math.abs(outwardX) * 0.5 + m.height * Math.abs(outwardY) * 0.5;
      const offset = levelGap * 0.85 + diagClearance + depth * siblingGap * 0.35;
      const x = baseX + offset * outwardX;
      const y = baseY + offset * outwardY;
      targets.set(id, { x, y, side: sign });

      const subKids = children(id);
      if (subKids.length === 0) return;

      const subBoxes = subKids.map((sk) => measureBranch(sk));
      const subTotalTan = subBoxes.reduce((s, b) => s + b.tangentSpan, 0);
      let tanCursor = -subTotalTan / 2;

      subKids.forEach((kid, subIdx) => {
        const childMetric = metricOf(kid);
        const childBox = subBoxes[subIdx];
        const branchStep =
          (m.width + childMetric.width) * Math.abs(outwardX) * 0.5 +
          (m.height + childMetric.height) * Math.abs(outwardY) * 0.5 +
          siblingGap * 1.15;
        const centerTan = tanCursor + childBox.tangentSpan / 2;
        tanCursor += childBox.tangentSpan;

        const childBaseX = x + branchStep * outwardX + centerTan * tangentX;
        const childBaseY = y + branchStep * outwardY + centerTan * tangentY;
        placeSubBranch(kid, childBaseX, childBaseY, depth + 1);
        subRibLinks.push({ sourceId: id, targetId: kid });
      });
    };

    const usableStart = Math.max(0.14 * ribLength, levelGap * 0.4);
    const usableEnd = Math.max(usableStart + 40, 0.84 * ribLength);
    const availableLen = Math.max(1, usableEnd - usableStart);
    let tanProgress = 0;

    kids.forEach((kid, k) => {
      const kidBox = kidBoxes[k];
      const distAlongRib =
        totalKidsTan > 0
          ? usableStart + ((tanProgress + kidBox.tangentSpan / 2) / totalKidsTan) * availableLen
          : usableStart + (k * availableLen) / Math.max(1, kids.length - 1);
      tanProgress += kidBox.tangentSpan;

      const baseX = anchorX + distAlongRib * tangentX;
      const baseY = y0 + distAlongRib * tangentY;
      placeSubBranch(kid, baseX, baseY, 1);
      subRibLinks.push({ sourceId: catId, targetId: kid, fixedSource: { x: baseX, y: baseY } });
    });
  });

  // Node tanpa hubungan (detached branches) ditempatkan rapi di bawah spine
  let stray = 0;
  for (const id of ids) {
    if (targets.has(id)) continue;
    targets.set(id, {
      x: x0 + (stray % 6) * siblingGap * 4,
      y: y0 + levelGap * (3 + Math.floor(stray / 6)),
    });
    stray += 1;
  }

  // Jaga agar effect & kategori utama tetap terkunci pada sudut rusuknya, lalu selesaikan sisa benturan sub-cabang
  const pinnedNodes = effect ? [effect, ...categories] : [...categories];
  const resolvedTargets = resolveAABBCollisions({
    targets,
    metrics: context.nodeMetrics,
    roots: pinnedNodes,
    childrenOf: children,
    mode: 'fishbone',
    minGap: Math.max(8, siblingGap * 0.35),
    primaryAxis: 'horizontal',
    preserveSpineSide: true,
    maxIterations: 20,
  });

  for (const link of subRibLinks) {
    const src = link.fixedSource ?? resolvedTargets.get(link.sourceId);
    const dst = resolvedTargets.get(link.targetId);
    if (!src || !dst) continue;
    decorations.push({
      kind: 'fishbone-rib',
      x1: src.x,
      y1: src.y,
      x2: dst.x,
      y2: dst.y,
      major: false,
      sourceId: link.sourceId,
      targetId: link.targetId,
    } as FishboneRib);
  }

  return { mode: 'fishbone', targets: resolvedTargets, bounds: boundsOf(resolvedTargets, context.nodeMetrics), decorations };
}
