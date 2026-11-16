import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseMarkdownOutlineToMindmap,
  renameOutlineTopicInMarkdown,
  toggleOutlineTaskInMarkdown,
  addOutlineSubtopicInMarkdown,
  addOutlineSiblingInMarkdown,
  reparentOutlineTopicInMarkdown,
  deleteOutlineTopicInMarkdown,
} from '@/domains/graph/shared/utils/markdownOutlineMindmapBridge';
import {
  readNodeFrontmatterMindmapProps,
  upsertNodeFrontmatterMindmapProps,
} from '@/domains/graph/shared/utils/frontmatterMindmapSync';
import {
  MINDMAP_MANIFEST_CANONICAL_PATH,
  MINDMAP_MANIFEST_LEGACY_PATH,
  loadVaultMindmapManifest,
  saveVaultMindmapManifest,
  readMindmapManifestFromDirectoryHandle,
  writeMindmapManifestToDirectoryHandle,
} from '@/domains/graph/shared/utils/mindmapLayoutManifest';
import { buildGraphProjection } from '@/domains/graph/shared/utils/buildGraphProjection';

const SAMPLE_NOTE = [
  '---',
  'tags:',
  '  - research',
  'priority: 2',
  '---',
  '# Arsitektur Sidra',
  '',
  'Paragraf pengantar ini harus tetap 100% utuh setelah mutasi AST.',
  '',
  '```markdown',
  '# Heading Palsu Di Dalam Code Block',
  '- [ ] Task palsu di dalam kode',
  '```',
  '',
  '## Pilar Visual',
  '- [ ] Implementasi Boundary',
  '- [x] Implementasi Summary',
  '  - Detail Kurung Kurawal',
  '',
  '## Mesin Penyimpanan',
  '- Sidecar JSON terisolasi',
].join('\n');

