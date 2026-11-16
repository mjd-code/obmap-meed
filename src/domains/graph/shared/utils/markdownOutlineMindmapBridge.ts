/**
 * Bidirectional Lossless In-Note Outline-to-Mindmap AST Bridge (`XMIND-STEP-06`, DOC-PLAN-009).
 *
 * Maps a single Markdown note (`# H1`, `## H2`, ..., `- list`, `- [ ] task`) cleanly into
 * deterministic `GraphData` nodes/links and applies surgical AST line patches back to the
 * raw Markdown source while preserving YAML frontmatter, prose paragraphs, and fenced code blocks.
 * Never injects HTML comments or hidden JSON into `.md` files (`AGENTS.md` Rule 6).
 */

import { splitDocument } from '@/domains/editor/shared/utils/frontmatterField';
import type { GraphData, Link, Node } from '@/global/types/graph.types';

export interface OutlineAstEntry {
  id: string;
  parentId: string | null;
  kind: 'root' | 'heading' | 'list' | 'task';
  title: string;
  /** 0-based line index relative to full Markdown document lines. */
  lineIndex: number | null;
  /** Exclusive end line index of the subtree belonging to this entry. */
  subtreeEndLine: number;
  headingLevel?: number;
  indent?: number;
  listPrefix?: string;
  checked?: boolean;
  depth: number;
}

export interface OutlineMindmapProjection {
  graphData: GraphData;
  entries: Map<string, OutlineAstEntry>;
  rootId: string;
  noteTitle: string;
}

interface ParsedBodyLine {
  docLineIndex: number;
  raw: string;
  kind: 'heading' | 'list' | 'task' | 'prose' | 'fence' | 'blank';
  headingLevel?: number;
  indent?: number;
  listPrefix?: string;
  checked?: boolean;
  title?: string;
}

