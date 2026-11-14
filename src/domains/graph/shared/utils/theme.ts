/** Resolves graph config and unified `--ob-*` semantic tokens into concrete canvas colors, once per render pass. */

import { colorWithOpacity, resolveColor } from '@/global/utils/color-utils';
import type { GraphConfigState } from '@/domains/graph/shared/stores/useGraphStore';
import type { RenderNode } from '@/domains/graph/shared/utils/graph.types';
import {
  resolveLevelColor,
  type HierarchyColorConfig,
} from '@/domains/graph/shared/utils/hierarchyColors';

export interface SemanticCanvasTokens {
  bgCanvas: string;
  surface: string;
  accent: string;
  edgeDefault: string;
  nodeFile: string;
  nodeFolder: string;
  textPrimary: string;
}

/** Reads live `--ob-*` CSS custom properties injected by `useThemeStore`. */
export function resolveSemanticCanvasTokens(): SemanticCanvasTokens {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      bgCanvas: resolveColor('hsl(var(--background))'),
      surface: resolveColor('hsl(var(--card))'),
      accent: resolveColor('hsl(var(--accent))'),
      edgeDefault: resolveColor('hsl(var(--primary))'),
      nodeFile: resolveColor('hsl(var(--file-node))'),
      nodeFolder: resolveColor('hsl(var(--folder-node))'),
      textPrimary: resolveColor('hsl(var(--foreground))'),
    };
  }

  const cs = getComputedStyle(document.documentElement);
  const readVar = (name: string, fallbackExpr: string) => {
    const raw = cs.getPropertyValue(name).trim();
    return resolveColor(raw || fallbackExpr);
  };

  return {
    bgCanvas: readVar('--ob-bg-canvas', 'hsl(var(--canvas-bg))'),
    surface: readVar('--ob-surface', 'hsl(var(--card))'),
    accent: readVar('--ob-accent', 'hsl(var(--accent))'),
    edgeDefault: readVar('--ob-edge-default', 'hsl(var(--primary))'),
    nodeFile: readVar('--ob-node-file', 'hsl(var(--file-node))'),
    nodeFolder: readVar('--ob-node-folder', 'hsl(var(--folder-node))'),
    textPrimary: readVar('--ob-text-primary', 'hsl(var(--foreground))'),
  };
}

export interface GraphTheme {
  folder: string;
  file: string;
  selected: string;
  label: string;
  labelBackground: string;
  labelBackgroundEnabled: boolean;
  link: string;
  linkOpacity: number;
  decoration: string;
  card: string;
  cardBorder: string;
  canvasBackground: string;
  nodeOpacity: number;
  autoColorBy: GraphConfigState['nodes']['autoColorBy'];
  labelSize: number;
  hierarchy: HierarchyColorConfig;
}

export function buildTheme(config: GraphConfigState): GraphTheme {
  const semantic = resolveSemanticCanvasTokens();

  return {
    folder: config.nodes.folderColor ? resolveColor(config.nodes.folderColor) : semantic.nodeFolder,
    file: config.nodes.fileColor ? resolveColor(config.nodes.fileColor) : semantic.nodeFile,
    selected: config.nodes.selectedColor ? resolveColor(config.nodes.selectedColor) : semantic.accent,
    label: config.nodes.labelColor ? resolveColor(config.nodes.labelColor) : semantic.textPrimary,
    labelBackground: config.nodes.labelBackgroundColor
      ? resolveColor(config.nodes.labelBackgroundColor)
      : semantic.surface,
    labelBackgroundEnabled: config.nodes.labelBackground,
    link: config.links.color ? resolveColor(config.links.color) : semantic.edgeDefault,
    linkOpacity: config.links.opacity,
    decoration: config.links.color ? resolveColor(config.links.color) : semantic.edgeDefault,
    card: semantic.surface,
    cardBorder: resolveColor('hsl(var(--border))'),
    canvasBackground: semantic.bgCanvas,
    nodeOpacity: config.nodes.opacity,
    autoColorBy: config.nodes.autoColorBy,
    labelSize: config.nodes.labelSize,
    hierarchy: config.hierarchy,
  };
}

export function accentFor(
  node: RenderNode,
  theme: GraphTheme,
  selected: boolean,
  overrideColor?: string
): string {
  if (selected) return theme.selected;
  if (overrideColor) return overrideColor;

  // Branch Color Inheritance: Turunan mewarisi warna cabang dari preset hierarchy
  if (theme.autoColorBy === 'branch' && theme.hierarchy?.levelColors?.length) {
    const branchId = node.branchId ?? node.id;
    const hash = branchId
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = hash % theme.hierarchy.levelColors.length;
    return theme.hierarchy.levelColors[colorIndex];
  }

  // Hierarchy colouring wins over autoColorBy, but keeps the selected accent.
  if (theme.hierarchy?.enabled) return resolveLevelColor(node.depth, theme.hierarchy);
  if (theme.autoColorBy === 'depth') return `hsl(${(node.depth * 40) % 360}, 70%, 55%)`;
  if (theme.autoColorBy === 'tags' && node.tags.length) {
    const hash = node.tags[0]
      .split('')
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return `hsl(${hash % 360}, 70%, 55%)`;
  }
  return node.type === 'folder' ? theme.folder : theme.file;
}

export const dim = (color: string, amount: number) => colorWithOpacity(color, amount);