describe('XMIND-STEP-06: In-Note Outline AST Bridge, YAML Sync & Sidecar Manifest', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('parses Markdown AST without misreading fenced code blocks & preserves prose/YAML across lossless round-trip edits', () => {
    const parsed = parseMarkdownOutlineToMindmap('note-1', 'Arsitektur Sidra', SAMPLE_NOTE);
    const names = parsed.graphData.nodes.map((n) => n.name);

    expect(parsed.rootId).toBe('note-1::outline-root');
    expect(names).toContain('Arsitektur Sidra');
    expect(names).toContain('Pilar Visual');
    expect(names).toContain('Implementasi Boundary');
    expect(names).toContain('Detail Kurung Kurawal');
    expect(names).not.toContain('Heading Palsu Di Dalam Code Block');
    expect(names).not.toContain('Task palsu di dalam kode');

    const boundaryTaskNode = parsed.graphData.nodes.find((n) => n.name === 'Implementasi Boundary');
    expect(boundaryTaskNode?.attachments?.markers).toEqual([
      { kind: 'checkbox', state: 'todo' },
    ]);

    const afterToggle = toggleOutlineTaskInMarkdown(
      'note-1',
      'Arsitektur Sidra',
      SAMPLE_NOTE,
      boundaryTaskNode!.id,
    );
    expect(afterToggle).toContain('- [x] Implementasi Boundary');
    expect(afterToggle).toContain('Paragraf pengantar ini harus tetap 100% utuh');
    expect(afterToggle).toContain('# Heading Palsu Di Dalam Code Block');

    const pilarNode = parsed.graphData.nodes.find((n) => n.name === 'Pilar Visual');
    const afterRename = renameOutlineTopicInMarkdown(
      'note-1',
      'Arsitektur Sidra',
      afterToggle,
      pilarNode!.id,
      'Pilar Visual & UX',
    );
    expect(afterRename).toContain('## Pilar Visual & UX');

    const parsedAfterRename = parseMarkdownOutlineToMindmap('note-1', 'Arsitektur Sidra', afterRename);
    const storageSection = parsedAfterRename.graphData.nodes.find((n) => n.name === 'Mesin Penyimpanan');
    const afterAddSub = addOutlineSubtopicInMarkdown(
      'note-1',
      'Arsitektur Sidra',
      afterRename,
      storageSection!.id,
      'Validasi Skema',
      { asHeading: true },
    );
    expect(afterAddSub).toContain('### Validasi Skema');

    const afterSibling = addOutlineSiblingInMarkdown(
      'note-1',
      'Arsitektur Sidra',
      afterAddSub,
      storageSection!.id,
      'Audit Kinerja',
    );
    expect(afterSibling).toContain('## Audit Kinerja');

    const parsedForReparent = parseMarkdownOutlineToMindmap('note-1', 'Arsitektur Sidra', afterSibling);
    const pilarNew = parsedForReparent.graphData.nodes.find((n) => n.name === 'Pilar Visual & UX');
    const auditNode = parsedForReparent.graphData.nodes.find((n) => n.name === 'Audit Kinerja');
    const afterReparent = reparentOutlineTopicInMarkdown(
      'note-1',
      'Arsitektur Sidra',
      afterSibling,
      auditNode!.id,
      pilarNew!.id,
    );
    expect(afterReparent).toContain('### Audit Kinerja');
    expect(afterReparent).not.toMatch(/<!--\s*(xmind|vk|obmap)/i);
    expect(afterReparent).toContain('priority: 2');
    expect(afterReparent).toContain('- [ ] Task palsu di dalam kode');

    const parsedForDelete = parseMarkdownOutlineToMindmap('note-1', 'Arsitektur Sidra', afterReparent);
    const targetDel = parsedForDelete.graphData.nodes.find((n) => n.name === 'Audit Kinerja');
    const afterDelete = deleteOutlineTopicInMarkdown(
      'note-1',
      'Arsitektur Sidra',
      afterReparent,
      targetDel!.id,
    );
    expect(afterDelete).not.toContain('Audit Kinerja');
  });

  it('syncs XMind YAML frontmatter properties cleanly and extracts structure_class in buildGraphProjection', () => {
    const updated = upsertNodeFrontmatterMindmapProps(SAMPLE_NOTE, {
      priority: 1,
      progress: 80,
      checkbox: 'done',
      structure_class: 'fishbone',
      topic_shape: 'pill',
      branch_color: '#3B82F6',
    });

    const readBack = readNodeFrontmatterMindmapProps(updated);
    expect(readBack.priority).toBe(1);
    expect(readBack.progress).toBe(80);
    expect(readBack.checkbox).toBe('done');
    expect(readBack.structureClass).toBe('fishbone');
    expect(readBack.topicShape).toBe('pill');
    expect(readBack.branchColor).toBe('#3B82F6');
    expect(updated).toContain('Paragraf pengantar ini harus tetap 100% utuh');

    const proj = buildGraphProjection(
      [
        {
          id: 'n1',
          name: 'Note 1',
          content: updated,
          type: 'file',
          parentId: null,
          depth: 0,
          tags: ['research'],
        },
      ],
      [],
    );
    expect(proj.byId.get('n1')?.structureClass).toBe('fishbone');
    expect(proj.byId.get('n1')?.topicShape).toBe('pill');
    expect(proj.byId.get('n1')?.branchColor).toBe('#3B82F6');
  });

  it('saves and migrates sidecar manifest between legacy .obmap/ & canonical .vk/ paths', async () => {
    expect(MINDMAP_MANIFEST_CANONICAL_PATH).toBe('.vk/mindmap-layout.json');
    expect(MINDMAP_MANIFEST_LEGACY_PATH).toBe('.obmap/mindmap-layout.json');

    localStorage.setItem(
      'obmap-mindmap-layout:v1',
      JSON.stringify({
        version: 1,
        updatedAt: '2026-11-15T00:00:00Z',
        boundaries: [{ id: 'b1', nodeIds: ['n1'], shape: 'cloud', padding: 16 }],
        summaries: [],
        relationships: [],
        manualNodeOffsets: { n2: { dx: 12, dy: -8 } },
      }),
    );
    const migrated = loadVaultMindmapManifest('v1');
    expect(migrated?.boundaries).toHaveLength(1);
    expect(migrated?.manualNodeOffsets.n2).toEqual({ dx: 12, dy: -8 });
    expect(localStorage.getItem('vk-mindmap-layout:v1')).not.toBeNull();

    saveVaultMindmapManifest('v2', {
      boundaries: [],
      summaries: [{ id: 's1', parentId: 'r', rangeNodeIds: ['a', 'b'], summaryNodeId: 'sum-1', braceStyle: 'curly' }],
      relationships: [],
      manualNodeOffsets: {},
    });
    expect(loadVaultMindmapManifest('v2')?.summaries[0].summaryNodeId).toBe('sum-1');

    const files = new Map<string, string>();
    const makeDirHandle = (prefix = '') => ({
      getDirectoryHandle: async (name: string) => makeDirHandle(`${prefix}${name}/`),
      getFileHandle: async (name: string, opts?: { create?: boolean }) => {
        const key = `${prefix}${name}`;
        if (!opts?.create && !files.has(key)) throw new Error('Not found');
        return {
          createWritable: async () => ({
            write: async (text: string) => {
              files.set(key, text);
            },
            close: async () => {},
          }),
          getFile: async () => ({
            text: async () => files.get(key) ?? '',
          }),
        };
      },
    });

    const mockRoot = makeDirHandle() as unknown as FileSystemDirectoryHandle;
    files.set(
      '.obmap/mindmap-layout.json',
      JSON.stringify({
        version: 1,
        boundaries: [{ id: 'legacy-b', nodeIds: ['x'], shape: 'dashed', padding: 14 }],
        summaries: [],
        relationships: [],
        manualNodeOffsets: {},
      }),
    );
    const readLegacy = await readMindmapManifestFromDirectoryHandle(mockRoot);
    expect(readLegacy?.boundaries[0].id).toBe('legacy-b');

    const ok = await writeMindmapManifestToDirectoryHandle(mockRoot, {
      boundaries: [{ id: 'vk-b', nodeIds: ['y'], shape: 'rounded', padding: 16 }],
      summaries: [],
      relationships: [],
      manualNodeOffsets: {},
    });
    expect(ok).toBe(true);
    const readCanonical = await readMindmapManifestFromDirectoryHandle(mockRoot);
    expect(readCanonical?.boundaries[0].id).toBe('vk-b');
  });
});