const HEADING_RE = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const TASK_RE = /^(\s*)([-*+]|\d+\.)\s+\[([ xX])\]\s+(.*)$/;
const LIST_RE = /^(\s*)([-*+]|\d+\.)\s+(.*)$/;
const FENCE_RE = /^\s*(```|~~~)/;

function slugifyHeading(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  return slug || 'node';
}

function tokenizeMarkdownLines(doc: string): {
  lines: string[];
  bodyStartLine: number;
  parsed: ParsedBodyLine[];
} {
  const normalized = doc.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const { info } = splitDocument(normalized);
  let bodyStartLine = 0;
  if (info.range) {
    const fmSlice = normalized.slice(0, info.range.to);
    bodyStartLine = fmSlice.split('\n').length;
  }

  const parsed: ParsedBodyLine[] = [];
  let activeFence: string | null = null;

  for (let i = bodyStartLine; i < lines.length; i += 1) {
    const raw = lines[i];
    const fenceMatch = raw.match(FENCE_RE);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!activeFence) activeFence = marker;
      else if (activeFence === marker) activeFence = null;
      parsed.push({ docLineIndex: i, raw, kind: 'fence' });
      continue;
    }

    if (activeFence) {
      parsed.push({ docLineIndex: i, raw, kind: 'prose' });
      continue;
    }

    if (!raw.trim()) {
      parsed.push({ docLineIndex: i, raw, kind: 'blank' });
      continue;
    }

    const hMatch = raw.match(HEADING_RE);
    if (hMatch) {
      parsed.push({
        docLineIndex: i,
        raw,
        kind: 'heading',
        headingLevel: hMatch[1].length,
        title: hMatch[2].trim() || `Heading ${i + 1}`,
      });
      continue;
    }

    const tMatch = raw.match(TASK_RE);
    if (tMatch) {
      parsed.push({
        docLineIndex: i,
        raw,
        kind: 'task',
        indent: tMatch[1].length,
        listPrefix: tMatch[2],
        checked: tMatch[3].toLowerCase() === 'x',
        title: tMatch[4].trim() || 'Untitled Task',
      });
      continue;
    }

    const lMatch = raw.match(LIST_RE);
    if (lMatch) {
      parsed.push({
        docLineIndex: i,
        raw,
        kind: 'list',
        indent: lMatch[1].length,
        listPrefix: lMatch[2],
        title: lMatch[3].trim() || 'Untitled Item',
      });
      continue;
    }

    parsed.push({ docLineIndex: i, raw, kind: 'prose' });
  }

  return { lines, bodyStartLine, parsed };
}

/**
 * Parses a Markdown document into deterministic Mindmap `GraphData` plus AST index.
 */
export function parseMarkdownOutlineToMindmap(
  noteId: string,
  noteTitle: string,
  markdownContent: string,
): OutlineMindmapProjection {
  const { lines, bodyStartLine, parsed } = tokenizeMarkdownLines(markdownContent ?? '');
  const totalLines = lines.length;
  const entries = new Map<string, OutlineAstEntry>();
  const orderedEntries: OutlineAstEntry[] = [];
  const sectionProseCount = new Map<string, number>();

  const firstH1 = parsed.find((line) => line.kind === 'heading' && line.headingLevel === 1);
  const rootId = `${noteId}::outline-root`;
  const rootTitle = firstH1?.title ?? (noteTitle || 'Catatan');

  const rootEntry: OutlineAstEntry = {
    id: rootId,
    parentId: null,
    kind: 'root',
    title: rootTitle,
    lineIndex: firstH1 ? firstH1.docLineIndex : null,
    subtreeEndLine: totalLines,
    headingLevel: firstH1 ? 1 : 0,
    depth: 0,
  };
  entries.set(rootId, rootEntry);
  orderedEntries.push(rootEntry);

  const headingStack: OutlineAstEntry[] = [rootEntry];
  let listStack: OutlineAstEntry[] = [];
  let activeContainerId = rootId;

  for (const token of parsed) {
    if (token.kind === 'heading') {
      if (firstH1 && token.docLineIndex === firstH1.docLineIndex) {
        activeContainerId = rootId;
        listStack = [];
        continue;
      }

      const hLevel = token.headingLevel ?? 2;
      while (
        headingStack.length > 1 &&
        (headingStack[headingStack.length - 1].headingLevel ?? 1) >= hLevel
      ) {
        headingStack.pop();
      }

      const parent = headingStack[headingStack.length - 1];
      const id = `${noteId}::h:${token.docLineIndex}:${slugifyHeading(token.title ?? '')}`;
      const entry: OutlineAstEntry = {
        id,
        parentId: parent.id,
        kind: 'heading',
        title: token.title ?? '',
        lineIndex: token.docLineIndex,
        subtreeEndLine: totalLines,
        headingLevel: hLevel,
        depth: parent.depth + 1,
      };
      entries.set(id, entry);
      orderedEntries.push(entry);
      headingStack.push(entry);
      listStack = [];
      activeContainerId = id;
      continue;
    }

    if (token.kind === 'list' || token.kind === 'task') {
      const indent = token.indent ?? 0;
      while (
        listStack.length > 0 &&
        (listStack[listStack.length - 1].indent ?? 0) >= indent
      ) {
        listStack.pop();
      }
      const parent = listStack[listStack.length - 1] ?? headingStack[headingStack.length - 1];
      const id = `${noteId}::li:${token.docLineIndex}:${slugifyHeading(token.title ?? '')}`;
      const entry: OutlineAstEntry = {
        id,
        parentId: parent.id,
        kind: token.kind,
        title: token.title ?? '',
        lineIndex: token.docLineIndex,
        subtreeEndLine: token.docLineIndex + 1,
        indent,
        listPrefix: token.listPrefix ?? '-',
        checked: token.checked,
        depth: parent.depth + 1,
      };
      entries.set(id, entry);
      orderedEntries.push(entry);
      listStack.push(entry);
      activeContainerId = id;
      continue;
    }

    if (token.kind === 'prose' && token.raw.trim()) {
      sectionProseCount.set(
        activeContainerId,
        (sectionProseCount.get(activeContainerId) ?? 0) + 1,
      );
    }
  }

  // Compute tight subtree line ranges using next entry of equal/smaller structural rank
  for (let i = 0; i < orderedEntries.length; i += 1) {
    const cur = orderedEntries[i];
    if (cur.lineIndex === null) {
      cur.subtreeEndLine = totalLines;
      continue;
    }
    let end = totalLines;
    for (let j = i + 1; j < orderedEntries.length; j += 1) {
      const next = orderedEntries[j];
      if (next.lineIndex === null) continue;
      if (cur.kind === 'heading' && next.kind === 'heading') {
        if ((next.headingLevel ?? 2) <= (cur.headingLevel ?? 2)) {
          end = next.lineIndex;
          break;
        }
      } else if (cur.kind === 'list' || cur.kind === 'task') {
        if (next.kind === 'heading') {
          end = next.lineIndex;
          break;
        }
        if ((next.indent ?? 0) <= (cur.indent ?? 0)) {
          end = next.lineIndex;
          break;
        }
      }
    }
    cur.subtreeEndLine = end;
  }

  // Fallback for empty body
  void bodyStartLine;

  const nodes: Node[] = orderedEntries.map((entry) => {
    const proseLines = sectionProseCount.get(entry.id) ?? 0;
    const isTask = entry.kind === 'task';
    return {
      id: entry.id,
      name: entry.title,
      content: proseLines > 0 ? `${proseLines} baris narasi/blok kode` : '',
      type: entry.kind === 'root' || entry.kind === 'heading' ? 'folder' : 'file',
      parentId: entry.parentId,
      depth: entry.depth,
      tags: [],
      ...(isTask
        ? {
            attachments: {
              markers: [{ kind: 'checkbox', state: entry.checked ? 'done' : 'todo' }],
            },
          }
        : proseLines > 0
          ? {
              attachments: {
                labels: [`${proseLines} blok`],
              },
            }
          : {}),
    };
  });

  const links: Link[] = orderedEntries
    .filter((entry) => entry.parentId !== null)
    .map((entry) => ({
      source: entry.parentId as string,
      target: entry.id,
      type: 'hierarchy',
    }));

  return {
    graphData: { nodes, links },
    entries,
    rootId,
    noteTitle,
  };
}

/** Renames a heading, task, or list item line without modifying surrounding prose or YAML. */
export function renameOutlineTopicInMarkdown(
  noteId: string,
  noteTitle: string,
  markdownContent: string,
  topicId: string,
  nextTitle: string,
): string {
  const cleanTitle = nextTitle.trim();
  if (!cleanTitle) return markdownContent;

  const lines = markdownContent.replace(/\r\n/g, '\n').split('\n');
  const { entries } = parseMarkdownOutlineToMindmap(noteId, noteTitle, markdownContent);
  const target = entries.get(topicId);
  if (!target || target.lineIndex === null) return markdownContent;

  const raw = lines[target.lineIndex];
  if (target.kind === 'root' || target.kind === 'heading') {
    const level = target.headingLevel ?? 2;
    lines[target.lineIndex] = `${'#'.repeat(Math.max(1, Math.min(6, level)))} ${cleanTitle}`;
  } else if (target.kind === 'task') {
    const indent = ' '.repeat(target.indent ?? 0);
    const prefix = target.listPrefix ?? '-';
    const mark = target.checked ? 'x' : ' ';
    lines[target.lineIndex] = `${indent}${prefix} [${mark}] ${cleanTitle}`;
  } else {
    const indent = ' '.repeat(target.indent ?? 0);
    const prefix = target.listPrefix ?? '-';
    lines[target.lineIndex] = `${indent}${prefix} ${cleanTitle}`;
  }

  void raw;
  return lines.join('\n');
}

/** Toggles `- [ ]` <-> `- [x]` on the target task line in Markdown AST. */
export function toggleOutlineTaskInMarkdown(
  noteId: string,
  noteTitle: string,
  markdownContent: string,
  topicId: string,
): string {
  const lines = markdownContent.replace(/\r\n/g, '\n').split('\n');
  const { entries } = parseMarkdownOutlineToMindmap(noteId, noteTitle, markdownContent);
  const target = entries.get(topicId);
  if (!target || target.lineIndex === null) return markdownContent;

  const line = lines[target.lineIndex];
  const taskMatch = line.match(TASK_RE);
  if (taskMatch) {
    const nextMark = taskMatch[3].toLowerCase() === 'x' ? ' ' : 'x';
    lines[target.lineIndex] = `${taskMatch[1]}${taskMatch[2]} [${nextMark}] ${taskMatch[4]}`;
    return lines.join('\n');
  }

  const listMatch = line.match(LIST_RE);
  if (listMatch) {
    lines[target.lineIndex] = `${listMatch[1]}${listMatch[2]} [x] ${listMatch[3]}`;
  }
  return lines.join('\n');
}

/** Inserts a new child heading, list item, or task under `parentTopicId` without touching prose. */
export function addOutlineSubtopicInMarkdown(
  noteId: string,
  noteTitle: string,
  markdownContent: string,
  parentTopicId: string,
  childTitle: string,
  options: { asTask?: boolean; asHeading?: boolean } = {},
): string {
  const title = childTitle.trim() || 'Topik Baru';
  const normalized = markdownContent.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const { entries } = parseMarkdownOutlineToMindmap(noteId, noteTitle, normalized);
  const parent = entries.get(parentTopicId);
  if (!parent) return markdownContent;

  let insertLine = '';
  if (parent.kind === 'list' || parent.kind === 'task') {
    const indent = ' '.repeat((parent.indent ?? 0) + 2);
    insertLine = options.asTask ? `${indent}- [ ] ${title}` : `${indent}- ${title}`;
  } else if (options.asHeading !== false && (parent.headingLevel ?? 0) < 6 && !options.asTask) {
    const childLevel = Math.min(6, Math.max(2, (parent.headingLevel ?? 1) + 1));
    insertLine = `${'#'.repeat(childLevel)} ${title}`;
  } else {
    insertLine = options.asTask ? `- [ ] ${title}` : `- ${title}`;
  }

  let insertIdx = parent.subtreeEndLine;
  while (insertIdx > (parent.lineIndex ?? 0) + 1 && lines[insertIdx - 1].trim() === '') {
    insertIdx -= 1;
  }

  lines.splice(insertIdx, 0, insertLine);
  return lines.join('\n');
}

/** Inserts a sibling heading or list item right after `siblingTopicId`'s subtree. */
export function addOutlineSiblingInMarkdown(
  noteId: string,
  noteTitle: string,
  markdownContent: string,
  siblingTopicId: string,
  siblingTitle: string,
): string {
  const title = siblingTitle.trim() || 'Topik Saudara';
  const normalized = markdownContent.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const { entries } = parseMarkdownOutlineToMindmap(noteId, noteTitle, normalized);
  const sibling = entries.get(siblingTopicId);
  if (!sibling || sibling.kind === 'root' || sibling.lineIndex === null) {
    return addOutlineSubtopicInMarkdown(noteId, noteTitle, markdownContent, `${noteId}::outline-root`, title);
  }

  let insertLine = '';
  if (sibling.kind === 'heading') {
    insertLine = `${'#'.repeat(Math.max(2, Math.min(6, sibling.headingLevel ?? 2)))} ${title}`;
  } else if (sibling.kind === 'task') {
    insertLine = `${' '.repeat(sibling.indent ?? 0)}${sibling.listPrefix ?? '-'} [ ] ${title}`;
  } else {
    insertLine = `${' '.repeat(sibling.indent ?? 0)}${sibling.listPrefix ?? '-'} ${title}`;
  }

  let insertIdx = sibling.subtreeEndLine;
  while (insertIdx > sibling.lineIndex + 1 && lines[insertIdx - 1].trim() === '') {
    insertIdx -= 1;
  }

  lines.splice(insertIdx, 0, insertLine);
  return lines.join('\n');
}

/** Moves an outline branch subtree cleanly under `newParentTopicId`, adjusting level/indent. */
export function reparentOutlineTopicInMarkdown(
  noteId: string,
  noteTitle: string,
  markdownContent: string,
  topicId: string,
  newParentTopicId: string,
): string {
  if (topicId === newParentTopicId) return markdownContent;
  const normalized = markdownContent.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const { entries } = parseMarkdownOutlineToMindmap(noteId, noteTitle, normalized);
  const source = entries.get(topicId);
  const target = entries.get(newParentTopicId);
  if (!source || !target || source.kind === 'root' || source.lineIndex === null) {
    return markdownContent;
  }

  // Prevent moving an ancestor into its own descendant
  let check: OutlineAstEntry | undefined = target;
  while (check) {
    if (check.id === source.id) return markdownContent;
    check = check.parentId ? entries.get(check.parentId) : undefined;
  }

  const start = source.lineIndex;
  const end = source.subtreeEndLine;
  const slice = lines.slice(start, end);

  const transformed = [...slice];
  if (source.kind === 'heading' && (target.kind === 'root' || target.kind === 'heading')) {
    const desiredHeadLevel = Math.min(6, Math.max(2, (target.headingLevel ?? 1) + 1));
    const delta = desiredHeadLevel - (source.headingLevel ?? 2);
    for (let i = 0; i < transformed.length; i += 1) {
      const m = transformed[i].match(HEADING_RE);
      if (m) {
        const nextLevel = Math.min(6, Math.max(2, m[1].length + delta));
        transformed[i] = `${'#'.repeat(nextLevel)} ${m[2]}`;
      }
    }
  } else if (source.kind === 'list' || source.kind === 'task') {
    const baseIndent = target.kind === 'list' || target.kind === 'task' ? (target.indent ?? 0) + 2 : 0;
    const indentDelta = baseIndent - (source.indent ?? 0);
    for (let i = 0; i < transformed.length; i += 1) {
      if (!transformed[i].trim()) continue;
      if (indentDelta > 0) {
        transformed[i] = `${' '.repeat(indentDelta)}${transformed[i]}`;
      } else if (indentDelta < 0) {
        const drop = Math.min(-indentDelta, transformed[i].search(/\S|$/));
        transformed[i] = transformed[i].slice(drop);
      }
    }
  }

  lines.splice(start, end - start);
  const removedLen = end - start;
  let destIdx = target.subtreeEndLine > start ? target.subtreeEndLine - removedLen : target.subtreeEndLine;
  destIdx = Math.max(0, Math.min(lines.length, destIdx));
  lines.splice(destIdx, 0, ...transformed);
  return lines.join('\n');
}

/** Removes an outline subtree slice from the Markdown body. */
export function deleteOutlineTopicInMarkdown(
  noteId: string,
  noteTitle: string,
  markdownContent: string,
  topicId: string,
): string {
  const normalized = markdownContent.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const { entries } = parseMarkdownOutlineToMindmap(noteId, noteTitle, normalized);
  const target = entries.get(topicId);
  if (!target || target.kind === 'root' || target.lineIndex === null) {
    return markdownContent;
  }

  lines.splice(target.lineIndex, target.subtreeEndLine - target.lineIndex);
  return lines.join('\n');
}
