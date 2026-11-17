/**
 * 4-Level Cascading Style Inheritance Engine & WCAG AA Contrast Guard (XMIND-STEP-03).
 *
 * Level 1: Skeleton & Global `--ob-*` Theme
 * Level 2: Topic Role Style (central, main, subtopic, floating, summary)
 * Level 3: Smart Branch HSL Inheritance (depth gradation + branchColorOverrides)
 * Level 4: Local Node Override (`styleOverride` / `nodeStyleOverrides`) + WCAG AA >= 4.5:1 guard
 *
 * Also exports pure Dual Update Pipeline signature builders separating geometric
 * layout invalidation (`buildLayoutSignature`) from `< 2ms` visual-only repaints (`buildPaintSignature`).
 */

import type {
  BoundaryGroup,
  BranchLineStyle,
  LayoutMode,
  ManualNodeOffset,
  MindmapOrientation,
  NodeStyleOverride,
  RenderNode,
  SkeletonPresetId,
  SubtreeLayoutMap,
  SummaryGroup,
  TopicRole,
  TopicShape,
} from '@/domains/graph/shared/utils/graph.types';
import type { GraphConfigState } from '@/domains/graph/shared/stores/useGraphStore';
import type { GraphTheme } from '@/domains/graph/shared/utils/theme';
import { getBrandConfig } from '@/global/config/brand.config';
import {
  contrastRatio,
  HIERARCHY_PRESETS,
  isDarkSurface,
  pickContrastTextColor,
  resolveEffectiveBranchColor,
  resolveSmartBranchHsl,
} from '@/domains/graph/shared/utils/hierarchyColors';

export interface SkeletonPreset {
  id: SkeletonPresetId;
  label: string;
  isDark: boolean;
  canvasBg: string;
  surfaceBg: string;
  lightText: string;
  darkText: string;
  defaultBranchStyle: BranchLineStyle;
  centralShape: TopicShape;
  mainShape: TopicShape;
  subtopicShape: TopicShape;
  seedPalette: string[];
}

