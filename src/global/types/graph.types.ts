/**
 * Shared types for Zustand stores
 */

// src/shared/stores/types.ts

/** Mutable object handed to ForceGraph2D — it writes x/y/fx/fy in place. */
export interface RenderNode {
  id: string;
  name: string;
  type: Node['type'];
  mediaType?: Node['mediaType']; 
  parentId: string | null;
  depth: number;
  tags: string[];
  content: string;
  time?: number;
  category?: string;
  childCount: number;
  branchId?: string;
  branchColor?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
  val?: number; // <-- Ukuran / radius node untuk kalkulasi kamera & bounds
  /** Toggle hit region in graph space, written by the node renderer. */
  toggle?: { x: number; y: number; r: number } | null;
}


export interface Node {
  id: string;
  name: string;
  content: string;
  type: 'folder' | 'file' | 'media'| 'pdf';
  parentId: string | null;
  depth: number;
  tags: string[];
  wikilinks?: string[];
  mediaType?: 'image' | 'audio' | 'video' | 'pdf'; // <-- Ditambahkan 'pdf'
  mimeType?: string;
  dataUrl?: string;
}


export interface Link {
  source: string | Node;
  target: string | Node;
  type?: 'hierarchy' | 'tag' | 'backlink' | 'semantic';
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

export interface Backlink {
  nodeId: string;
  nodeName: string;
  nodePath?: string;
  isWikilink: boolean;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
