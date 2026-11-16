/**
 * Normalizes vault graph data into the render model plus hierarchy indexes.
 * Dangling parents are ignored and cycles are cut at their first repeat, so a
 * malformed vault still produces a deterministic forest.
 * Also extracts XMind-compatible YAML frontmatter attachments, TopicShape, and [[wikilink]] counts.
 */

import { parse as parseYaml } from 'yaml';
import type {
  GraphProjection,
  Link,
  MindmapLayoutMode,
  Node,
  NodeAttachments,
  NodeMarker,
  NodeStyleOverride,
  RenderLink,
  RenderNode,
  TopicShape,
} from '@/domains/graph/shared/utils/graph.types';

const VALID_STRUCTURE_CLASSES = new Set<MindmapLayoutMode>([
  'mindmap',
  'org-chart',
  'brace-map',
  'timeline',
  'fishbone',
]);

const VALID_TOPIC_SHAPES = new Set<TopicShape>([
  'rounded-rect',
  'pill',
  'underline',
  'ellipse',
  'diamond',
  'hexagon',
  'cloud',
  'parallelogram',
]);

export const endpointId = (end: string | { id: string }) =>
  typeof end === 'string' ? end : end.id;

const normalizeLinkType = (type: unknown): RenderLink['type'] => {
  if (type === 'hierarchical') return 'hierarchy';
  if (type === 'hierarchy' || type === 'backlink' || type === 'tag' || type === 'semantic') {
    return type;
  }
  return 'hierarchy';
};