export const SKELETON_PRESETS: Record<SkeletonPresetId, SkeletonPreset> = {
  'obmap-midnight': {
    id: 'obmap-midnight',
    label: `${getBrandConfig().name} Midnight`,
    isDark: true,
    canvasBg: '#0B1120',
    surfaceBg: '#0F172A',
    lightText: '#F8FAFC',
    darkText: '#0F172A',
    defaultBranchStyle: 'tapered-bezier',
    centralShape: 'pill',
    mainShape: 'rounded-rect',
    subtopicShape: 'rounded-rect',
    seedPalette: [
      'hsl(212, 92%, 62%)',
      'hsl(168, 76%, 48%)',
      'hsl(268, 82%, 66%)',
      'hsl(38, 92%, 58%)',
      'hsl(340, 82%, 62%)',
      'hsl(190, 88%, 54%)',
    ],
  },
  'obsidian-oled': {
    id: 'obsidian-oled',
    label: 'Obsidian OLED',
    isDark: true,
    canvasBg: '#000000',
    surfaceBg: '#0A0A0F',
    lightText: '#F8FAFC',
    darkText: '#09090B',
    defaultBranchStyle: 'tapered-bezier',
    centralShape: 'pill',
    mainShape: 'rounded-rect',
    subtopicShape: 'rounded-rect',
    seedPalette: [
      'hsl(265, 88%, 68%)',
      'hsl(195, 92%, 58%)',
      'hsl(315, 82%, 66%)',
      'hsl(152, 74%, 52%)',
      'hsl(42, 94%, 60%)',
      'hsl(225, 88%, 66%)',
    ],
  },
  'daylight-paper': {
    id: 'daylight-paper',
    label: 'Daylight Paper',
    isDark: false,
    canvasBg: '#F8FAFC',
    surfaceBg: '#FFFFFF',
    lightText: '#F8FAFC',
    darkText: '#0F172A',
    defaultBranchStyle: 'tapered-bezier',
    centralShape: 'pill',
    mainShape: 'rounded-rect',
    subtopicShape: 'underline',
    seedPalette: [
      'hsl(221, 83%, 53%)',
      'hsl(160, 84%, 39%)',
      'hsl(262, 83%, 58%)',
      'hsl(25, 95%, 53%)',
      'hsl(346, 77%, 50%)',
      'hsl(199, 89%, 44%)',
    ],
  },
  'warm-sepia': {
    id: 'warm-sepia',
    label: 'Warm Sepia',
    isDark: false,
    canvasBg: '#F5EFE6',
    surfaceBg: '#FAF6F0',
    lightText: '#FAF6F0',
    darkText: '#292018',
    defaultBranchStyle: 'cubic-bezier',
    centralShape: 'rounded-rect',
    mainShape: 'rounded-rect',
    subtopicShape: 'underline',
    seedPalette: [
      'hsl(18, 76%, 48%)',
      'hsl(142, 48%, 38%)',
      'hsl(36, 82%, 44%)',
      'hsl(210, 52%, 44%)',
      'hsl(345, 58%, 46%)',
      'hsl(172, 50%, 38%)',
    ],
  },
  'nord-scholar': {
    id: 'nord-scholar',
    label: 'Nord Scholar',
    isDark: true,
    canvasBg: '#2E3440',
    surfaceBg: '#3B4252',
    lightText: '#ECEFF4',
    darkText: '#2E3440',
    defaultBranchStyle: 'cubic-bezier',
    centralShape: 'rounded-rect',
    mainShape: 'rounded-rect',
    subtopicShape: 'rounded-rect',
    seedPalette: [
      'hsl(193, 43%, 67%)',
      'hsl(179, 25%, 65%)',
      'hsl(213, 32%, 62%)',
      'hsl(92, 28%, 65%)',
      'hsl(14, 51%, 63%)',
      'hsl(311, 20%, 63%)',
    ],
  },
  'high-contrast-aaa': {
    id: 'high-contrast-aaa',
    label: 'High Contrast AAA',
    isDark: true,
    canvasBg: '#020617',
    surfaceBg: '#090D16',
    lightText: '#FFFFFF',
    darkText: '#000000',
    defaultBranchStyle: 'orthogonal',
    centralShape: 'pill',
    mainShape: 'rounded-rect',
    subtopicShape: 'rounded-rect',
    seedPalette: [
      'hsl(195, 100%, 55%)',
      'hsl(48, 100%, 55%)',
      'hsl(142, 90%, 52%)',
      'hsl(320, 95%, 65%)',
      'hsl(22, 100%, 60%)',
      'hsl(265, 95%, 72%)',
    ],
  },
  'xmind-classic': {
    id: 'xmind-classic',
    label: 'XMind Classic Rainbow',
    isDark: false,
    canvasBg: '#FFFFFF',
    surfaceBg: '#F8FAFC',
    lightText: '#FFFFFF',
    darkText: '#0F172A',
    defaultBranchStyle: 'tapered-bezier',
    centralShape: 'pill',
    mainShape: 'rounded-rect',
    subtopicShape: 'underline',
    seedPalette: [
      'hsl(215, 88%, 54%)',
      'hsl(352, 82%, 56%)',
      'hsl(148, 72%, 40%)',
      'hsl(32, 92%, 52%)',
      'hsl(272, 78%, 58%)',
      'hsl(188, 84%, 42%)',
    ],
  },
};

export interface ResolvedNodePaint {
  role: TopicRole;
  topicShape: TopicShape;
  fillColor: string;
  borderColor: string;
  textColor: string;
  lineColor: string;
  accentColor: string;
  lineWidth: number;
  fontWeight: '500' | '600' | '700';
  fontSizeDelta: number;
  contrastRatio: number;
  dashedBorder: boolean;
  /** True when branch inheritance, skeleton preset, floating/summary role, or local override drives node paint. */
  hasExplicitCascade: boolean;
}

