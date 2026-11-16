/**
 * Sidecar Spatial Manifest persistence (`XMIND-STEP-06`, `ADR-0013`).
 *
 * Stores purely spatial graph metadata (`boundaries`, `summaries`, `relationships`,
 * `manualNodeOffsets`) in `.vk/mindmap-layout.json` (with zero-loss fallback to legacy
 * `.obmap/mindmap-layout.json`) and canonical `vk-mindmap-layout:<vaultId>` browser storage,
 * keeping `.md` Markdown bodies 100% pure (`AGENTS.md` Rule 6).
 */

import type {
  BoundaryGroup,
  ManualNodeOffset,
  MindmapStructureClass,
  RelationshipEdge,
  SummaryGroup,
  TopicShape,
} from '@/global/types/graph.types';
import {
  readMigratedLocalStorageItem,
  writeCanonicalLocalStorageItem,
} from '@/global/utils/storageKeyMigrator';

export const MINDMAP_MANIFEST_CANONICAL_DIR = '.vk';
export const MINDMAP_MANIFEST_LEGACY_DIR = '.obmap';
export const MINDMAP_MANIFEST_FILENAME = 'mindmap-layout.json';
export const MINDMAP_MANIFEST_CANONICAL_PATH = `${MINDMAP_MANIFEST_CANONICAL_DIR}/${MINDMAP_MANIFEST_FILENAME}`;
export const MINDMAP_MANIFEST_LEGACY_PATH = `${MINDMAP_MANIFEST_LEGACY_DIR}/${MINDMAP_MANIFEST_FILENAME}`;

const LS_MANIFEST_PREFIX_CANONICAL = 'vk-mindmap-layout:';
const LS_MANIFEST_PREFIX_LEGACY = 'obmap-mindmap-layout:';

export interface OutlineNodeStyleRecord {
  structureClass?: MindmapStructureClass;
  topicShape?: TopicShape;
}

export interface MindmapLayoutManifest {
  version: 1;
  updatedAt: string;
  boundaries: BoundaryGroup[];
  summaries: SummaryGroup[];
  relationships: RelationshipEdge[];
  manualNodeOffsets: Record<string, ManualNodeOffset>;
  outlineOverrides?: Record<string, OutlineNodeStyleRecord>;
}

export function createEmptyMindmapLayoutManifest(): MindmapLayoutManifest {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    boundaries: [],
    summaries: [],
    relationships: [],
    manualNodeOffsets: {},
  };
}

export function serializeMindmapLayoutManifest(
  input: Omit<MindmapLayoutManifest, 'version' | 'updatedAt'> & { updatedAt?: string },
): string {
  const payload: MindmapLayoutManifest = {
    version: 1,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    boundaries: Array.isArray(input.boundaries) ? input.boundaries : [],
    summaries: Array.isArray(input.summaries) ? input.summaries : [],
    relationships: Array.isArray(input.relationships) ? input.relationships : [],
    manualNodeOffsets: input.manualNodeOffsets ?? {},
    ...(input.outlineOverrides ? { outlineOverrides: input.outlineOverrides } : {}),
  };
  return JSON.stringify(payload, null, 2);
}

export function parseMindmapLayoutManifest(raw: string): MindmapLayoutManifest | null {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw) as Partial<MindmapLayoutManifest> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      version: 1,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      boundaries: Array.isArray(parsed.boundaries) ? parsed.boundaries : [],
      summaries: Array.isArray(parsed.summaries) ? parsed.summaries : [],
      relationships: Array.isArray(parsed.relationships) ? parsed.relationships : [],
      manualNodeOffsets:
        parsed.manualNodeOffsets && typeof parsed.manualNodeOffsets === 'object'
          ? parsed.manualNodeOffsets
          : {},
      ...(parsed.outlineOverrides && typeof parsed.outlineOverrides === 'object'
        ? { outlineOverrides: parsed.outlineOverrides }
        : {}),
    };
  } catch {
    return null;
  }
}

export function saveVaultMindmapManifest(
  vaultId: string,
  manifest: Omit<MindmapLayoutManifest, 'version' | 'updatedAt'>,
): void {
  if (!vaultId) return;
  writeCanonicalLocalStorageItem(
    `${LS_MANIFEST_PREFIX_CANONICAL}${vaultId}`,
    serializeMindmapLayoutManifest(manifest),
  );
}

export function loadVaultMindmapManifest(vaultId: string): MindmapLayoutManifest | null {
  if (!vaultId) return null;
  const raw = readMigratedLocalStorageItem(
    `${LS_MANIFEST_PREFIX_CANONICAL}${vaultId}`,
    `${LS_MANIFEST_PREFIX_LEGACY}${vaultId}`,
  );
  return raw ? parseMindmapLayoutManifest(raw) : null;
}

/** Writes `.vk/mindmap-layout.json` into a mounted File System Access API vault folder. */
export async function writeMindmapManifestToDirectoryHandle(
  rootHandle: FileSystemDirectoryHandle | null | undefined,
  manifest: Omit<MindmapLayoutManifest, 'version' | 'updatedAt'>,
): Promise<boolean> {
  if (!rootHandle) return false;
  try {
    const dir = await rootHandle.getDirectoryHandle(MINDMAP_MANIFEST_CANONICAL_DIR, { create: true });
    const file = await dir.getFileHandle(MINDMAP_MANIFEST_FILENAME, { create: true });
    const writable = await file.createWritable();
    await writable.write(serializeMindmapLayoutManifest(manifest));
    await writable.close();
    return true;
  } catch (error) {
    console.error('[mindmapLayoutManifest] Failed to write .vk/mindmap-layout.json:', error);
    return false;
  }
}

/** Reads `.vk/mindmap-layout.json` from a mounted folder handle with zero-loss `.obmap/` fallback. */
export async function readMindmapManifestFromDirectoryHandle(
  rootHandle: FileSystemDirectoryHandle | null | undefined,
): Promise<MindmapLayoutManifest | null> {
  if (!rootHandle) return null;
  for (const dirName of [MINDMAP_MANIFEST_CANONICAL_DIR, MINDMAP_MANIFEST_LEGACY_DIR]) {
    try {
      const dir = await rootHandle.getDirectoryHandle(dirName, { create: false });
      const fileHandle = await dir.getFileHandle(MINDMAP_MANIFEST_FILENAME, { create: false });
      const file = await fileHandle.getFile();
      const parsed = parseMindmapLayoutManifest(await file.text());
      if (parsed) return parsed;
    } catch {
      /* continue checking fallback sidecar folder */
    }
  }
  return null;
}