function parseFrontmatterRecord(content: string): Record<string, unknown> | null {
  if (!content.startsWith('---')) return null;
  const end = content.indexOf('\n---', 3);
  if (end === -1) return null;
  try {
    const parsed = parseYaml(content.slice(content.indexOf('\n') + 1, end));
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Counts `[[wikilinks]]` in Markdown body outside YAML frontmatter. */
export function countWikilinks(content: string): number {
  if (!content) return 0;
  let body = content;
  if (content.startsWith('---')) {
    const end = content.indexOf('\n---', 3);
    if (end !== -1) body = content.slice(end + 4);
  }
  const matches = body.match(/\[\[[^\]]+\]\]/g);
  return matches ? matches.length : 0;
}

/** Extracts XMind attachments (`markers`, `sticker`, `labels`), `topicShape`, `structureClass`, `branchColor`, and local `styleOverride` from YAML frontmatter. */
export function extractRichMetadata(content: string): {
  attachments?: NodeAttachments;
  topicShape?: TopicShape;
  structureClass?: MindmapLayoutMode;
  branchColor?: string;
  styleOverride?: NodeStyleOverride;
} {
  const fm = parseFrontmatterRecord(content);
  if (!fm) return {};

  const markers: NodeMarker[] = [];

  // Priority (1..7 or P1..P7)
  const rawPriority = fm.priority;
  if (rawPriority !== undefined && rawPriority !== null) {
    const numMatch = String(rawPriority).match(/([1-7])/);
    if (numMatch) {
      markers.push({ kind: 'priority', level: Number(numMatch[1]) as 1 | 2 | 3 | 4 | 5 | 6 | 7 });
    }
  }

  // Progress (0..100 or "75%")
  const rawProgress = fm.progress;
  if (rawProgress !== undefined && rawProgress !== null) {
    const num = Number(String(rawProgress).replace('%', '').trim());
    if (Number.isFinite(num)) {
      markers.push({ kind: 'progress', percent: Math.max(0, Math.min(100, num)) });
    }
  }

  // Checkbox / Status ('todo' | 'done' | boolean)
  const rawCheckbox = fm.checkbox ?? fm.task_status;
  if (typeof rawCheckbox === 'boolean') {
    markers.push({ kind: 'checkbox', state: rawCheckbox ? 'done' : 'todo' });
  } else if (typeof rawCheckbox === 'string') {
    const norm = rawCheckbox.trim().toLowerCase();
    if (norm === 'done' || norm === 'complete' || norm === 'completed') {
      markers.push({ kind: 'checkbox', state: 'done' });
    } else if (norm === 'todo' || norm === 'open' || norm === 'pending') {
      markers.push({ kind: 'checkbox', state: 'todo' });
    }
  } else if (typeof fm.status === 'string') {
    const norm = fm.status.trim().toLowerCase();
    if (norm === 'done' || norm === 'completed') {
      markers.push({ kind: 'checkbox', state: 'done' });
    } else if (norm === 'todo') {
      markers.push({ kind: 'checkbox', state: 'todo' });
    }
  }

  // Flag & Star
  if (fm.flag) {
    markers.push({
      kind: 'flag',
      color: typeof fm.flag === 'string' && fm.flag !== 'true' ? fm.flag : '#ef4444',
    });
  }
  if (fm.star) {
    markers.push({
      kind: 'star',
      color: typeof fm.star === 'string' && fm.star !== 'true' ? fm.star : '#eab308',
    });
  }

  // Emoji marker
  if (typeof fm.emoji === 'string' && fm.emoji.trim()) {
    markers.push({ kind: 'emoji', value: fm.emoji.trim() });
  }

  // Sticker / Icon
  const rawSticker = fm.sticker ?? fm.icon;
  const sticker =
    typeof rawSticker === 'string' && rawSticker.trim() ? rawSticker.trim() : undefined;

  // Footer labels
  const rawLabels = fm.labels;
  let labels: string[] | undefined;
  if (Array.isArray(rawLabels)) {
    labels = rawLabels.map((item) => String(item).trim()).filter(Boolean);
  } else if (typeof rawLabels === 'string' && rawLabels.trim()) {
    labels = rawLabels.split(',').map((item) => item.trim()).filter(Boolean);
  }

  // Topic shape
  const rawShape = String(fm.topic_shape ?? fm.topicShape ?? fm.shape ?? '')
    .trim()
    .toLowerCase() as TopicShape;
  const topicShape = VALID_TOPIC_SHAPES.has(rawShape) ? rawShape : undefined;

  const rawStructure = String(fm.structure_class ?? fm.structureClass ?? '')
    .trim()
    .toLowerCase() as MindmapLayoutMode;
  const structureClass = VALID_STRUCTURE_CLASSES.has(rawStructure) ? rawStructure : undefined;

  const branchColor =
    typeof fm.branch_color === 'string' && fm.branch_color.trim()
      ? fm.branch_color.trim()
      : undefined;

  const styleOverride: NodeStyleOverride = {};
  if (typeof fm.fill_color === 'string' && fm.fill_color.trim()) {
    styleOverride.fillColor = fm.fill_color.trim();
  }
  if (typeof fm.border_color === 'string' && fm.border_color.trim()) {
    styleOverride.borderColor = fm.border_color.trim();
  }
  if (typeof fm.text_color === 'string' && fm.text_color.trim()) {
    styleOverride.textColor = fm.text_color.trim();
  }
  if (typeof fm.line_color === 'string' && fm.line_color.trim()) {
    styleOverride.lineColor = fm.line_color.trim();
  }
  if (typeof fm.font_weight === 'string') {
    const fw = fm.font_weight.trim().toLowerCase();
    if (fw === 'normal' || fw === 'medium' || fw === 'semibold' || fw === 'bold') {
      styleOverride.fontWeight = fw;
    }
  }
  const hasStyleOverride = Object.keys(styleOverride).length > 0;

  const hasAttachments = markers.length > 0 || Boolean(sticker) || Boolean(labels?.length);
  return {
    attachments: hasAttachments
      ? {
          ...(markers.length > 0 ? { markers } : {}),
          ...(sticker ? { sticker } : {}),
          ...(labels?.length ? { labels } : {}),
        }
      : undefined,
    topicShape,
    structureClass,
    branchColor,
    styleOverride: hasStyleOverride ? styleOverride : undefined,
  };
}

/** Best-effort date extraction from a note's frontmatter. */
export function noteTime(content: string, field: string): number | undefined {
  const fm = parseFrontmatterRecord(content);
  if (!fm) return undefined;
  const raw = fm[field] ?? fm.date ?? fm.created ?? fm.year;
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === 'number') {
    return new Date(`${String(raw).padStart(4, '0')}-01-01`).getTime();
  }
  const time = new Date(String(raw)).getTime();
  return Number.isFinite(time) ? time : undefined;
}