export interface CascadingStyleContext {
  theme: GraphTheme;
  config: GraphConfigState;
  parentByChild: Map<string, string | null>;
  branchColorOverrides: Record<string, string>;
  nodeStyleOverrides: Record<string, NodeStyleOverride>;
  nodeBranchColorById: Map<string, string | undefined>;
  skeletonPreset?: SkeletonPresetId;
  roleByNodeId?: Map<string, TopicRole>;
  summaries?: SummaryGroup[];
}

const FONT_WEIGHT_MAP: Record<NonNullable<NodeStyleOverride['fontWeight']>, '500' | '600' | '700'> = {
  normal: '500',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export function resolveSkeletonPreset(
  presetId?: SkeletonPresetId | 'vk-midnight' | string,
  canvasBackground?: string,
): SkeletonPreset {
  if (presetId === 'vk-midnight' || presetId === 'obmap-midnight') {
    return {
      ...SKELETON_PRESETS['obmap-midnight'],
      label: `${getBrandConfig().name} Midnight`,
    };
  }
  if (presetId && presetId in SKELETON_PRESETS) {
    return SKELETON_PRESETS[presetId as SkeletonPresetId];
  }
  const dark = canvasBackground ? isDarkSurface(canvasBackground) : true;
  if (dark) {
    return {
      ...SKELETON_PRESETS['obmap-midnight'],
      label: `${getBrandConfig().name} Midnight`,
    };
  }
  return SKELETON_PRESETS['daylight-paper'];
}

export function resolveTopicRole(
  node: Pick<RenderNode, 'id' | 'parentId' | 'depth'>,
  roleOverride?: TopicRole,
): TopicRole {
  if (roleOverride) return roleOverride;
  if (node.parentId === null || node.depth === 0) return 'central';
  if (node.depth === 1) return 'main';
  return 'subtopic';
}

function roleDefaults(role: TopicRole, depth: number, skeleton: SkeletonPreset): {
  fontWeight: '500' | '600' | '700';
  fontSizeDelta: number;
  lineWidth: number;
  defaultShape: TopicShape;
  dashedBorder: boolean;
} {
  switch (role) {
    case 'central':
      return {
        fontWeight: '700',
        fontSizeDelta: 3,
        lineWidth: 3.0,
        defaultShape: skeleton.centralShape,
        dashedBorder: false,
      };
    case 'main':
      return {
        fontWeight: '600',
        fontSizeDelta: 1,
        lineWidth: 2.25,
        defaultShape: skeleton.mainShape,
        dashedBorder: false,
      };
    case 'floating':
      return {
        fontWeight: '500',
        fontSizeDelta: 0,
        lineWidth: 1.5,
        defaultShape: 'rounded-rect',
        dashedBorder: true,
      };
    case 'summary':
      return {
        fontWeight: '600',
        fontSizeDelta: 0,
        lineWidth: 1.6,
        defaultShape: 'rounded-rect',
        dashedBorder: false,
      };
    case 'subtopic':
    default:
      return {
        fontWeight: '500',
        fontSizeDelta: 0,
        lineWidth: Math.max(1.25, 3.0 - depth * 0.35),
        defaultShape: skeleton.subtopicShape,
        dashedBorder: false,
      };
  }
}

/**
 * Resolves a node's immutable per-frame paint specification through the 4-level cascade:
 * Level 1 Skeleton -> Level 2 Role -> Level 3 Smart Branch HSL -> Level 4 Local Override + WCAG AA.
 */
export function resolveCascadingNodeStyle(
  node: Pick<RenderNode, 'id' | 'parentId' | 'depth' | 'branchId' | 'branchColor' | 'topicShape' | 'styleOverride'>,
  context: CascadingStyleContext,
): ResolvedNodePaint {
  // Level 1: Skeleton & Global Theme Polarity
  const configuredSkeletonId =
    context.skeletonPreset ??
    (context.config.hierarchy?.skeletonPreset as SkeletonPresetId | undefined);
  const skeleton = resolveSkeletonPreset(configuredSkeletonId, context.theme.canvasBackground);
  const isDark = context.theme.canvasBackground
    ? isDarkSurface(context.theme.canvasBackground)
    : skeleton.isDark;

  const customPalette =
    context.config.hierarchy?.enabled && context.config.hierarchy.levelColors.length > 0
      ? context.config.hierarchy.levelColors
      : undefined;
  const seedPalette =
    customPalette && context.config.hierarchy.preset !== 'classic'
      ? customPalette
      : skeleton.seedPalette.length > 0
        ? skeleton.seedPalette
        : HIERARCHY_PRESETS[0].colors;

  // Level 2: Topic Role Style
  const role = resolveTopicRole(node, context.roleByNodeId?.get(node.id));
  const roleSpec = roleDefaults(role, node.depth, skeleton);

  // Level 3: Smart Branch HSL Inheritance
  const effectiveSeed =
    node.depth === 0 && !context.branchColorOverrides[node.id] && !node.branchColor
      ? seedPalette[0]
      : resolveEffectiveBranchColor(
          node.id,
          node.branchId,
          context.parentByChild,
          context.branchColorOverrides,
          context.nodeBranchColorById,
          seedPalette,
        );
  const smart = resolveSmartBranchHsl(effectiveSeed, node.depth, isDark);

  // Level 4: Local / Inline Override
  const storeLocal = context.nodeStyleOverrides[node.id];
  const mergedLocal: NodeStyleOverride = {
    ...(node.styleOverride ?? {}),
    ...(storeLocal ?? {}),
  };

  const topicShape: TopicShape =
    mergedLocal.topicShape ??
    node.topicShape ??
    context.config.nodes.topicShape ??
    roleSpec.defaultShape;

  const fillColor = mergedLocal.fillColor ?? smart.fill;
  const borderColor = mergedLocal.borderColor ?? smart.border;
  const lineColor = mergedLocal.lineColor ?? smart.line;
  const fontWeight = mergedLocal.fontWeight
    ? FONT_WEIGHT_MAP[mergedLocal.fontWeight]
    : roleSpec.fontWeight;

  // WCAG AA >= 4.5:1 Contrast Guard against actual readable background
  const canvasSurface = context.theme.canvasBackground || skeleton.canvasBg;
  const readableBackground =
    topicShape === 'underline' || !context.config.nodes.labelBox
      ? canvasSurface
      : fillColor;

  const candidateText =
    mergedLocal.textColor ??
    pickContrastTextColor(readableBackground, skeleton.lightText, skeleton.darkText, 4.5);
  const measuredRatio = contrastRatio(candidateText, readableBackground);
  const textColor =
    measuredRatio >= 4.5
      ? candidateText
      : pickContrastTextColor(readableBackground, skeleton.lightText, skeleton.darkText, 4.5);

  const hasAncestorBranchOverride = (() => {
    let cur: string | null | undefined = node.id;
    const seen = new Set<string>();
    while (cur && !seen.has(cur)) {
      if (context.branchColorOverrides[cur] || context.nodeBranchColorById.get(cur)) return true;
      seen.add(cur);
      cur = context.parentByChild.get(cur) ?? null;
    }
    return false;
  })();

  const hasExplicitCascade =
    context.config.nodes.autoColorBy === 'branch' ||
    Boolean(configuredSkeletonId) ||
    hasAncestorBranchOverride ||
    Object.keys(mergedLocal).length > 0 ||
    role === 'floating' ||
    role === 'summary';

  return {
    role,
    topicShape,
    fillColor,
    borderColor,
    textColor,
    lineColor,
    accentColor: mergedLocal.borderColor ?? smart.accent,
    lineWidth: roleSpec.lineWidth,
    fontWeight,
    fontSizeDelta: roleSpec.fontSizeDelta,
    contrastRatio: contrastRatio(textColor, readableBackground),
    dashedBorder: roleSpec.dashedBorder,
    hasExplicitCascade,
  };
}

/** Batch resolver for `useGraphCanvasController` paint memoization. */
export function resolveCascadingPaintMap(
  nodes: RenderNode[],
  context: CascadingStyleContext,
): Map<string, ResolvedNodePaint> {
  let effectiveContext = context;
  if (context.summaries && context.summaries.length > 0) {
    const summaryRoles = new Map<string, TopicRole>(context.roleByNodeId);
    for (const s of context.summaries) {
      if (!summaryRoles.has(s.summaryNodeId)) {
        summaryRoles.set(s.summaryNodeId, 'summary');
      }
    }
    effectiveContext = { ...context, roleByNodeId: summaryRoles };
  }
  const map = new Map<string, ResolvedNodePaint>();
  for (const node of nodes) {
    map.set(node.id, resolveCascadingNodeStyle(node, effectiveContext));
  }
  return map;
}

export interface LayoutSignatureInput {
  mode: LayoutMode;
  orientation: MindmapOrientation;
  rootId?: string;
  width: number;
  height: number;
  levelGap: number;
  siblingGap: number;
  laneGap: number;
  ribAngle: number;
  visibleIds: string[];
  linksCount: number;
  metricDigest: string;
  subtreeOverrides?: SubtreeLayoutMap;
  boundaries?: BoundaryGroup[];
  summaries?: SummaryGroup[];
  manualOffsets?: Record<string, ManualNodeOffset>;
}

/** Pure geometric layout signature — intentionally excludes color, preset, and line-style fields. */
export function buildLayoutSignature(input: LayoutSignatureInput): string {
  return [
    input.mode,
    input.orientation,
    input.rootId ?? '',
    Math.round(input.width),
    Math.round(input.height),
    input.levelGap,
    input.siblingGap,
    input.laneGap,
    input.ribAngle.toFixed(3),
    input.visibleIds.join(','),
    input.linksCount,
    input.metricDigest,
    JSON.stringify(input.subtreeOverrides ?? {}),
    JSON.stringify(
      (input.boundaries ?? []).map((b) => [b.id, b.nodeIds, b.padding, b.shape, b.title ?? '']),
    ),
    JSON.stringify(
      (input.summaries ?? []).map((s) => [s.id, s.parentId, s.rangeNodeIds, s.summaryNodeId]),
    ),
    JSON.stringify(input.manualOffsets ?? {}),
  ].join('|');
}

export interface PaintSignatureInput {
  skeletonPreset?: string;
  canvasBackground: string;
  labelBackground: string;
  labelBox?: boolean;
  showLabels?: boolean;
  autoColorBy: string;
  hierarchy: GraphConfigState['hierarchy'];
  branchLineStyle?: string;
  taperedTrunk?: boolean;
  branchColorOverrides: Record<string, string>;
  nodeStyleOverrides: Record<string, NodeStyleOverride>;
  appTheme?: string;
  customCssSnippet?: string;
}

/** Visual-only paint signature — changes here invalidate Canvas2D paint without running layout solvers. */
export function buildPaintSignature(input: PaintSignatureInput): string {
  return JSON.stringify([
    input.skeletonPreset ?? '',
    input.canvasBackground,
    input.labelBackground,
    input.labelBox ?? true,
    input.showLabels ?? true,
    input.autoColorBy,
    input.hierarchy,
    input.branchLineStyle ?? '',
    input.taperedTrunk ?? true,
    input.branchColorOverrides,
    input.nodeStyleOverrides,
    input.appTheme ?? '',
    input.customCssSnippet ?? '',
  ]);
}
