/**
 * Shared types for Zustand stores
 */

// src/shared/stores/types.ts

export type MindmapStructureClass =
  | 'mindmap'
  | 'org-chart'
  | 'brace-map'
  | 'timeline'
  | 'fishbone';

export type TopicShape =
  | 'rounded-rect'
  | 'pill'
  | 'underline'
  | 'ellipse'
  | 'diamond'
  | 'hexagon'
  | 'cloud'
  | 'parallelogram'
  | 'circle'
  | 'square'
  | 'triangle';

export type BranchLineStyle =
  | 'tapered-bezier'
  | 'cubic-bezier'
  | 'rounded-elbow'
  | 'orthogonal'
  | 'brace-bracket'
  | 'straight';

export type NodeMarker =
  | { kind: 'priority'; level: 1 | 2 | 3 | 4 | 5 | 6 | 7 }
  | { kind: 'progress'; percent: number }
  | { kind: 'checkbox'; state: 'todo' | 'done' }
  | { kind: 'flag'; color: string }
  | { kind: 'star'; color: string }
  | { kind: 'emoji'; value: string };

export interface NodeAttachments {
  markers?: NodeMarker[];
  sticker?: string;
  labels?: string[];
}

export type TopicRole = 'central' | 'main' | 'subtopic' | 'floating' | 'summary';

export type SkeletonPresetId =
  | 'obmap-midnight'
  | 'obsidian-oled'
  | 'daylight-paper'
  | 'warm-sepia'
  | 'nord-scholar'
  | 'high-contrast-aaa'
  | 'xmind-classic';

export interface NodeStyleOverride {
  fillColor?: string;
  borderColor?: string;
  textColor?: string;
  lineColor?: string;
  topicShape?: TopicShape;
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

export type BoundaryShape = 'rounded' | 'cloud' | 'dashed';

export interface BoundaryGroup {
  id: string;
  title?: string;
  nodeIds: string[];
  shape: BoundaryShape;
  padding: number;
  fillColor?: string;
  strokeColor?: string;
}

export type SummaryBraceStyle = 'curly' | 'square' | 'round';

export interface SummaryGroup {
  id: string;
  parentId: string;
  rangeNodeIds: [string, string];
  summaryNodeId: string;
  braceStyle: SummaryBraceStyle;
  label?: string;
  color?: string;
}

export interface RelationshipEdge {
  id: string;
  sourceId: string;
  targetId: string;
  origin: 'manual' | 'wikilink' | 'tag';
  label?: string;
  curvatureOffset?: { x: number; y: number };
  arrowMode: 'forward' | 'both' | 'none';
  dashStyle: 'dashed' | 'dotted' | 'solid';
  color?: string;
}

export interface ManualNodeOffset {
  dx: number;
  dy: number;
}

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
  attachments?: NodeAttachments;
  topicShape?: TopicShape;
  structureClass?: MindmapStructureClass;
  styleOverride?: NodeStyleOverride;
  wikilinkCount?: number;
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
  wikilinkCount?: number;
  attachments?: NodeAttachments;
  topicShape?: TopicShape;
  structureClass?: MindmapStructureClass;
  branchColor?: string;
  styleOverride?: NodeStyleOverride;
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