export function buildGraphProjection(
  nodes: Node[],
  links: Link[],
  options: { timeField?: string } = {},
): GraphProjection {
  const timeField = options.timeField ?? 'date';
  const ids = new Set(nodes.map((node) => node.id));

  const parentByChild = new Map<string, string | null>();
  for (const node of nodes) {
    const parent = node.parentId && ids.has(node.parentId) ? node.parentId : null;
    parentByChild.set(node.id, parent === node.id ? null : parent);
  }

  // Cut cycles: walking up must always terminate at a root.
  for (const node of nodes) {
    const seen = new Set<string>([node.id]);
    let current = parentByChild.get(node.id) ?? null;
    while (current) {
      if (seen.has(current)) {
        parentByChild.set(current, null);
        break;
      }
      seen.add(current);
      current = parentByChild.get(current) ?? null;
    }
  }

  const childrenByParent = new Map<string, string[]>();
  const roots: string[] = [];
  for (const node of nodes) {
    const parent = parentByChild.get(node.id) ?? null;
    if (parent === null) roots.push(node.id);
    else {
      const list = childrenByParent.get(parent);
      if (list) list.push(node.id);
      else childrenByParent.set(parent, [node.id]);
    }
  }

  const depthOf = new Map<string, number>();
  const assignDepth = (id: string, depth: number) => {
    depthOf.set(id, depth);
    for (const child of childrenByParent.get(id) ?? []) assignDepth(child, depth + 1);
  };
  roots.forEach((id) => assignDepth(id, 0));

  const rootOf = (id: string): string => {
    let current = id;
    let parent = parentByChild.get(current) ?? null;
    while (parent) {
      current = parent;
      parent = parentByChild.get(current) ?? null;
    }
    return current;
  };

  const branchRootOf = (id: string): string => {
    let current = id;
    let parent = parentByChild.get(current) ?? null;
    if (!parent) return id;
    while (parent && (depthOf.get(parent) ?? 0) > 0) {
      current = parent;
      parent = parentByChild.get(current) ?? null;
    }
    return current;
  };

  const renderNodes: RenderNode[] = nodes.map((node) => {
    const content = node.content ?? '';
    const extracted =
      node.type === 'folder' ? {} : extractRichMetadata(content);
    const mergedAttachments: NodeAttachments | undefined =
      node.attachments || extracted.attachments
        ? {
            markers: node.attachments?.markers ?? extracted.attachments?.markers,
            sticker: node.attachments?.sticker ?? extracted.attachments?.sticker,
            labels: node.attachments?.labels ?? extracted.attachments?.labels,
          }
        : undefined;
    const wikilinkCount =
      node.wikilinkCount ??
      node.wikilinks?.length ??
      (node.type === 'folder' ? 0 : countWikilinks(content));

    const mergedStyleOverride: NodeStyleOverride | undefined =
      node.styleOverride || extracted.styleOverride
        ? { ...(extracted.styleOverride ?? {}), ...(node.styleOverride ?? {}) }
        : undefined;

    return {
      id: node.id,
      name: node.name,
      type: node.type,
      mediaType: node.mediaType,
      parentId: parentByChild.get(node.id) ?? null,
      depth: depthOf.get(node.id) ?? 0,
      tags: node.tags ?? [],
      content,
      time: node.type === 'folder' ? undefined : noteTime(content, timeField),
      category: rootOf(node.id),
      branchId: branchRootOf(node.id),
      branchColor: node.branchColor ?? extracted.branchColor,
      styleOverride: mergedStyleOverride,
      childCount: (childrenByParent.get(node.id) ?? []).length,
      attachments: mergedAttachments,
      topicShape: node.topicShape ?? extracted.topicShape,
      structureClass: node.structureClass ?? extracted.structureClass,
      wikilinkCount,
    };
  });

  const byId = new Map(renderNodes.map((node) => [node.id, node]));

  const renderLinks: RenderLink[] = links
    .filter((link) => ids.has(endpointId(link.source)) && ids.has(endpointId(link.target)))
    .map((link) => ({
      source: endpointId(link.source),
      target: endpointId(link.target),
      type: normalizeLinkType(link.type),
      role: normalizeLinkType(link.type) === 'hierarchy' ? 'hierarchy' : undefined,
    }));

  return { nodes: renderNodes, links: renderLinks, byId, childrenByParent, parentByChild, roots };
}

/** Subtree weight: max(1, sum of visible children weights). */
export function subtreeWeights(
  roots: string[],
  childrenOf: (id: string) => string[],
): Map<string, number> {
  const weights = new Map<string, number>();
  const visit = (id: string): number => {
    const cached = weights.get(id);
    if (cached !== undefined) return cached;
    weights.set(id, 1);
    const children = childrenOf(id);
    const total = children.reduce((sum, child) => sum + visit(child), 0);
    const weight = Math.max(1, total);
    weights.set(id, weight);
    return weight;
  };
  roots.forEach(visit);
  return weights;
}
