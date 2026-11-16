/**
 * Isolated YAML frontmatter read/write helpers for XMind semantic metadata (AGENTS.md Rule 6).
 * Updates only YAML properties (`priority`, `progress`, `checkbox`, `icon`, `topic_shape`,
 * `branch_color`, `structure_class`, `parent`) while keeping the Markdown body untouched.
 */

import {
  parseFrontmatter,
  writeFrontmatter,
} from '@/domains/editor/shared/utils/frontmatterField';
import {
  detectListLayout,
  reservedType,
} from '@/domains/editor/shared/utils/frontmatterUtils';
import type {
  MindmapLayoutMode,
  TopicShape,
} from '@/domains/graph/shared/utils/graph.types';
import type { FrontmatterProperty } from '@/domains/editor/shared/utils/editor.types';

export interface NodeFrontmatterMindmapProps {
  priority?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  progress?: number;
  checkbox?: 'todo' | 'done';
  icon?: string;
  topicShape?: TopicShape;
  branchColor?: string;
  structureClass?: MindmapLayoutMode;
  parent?: string;
}

export interface NodeFrontmatterMindmapPatch {
  priority?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | null;
  progress?: number | null;
  checkbox?: 'todo' | 'done' | null;
  icon?: string | null;
  topic_shape?: TopicShape | null;
  branch_color?: string | null;
  structure_class?: MindmapLayoutMode | null;
  parent?: string | null;
}

/** Reads XMind properties from isolated YAML frontmatter without scanning body text. */
export function readNodeFrontmatterMindmapProps(
  markdownContent: string,
): NodeFrontmatterMindmapProps {
  const { properties } = parseFrontmatter(markdownContent ?? '');
  const byKey = new Map(properties.map((p) => [p.key.toLowerCase(), p.value]));

  const out: NodeFrontmatterMindmapProps = {};

  const rawPriority = byKey.get('priority');
  if (rawPriority !== undefined && rawPriority !== null) {
    const match = String(rawPriority).match(/([1-7])/);
    if (match) out.priority = Number(match[1]) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
  }

  const rawProgress = byKey.get('progress');
  if (rawProgress !== undefined && rawProgress !== null) {
    const num = Number(String(rawProgress).replace('%', '').trim());
    if (Number.isFinite(num)) out.progress = Math.max(0, Math.min(100, Math.round(num)));
  }

  const rawCheckbox = byKey.get('checkbox') ?? byKey.get('task_status');
  if (typeof rawCheckbox === 'boolean') {
    out.checkbox = rawCheckbox ? 'done' : 'todo';
  } else if (typeof rawCheckbox === 'string') {
    const norm = rawCheckbox.trim().toLowerCase();
    if (norm === 'done' || norm === 'completed') out.checkbox = 'done';
    else if (norm === 'todo' || norm === 'pending') out.checkbox = 'todo';
  }

  const rawIcon = byKey.get('icon') ?? byKey.get('sticker');
  if (typeof rawIcon === 'string' && rawIcon.trim()) {
    out.icon = rawIcon.trim();
  }

  const rawShape = byKey.get('topic_shape') ?? byKey.get('topicshape');
  if (typeof rawShape === 'string' && rawShape.trim()) {
    out.topicShape = rawShape.trim().toLowerCase() as TopicShape;
  }

  const rawBranchColor = byKey.get('branch_color');
  if (typeof rawBranchColor === 'string' && rawBranchColor.trim()) {
    out.branchColor = rawBranchColor.trim();
  }

  const rawStructure = byKey.get('structure_class') ?? byKey.get('structureclass');
  if (typeof rawStructure === 'string' && rawStructure.trim()) {
    out.structureClass = rawStructure.trim().toLowerCase() as MindmapLayoutMode;
  }

  const rawParent = byKey.get('parent');
  if (typeof rawParent === 'string' && rawParent.trim()) {
    out.parent = rawParent.trim();
  }

  return out;
}

/**
 * Upserts or clears XMind frontmatter keys inside the YAML fence while preserving
 * all other YAML properties and leaving the Markdown body 100% unmodified.
 */
export function upsertNodeFrontmatterMindmapProps(
  markdownContent: string,
  patch: NodeFrontmatterMindmapPatch,
): string {
  const doc = markdownContent ?? '';
  const parsed = parseFrontmatter(doc);
  const listLayout = parsed.raw ? detectListLayout(parsed.raw) : 'block';
  const nextProps: FrontmatterProperty[] = [...parsed.properties];

  for (const [rawKey, rawValue] of Object.entries(patch)) {
    const key = rawKey.trim();
    if (!key) continue;

    const existingIdx = nextProps.findIndex((p) => p.key.toLowerCase() === key.toLowerCase());
    const shouldRemove = rawValue === null || rawValue === undefined || rawValue === '';

    if (shouldRemove) {
      if (existingIdx !== -1) nextProps.splice(existingIdx, 1);
      continue;
    }

    const propType =
      reservedType(key) ??
      (typeof rawValue === 'number'
        ? 'number'
        : typeof rawValue === 'boolean'
          ? 'checkbox'
          : 'text');

    if (existingIdx !== -1) {
      nextProps[existingIdx] = { ...nextProps[existingIdx], value: rawValue, type: propType };
    } else {
      nextProps.push({ key, value: rawValue, type: propType });
    }
  }

  return writeFrontmatter(doc, nextProps, listLayout);
}
